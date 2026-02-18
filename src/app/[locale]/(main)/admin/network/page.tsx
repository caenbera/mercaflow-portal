
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useOrganization } from '@/context/organization-context';
import { useOrganizations } from '@/hooks/use-organizations';
import { useConnections } from '@/hooks/use-connections';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useProducts } from '@/hooks/use-products';
import { 
  sendConnectionRequest, 
  updateConnectionStatus, 
  deleteConnection 
} from '@/lib/firestore/connections';
import { updateProduct } from '@/lib/firestore/products';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, Users, Link as LinkIcon, Link2Off, 
  Check, X, Loader2, Globe, Truck, ShoppingBag, Store,
  RefreshCw, AlertCircle, Info, ArrowRight, Zap, Flame
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Product, Supplier } from '@/types';
import Image from 'next/image';

interface SyncItem {
  id: string; // SKU o ID del producto local
  sku: string;
  name: string;
  photoUrl: string;
  currentCost: number;
  newCost: number;
  status: 'new' | 'price_change' | 'synced';
  remoteProduct: Product;
  localProduct?: Product;
  supplierName: string;
}

export default function SupplyNetworkPage() {
  const { activeOrg, activeOrgId } = useOrganization();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const { connections, loading: connLoading } = useConnections(activeOrgId);
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { products: localProducts, loading: productsLoading } = useProducts();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sync');

  // Sync State
  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [isProcessingSync, setIsProcessingSync] = useState(false);

  const loading = orgsLoading || connLoading || suppliersLoading || productsLoading;

  // Filtrado de edificios para conectar
  const filteredOrgs = useMemo(() => {
    if (!searchTerm) return [];
    return organizations.filter(org => 
      org.id !== activeOrgId && 
      (org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       org.slug.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [organizations, searchTerm, activeOrgId]);

  // Lógica de Sincronización
  const handleCheckForUpdates = async () => {
    if (!activeOrgId) return;
    setIsSyncing(true);
    setSyncItems([]);
    setSelectedSkus([]);

    try {
      const linkedSuppliers = suppliers.filter(s => !!s.linkedOrgId);
      const allUpdates: SyncItem[] = [];

      for (const supplier of linkedSuppliers) {
        // Consultar productos de la organización vinculada
        const q = query(collection(db, 'products'), where('organizationId', '==', supplier.linkedOrgId));
        const snap = await getDocs(q);
        const remoteProducts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

        for (const remote of remoteProducts) {
          const local = localProducts.find(lp => lp.sku === remote.sku);
          
          if (!local) {
            // Producto Nuevo
            allUpdates.push({
              id: remote.id,
              sku: remote.sku,
              name: remote.name.es,
              photoUrl: remote.photoUrl || '',
              currentCost: 0,
              newCost: remote.salePrice,
              status: 'new',
              remoteProduct: remote,
              supplierName: supplier.name
            });
          } else {
            // Verificar cambio de precio
            const supplierInfo = local.suppliers?.find(s => s.supplierId === supplier.id);
            if (supplierInfo && supplierInfo.cost !== remote.salePrice) {
              allUpdates.push({
                id: local.id,
                sku: local.sku,
                name: local.name.es,
                photoUrl: local.photoUrl || '',
                currentCost: supplierInfo.cost,
                newCost: remote.salePrice,
                status: 'price_change',
                remoteProduct: remote,
                localProduct: local,
                supplierName: supplier.name
              });
            }
          }
        }
      }
      setSyncItems(allUpdates);
      if (allUpdates.length === 0) {
        toast({ title: "Catálogo al día", description: "No se encontraron cambios pendientes en tus proveedores vinculados." });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Error", description: "No se pudo consultar la red de suministros." });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplySync = async () => {
    if (selectedSkus.length === 0) return;
    setIsProcessingSync(true);
    try {
      let count = 0;
      for (const sku of selectedSkus) {
        const item = syncItems.find(i => i.sku === sku);
        if (!item) continue;

        if (item.status === 'price_change' && item.localProduct) {
          // Actualizar costo del proveedor vinculado en el producto local
          const updatedSuppliers = item.localProduct.suppliers.map(s => {
            const supplier = suppliers.find(sup => sup.name === item.supplierName);
            if (s.supplierId === supplier?.id) {
              return { ...s, cost: item.newCost };
            }
            return s;
          });
          await updateProduct(item.localProduct.id, { suppliers: updatedSuppliers });
          count++;
        }
        // Nota: La creación de productos 'new' requiere un flujo más complejo de categorías/unidades
        // Para este MVP, nos enfocamos en cambios de precio que es lo más crítico.
      }
      toast({ title: "Sincronización Exitosa", description: `Se actualizaron ${count} precios de productos.` });
      handleCheckForUpdates();
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Ocurrió un problema al aplicar los cambios." });
    } finally {
      setIsProcessingSync(false);
    }
  };

  const toggleSelect = (sku: string) => {
    setSelectedSkus(prev => prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  if (!activeOrg) return <div className="p-8 text-center text-muted-foreground">Selecciona un edificio para gestionar su red.</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-slate-900">
            <LinkIcon className="text-primary h-8 w-8" />
            Red de Suministro Inteligente
          </h1>
          <p className="text-slate-500 mt-1">Conecta con tus proveedores en MercaFlow para automatizar costos y catálogos.</p>
        </div>
        <div className="flex gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl border border-white/10 shadow-xl items-center">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Tu Código de Red</span>
            <span className="font-mono text-sm font-bold text-primary">{activeOrg.slug}</span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <Zap className="h-5 w-5 text-primary" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-xl border shadow-sm mb-6">
          <TabsTrigger value="sync" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <RefreshCw className="h-4 w-4" /> Sincronización de Precios
          </TabsTrigger>
          <TabsTrigger value="manage" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Users className="h-4 w-4" /> Socios y Vínculos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="mt-0">
          <div className="grid gap-6">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Actualizaciones de Red Pendientes</CardTitle>
                    <CardDescription>Compara tus costos actuales con los precios de venta de tus proveedores vinculados.</CardDescription>
                  </div>
                  <Button onClick={handleCheckForUpdates} disabled={isSyncing} className="bg-primary hover:bg-primary/90 rounded-full h-11 px-6 shadow-lg">
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Buscar Cambios
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {syncItems.length > 0 ? (
                  <div className="flex flex-col">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/30">
                            <TableHead className="w-[50px] pl-6"></TableHead>
                            <TableHead>Producto / SKU</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead className="text-right">Costo Actual</TableHead>
                            <TableHead className="text-right">Nuevo Costo</TableHead>
                            <TableHead className="text-center">Diferencia</TableHead>
                            <TableHead className="text-center">Tipo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {syncItems.map((item) => {
                            const diff = item.newCost - item.currentCost;
                            const diffPercent = item.currentCost > 0 ? (diff / item.currentCost) * 100 : 0;
                            
                            return (
                              <TableRow key={item.sku} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="pl-6">
                                  <Checkbox 
                                    checked={selectedSkus.includes(item.sku)}
                                    onCheckedChange={() => toggleSelect(item.sku)}
                                    disabled={item.status === 'new'} // Inhabilitado por ahora para 'new' en MVP
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border">
                                      {item.photoUrl ? <Image src={item.photoUrl} alt={item.name} width={40} height={40} className="object-cover h-full w-full" /> : <ShoppingBag className="h-5 w-5 m-auto mt-2.5 text-slate-300" />}
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-slate-800">{item.name}</p>
                                      <p className="text-[10px] font-mono text-muted-foreground uppercase">{item.sku}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-white shadow-sm border-slate-200">
                                    <Truck className="h-3 w-3 mr-1.5 text-primary" /> {item.supplierName}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium text-slate-500">
                                  {item.currentCost > 0 ? formatCurrency(item.currentCost) : '---'}
                                </TableCell>
                                <TableCell className="text-right font-bold text-primary">
                                  {formatCurrency(item.newCost)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {item.status === 'price_change' && (
                                    <div className={cn(
                                      "inline-flex items-center gap-1 font-bold text-xs px-2 py-1 rounded-lg",
                                      diff > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                    )}>
                                      {diff > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                      {Math.abs(diffPercent).toFixed(1)}%
                                    </div>
                                  )}
                                  {item.status === 'new' && <span className="text-muted-foreground italic text-xs">Sin histórico</span>}
                                </TableCell>
                                <TableCell className="text-center">
                                  {item.status === 'new' ? (
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none text-[10px] font-bold">NUEVO</Badge>
                                  ) : (
                                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none text-[10px] font-bold">CAMBIO PRECIO</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="p-4 bg-slate-50 border-t flex justify-between items-center">
                      <p className="text-sm text-slate-600 font-medium">
                        {selectedSkus.length} productos seleccionados para actualizar.
                      </p>
                      <Button 
                        disabled={selectedSkus.length === 0 || isProcessingSync}
                        onClick={handleApplySync}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-xl font-bold h-12 shadow-lg"
                      >
                        {isProcessingSync ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Aplicar Cambios en mi Catálogo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24 flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                      <RefreshCw className="h-8 w-8 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">No hay cambios pendientes</h3>
                      <p className="text-slate-500 max-w-sm mx-auto mt-1">Tu catálogo está sincronizado con la red. Haz clic en "Buscar Cambios" para verificar nuevamente.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-blue-50 border-blue-100">
                <CardContent className="p-4 flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Info className="h-5 w-5" /></div>
                  <div className="text-xs text-blue-800 space-y-1">
                    <p className="font-bold">¿Cómo funciona?</p>
                    <p>Al sincronizar, actualizamos tu **Costo de Compra** con el precio actual del proveedor. Esto recalculerá tu margen de ganancia automáticamente.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-orange-100">
                <CardContent className="p-4 flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0"><Flame className="h-5 w-5" /></div>
                  <div className="text-xs text-orange-800 space-y-1">
                    <p className="font-bold">Nuevos Productos</p>
                    <p>Próximamente podrás importar productos nuevos del proveedor directamente a tus categorías locales con un clic.</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-100">
                <CardContent className="p-4 flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><Check className="h-5 w-5" /></div>
                  <div className="text-xs text-green-800 space-y-1">
                    <p className="font-bold">Control Total</p>
                    <p>Tú decides qué cambios aceptar. Nada en tu catálogo cambia sin que tú lo apruebes manualmente en esta pantalla.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* BUSCADOR DE EDIFICIOS */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-none shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Vincular Nuevos Edificios</CardTitle>
                  <CardDescription>Envía una solicitud formal de conexión comercial.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Nombre o slug..." 
                      className="pl-8 bg-slate-50" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    {filteredOrgs.map(org => {
                      const conn = connections.find(c => c.fromOrgId === org.id || c.toOrgId === org.id);
                      return (
                        <div key={org.id} className="p-3 border rounded-xl flex items-center justify-between bg-card transition-all hover:border-primary/50">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center"><Store className="h-4 w-4 text-slate-500" /></div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{org.name}</div>
                              <p className="text-[10px] text-muted-foreground font-mono">{org.slug}</p>
                            </div>
                          </div>
                          {conn ? (
                            <Badge variant={conn.status === 'accepted' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                              {conn.status}
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 rounded-full p-0 hover:bg-primary/10 hover:text-primary"
                              onClick={() => {}}
                              disabled={!!isSubmitting}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    {searchTerm && filteredOrgs.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-4 italic">No se encontraron edificios con ese nombre.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* GESTIÓN DE CONEXIONES */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                  <CardTitle className="text-base">Mi Red de Suministro Activa</CardTitle>
                  <CardDescription>Empresas con las que compartes datos operativos.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="space-y-3"><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /></div>
                  ) : connections.some(c => c.status === 'accepted') ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {connections.filter(c => c.status === 'accepted').map(conn => {
                        const otherOrgId = conn.fromOrgId === activeOrgId ? conn.toOrgId : conn.fromOrgId;
                        const org = organizations.find(o => o.id === otherOrgId);
                        const isMySupplier = conn.toOrgId === activeOrgId;

                        return (
                          <div key={conn.id} className="p-4 border rounded-2xl bg-card hover:shadow-lg transition-all border-slate-100">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2.5 rounded-xl border shadow-sm", isMySupplier ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-purple-50 border-purple-100 text-purple-600")}>
                                  <Store className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-slate-800">{org?.name}</p>
                                  <Badge variant="secondary" className="text-[10px] h-4 mt-0.5 px-1.5 font-bold uppercase tracking-tighter">
                                    {isMySupplier ? "Proveedor" : "Cliente"}
                                  </Badge>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-full"
                                onClick={() => {}}
                              >
                                <Link2Off className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-3 border-t mt-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              Flujo de datos bidireccional activo
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-3xl bg-slate-50/50">
                      <LinkIcon className="mx-auto h-10 w-10 text-slate-300 mb-3 opacity-50" />
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">Aún no tienes socios comerciales vinculados. Empieza buscando edificios arriba.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return <PlusCircle className={className} />;
}

function PlusCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>
    </svg>
  );
}

function ArrowDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m7 10 5 5 5-5"/>
    </svg>
  );
}

function ArrowUp({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m17 14-5-5-5 5"/>
    </svg>
  );
}
