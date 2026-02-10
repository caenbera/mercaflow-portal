
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { UserProfile, ClientTier } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firestore/users';
import { usePriceLists } from '@/hooks/use-pricelists';
import { PriceListManagerDialog } from './price-list-manager-dialog';
import { Settings } from 'lucide-react';


const clientFormSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  phone: z.string().min(10, "A valid phone number is required"),
  address: z.string().min(5, "A valid address is required"),
  tier: z.enum(['standard', 'bronze', 'silver', 'gold']), // ← CAMBIO AQUÍ
  creditLimit: z.coerce.number().min(0).optional(),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  priceList: z.string().optional(),
});

type FormValues = z.infer<typeof clientFormSchema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: UserProfile | null;
}

const initialTiers: ClientTier[] = ['standard', 'bronze', 'silver', 'gold'];

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const t = useTranslations('ClientsPage');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  
  const { priceLists, loading: priceListsLoading } = usePriceLists();

  const form = useForm<FormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      businessName: '',
      contactPerson: '',
      phone: '',
      address: '',
      tier: 'standard',
      creditLimit: 0,
      paymentTerms: 'Net 15',
      priceList: 'Standard'
    },
  });

  useEffect(() => {
    if (open && client) {
      form.reset({
        businessName: client.businessName || '',
        contactPerson: client.contactPerson || '',
        phone: client.phone || '',
        address: client.address || '',
        tier: client.tier || 'standard',
        creditLimit: client.creditLimit || 0,
        paymentTerms: client.paymentTerms || 'Net 15',
        priceList: client.priceList || 'Standard'
      });
    } else if (open) {
        form.reset({
          businessName: '', contactPerson: '', phone: '', address: '',
          tier: 'standard', creditLimit: 0, paymentTerms: 'Net 15', priceList: 'Standard'
      });
    }
  }, [open, client, form]);
  
  const selectedPriceListName = form.watch('priceList');
  const selectedPriceList = priceLists.find(p => p.name === selectedPriceListName);
  
  const onSubmit = async (values: FormValues) => {
    if (!client) {
        toast({ variant: 'destructive', title: 'Action Not Supported', description: 'Creating new clients from the admin panel is not yet implemented.'});
        return;
    }
    
    setIsLoading(true);
    try {
        await updateUserProfile(client.uid, values);
        toast({ title: t('toast_client_updated_title'), description: t('toast_client_updated_desc', { clientName: values.businessName }) });
        onOpenChange(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Could not save client data." });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
    <PriceListManagerDialog open={isManagerOpen} onOpenChange={setIsManagerOpen} />
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client ? t('edit_client_modal_title') : t('new_client_modal_title')}</DialogTitle>
           <DialogDescription>{client ? t('edit_client_modal_desc') : t('new_client_modal_desc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="businessName" render={({ field }) => ( <FormItem><FormLabel>{t('business_name_label')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormField control={form.control} name="contactPerson" render={({ field }) => ( <FormItem><FormLabel>{t('main_contact_label')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormItem><FormLabel>{t('email_label')}</FormLabel><Input type="email" value={client?.email || ''} readOnly disabled className="bg-muted/50" /></FormItem>
                    <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>{t('phone_label')}</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                </div>
                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>{t('address_label')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>

                <hr className="my-4"/>
                <h3 className="text-base font-semibold text-foreground">Financial & Commercial</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="tier" render={({ field }) => ( <FormItem><FormLabel>{t('tier_label')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>{initialTiers.map(tier => <SelectItem key={tier} value={tier} className="capitalize">{tier}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )}/>
                    <FormField control={form.control} name="creditLimit" render={({ field }) => ( <FormItem><FormLabel>{t('credit_limit_input_label')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <FormField control={form.control} name="paymentTerms" render={({ field }) => ( <FormItem><FormLabel>{t('payment_terms_label')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Net 7">Net 7</SelectItem><SelectItem value="Net 15">Net 15</SelectItem><SelectItem value="Net 30">Net 30</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                     <FormField control={form.control} name="priceList" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('price_list_label')}</FormLabel>
                            <div className="flex gap-2">
                                <Select onValueChange={field.onChange} value={field.value} disabled={priceListsLoading}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder={t('price_list_label')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {priceLists.map(pl => <SelectItem key={pl.id} value={pl.name}>{pl.name}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" size="icon" onClick={() => setIsManagerOpen(true)}>
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </div>
                            {selectedPriceList && (
                                <p className="text-xs text-muted-foreground pt-1">
                                    This list has <strong>{selectedPriceList.tiers?.length || 0} pricing tiers</strong>.
                                </p>
                            )}
                          <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                 <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{t('cancel_button')}</Button>
                    <Button type="submit" disabled={isLoading}>{isLoading ? t('saving_button_text') : t('save_button')}</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
