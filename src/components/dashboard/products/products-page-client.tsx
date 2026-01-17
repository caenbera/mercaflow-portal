"use client";

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/hooks/use-products';
import { ProductTable } from './product-table';
import { ProductDialog } from './product-dialog';
import { DeleteProductAlert } from './delete-product-alert';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

export function ProductsPageClient() {
  const { products, loading } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const t = useTranslations('Dashboard');

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
    <div className="flex flex-col gap-4">
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
        <h1 className="text-2xl font-headline font-bold">{t('products_title')}</h1>
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('products_add_button')}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('products_card_title')}</CardTitle>
          <CardDescription>{t('products_card_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
