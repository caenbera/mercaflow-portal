"use client";

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Leaf
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- MOCK DATA ---
const lowStockSuggestions = [
  {
    product: { name: { es: 'Tomate Chonto', en: 'Roma Tomato' }, sku: 'TOM-001', image: 'https://i.postimg.cc/TY6YMwmY/tomate_chonto.png' },
    stock: { current: 12, unit: 'Kg' },
    currentSupplier: { name: 'AgroFresh Farms', price: 12.50, unit: 'Caja' },
    bestOffer: { name: 'GreenValley Corp', price: 11.80, unit: 'Caja' },
  },
  {
    product: { name: { es: 'Cebolla Blanca', en: 'White Onion' }, sku: 'ONI-202', image: 'https://i.postimg.cc/TPwHKV88/cebolla_blanca.png' },
    stock: { current: 5, unit: 'Bultos' },
    currentSupplier: { name: 'Global Imports', price: 28.00, unit: 'Bulto' },
    bestOffer: null,
  },
];

const generalCatalog = [
    {
        product: { name: { es: 'Limón Tahití', en: 'Tahiti Lime' }, sku: 'LIM-040', image: 'https://i.postimg.cc/43dFY6CX/limon.png' },
        stock: { current: 95, unit: 'Cajas', status: 'ok' },
        mainSupplier: { name: 'AgroFresh Farms', price: 59.00 },
    },
    {
        product: { name: { es: 'Aceite Vegetal 20L', en: 'Vegetable Oil 20L' }, sku: 'OIL-500', image: 'https://i.postimg.cc/7L6Q53vy/aceite20.png' },
        stock: { current: 40, unit: 'Bidones', status: 'ok' },
        mainSupplier: { name: 'Global Imports', price: 35.50 },
    }
]

// --- TYPES ---
interface CartItem {
  name: string;
  price: number;
  qty: number;
}
interface ProcurementCart {
  [vendorName: string]: CartItem[];
}
interface ComparisonData {
    productName: string;
    current: { name: string; price: number };
    best: { name: string; price: number };
}

