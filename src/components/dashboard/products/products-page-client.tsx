"use client";

import { useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/use-products';
import { ProductTable } from './product-table';
import { ProductDialog } from './product-dialog';
import { DeleteProductAlert } from './delete-product-alert';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductsPageClient() {
  const { products, loading } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const t = useTranslations('ProductsPage');

  const handleAdd = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setAlertOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
      />
      <DeleteProductAlert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        product={selectedProduct}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">{t('title')}</h1>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('add_button')}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t('search_placeholder')} className="pl-8" />
                </div>
                 <Select>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder={t('filter_all_categories')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('filter_all_categories')}</SelectItem>
                    </SelectContent>
                </Select>
                 <Select>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder={t('filter_status_all')} />
                    </SelectTrigger>
                </Select>
            </div>
          {loading ? (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
