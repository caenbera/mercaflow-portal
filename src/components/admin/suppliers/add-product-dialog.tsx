"use client";

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductDialog({ open, onOpenChange }: AddProductDialogProps) {
  const t = useTranslations('SuppliersPage');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('add_product_modal_title')}</DialogTitle>
          <DialogDescription>
            Fill in the details for the new product.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('product_name')}</Label>
            <Input id="name" placeholder="e.g., Tomate Chonto Primera"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="sku">{t('sku')}</Label>
                <Input id="sku" placeholder="e.g., AG-001" />
             </div>
             <div className="grid gap-2">
                <Label htmlFor="unit">{t('purchase_unit')}</Label>
                <Input id="unit" placeholder="e.g., Caja 20lb" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="cost">{t('cost')}</Label>
                <Input id="cost" type="number" placeholder="12.50" />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="image">{t('image_url')}</Label>
                <Input id="image" placeholder="https://..." />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={() => onOpenChange(false)}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
