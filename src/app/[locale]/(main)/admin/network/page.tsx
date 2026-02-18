
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useOrganization } from '@/context/organization-context';
import { useOrganizations } from '@/hooks/use-organizations';
import { useConnections } from '@/hooks/use-connections';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useProducts } from '@/hooks/use-products';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Users, Link as LinkIcon, Link2Off, 
  Check, X, Loader2, Truck, ShoppingBag, Store,
  RefreshCw, Info, Zap, Flame, ArrowUp, ArrowDown,
  ArrowRight, Calculator
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Product, Supplier } from '@/types';
import Image from 'next/image';

interface SyncItem {
  id: string; 
  sku: string;
  name: string;
  photoUrl: string;
  currentCost: number;
  newCost: number;
  currentSalePrice: number;
  suggestedSalePrice: number;
  status: 'new' | 'price_change' | 'synced';
  remoteProduct: Product;
  localProduct?: Product;
  supplierName: string;
  pricingMethod?: 'margin' | 'markup';
  marginOrMarkup: number;
}

export default function SupplyNetworkPage() {
  const { activeOrg, activeOrgId } = useOrganization();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const { connections, loading: connLoading } = useConnections(activeOrgId);
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { products: localProducts, loading: productsLoading } = useProducts();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('sync');

  // Sync State
  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [isProcessingSync, setIsProcessingSync] = useState(false);
  const [maintainMargins, setMaintainMargins] = useState(true);

  const loading = orgsLoading || connLoading || suppliersLoading || productsLoading;

  const handleCheckForUpdates = async () => {
    if (!activeOrgId) return;
    setIsSyncing(true);
    setSyncItems([]);
    setSelectedSkus([]);

    try {
      const linkedSuppliers = suppliers.filter(s => !!s.linkedOrgId);
      const allUpdates: SyncItem[] = [];

      for (const supplier of linkedSuppliers) {
        const q = query(collection(db, 'products'), where('organizationId', '==', supplier.linkedOrgId));
        const snap = await getDocs(q);
        const remoteProducts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

        for (const remote of remoteProducts) {
          const local = localProducts.find(lp => lp.sku === remote.sku);
          
          if (!local) {
            // Producto Nuevo (Omitido de la sincronización de precios masiva por ahora)
            continue;
          } else {
            // Verificar cambio de precio
            const supplierInfo = local.suppliers?.find(s => s.supplierId === supplier.id);
            if (supplierInfo && supplierInfo.cost !== remote.salePrice) {
              
              // Calcular Sugerido basándonos en la regla guardada
              let marginOrMarkup = 0;
              let suggestedPrice = local.salePrice;
              const method = local.pricingMethod || 'margin';

              if (method === 'margin') {
                marginOrMarkup = local.salePrice > 0 ? ((local.salePrice - supplierInfo.cost) / local.salePrice) * 100 : 0;
                if (marginOrMarkup < 100) {
                  suggestedPrice = remote.salePrice / (1 - (marginOrMarkup / 100));
                }
              } else {
                marginOrMarkup = supplierInfo.cost > 0 ? ((local.salePrice - supplierInfo.cost) / supplierInfo.cost) * 100 : 0;
                suggestedPrice = remote.salePrice * (1 + (marginOrMarkup / 100));
              }

              allUpdates.push({
                id: local.id,
                sku: local.sku,
                name: local.name.es,
                photoUrl: local.photoUrl || '',
                currentCost: supplierInfo.cost,
                newCost: remote.salePrice,
                currentSalePrice: local.salePrice,
                suggestedSalePrice: suggestedPrice,
                status: 'price_change',
                remoteProduct: remote,
                localProduct: local,
                supplierName: supplier.name,
                pricingMethod: method,
                marginOrMarkup: marginOrMarkup
              });
            }
          }
        }
      }
      setSyncItems(allUpdates);
      if (allUpdates.length === 0) {
        toast({ title: "Catálogo al día", description: "No se encontraron cambios de costo en tus proveedores vinculados." });
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
        if (!item || !item.localProduct) continue;

        const updatedSuppliers = item.localProduct.suppliers.map(s => {
          const supplier = suppliers.find(sup => sup.name === item.supplierName);
          if (s.supplierId === supplier?.id) {
            return { ...s, cost: item.newCost };
          }
          return s;
        });

        const updatePayload: any = { suppliers: updatedSuppliers };
        
        // Si el usuario marcó mantener márgenes, actualizamos también el precio de venta
        if (maintainMargins) {
          updatePayload.salePrice = parseFloat(item.suggestedSalePrice.toFixed(2));
        }

        await updateProduct(item.localProduct.id, updatePayload);
        count++;
      }
      toast({ title: "Sincronización Exitosa", description: `Se actualizaron ${count} productos en tu catálogo.` });
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
          <p className="text-slate-500 mt-1">Sincroniza costos y protege tu rentabilidad automáticamente.</p>
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg">Detección de Cambios en la Red</CardTitle>
                    <CardDescription>Compara tus costos con los precios vivos de tus proveedores.</CardDescription>
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
                            <TableHead className="text-right">Costo Actual</TableHead>
                            <TableHead className="text-right">Nuevo Costo</TableHead>
                            <TableHead className="text-center">Diferencia</TableHead>
                            <TableHead className="text-right">Precio Actual</TableHead>
                            <TableHead className="text-right bg-primary/5">Precio Sugerido</TableHead>
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
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border">
                                      {item.photoUrl ? <Image src={item.photoUrl} alt={item.name} width={40} height={40} className="object-cover h-full w-full" /> : <ShoppingBag className="h-5 w-5 m-auto mt-2.5 text-slate-300" />}
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-slate-800">{item.name}</p>
                                      <p className="text-[10px] text-muted-foreground">{item.supplierName}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-slate-500 font-medium">
                                  {formatCurrency(item.currentCost)}
                                </TableCell>
                                <TableCell className="text-right font-black text-slate-900">
                                  {formatCurrency(item.newCost)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className={cn(
                                    "inline-flex items-center gap-1 font-bold text-xs px-2 py-1 rounded-lg",
                                    diff > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                  )}>
                                    {diff > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                    {Math.abs(diffPercent).toFixed(1)}%
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-slate-500">
                                  {formatCurrency(item.currentSalePrice)}
                                </TableCell>
                                <TableCell className="text-right font-black text-primary bg-primary/5">
                                  {formatCurrency(item.suggestedSalePrice)}
                                  <div className="text-[9px] text-primary/60 uppercase font-bold">
                                    {item.pricingMethod === 'margin' ? 'Mantener Margen' : 'Mantener Recargo'}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="p-6 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm flex-grow w-full md:w-auto">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Calculator className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="maintain-margins" className="font-bold text-sm">Proteger Rentabilidad Automáticamente</Label>
                            <Switch 
                              id="maintain-margins" 
                              checked={maintainMargins} 
                              onCheckedChange={setMaintainMargins} 
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">Si está activo, ajustaremos tu precio de venta para mantener tus márgenes actuales.</p>
                        </div>
                      </div>
                      
                      <Button 
                        disabled={selectedSkus.length === 0 || isProcessingSync}
                        onClick={handleApplySync}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-10 rounded-xl font-bold h-14 shadow-xl shrink-0 w-full md:w-auto"
                      >
                        {isProcessingSync ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                        Actualizar {selectedSkus.length} Productos
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24 flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                      <RefreshCw className="h-8 w-8 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Todo al día</h3>
                      <p className="text-slate-500 max-w-sm mx-auto mt-1">No hay cambios de costo pendientes en tu red. Haz clic en "Buscar Cambios" para verificar.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">Aún no tienes socios comerciales vinculados.</p>
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

function Search({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}
