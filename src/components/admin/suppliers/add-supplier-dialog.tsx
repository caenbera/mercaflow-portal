"use client";

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSupplierDialog({ open, onOpenChange }: AddSupplierDialogProps) {
  const t = useTranslations('SuppliersPage');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('add_supplier_modal_title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('company_name')}</Label>
            <Input id="name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="category">{t('category')}</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="fruits_vegetables">{t('fruits_vegetables')}</SelectItem>
                        <SelectItem value="packaging">{t('packaging')}</SelectItem>
                        <SelectItem value="groceries">{t('groceries')}</SelectItem>
                        <SelectItem value="logistics">{t('logistics')}</SelectItem>
                    </SelectContent>
                </Select>
             </div>
             <div className="grid gap-2">
                <Label htmlFor="days">{t('delivery_days')}</Label>
                <Input id="days" placeholder={t('delivery_days_placeholder')} />
             </div>
          </div>
           <div className="grid gap-2">
            <Label htmlFor="contact">{t('contact_name')}</Label>
            <Input id="contact" />
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
