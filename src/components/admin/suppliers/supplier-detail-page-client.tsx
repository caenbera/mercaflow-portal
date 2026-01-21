"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Supplier, Product } from '@/types';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Star,
  FileText,
  Send,
  Phone,
  Mail,
  Truck,
  CreditCard,
  Info,
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  LineChart,
  Pencil,
  BotMessageSquare,
  Trash2,
} from 'lucide-react';
import { ProductDialog } from '@/components/dashboard/products/product-dialog';
import { DeleteProductAlert } from '@/components/dashboard/products/delete-product-alert';
import { AddSupplierDialog } from './add-supplier-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


interface SupplierDetailPageClientProps {
    supplier: Supplier;
    products: Product[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const InteractiveRating = ({ initialRating, onRate }: { initialRating: number, onRate: (rating: number) => void }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(initialRating);

  const handleRate = (rating: number) => {
    setCurrentRating(rating);
    onRate(rating);
  };
  
  return (
    <div className="flex items-center gap-1">
      <div 
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHoverRating(0)}
      >
        {[...Array(5)].map((_, i) => {
          const ratingValue = i + 1;
          return (
            <Star
              key={i}
              className={cn(
                "h-5 w-5 cursor-pointer transition-colors",
                ratingValue <= (hoverRating || currentRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              )}
              onMouseEnter={() => setHoverRating(ratingValue)}
              onClick={() => handleRate(ratingValue)}
            />
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground">({currentRating.toFixed(1)})</span>
    </div>
  );
};

export function SupplierDetailPageClient({ supplier, products: supplierCatalog }: SupplierDetailPageClientProps) {
  const t = useTranslations('SuppliersPage');
  const { toast } = useToast();
  
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(supplier);
  
  // State for product modals
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleRatingChange = (newRating: number) => {
      // In a real app, this would be an async call to update the DB
      setCurrentSupplier(prev => ({...prev, rating: newRating}));
      toast({
          title: t('rating_updated_title'),
          description: t('rating_updated_desc', { supplierName: supplier.name, rating: newRating }),
      });
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setAlertOpen(true);
  };

  return (
    <>
      <ProductDialog 
        open={isProductDialogOpen} 
        onOpenChange={setIsProductDialogOpen} 
        product={selectedProduct} 
        defaultSupplierId={supplier.id}
      />
      <DeleteProductAlert
        open={isAlertOpen}
        onOpenChange={setAlertOpen}
        product={selectedProduct}
      />
      <AddSupplierDialog 
        open={isSupplierDialogOpen}
        onOpenChange={setIsSupplierDialogOpen}
        supplier={currentSupplier}
      />
      <div className="flex flex-col gap-6">
        <div className="mb-4">
          <Button variant="ghost" asChild className="text-muted-foreground font-semibold px-0">
            <Link href="/admin/suppliers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back_to_list')}
            </Link>
          </Button>
        </div>

        <Card className="p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 text-2xl font-bold">
                  <AvatarFallback>{supplier.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold font-headline">{supplier.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  {supplier.verified && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t('verified')}</Badge>}
                  <InteractiveRating initialRating={currentSupplier.rating} onRate={handleRatingChange} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 self-start sm:self-center">
              <Button variant="outline"><FileText className="mr-2" />{t('account_statement')}</Button>
              <Button><Send className="mr-2" />{t('send_order')}</Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('contact_payments')}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSupplierDialogOpen(true)}><Pencil className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3"><Mail className="h-5 w-5 text-primary mt-0.5" /> <a href={`mailto:${supplier.email}`} className="text-primary underline">{supplier.email}</a></div>
              <div className="flex items-start gap-3"><Truck className="h-5 w-5 text-primary mt-0.5" /> <div>{t('delivery_days')}: {supplier.deliveryDays}</div></div>
              <div className="flex items-start gap-3"><CreditCard className="h-5 w-5 text-primary mt-0.5" /> <div>{t('payment_terms')}: {supplier.paymentTerms}</div></div>
              <hr />
              <h4 className="font-bold">{t('contacts_section_title')}</h4>
              {supplier.contacts.map(contact => (
                   <div key={contact.id} className="flex justify-between items-start text-xs border-b pb-2 last:border-0">
                      <div>
                          <div className="font-semibold text-sm">{contact.name}</div>
                          <div className="text-muted-foreground">{contact.department}</div>
                          <div className="flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              <span>{contact.phone}</span>
                              {contact.isWhatsapp && <BotMessageSquare className="h-3 w-3 text-green-500" />}
                          </div>
                      </div>
                   </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">{t('performance_finance')}</CardTitle>
                {supplier.finance.pendingBalance > 0 && <Badge variant="destructive">{t('debt')}: {formatCurrency(supplier.finance.pendingBalance)}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-2 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{supplier.finance.fillRate}%</div>
                  <div className="text-xs text-muted-foreground">{t('fill_rate')}</div>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <div className={`text-xl font-bold ${supplier.finance.onTimeDelivery ? 'text-green-600' : 'text-red-600'}`}>On-Time</div>
                  <div className="text-xs text-muted-foreground">{t('on_time_deliveries')}</div>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{supplierCatalog.length}</div>
                  <div className="text-xs text-muted-foreground">{t('active_skus')}</div>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <div className="text-xl font-bold">{formatCurrency(supplier.finance.ytdSpend / 1000)}k</div>
                  <div className="text-xs text-muted-foreground">{t('ytd_purchases')}</div>
                </div>
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

        <Card className="shadow-sm">
          <CardHeader>
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-base">{t('product_catalog_costs')}</CardTitle>
                  <div className="flex gap-2 w-full sm:w-auto">
                      <div className="relative flex-grow">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder={t('search_product_placeholder')} className="pl-8" />
                      </div>
                      <Button onClick={handleAddProduct}>
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
                      {supplierCatalog.length > 0 ? (
                        supplierCatalog.map(product => {
                          const costChange = product.cost > 0 ? (product.cost - (product.cost * 0.95)) : 0; // Mocking previous cost
                          return (
                          <TableRow key={product.id}>
                              <TableCell className="pl-6 font-medium">
                                  <div className="flex items-center gap-3">
                                      <Image src={product.photoUrl || '/placeholder.svg'} alt={product.name.es} width={40} height={40} className="rounded-md object-cover"/>
                                      <div>
                                          <div className="font-semibold">{product.name.es}</div>
                                          <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                                      </div>
                                  </div>
                              </TableCell>
                              <TableCell>{product.unit}</TableCell>
                              <TableCell className="font-semibold">
                                  <div className="flex items-center gap-1">
                                      {formatCurrency(product.cost)}
                                      {costChange > 0 && <ArrowUp className="h-3 w-3 text-destructive" title={`${t('price_increased')} ${formatCurrency(costChange)}`} />}
                                      {costChange < 0 && <ArrowDown className="h-3 w-3 text-green-600" title={`${t('price_decreased')} ${formatCurrency(Math.abs(costChange))}`} />}
                                  </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                  {costChange !== 0 ? `${t('before')}: ${formatCurrency(product.cost - costChange)}` : t('price_stable')}
                              </TableCell>
                               <TableCell>
                                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">{t('available')}</Badge>
                              </TableCell>
                              <TableCell className="pr-6">
                                  <div className="flex justify-end gap-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditProduct(product)}><Pencil className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteProduct(product)}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                              </TableCell>
                          </TableRow>
                          )
                      })
                      ) : (
                        <TableRow><TableCell colSpan={6} className="text-center h-24">{t('no_products_yet')}</TableCell></TableRow>
                      )}
                  </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
