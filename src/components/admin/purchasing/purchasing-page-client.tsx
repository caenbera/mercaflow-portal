
"use client";

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useProducts } from '@/hooks/use-products';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useAllOrders } from '@/hooks/use-all-orders';
import { startOfMonth } from 'date-fns';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Flame,
  ArrowDown,
  ArrowRightLeft,
  Plus,
  ShoppingCart,
  ClipboardList,
  Trash2,
  FileText,
  Search,
  Trophy,
  History,
  DollarSign,
  Leaf,
  Lightbulb,
  FileCheck2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product, ProductSupplier, SupplierDiscount, PurchaseOrder } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { addPurchaseOrder } from '@/lib/firestore/purchaseOrders';
import { usePurchaseOrders } from '@/hooks/use-purchase-orders';
import { ReceptionConfirmationDialog } from './reception-confirmation-dialog';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}
interface ProcurementCart {
  [vendorName: string]: CartItem[];
}
interface ComparisonData {
    productName: string;
    product: Product;
    current: ProductSupplier & { name: string };
    best: ProductSupplier & { name: string };
}
interface DiscountInfo {
    appliedDiscount: {
        description: string;
        amount: number;
    } | null;
    opportunities: string[];
}

const PrintablePO = ({ poData, onDone }: { poData: any, onDone: () => void }) => {
    const t = useTranslations('PurchasingPage');

    useEffect(() => {
        if (poData) {
            document.body.classList.add('is-printing');
            const handleAfterPrint = () => {
                onDone();
                document.body.classList.remove('is-printing');
                window.removeEventListener('afterprint', handleAfterPrint);
            };

            window.addEventListener('afterprint', handleAfterPrint);
            window.print();
            
            return () => {
                window.removeEventListener('afterprint', handleAfterPrint);
            };
        }
    }, [poData, onDone]);

    if (!poData) return null;

    const subtotal = poData.items.reduce((sum: number, item: any) => sum + item.price * item.qty, 0);

    return (
        <div className="print-area">
             <div className="flex justify-between mb-10 border-b pb-4" style={{borderColor: 'hsl(var(--sidebar-background))'}}>
                <div>
                    <h1 className="text-4xl font-extrabold m-0" style={{color: 'hsl(var(--sidebar-background))'}}>{t('po_id')}</h1>
                    <div className="text-lg text-gray-500">{poData.poId}</div>
                </div>
                <div className="text-right">
                    <h3 className="text-2xl font-bold m-0 text-primary flex items-center gap-2"><Leaf /> Fresh Hub</h3>
                    <div className="text-sm">{t('print_warehouse_name')}</div>
                    <div className="text-sm">{t('print_date_label')}: {poData.date}</div>
                </div>
            </div>

            <div className="flex justify-between mb-10">
                 <div>
                    <h6 className="font-bold uppercase text-muted-foreground">{t('print_supplier_label')}:</h6>
                    <h2 className="m-0 font-bold text-2xl text-gray-800">{poData.vendorName}</h2>
                    <div>Departamento de Ventas</div>
                </div>
                <div className="text-right">
                    <h6 className="font-bold uppercase text-muted-foreground">{t('print_send_to_label')}:</h6>
                    <h5 className="font-bold">{t('print_warehouse_name')}</h5>
                    <div>{t('print_warehouse_dock')}</div>
                </div>
            </div>

            <table className="print-table w-full">
                <thead>
                    <tr>
                        <th className="text-left">{t('print_product_header')}</th>
                        <th className="text-center">{t('print_qty_header')}</th>
                        <th className="text-right">{t('print_unit_cost_header')}</th>
                        <th className="text-right">{t('print_subtotal_header')}</th>
                    </tr>
                </thead>
                <tbody>
                    {poData.items.map((item: any, index: number) => (
                         <tr key={index}>
                            <td>{item.name}</td>
                            <td className="text-center">{item.qty}</td>
                            <td className="text-right">${item.price.toFixed(2)}</td>
                            <td className="text-right">${(item.qty * item.price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
             <div className="w-full flex justify-end mt-4">
                <div className="w-1/2 sm:w-1/3 text-right space-y-1">
                    <div className="flex justify-between py-1">
                        <span>Subtotal:</span>
                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                     {poData.discountInfo?.appliedDiscount && (
                       <div className="flex justify-between py-1 border-t text-green-600">
                            <span>{poData.discountInfo.appliedDiscount.description}:</span>
                            <span className="font-medium">-${poData.discountInfo.appliedDiscount.amount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-2 border-t text-lg">
                        <span className="font-bold">{t('print_total_label')}:</span>
                        <span className="font-bold text-primary">${poData.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
             <div className="fixed bottom-8 left-0 w-full text-center text-xs text-gray-400">
                {t('print_footer')}
            </div>
        </div>
    );
};

export function PurchasingPageClient() {
  const t = useTranslations('PurchasingPage');
  const locale = useLocale() as 'es' | 'en';
  const { toast } = useToast();
  
  const { products, loading: productsLoading } = useProducts();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { orders: allOrders, loading: ordersLoading } = useAllOrders();
  const loading = productsLoading || suppliersLoading || ordersLoading;

  const [procurementCart, setProcurementCart] = useState<ProcurementCart>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [poToPrint, setPoToPrint] = useState<any | null>(null);
  const [isClient, setIsClient] = useState(false);

  const { purchaseOrders, loading: poLoading } = usePurchaseOrders();
  const [isReceptionDialogOpen, setIsReceptionDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  useEffect(() => { setIsClient(true); }, []);

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'N/A';
  
  const unifiedProducts = useMemo(() => {
    if (loading) return [];
    const productMap = products.reduce((acc, product) => {
        const existing = acc.get(product.sku);
        if (existing) {
            existing.stock += product.stock;
        } else {
            acc.set(product.sku, { ...product });
        }
        return acc;
    }, new Map<string, Product>());
    return Array.from(productMap.values());
  }, [products, loading]);

  const lowStockSuggestions = useMemo(() => {
    if (loading) return [];
    return unifiedProducts.filter(p => p.stock <= p.minStock && p.suppliers?.length > 0);
  }, [unifiedProducts, loading]);
  
  const generalCatalog = useMemo(() => {
    if (loading) return [];
    const lowStockSKUs = new Set(lowStockSuggestions.map(p => p.sku));
    let catalog = unifiedProducts.filter(p => !lowStockSKUs.has(p.sku) && p.suppliers?.length > 0);

    if (searchTerm) {
        return catalog.filter(p => p.name.es.toLowerCase().includes(searchTerm.toLowerCase()) || p.name.en.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return catalog;
  }, [unifiedProducts, loading, lowStockSuggestions, searchTerm]);

  const discountCalculations = useMemo(() => {
    if (loading) return {};
    const now = new Date();
    const startOfMonthDate = startOfMonth(now);
    const calculations: Record<string, DiscountInfo> = {};

    for (const vendorName in procurementCart) {
        const supplier = suppliers.find(s => s.name === vendorName);
        if (!supplier?.volumeDiscounts) continue;

        const cartItems = procurementCart[vendorName];
        const draftTotal = cartItems.reduce((sum, item) => sum + item.qty * item.price, 0);

        const monthlyTotal = allOrders
            .filter(o => o.createdAt.toDate() >= startOfMonthDate && (products.find(p => p.id === o.items[0]?.productId)?.suppliers.some(s => s.supplierId === supplier.id))) // Simplification, assumes first item's supplier is representative.
            .reduce((sum, o) => sum + o.total, 0);
        
        let bestDiscount: { rule: SupplierDiscount, amount: number } | null = null;
        const opportunities: string[] = [];

        for (const rule of supplier.volumeDiscounts) {
            let isApplicable = false;
            let currentProgress = 0;
            let threshold = rule.from;

            if (rule.type === 'amount' && rule.scope === 'order') {
                isApplicable = draftTotal >= threshold;
                currentProgress = draftTotal;
            } else if (rule.type === 'monthlyVolume' && rule.scope === 'order') {
                const projectedTotal = monthlyTotal + draftTotal;
                isApplicable = projectedTotal >= threshold;
                currentProgress = projectedTotal;
            } else if (rule.type === 'quantity' && rule.scope === 'product') {
                const item = cartItems.find(i => i.productId === rule.productId);
                if (item) {
                    isApplicable = item.qty >= threshold;
                    currentProgress = item.qty;
                }
            }

            if (isApplicable) {
                const discountAmount = draftTotal * (rule.discount / 100);
                if (!bestDiscount || discountAmount > bestDiscount.amount) {
                    bestDiscount = { rule, amount: discountAmount };
                }
            } else {
                const closeness = currentProgress / threshold;
                if (closeness >= 0.8) { // 80% towards the goal
                    const needed = threshold - currentProgress;
                    if (rule.type === 'quantity') {
                        const productName = products.find(p => p.id === rule.productId)?.name[locale as 'es'|'en'] || 'product';
                        opportunities.push(t('opportunity_add_units', { needed: needed.toFixed(0), productName, discount: rule.discount }));
                    } else {
                        opportunities.push(t('opportunity_add_amount', { needed: needed.toFixed(2), discount: rule.discount }));
                    }
                }
            }
        }
        
        calculations[vendorName] = {
            appliedDiscount: bestDiscount ? { description: t('discount_applied_desc', { discount: bestDiscount.rule.discount }), amount: bestDiscount.amount } : null,
            opportunities,
        };
    }
    return calculations;
  }, [procurementCart, suppliers, allOrders, products, loading, locale, t]);

  const pendingPOs = useMemo(() => {
    if (poLoading) return [];
    return purchaseOrders.filter(po => po.status === 'pending');
  }, [purchaseOrders, poLoading]);

  const handleOpenReceptionDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsReceptionDialogOpen(true);
  };

  const handleOpenCompare = (product: Product, current: ProductSupplier, best: ProductSupplier) => setComparisonData({ product, productName: product.name[locale], current: { ...current, name: getSupplierName(current.supplierId) }, best: { ...best, name: getSupplierName(best.supplierId) } });
  const handleCloseCompare = () => setComparisonData(null);
  const handleAddToCart = (product: Product, vendorId: string, price: number) => { const vendorName = getSupplierName(vendorId); setProcurementCart(prevCart => { const newCart = { ...prevCart }; const vendorCart = newCart[vendorName] ? [...newCart[vendorName]] : []; const existingItem = vendorCart.find(p => p.productId === product.id); if (existingItem) { existingItem.qty += 10; } else { vendorCart.push({ productId: product.id, name: product.name[locale], price, qty: 10 }); } newCart[vendorName] = vendorCart; return newCart; }); handleCloseCompare(); };
  const handleUpdateQty = (vendor: string, productName: string, newQty: string) => { setProcurementCart(prevCart => { const newCart = { ...prevCart }; const vendorCart = newCart[vendor] ? [...newCart[vendor]] : []; const itemToUpdate = vendorCart.find(p => p.name === productName); if (itemToUpdate) { itemToUpdate.qty = parseInt(newQty, 10) || 0; } newCart[vendor] = vendorCart; return newCart; }); };
  const handleRemoveDraft = (vendor: string) => { if (window.confirm(`${t('confirm_remove_draft')} ${vendor}?`)) { setProcurementCart(prevCart => { const newCart = { ...prevCart }; delete newCart[vendor]; return newCart; }); } };
  
  const handleSaveAndPrintPO = async (vendorName: string) => {
    const items = procurementCart[vendorName];
    if (!items || items.length === 0) {
      toast({
        variant: 'destructive',
        title: t('cannot_create_po_title'),
        description: t('cannot_create_po_desc'),
      });
      return;
    }
  
    const supplier = suppliers.find(s => s.name === vendorName);
    if (!supplier) {
      toast({ variant: 'destructive', title: 'Supplier not found' });
      return;
    }
  
    const discountInfo = discountCalculations[vendorName];
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const total = subtotal - (discountInfo?.appliedDiscount?.amount || 0);
    const poId = `PO-${1000 + Math.floor(Math.random() * 9000)}`;
  
    const purchaseOrderData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'completedAt'> = {
      poId,
      supplierId: supplier.id,
      supplierName: vendorName,
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        orderedQty: item.qty,
        price: item.price,
      })),
      subtotal,
      discountInfo,
      total,
      status: 'pending',
    };
  
    try {
      await addPurchaseOrder(purchaseOrderData);
      toast({
        title: t('po_saved_success_title'),
        description: t('po_saved_success_desc', { poId }),
      });
  
      setPoToPrint({ ...purchaseOrderData, date: new Date().toLocaleDateString() });
  
      setProcurementCart(prevCart => {
        const newCart = { ...prevCart };
        delete newCart[vendorName];
        return newCart;
      });
    } catch (error) {
      console.error("Error saving purchase order:", error);
      toast({
        variant: 'destructive',
        title: t('po_saved_error_title'),
        description: t('po_saved_error_desc'),
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };


  const renderProductRow = (product: Product) => {
    if (!product.suppliers || product.suppliers.length === 0) return null;
    const primarySupplier = product.suppliers.find(s => s.isPrimary) || product.suppliers[0];
    if (!primarySupplier) return null;
    const bestSupplier = product.suppliers.reduce((best, current) => (current.cost < best.cost ? current : best));
    const hasOpportunity = product.suppliers.length > 1 && bestSupplier.supplierId !== primarySupplier.supplierId;
    const unitText = (typeof product.unit === 'object' && product.unit?.[locale]) ? product.unit[locale] : (product.unit as any);
    const savings = hasOpportunity ? ((primarySupplier.cost - bestSupplier.cost) / primarySupplier.cost) * 100 : 0;
    return (
      <TableRow key={product.sku}>
        <TableCell><div className="flex items-center gap-3"><Image src={product.photoUrl || 'https://via.placeholder.com/40'} alt={product.name[locale]} width={40} height={40} className="rounded-md object-cover" /><div className="font-semibold">{product.name[locale]}<div className="text-xs text-muted-foreground">SKU: {product.sku}</div></div></div></TableCell>
        <TableCell>{product.stock <= product.minStock ? <Badge variant="destructive">{product.stock} {unitText}</Badge> : <Badge variant="secondary" className="bg-green-100 text-green-700">{product.stock} {unitText}</Badge>}</TableCell>
        <TableCell><div className="font-medium">{getSupplierName(primarySupplier.supplierId)}</div><div className="text-sm text-muted-foreground">${primarySupplier.cost.toFixed(2)}</div></TableCell>
        <TableCell>{hasOpportunity ? <div><div className="flex items-center gap-1 font-bold text-primary"><ArrowDown className="h-4 w-4"/>${bestSupplier.cost.toFixed(2)}<Badge className="ml-1 bg-primary/10 text-primary hover:bg-primary/20">{t('save_tag')} {savings.toFixed(0)}%</Badge></div><div className="text-sm text-muted-foreground">{getSupplierName(bestSupplier.supplierId)}</div></div> : <div className="text-sm text-muted-foreground">{t('best_price_found')}</div>}</TableCell>
        <TableCell className="text-right">{hasOpportunity ? <Button variant="outline" size="sm" onClick={() => handleOpenCompare(product, primarySupplier, bestSupplier)}><ArrowRightLeft className="mr-2 h-4 w-4" />{t('compare_button')}</Button> : <Button size="sm" onClick={() => handleAddToCart(product, primarySupplier.supplierId, primarySupplier.cost)}><Plus className="mr-2 h-4 w-4" />{t('add_button')}</Button>}</TableCell>
      </TableRow>
    );
  };

  return (
    <>
      {isClient && poToPrint && createPortal( <PrintablePO poData={poToPrint} onDone={() => setPoToPrint(null)} />, document.body )}
      <ReceptionConfirmationDialog
        open={isReceptionDialogOpen}
        onOpenChange={setIsReceptionDialogOpen}
        purchaseOrder={selectedPO}
      />
      <div className="flex flex-col gap-6 no-print">
        <div><h1 className="text-2xl font-bold font-headline">{t('title')}</h1><p className="text-muted-foreground">{t('subtitle')}</p></div>
        <Card className="border-yellow-400"><CardHeader className="bg-yellow-50 dark:bg-yellow-900/20"><h2 className="font-bold text-lg flex items-center gap-2"><Flame className="text-red-500"/>{t('suggestions_title')}</h2><p className="text-sm text-muted-foreground">{t('suggestions_subtitle')}</p></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t('product_header')}</TableHead><TableHead>{t('stock_status_header')}</TableHead><TableHead>{t('current_supplier_header')}</TableHead><TableHead>{t('price_opportunity_header')}</TableHead><TableHead className="text-right">{t('action_header')}</TableHead></TableRow></TableHeader><TableBody>{loading ? Array.from({length: 2}).map((_,i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full"/></TableCell></TableRow>) : lowStockSuggestions.map(renderProductRow)}</TableBody></Table></div></CardContent></Card>
        <Card><CardHeader><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><h2 className="font-bold text-lg">{t('catalog_title')}</h2><div className="relative max-w-xs w-full"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t('search_placeholder')} className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t('product_header')}</TableHead><TableHead>{t('stock_status_header')}</TableHead><TableHead>{t('main_supplier_header')}</TableHead><TableHead>{t('price_opportunity_header')}</TableHead><TableHead className="text-right">{t('action_header')}</TableHead></TableRow></TableHeader><TableBody>{loading ? Array.from({length: 3}).map((_,i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full"/></TableCell></TableRow>) : generalCatalog.map(renderProductRow)}</TableBody></Table></div></CardContent></Card>
        
        <Card>
            <CardHeader>
                <h2 className="font-bold text-lg flex items-center gap-2"><FileCheck2 className="text-blue-500"/>{t('pending_receptions_title')}</h2>
                <p className="text-sm text-muted-foreground">{t('pending_receptions_subtitle')}</p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('reception_id_header')}</TableHead>
                                <TableHead>{t('reception_supplier_header')}</TableHead>
                                <TableHead>{t('reception_date_header')}</TableHead>
                                <TableHead className="text-right">{t('total_header')}</TableHead>
                                <TableHead className="text-right">{t('action_header')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {poLoading ? (
                                <TableRow><TableCell colSpan={5}><Skeleton className="h-10 w-full"/></TableCell></TableRow>
                            ) : pendingPOs.length > 0 ? (
                                pendingPOs.map(po => (
                                    <TableRow key={po.id}>
                                        <TableCell className="font-bold">{po.poId}</TableCell>
                                        <TableCell>{po.supplierName}</TableCell>
                                        <TableCell>{po.createdAt.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(po.total)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => handleOpenReceptionDialog(po)}>{t('reception_confirm_button')}</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">{t('no_pending_receptions')}</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        <div className="space-y-4"><h2 className="text-xl font-bold text-primary flex items-center gap-2 pt-4 border-t mt-4"><ClipboardList />{t('draft_pos_title')}</h2>{Object.keys(procurementCart).length === 0 ? <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card shadow-sm"><ShoppingCart className="mx-auto h-12 w-12 opacity-25 mb-2"/><p className="font-semibold">{t('no_drafts_title')}</p><p className="text-sm">{t('no_drafts_subtitle')}</p></div> : (
          Object.entries(procurementCart).map(([vendor, items]) => {
            const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
            const discountInfo = discountCalculations[vendor];
            const total = subtotal - (discountInfo?.appliedDiscount?.amount || 0);
            return (
              <Card key={vendor} className="border-l-4 border-primary">
                <CardHeader><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><p className="text-sm font-semibold uppercase text-muted-foreground">{t('po_draft_title')}</p><h3 className="font-bold text-lg text-primary">{vendor}</h3></div><div className="text-left sm:text-right"><p className="font-bold text-xl text-green-600">${total.toFixed(2)}</p><p className="text-sm text-muted-foreground">{items.length} {t('items_label')}</p></div></div></CardHeader>
                <CardContent>
                  {discountInfo?.opportunities && discountInfo.opportunities.length > 0 && (
                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm mb-4 space-y-1">
                      {discountInfo.opportunities.map((opp, i) => (
                        <div key={i} className="flex gap-2 items-center font-semibold"><Lightbulb className="h-4 w-4"/> {opp}</div>
                      ))}
                    </div>
                  )}
                  <div className="overflow-x-auto"><Table><TableBody>{items.map(item => (<TableRow key={item.name}><TableCell className="font-semibold">{item.name}</TableCell><TableCell><Input type="number" value={item.qty} className="w-20 h-8" onChange={(e) => handleUpdateQty(vendor, item.name, e.target.value)} /></TableCell><TableCell className="text-right">${item.price.toFixed(2)}</TableCell><TableCell className="text-right font-bold">${(item.qty * item.price).toFixed(2)}</TableCell></TableRow>))}</TableBody></Table></div>
                  <div className="flex justify-end mt-2">
                    <div className="w-full max-w-sm text-sm">
                      <div className="flex justify-between py-1 border-t"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                      {discountInfo?.appliedDiscount && <div className="flex justify-between py-1 text-green-600 font-semibold"><span>{discountInfo.appliedDiscount.description}:</span><span>-${discountInfo.appliedDiscount.amount.toFixed(2)}</span></div>}
                      <div className="flex justify-between py-1 font-bold border-t"><span>Total:</span><span>${total.toFixed(2)}</span></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 mt-4 border-t"><Button variant="link" className="text-destructive p-0 h-auto" onClick={() => handleRemoveDraft(vendor)}><Trash2 className="mr-2 h-4 w-4"/> {t('remove_draft_button')}</Button><Button onClick={() => handleSaveAndPrintPO(vendor)}><FileText className="mr-2 h-4 w-4" />{t('save_print_po_button')}</Button></div>
                </CardContent>
              </Card>
            )
          })
        )}</div>
      </div>
      <Dialog open={!!comparisonData} onOpenChange={(isOpen) => !isOpen && handleCloseCompare()}><DialogContent><DialogHeader><DialogTitle>{t('compare_modal_title')}: {comparisonData?.productName}</DialogTitle><DialogDescription>{t('compare_modal_subtitle')}</DialogDescription></DialogHeader><div className="space-y-3 py-4">{comparisonData && (<>
        <button className="w-full text-left p-3 border-2 border-primary bg-green-50 rounded-lg hover:bg-green-100" onClick={() => handleAddToCart(comparisonData.product, comparisonData.best.supplierId, comparisonData.best.cost)}><div className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Trophy className="h-5 w-5" /></div><div><p className="font-bold">{comparisonData.best.name}</p><p className="text-sm text-primary font-semibold">{t('best_option_label')}</p></div></div><p className="text-lg font-bold text-primary">${comparisonData.best.cost.toFixed(2)}</p></div></button>
        <button className="w-full text-left p-3 border rounded-lg hover:bg-muted" onClick={() => handleAddToCart(comparisonData.product, comparisonData.current.supplierId, comparisonData.current.cost)}><div className="flex justify-between items-center"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><History className="h-5 w-5" /></div><div><p className="font-semibold">{comparisonData.current.name}</p><p className="text-sm text-muted-foreground">{t('current_supplier_label')}</p></div></div><p className="text-lg font-semibold">${comparisonData.current.cost.toFixed(2)}</p></div></button>
      </>)}</div></DialogContent></Dialog>
    </>
  );
}
