
"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { usePriceLists } from '@/hooks/use-pricelists';
import { addPriceList, updatePriceList, deletePriceList } from '@/lib/firestore/pricelists';
import { Pencil, Trash2, Check, X, Loader2, Plus, AlertTriangle, ArrowRight } from 'lucide-react';
import type { PriceList } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const tierSchema = z.object({
  from: z.coerce.number().min(0, "From must be positive"),
  to: z.coerce.number().min(0, "To must be positive").nullable(),
  discount: z.coerce.number().min(0, "Discount must be positive.").max(100, "Discount cannot exceed 100."),
});

const priceListSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  tiers: z.array(tierSchema).min(1, "At least one pricing tier is required."),
});

type FormValues = z.infer<typeof priceListSchema>;

interface PriceListManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriceListManagerDialog({ open, onOpenChange }: PriceListManagerDialogProps) {
  const t = useTranslations('ClientsPage');
  const { toast } = useToast();
  const { priceLists, loading } = usePriceLists();
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(priceListSchema),
    defaultValues: { name: '', tiers: [{ from: 0, to: null, discount: 0 }] },
  });
  
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "tiers",
  });

  const { isSubmitting } = form.formState;

  const handleAddNew = async (values: FormValues) => {
    await addPriceList(values);
    toast({ title: "Success", description: "New price list added." });
    form.reset({ name: '', tiers: [{ from: 0, to: null, discount: 0 }] });
  };
  
  const handleStartEdit = (priceList: PriceList) => {
    setEditingId(priceList.id);
    form.reset({ name: priceList.name, tiers: priceList.tiers || [{ from: 0, to: null, discount: 0 }] });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset({ name: '', tiers: [{ from: 0, to: null, discount: 0 }] });
  };
  
  const handleUpdate = async (values: FormValues) => {
    if (!editingId) return;
    await updatePriceList(editingId, values);
    toast({ title: "Success", description: "Price list updated." });
    handleCancelEdit();
  };
  
  const handleDelete = async (id: string) => {
    await deletePriceList(id);
    toast({ title: "Success", description: "Price list deleted." });
  };
  
  const getTierDescription = (list: PriceList) => {
    if (!list.tiers || list.tiers.length === 0) return "No tiers";
    const minDiscount = Math.min(...list.tiers.map(t => t.discount));
    const maxDiscount = Math.max(...list.tiers.map(t => t.discount));
    if (minDiscount === maxDiscount) return `${minDiscount}% discount`;
    return `Discounts from ${minDiscount}% to ${maxDiscount}%`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('manage_pricelists_title')}</DialogTitle>
          <DialogDescription>{t('manage_pricelists_desc')}</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
                 <h3 className="font-semibold text-sm">Existing Lists</h3>
                 <ScrollArea className="h-72 pr-4 border rounded-lg bg-muted/30">
                    <div className="space-y-2 p-2">
                        {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}
                        {priceLists.map((list) => (
                            <div key={list.id} className="flex items-center gap-2 p-2 rounded-md bg-card border shadow-sm">
                                <div className="flex-grow">
                                    <span className="font-semibold">{list.name}</span>
                                    <p className="text-xs text-muted-foreground">{getTierDescription(list)}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEdit(list)}><Pencil className="h-4 w-4" /></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('delete_confirm_title')}</AlertDialogTitle>
                                            <AlertDialogDescription>{t('confirm_delete_pricelist', { priceListName: list.name })}</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t('cancel_button')}</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(list.id)} className="bg-destructive hover:bg-destructive/90">{t('delete_button_confirm')}</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(editingId ? handleUpdate : handleAddNew)} className="space-y-4">
                    <h3 className="text-sm font-semibold">{editingId ? t('edit_pricelist') : t('new_pricelist')}</h3>
                    <FormField control={form.control} name="name" render={({ field }) => (
                         <FormItem>
                             <FormLabel>{t('new_pricelist_name_label')}</FormLabel>
                             <FormControl><Input {...field} placeholder="e.g., VIP Clients" /></FormControl>
                             <FormMessage/>
                         </FormItem>
                     )}/>
                     
                     <div className="space-y-3">
                        <FormLabel>Pricing Tiers</FormLabel>
                        {fields.map((field, index) => (
                           <div key={field.id} className="grid grid-cols-[1fr,auto,1fr,1fr,auto] items-end gap-2 p-2 border rounded-md bg-muted/20">
                               <FormField control={form.control} name={`tiers.${index}.from`} render={({ field }) => (<FormItem><FormLabel className="text-xs">From ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)}/>
                               <ArrowRight className="h-4 w-4 text-muted-foreground self-center mt-6"/>
                               <FormField control={form.control} name={`tiers.${index}.to`} render={({ field }) => (<FormItem><FormLabel className="text-xs">To ($)</FormLabel><FormControl><Input type="number" placeholder="or more" {...field} value={field.value ?? ''} /></FormControl></FormItem>)}/>
                               <FormField control={form.control} name={`tiers.${index}.discount`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Discount (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)}/>
                               <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                           </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => append({from: 0, to: null, discount: 0})}><Plus className="mr-2 h-4 w-4"/>Add Tier</Button>
                     </div>
                     <FormMessage>{form.formState.errors.tiers?.root?.message || form.formState.errors.tiers?.message}</FormMessage>

                     <DialogFooter className="pt-4">
                        {editingId && (
                             <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                        )}
                        <Button type="submit" disabled={isSubmitting}>
                           {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : editingId ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                           {editingId ? "Save Changes" : "Create New List"}
                       </Button>
                    </DialogFooter>
                </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
