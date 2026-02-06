'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Prospect, ProspectStatus } from '@/types';
import { addProspect, updateProspect } from '@/lib/firestore/prospects';

const prospectSchema = z.object({
  name: z.string().min(2, "Name is required."),
  address: z.string().min(5, "Address is required."),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required, e.g., IL.").default("Illinois"),
  phone: z.string().optional(),
  web: z.string().optional(),
  category: z.enum(['Restaurante', 'Supermercado', 'Carnicería', 'Otro']),
  ethnic: z.enum(['mexicano', 'peruano', 'colombiano', 'ecuatoriano', 'venezolano', 'salvadoreno', 'guatemalteco', 'otro']),
  zone: z.string().optional(),
  status: z.enum(['pending', 'contacted', 'visited', 'client', 'not_interested']),
  priority: z.boolean().default(false),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof prospectSchema>;

interface ProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
}

export function ProspectDialog({ open, onOpenChange, prospect }: ProspectDialogProps) {
  const t = useTranslations('AdminSalesPage');
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(prospectSchema),
    defaultValues: {
      name: '',
      address: '',
      city: 'Chicago',
      state: 'Illinois',
      phone: '',
      web: '',
      category: 'Restaurante',
      ethnic: 'mexicano',
      zone: '',
      status: 'pending',
      priority: false,
      notes: ''
    }
  });

  useEffect(() => {
    if (open && prospect) {
      form.reset(prospect);
    } else if (open) {
      form.reset({
        name: '',
        address: '',
        city: 'Chicago',
        state: 'Illinois',
        phone: '',
        web: '',
        category: 'Restaurante',
        ethnic: 'mexicano',
        zone: '',
        status: 'pending',
        priority: false,
        notes: ''
      });
    }
  }, [open, prospect, form]);

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    const dataToSave = {
      ...values,
      salespersonId: user.uid,
    };

    try {
      if (prospect) {
        await updateProspect(prospect.id, dataToSave);
        toast({ title: t('toast_update_success_title'), description: values.name });
      } else {
        await addProspect(dataToSave);
        toast({ title: t('toast_create_success_title'), description: values.name });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('toast_error_title'), description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{prospect ? t('edit_prospect_title') : t('new_prospect_title')}</DialogTitle>
          <DialogDescription>{prospect ? t('edit_prospect_desc') : t('new_prospect_desc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto pr-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('label_name')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('label_category')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Restaurante">{t('filter_restaurants')}</SelectItem>
                      <SelectItem value="Supermercado">{t('filter_supermarkets')}</SelectItem>
                      <SelectItem value="Carnicería">{t('filter_butchers')}</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
               <FormField control={form.control} name="ethnic" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('label_ethnic')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="mexicano">Mexicano</SelectItem>
                      <SelectItem value="peruano">Peruano</SelectItem>
                      <SelectItem value="colombiano">Colombiano</SelectItem>
                      <SelectItem value="ecuatoriano">Ecuatoriano</SelectItem>
                      <SelectItem value="venezolano">Venezolano</SelectItem>
                      <SelectItem value="salvadoreno">Salvadoreño</SelectItem>
                      <SelectItem value="guatemalteco">Guatemalteco</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem><FormLabel>{t('label_address')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>{t('label_city')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>{t('label_state')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>{t('label_phone')}</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="web" render={({ field }) => (<FormItem><FormLabel>{t('label_web')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
             </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>{t('label_notes')}</FormLabel><FormControl><Textarea placeholder={t('notes_placeholder')} {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('label_status')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="pending">{t('status_pending')}</SelectItem>
                                <SelectItem value="contacted">{t('status_contacted')}</SelectItem>
                                <SelectItem value="visited">{t('status_visited')}</SelectItem>
                                <SelectItem value="client">{t('status_client')}</SelectItem>
                                <SelectItem value="not_interested">{t('status_not_interested')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-2">
                    <div className="space-y-0.5"><FormLabel>{t('label_priority')}</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{t('cancel')}</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? t('saving') : t('save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