// --- PRINTABLE PO COMPONENT ---
const PrintablePO = ({ poData, onDone }: { poData: any, onDone: () => void }) => {
    const t = useTranslations('PurchasingPage');

    useEffect(() => {
        if (poData) {
            const handleAfterPrint = () => {
                onDone();
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
             <div className="flex justify-end mt-4">
                <div className="w-1/3 text-right">
                    <div className="flex justify-between py-2 border-t">
                        <span className="text-xl font-bold">{t('print_total_label')}:</span>
                        <span className="text-xl font-bold text-primary">${poData.total.toFixed(2)}</span>
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
  const [procurementCart, setProcurementCart] = useState<ProcurementCart>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [poToPrint, setPoToPrint] = useState<any | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredCatalog = useMemo(() => {
    if (!searchTerm) return generalCatalog;
    return generalCatalog.filter(item => 
        item.product.name.es.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.name.en.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleOpenCompare = (data: ComparisonData) => setComparisonData(data);
  const handleCloseCompare = () => setComparisonData(null);

  const handleAddToCart = (productName: string, vendor: string, price: number) => {
    setProcurementCart(prevCart => {
      const newCart = { ...prevCart };
      const vendorCart = newCart[vendor] ? [...newCart[vendor]] : [];
      const existingItem = vendorCart.find(p => p.name === productName);

      if (existingItem) {
        existingItem.qty += 10; // Default 10 uds
      } else {
        vendorCart.push({ name: productName, price, qty: 10 });
      }
      newCart[vendor] = vendorCart;
      return newCart;
    });
    handleCloseCompare(); // Cierra el modal de comparación si está abierto
  };
  
  const handleUpdateQty = (vendor: string, productName: string, newQty: string) => {
     setProcurementCart(prevCart => {
      const newCart = { ...prevCart };
      const vendorCart = newCart[vendor] ? [...newCart[vendor]] : [];
      const itemToUpdate = vendorCart.find(p => p.name === productName);
      if (itemToUpdate) {
        itemToUpdate.qty = parseInt(newQty, 10) || 0;
      }
      newCart[vendor] = vendorCart;
      return newCart;
    });
  }

  const handleRemoveDraft = (vendor: string) => {
    if (window.confirm(`${t('confirm_remove_draft')} ${vendor}?`)) {
      setProcurementCart(prevCart => {
        const newCart = { ...prevCart };
        delete newCart[vendor];
        return newCart;
      });
    }
  };

  const handlePrintPO = (vendorName: string) => {
      const items = procurementCart[vendorName];
      if (!items) return;

      const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const poId = `PO-${9020 + Object.keys(procurementCart).indexOf(vendorName)}`;
      
      setPoToPrint({
          vendorName,
          items,
          total,
          poId,
          date: new Date().toLocaleDateString(),
      });
  };

  return (
    <>
      {isClient && poToPrint && createPortal(
        <PrintablePO poData={poToPrint} onDone={() => setPoToPrint(null)} />,
        document.body
      )}
      <div className="flex flex-col gap-6 no-print">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold font-headline">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Suggestions Card */}
        <Card className="border-yellow-400">
            <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <Flame className="text-red-500"/>
                    {t('suggestions_title')}
                </h2>
                <p className="text-sm text-muted-foreground">{t('suggestions_subtitle')}</p>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('product_header')}</TableHead>
                                <TableHead>{t('stock_status_header')}</TableHead>
                                <TableHead>{t('current_supplier_header')}</TableHead>
                                <TableHead>{t('price_opportunity_header')}</TableHead>
                                <TableHead className="text-right">{t('action_header')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lowStockSuggestions.map(item => (
                                <TableRow key={item.product.sku}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Image src={item.product.image} alt={item.product.name.es} width={40} height={40} className="rounded-md object-cover" />
                                            <div>
                                                <div className="font-semibold">{item.product.name.es}</div>
                                                <div className="text-xs text-muted-foreground">SKU: {item.product.sku}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                     <TableCell>
                                        <Badge variant="destructive">{t('remaining_stock')} {item.stock.current} {item.stock.unit}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{item.currentSupplier.name}</div>
                                        <div className="text-sm text-muted-foreground">${item.currentSupplier.price.toFixed(2)} / {item.currentSupplier.unit}</div>
                                    </TableCell>
                                     <TableCell>
                                        {item.bestOffer ? (
                                            <div>
                                                <div className="flex items-center gap-1 font-bold text-primary">
                                                    <ArrowDown className="h-4 w-4"/>
                                                    ${item.bestOffer.price.toFixed(2)}
                                                    <Badge className="ml-1 bg-primary/10 text-primary hover:bg-primary/20">
                                                       {t('save_tag')} {((1 - item.bestOffer.price / item.currentSupplier.price) * 100).toFixed(0)}%
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground">{item.bestOffer.name}</div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">{t('best_price_found')}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.bestOffer ? (
                                            <Button variant="outline" size="sm" onClick={() => handleOpenCompare({
                                                productName: item.product.name.es,
                                                current: { name: item.currentSupplier.name, price: item.currentSupplier.price },
                                                best: { name: item.bestOffer.name, price: item.bestOffer.price },
                                            })}>
                                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                                {t('compare_button')}
                                            </Button>
                                        ) : (
                                            <Button size="sm" onClick={() => handleAddToCart(item.product.name.es, item.currentSupplier.name, item.currentSupplier.price)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                {t('add_button')}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        {/* General Catalog Card */}
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="font-bold text-lg">{t('catalog_title')}</h2>
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={t('search_placeholder')} 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
             <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                         <TableHeader>
                            <TableRow>
                                <TableHead>{t('product_header')}</TableHead>
                                <TableHead>{t('stock_status_header')}</TableHead>
                                <TableHead>{t('main_supplier_header')}</TableHead>
                                <TableHead>{t('unit_cost_header')}</TableHead>
                                <TableHead className="text-right">{t('action_header')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCatalog.map(item => (
                                <TableRow key={item.product.sku}>
                                    <TableCell>
                                         <div className="flex items-center gap-3">
                                            <Image src={item.product.image} alt={item.product.name.es} width={40} height={40} className="rounded-md object-cover opacity-70" />
                                            <div>
                                                <div className="font-semibold">{item.product.name.es}</div>
                                                <div className="text-xs text-muted-foreground">SKU: {item.product.sku}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                                            {item.stock.current} {item.stock.unit} ({item.stock.status.toUpperCase()})
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.mainSupplier.name}</TableCell>
                                    <TableCell className="font-semibold">${item.mainSupplier.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                         <Button variant="outline" size="sm" onClick={() => handleAddToCart(item.product.name.es, item.mainSupplier.name, item.mainSupplier.price)}>
                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                            {t('add_to_cart_button')}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
             </CardContent>
        </Card>

        {/* PO Drafts Section */}
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2 pt-4 border-t mt-4">
                <ClipboardList />
                {t('draft_pos_title')}
            </h2>
            {Object.keys(procurementCart).length === 0 ? (
                 <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card shadow-sm">
                    <ShoppingCart className="mx-auto h-12 w-12 opacity-25 mb-2"/>
                    <p className="font-semibold">{t('no_drafts_title')}</p>
                    <p className="text-sm">{t('no_drafts_subtitle')}</p>
                </div>
            ) : (
                Object.entries(procurementCart).map(([vendor, items]) => {
                    const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
                    return (
                        <Card key={vendor} className="border-l-4 border-primary">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                     <div>
                                        <p className="text-sm font-semibold uppercase text-muted-foreground">{t('po_draft_title')}</p>
                                        <h3 className="font-bold text-lg text-primary">{vendor}</h3>
                                     </div>
                                      <div className="text-left sm:text-right">
                                        <p className="font-bold text-xl text-green-600">${total.toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">{items.length} {t('items_label')}</p>
                                     </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableBody>
                                        {items.map(item => (
                                            <TableRow key={item.name}>
                                                <TableCell className="font-semibold">{item.name}</TableCell>
                                                <TableCell>
                                                    <Input type="number" value={item.qty} className="w-20 h-8" onChange={(e) => handleUpdateQty(vendor, item.name, e.target.value)} />
                                                </TableCell>
                                                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-bold">${(item.qty * item.price).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="flex justify-between items-center pt-4 mt-4 border-t">
                                    <Button variant="link" className="text-destructive p-0 h-auto" onClick={() => handleRemoveDraft(vendor)}>
                                        <Trash2 className="mr-2 h-4 w-4"/> {t('remove_draft_button')}
                                    </Button>
                                    <Button onClick={() => handlePrintPO(vendor)}>
                                        <FileText className="mr-2 h-4 w-4" />{t('generate_pdf_button')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })
            )}
        </div>
      </div>

       {/* Price Comparator Dialog */}
       <Dialog open={!!comparisonData} onOpenChange={(isOpen) => !isOpen && handleCloseCompare()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('compare_modal_title')}: {comparisonData?.productName}</DialogTitle>
                    <DialogDescription>{t('compare_modal_subtitle')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                     {comparisonData && (
                        <>
                            {/* Best Price Option */}
                            <button className="w-full text-left p-3 border-2 border-primary bg-green-50 rounded-lg hover:bg-green-100" onClick={() => handleAddToCart(comparisonData.productName, comparisonData.best.name, comparisonData.best.price)}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Trophy className="h-5 w-5" /></div>
                                        <div>
                                            <p className="font-bold">{comparisonData.best.name}</p>
                                            <p className="text-sm text-primary font-semibold">{t('best_option_label')}</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-primary">${comparisonData.best.price.toFixed(2)}</p>
                                </div>
                            </button>
                             {/* Current Supplier Option */}
                            <button className="w-full text-left p-3 border rounded-lg hover:bg-muted" onClick={() => handleAddToCart(comparisonData.productName, comparisonData.current.name, comparisonData.current.price)}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><History className="h-5 w-5" /></div>
                                        <div>
                                            <p className="font-semibold">{comparisonData.current.name}</p>
                                            <p className="text-sm text-muted-foreground">{t('current_supplier_label')}</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-semibold">${comparisonData.current.price.toFixed(2)}</p>
                                </div>
                            </button>
                        </>
                    )}
                </div>
            </DialogContent>
       </Dialog>
    </>
  );
}
