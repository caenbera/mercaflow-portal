"use client";

import { useState, useEffect, useRef } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { UserProfile, ClientTier } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firestore/users';
import { Check, Pencil, Plus, Trash2, Undo2 } from 'lucide-react';


const clientFormSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  phone: z.string().min(10, "A valid phone number is required"),
  address: z.string().min(5, "A valid address is required"),
  tier: z.string().min(1, "Tier is required"),
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
const initialPriceLists: string[] = ['Standard', 'VIP', 'Wholesale'];

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const t = useTranslations('ClientsPage');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [priceLists, setPriceLists] = useState(initialPriceLists);
  const [isInputMode, setIsInputMode] = useState(false);
  const [editModeTarget, setEditModeTarget] = useState<string | null>(null);
  const priceListInputRef = useRef<HTMLInputElement>(null);
  
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
       if (client.priceList && !priceLists.includes(client.priceList)) {
        setPriceLists(prev => [...prev, client.priceList!]);
      }
    } else if (open) {
        form.reset({
          businessName: '', contactPerson: '', phone: '', address: '',
          tier: 'standard', creditLimit: 0, paymentTerms: 'Net 15', priceList: 'Standard'
      });
    }
  }, [open, client, form]);

  const currentPriceList = form.watch('priceList');

  const startCreatingPriceList = () => { setEditModeTarget(null); setIsInputMode(true); if (priceListInputRef.current) priceListInputRef.current.value = ""; setTimeout(() => priceListInputRef.current?.focus(), 100); };
  const startEditingPriceList = () => { if (!currentPriceList) return; setEditModeTarget(currentPriceList); setIsInputMode(true); setTimeout(() => { if(priceListInputRef.current) { priceListInputRef.current.value = currentPriceList; priceListInputRef.current.focus(); }}, 100);};
  const handleSavePriceList = () => { const inputValue = priceListInputRef.current?.value.trim(); if (!inputValue) { setIsInputMode(false); return; } if (editModeTarget) { setPriceLists(prev => prev.map(c => c === editModeTarget ? inputValue : c)); if (currentPriceList === editModeTarget) form.setValue('priceList', inputValue); } else { if (!priceLists.includes(inputValue)) { setPriceLists(prev => [...prev, inputValue]); form.setValue('priceList', inputValue); } } setIsInputMode(false); setEditModeTarget(null); };
  const handleDeletePriceList = () => { if (!currentPriceList || !confirm(t('confirm_delete_pricelist', { priceList: currentPriceList }))) return; setPriceLists(prev => prev.filter(c => c !== currentPriceList)); form.setValue('priceList', ''); };
  const cancelPriceListInput = () => { setIsInputMode(false); setEditModeTarget(null); };
  
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="paymentTerms" render={({ field }) => ( <FormItem><FormLabel>{t('payment_terms_label')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Net 7">Net 7</SelectItem><SelectItem value="Net 15">Net 15</SelectItem><SelectItem value="Net 30">Net 30</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
                     <FormField control={form.control} name="priceList" render={({ field }) => (
                        <FormItem><FormLabel>{t('price_list_label')}</FormLabel>
                        <div className="flex items-center gap-2">
                        {isInputMode ? (
                           <>
                                <Input ref={priceListInputRef} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleSavePriceList(); }}} />
                                <Button type="button" size="icon" onClick={handleSavePriceList}><Check className="h-4 w-4" /></Button>
                                <Button type="button" size="icon" variant="ghost" onClick={cancelPriceListInput}><Undo2 className="h-4 w-4" /></Button>
                            </>
                        ) : (
                             <>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder={t('price_list_label')} /></SelectTrigger></FormControl>
                                <SelectContent>{priceLists.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                                <div className="flex gap-1 shrink-0 bg-gray-50 p-1 rounded-md border">
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!currentPriceList} onClick={startEditingPriceList}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!currentPriceList} onClick={handleDeletePriceList}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={startCreatingPriceList}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </>
                        )}
                        </div>
                        <FormMessage /></FormItem>
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
  );
}
