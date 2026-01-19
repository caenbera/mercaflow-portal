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

interface NewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewClientDialog({ open, onOpenChange }: NewClientDialogProps) {
  const t = useTranslations('ClientsPage');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('new_client_modal_title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">{t('business_name_label')}</Label>
              <Input id="businessName" placeholder={t('business_name_placeholder')} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="mainContact">{t('main_contact_label')}</Label>
              <Input id="mainContact" placeholder={t('main_contact_placeholder')} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">{t('email_login_label')}</Label>
              <Input id="email" type="email" placeholder={t('email_placeholder')} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="phone">{t('phone_label')}</Label>
              <Input id="phone" type="tel" placeholder={t('phone_placeholder')} />
            </div>
          </div>
          <hr className="my-2" />
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2">
                <Label htmlFor="creditLimit">{t('credit_limit_input_label')}</Label>
                <Input id="creditLimit" type="number" defaultValue="5000" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="paymentTerms">{t('payment_terms_label')}</Label>
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder={t('payment_terms_label')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="net7">Net 7</SelectItem>
                        <SelectItem value="net15">Net 15</SelectItem>
                        <SelectItem value="net30">Net 30</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="priceList">{t('price_list_label')}</Label>
                 <Select>
                    <SelectTrigger>
                        <SelectValue placeholder={t('price_list_label')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="vip">VIP (5% off)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel_button')}</Button>
          <Button onClick={() => onOpenChange(false)}>{t('save_button')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
