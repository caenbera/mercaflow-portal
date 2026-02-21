
"use client";

import { useState, useMemo } from 'react';
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
  Users, Link as LinkIcon, 
  Check, Loader2, Store,
  RefreshCw, Zap, ArrowUp, ArrowDown,
  Calculator, Search, Lock, ShieldCheck,
  Send,
  Building2
} from 'lucide-center';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { collection, query, where, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Product, OrganizationType, Organization } from '@/types';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

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

const HIERARCHY_MAP: Record<string, OrganizationType | null> = {
  retailer: 'wholesaler',
  wholesaler: 'distributor',
  distributor: 'importer',
  importer: null,
};

export default function SupplyNetworkPage() {
  const t = useTranslations('AdminSalesPage');
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

  // Global Search State
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [globalResults, setGlobalResults] = useState<Organization[]>([]);

  const loading = orgsLoading || connLoading || suppliersLoading || productsLoading;
  const isPremiumSearchEnabled = activeOrg?.adminAgreements?.premiumNetworkSearch || false;

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
            continue;
          } else {
            const supplierInfo = local.suppliers?.find(s => s.supplierId === supplier.id);
            if (supplierInfo && supplierInfo.cost !== remote.salePrice) {
              
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
        toast({ title: t('toast_no_updates_title'), description: t('toast_no_updates_desc') });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Error", description: t('toast_check_error') });
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
        
        if (maintainMargins) {
          updatePayload.salePrice = parseFloat(item.suggestedSalePrice.toFixed(2));
        }

        await updateProduct(item.localProduct.id, updatePayload);
        count++;
      }
      toast({ title: t('toast_sync_success_title'), description: t('toast_sync_success_desc', { count }) });
      handleCheckForUpdates();
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: t('toast_sync_error') });
    } finally {
      setIsProcessingSync(false);
    }
  };

  const handleGlobalSearch = async () => {
    if (!searchTerm || !activeOrg) return;
    
    const targetType = HIERARCHY_MAP[activeOrg.type];
    if (!targetType) {
      toast({ title: "Fin de la cadena", description: "Tu nivel de edificio no permite buscar proveedores superiores." });
      return;
    }

    setIsSearchingGlobal(true);
    try {
      const q = query(
        collection(db, 'organizations'), 
        where('type', '==', targetType),
        where('status', '==', 'active')
      );
      const snap = await getDocs(q);
      const allMatches = snap.docs.map(d => ({ id: d.id, ...d.data() } as Organization));
      
      // Filtrado por nombre localmente para mayor flexibilidad
      const filteredMatches = allMatches.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setGlobalResults(filteredMatches);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Error al consultar la red global." });
    } finally {
      setIsSearchingGlobal(false);
    }
  };

  const handleRequestConnection = async (targetOrgId: string) => {
    if (!activeOrgId) return;
    try {
      await addDoc(collection(db, 'connections'), {
        fromOrgId: activeOrgId,
        toOrgId: targetOrgId,
        status: 'pending',
        type: 'supplier-client',
        createdAt: serverTimestamp()
      });
      toast({ title: "Solicitud Enviada", description: "El proveedor revisará tu conexión." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error" });
    }
  };

  const toggleSelect = (sku: string) => {
    setSelectedSkus(prev => prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  if (!activeOrg) return <div className="p-8 text-center text-muted-foreground">{t('select_org_message')}</div>;

  // Lógica robusta para la etiqueta de nivel jerárquico
  const nextLevel = HIERARCHY_MAP[activeOrg.type];
  const targetLevelLabel = nextLevel ? t(`group_level_${nextLevel}` as any) : "Nivel superior";

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-slate-900">
            <LinkIcon className="text-primary h-8 w-8" />
            {t('network_title')}
          </h1>
          <p className="text-slate-500 mt-1">{t('network_subtitle')}</p>
        </div>
        <div className="flex gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl border border-white/10 shadow-xl items-center">
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">{t('network_code_label')}</span>
            <span className="font-mono text-sm font-bold text-primary">{activeOrg.slug}</span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <Zap className="h-5 w-5 text-primary" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-1 rounded-xl border shadow-sm mb-6">
          <TabsTrigger value="sync" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <RefreshCw className="h-4 w-4" /> {t('tab_sync')}
          </TabsTrigger>
          <TabsTrigger value="manage" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Users className="h-4 w-4" /> {t('tab_manage')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="mt-0">
          <div className="grid gap-6">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg">{t('sync_card_title')}</CardTitle>
                    <CardDescription>{t('sync_card_desc')}</CardDescription>
                  </div>
                  <Button onClick={handleCheckForUpdates} disabled={isSyncing} className="bg-primary hover:bg-primary/90 rounded-full h-11 px-6 shadow-lg">
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    {t('search_changes_button')}
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
                            <TableHead>{t('table_product_sku')}</TableHead>
                            <TableHead className="text-right">{t('table_current_cost')}</TableHead>
                            <TableHead className="text-right">{t('table_new_cost')}</TableHead>
                            <TableHead className="text-center">{t('table_difference')}</TableHead>
                            <TableHead className="text-right">{t('table_current_price')}</TableHead>
                            <TableHead className="text-right bg-primary/5">{t('table_suggested_price')}</TableHead>
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
                                      {item.photoUrl ? (
                                        <Image src={item.photoUrl} alt={item.name} width={40} height={40} className="object-cover h-full w-full" />
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-muted text-slate-300">
                                          <RefreshCw className="h-5 w-5" />
                                        </div>
                                      )}
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
                                    {item.pricingMethod === 'margin' ? t('maintain_margin_method_margin') : t('maintain_margin_method_markup')}
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
                            <Label htmlFor="maintain-margins" className="font-bold text-sm">{t('maintain_margin_label')}</Label>
                            <Switch 
                              id="maintain-margins" 
                              checked={maintainMargins} 
                              onCheckedChange={setMaintainMargins} 
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">{t('maintain_margin_desc')}</p>
                        </div>
                      </div>
                      
                      <Button 
                        disabled={selectedSkus.length === 0 || isProcessingSync}
                        onClick={handleApplySync}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-10 rounded-xl font-bold h-14 shadow-xl shrink-0 w-full md:w-auto"
                      >
                        {isProcessingSync ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                        {t('update_products_button', { count: selectedSkus.length })}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24 flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                      <RefreshCw className="h-8 w-8 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{t('sync_up_to_date_title')}</h3>
                      <p className="text-slate-500 max-w-sm mx-auto mt-1">{t('sync_up_to_date_desc')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-none shadow-md relative overflow-hidden">
                {!isPremiumSearchEnabled && (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <Lock className="h-7 w-7" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">Buscador Premium</h3>
                    <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                      Encuentra nuevos proveedores verificados en Chicago y expande tu catálogo.
                    </p>
                    <Button size="sm" variant="outline" className="rounded-full border-amber-200 text-amber-700 bg-white hover:bg-amber-50">
                      Solicitar Acceso
                    </Button>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">{t('manage_card_title')}</CardTitle>
                  <CardDescription>{t('manage_card_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder={t('search_org_placeholder')} 
                        className="pl-8 bg-slate-50" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                      />
                    </div>
                    <Button size="icon" variant="secondary" onClick={handleGlobalSearch} disabled={isSearchingGlobal}>
                      {isSearchingGlobal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {globalResults.map(org => (
                      <div key={org.id} className="p-3 border rounded-xl bg-white flex items-center justify-between hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{org.name}</p>
                            <p className="text-[9px] uppercase font-bold text-muted-foreground">{org.type}</p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleRequestConnection(org.id)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Jerarquía Segura</span>
                </div>
                <p className="text-[10px] text-blue-800 leading-relaxed">
                  Tu edificio está configurado como <strong>{activeOrg.type}</strong>. Por seguridad, solo puedes buscar y vincularte con <strong>{targetLevelLabel}</strong>.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b pb-4">
                  <CardTitle className="text-base">{t('active_network_title')}</CardTitle>
                  <CardDescription>{t('active_network_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full rounded-xl" />
                      <Skeleton className="h-16 w-full rounded-xl" />
                    </div>
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
                                    {isMySupplier ? t('role_supplier') : t('role_client')}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-3 border-t mt-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              {t('data_flow_active')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-3xl bg-slate-50/50">
                      <LinkIcon className="mx-auto h-10 w-10 text-slate-300 mb-3 opacity-50" />
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">{t('no_partners_message')}</p>
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
