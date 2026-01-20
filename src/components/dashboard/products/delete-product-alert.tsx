"use client";

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { deleteProduct } from '@/lib/firestore/products';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { useTranslations } from 'next-intl';

interface DeleteProductAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function DeleteProductAlert({ open, onOpenChange, product }: DeleteProductAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('ProductsPage');

  const handleDelete = async () => {
    if (!product) return;

    setIsLoading(true);
    try {
      await deleteProduct(product.id);
      toast({ title: t('toast_delete_success_title'), description: t('toast_delete_success_desc') });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('toast_delete_error_title'),
        description: error.message || t('toast_delete_error_desc'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete_alert_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_alert_description', { productName: product?.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{t('delete_alert_cancel')}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={handleDelete}
            className={cn(buttonVariants({ variant: 'destructive' }))}
          >
            {isLoading ? 'Deleting...' : t('delete_alert_confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
