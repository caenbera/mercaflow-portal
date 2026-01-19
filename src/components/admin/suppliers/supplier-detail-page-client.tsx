"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { suppliers, supplierProducts } from '@/lib/placeholder-data';
import type { Supplier, SupplierProduct } from '@/types';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Star,
  FileInvoice,
  Send,
  UserCircle,
  Phone,
  Mail,
  Truck,
  CreditCard,
  Info,
  Percent,
  ThumbsUp,
  Boxes,
  TrendingUp,
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  LineChart,
  Pencil
} from 'lucide-react';
import { AddProductDialog } from './add-product-dialog';

interface SupplierDetailPageClientProps {
    supplier: Supplier;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const Rating = ({ rating, count }: { rating: number, count?: string }) => (
  <div className="flex items-center gap-1">
    <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
        <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
        ))}
    </div>
    {count && <span className="text-xs text-muted-foreground">{count}</span>}
  </div>
);

export function SupplierDetailPageClient({ supplier }: SupplierDetailPageClientProps) {
  const t = useTranslations('SuppliersPage');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  return (
    <>
    <AddProductDialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen} />
    <div className="flex flex-col gap-6">
      <div className="mb-4">
        <Button variant="ghost" asChild className="text-muted-foreground font-semibold px-0">
          <Link href="/admin/suppliers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back_to_list')}
          </Link>
        </Button>
      </div>

      {/* Hero */}
      <Card className="p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src={supplier.logo}
              alt={`${supplier.name} logo`}
              width={80}
              height={80}
              className="rounded-2xl border p-1 hidden sm:block"
            />
            <div>
              <h2 className="text-2xl font-bold font-headline">{supplier.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                {supplier.verified && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t('verified')}</Badge>}
                <Rating rating={supplier.rating} count={`(${supplier.rating}.0)`} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 self-start sm:self-center">
            <Button variant="outline"><FileInvoice className="mr-2" />{t('account_statement')}</Button>
            <Button><Send className="mr-2" />{t('send_order')}</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t('contact_payments')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3"><UserCircle className="h-5 w-5 text-primary mt-0.5" /> <div>{supplier.contact.name}</div></div>
            <div className="flex items-start gap-3"><Phone className="h-5 w-5 text-primary mt-0.5" /> <div>{supplier.contact.phone}</div></div>
            <div className="flex items-start gap-3"><Mail className="h-5 w-5 text-primary mt-0.5" /> <a href={`mailto:${supplier.contact.email}`} className="text-primary underline">{supplier.contact.email}</a></div>
            <hr />
            <div className="flex items-start gap-3"><Truck className="h-5 w-5 text-primary mt-0.5" /> <div>{t('delivery_days')}: {supplier.deliveryDays}</div></div>
            <div className="flex items-start gap-3"><CreditCard className="h-5 w-5 text-primary mt-0.5" /> <div>{t('payment_terms')}: {supplier.paymentTerms}</div></div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">{t('performance_finance')}</CardTitle>
              {supplier.finance.pendingBalance > 0 && <Badge variant="destructive">{t('debt')}: {formatCurrency(supplier.finance.pendingBalance)}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-2 bg-muted rounded-lg"><div className="text-xl font-bold">{supplier.finance.fillRate}%</div><div className="text-xs text-muted-foreground">{t('fill_rate')}</div></div>
              <div className="p-2 bg-muted rounded-lg"><div className={`text-xl font-bold ${supplier.finance.onTimeDelivery ? 'text-green-600' : 'text-red-600'}`}>On-Time</div><div className="text-xs text-muted-foreground">{t('on_time_deliveries')}</div></div>
              <div className="p-2 bg-muted rounded-lg"><div className="text-xl font-bold">12</div><div className="text-xs text-muted-foreground">{t('active_skus')}</div></div>
              <div className="p-2 bg-muted rounded-lg"><div className="text-xl font-bold">{formatCurrency(supplier.finance.ytdSpend / 1000)}k</div><div className="text-xs text-muted-foreground">{t('ytd_purchases')}</div></div>
            </div>
            {supplier.notes && (
              <div className="mt-4 bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <div><strong>{t('internal_note')}:</strong> {supplier.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

       {/* Product Catalog */}
      <Card className="shadow-sm">
        <CardHeader>
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-base">{t('product_catalog_costs')}</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t('search_product_placeholder')} className="pl-8" />
                    </div>
                    <Button onClick={() => setIsAddProductOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('add_product_button')}
                    </Button>
                </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="pl-6">{t('product')}</TableHead>
                        <TableHead>{t('purchase_unit')}</TableHead>
                        <TableHead>{t('current_cost')}</TableHead>
                        <TableHead>{t('history')}</TableHead>
                        <TableHead>{t('supplier_stock')}</TableHead>
                        <TableHead className="pr-6 text-right">{t('actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {supplierProducts.map(product => {
                        const costChange = product.previousCost ? product.currentCost - product.previousCost : 0;
                        return (
                        <TableRow key={product.id}>
                            <TableCell className="pl-6 font-medium">
                                <div className="flex items-center gap-3">
                                    <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-md object-cover"/>
                                    <div>
                                        <div className="font-semibold">{product.name}</div>
                                        <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{product.purchaseUnit}</TableCell>
                            <TableCell className="font-semibold">
                                <div className="flex items-center gap-1">
                                    {formatCurrency(product.currentCost)}
                                    {costChange > 0 && <ArrowUp className="h-3 w-3 text-destructive" title={`${t('price_increased')} ${formatCurrency(costChange)}`} />}
                                    {costChange < 0 && <ArrowDown className="h-3 w-3 text-green-600" title={`${t('price_decreased')} ${formatCurrency(Math.abs(costChange))}`} />}
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {product.previousCost ? `${t('before')}: ${formatCurrency(product.previousCost)}` : t('price_stable')}
                            </TableCell>
                             <TableCell>
                                {product.stockStatus === 'available' && <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">{t('available')}</Badge>}
                                {product.stockStatus === 'limited' && <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">{t('limited')}</Badge>}
                                {product.stockStatus === 'unavailable' && <Badge variant="destructive">{t('unavailable')}</Badge>}
                            </TableCell>
                            <TableCell className="pr-6">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><LineChart className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
