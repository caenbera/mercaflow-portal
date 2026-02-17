
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Check, Undo2, Pencil, BotMessageSquare, DollarSign, Package } from 'lucide-react';
import type { Supplier } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { addSupplier, updateSupplier, type SupplierInput } from '@/lib/firestore/suppliers';
import { useProducts } from '@/hooks/use-products';
import { useOrganization } from '@/context/organization-context';

const initialCategories = ["Frutas y Verduras", "Empaques y Desechables", "Lácteos y Huevos", "Secos y Abarrotes", "Logística"];

const contactSchema = z.object({
  id: z.string().optional(),
  department: z.string().min(1, 'Required'),
  name: z.string().min(2, 'Required'),
  phone: z.string().min(7, 'Required'),
  isWhatsapp: z.boolean(),
});

const discountSchema = z.object({
  id: z.string(),
  type: z.enum(['amount', 'quantity', 'monthlyVolume']),
  scope: z.enum(['order', 'product']),
  productId: z.string().optional(),
  from: z.coerce.number().min(1, 'Must be > 0'),
  discount: z.coerce.number().min(0.1, 'Must be > 0').max(100, 'Max 100'),
}).refine(data => {
    if (data.type === 'quantity') return data.scope === 'product' && !!data.productId;
    if (data.type === 'amount' || data.type === 'monthlyVolume') return data.scope === 'order';
    return false;
}, { message: "Invalid type/scope combination", path: ['type']});


const supplierSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  category: z.string().min(1, "Category is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address is required"),
  deliveryDays: z.string().min(2, "Delivery days are required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  notes: z.string().optional(),
  contacts: z.array(contactSchema).min(1, "At least one contact is required"),
  volumeDiscounts: z.array(discountSchema).optional(),
});

type FormValues = z.infer<typeof supplierSchema>;

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
}

export function AddSupplierDialog({ open, onOpenChange, supplier }: AddSupplierDialogProps) {
  const t = useTranslations('SuppliersPage');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { products, loading: productsLoading } = useProducts();
  const { activeOrgId } = useOrganization();
  
  const [categories, setCategories] = useState(initialCategories);
  const [isInputMode, setIsInputMode] = useState(false);
  const [editModeTarget, setEditModeTarget] = useState<string | null>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
        name: '', category: '', email: '', address: '', deliveryDays: '',
        paymentTerms: 'Net 15', notes: '',
        contacts: [],
        volumeDiscounts: [],
    },
  });

  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control: form.control,
    name: "contacts",
  });
  
  const { fields: discountFields, append: appendDiscount, remove: removeDiscount } = useFieldArray({
    control: form.control,
    name: "volumeDiscounts",
  });

  useEffect(() => {
    if (open && supplier) {
      form.reset({
        ...supplier,
        notes: supplier.notes || '',
        contacts: supplier.contacts.map(c => ({...c, id: c.id || `contact-${Math.random()}`})),
        volumeDiscounts: supplier.volumeDiscounts?.map(d => ({...d, id: d.id || `discount-${Math.random()}`})) || [],
      });
    } else if (open) {
      form.reset({
        name: '', category: '', email: '', address: '', deliveryDays: '',
        paymentTerms: 'Net 15', notes: '',
        contacts: [{ id: `contact-${Date.now()}`, department: 'Ventas', name: '', phone: '', isWhatsapp: true }],
        volumeDiscounts: [],
      });
    }
  }, [open, supplier, form]);

  const currentCategory = form.watch('category');

  const startCreatingCategory = () => { setEditModeTarget(null); setIsInputMode(true); if (categoryInputRef.current) categoryInputRef.current.value = ""; setTimeout(() => categoryInputRef.current?.focus(), 100); };
  const startEditingCategory = () => { if (!currentCategory) return; setEditModeTarget(currentCategory); setIsInputMode(true); setTimeout(() => { if(categoryInputRef.current) { categoryInputRef.current.value = currentCategory; categoryInputRef.current.focus(); } }, 100); };
  const handleSaveCategory = () => { const inputValue = categoryInputRef.current?.value.trim(); if (!inputValue) { setIsInputMode(false); return; } if (editModeTarget) { setCategories(prev => prev.map(c => c === editModeTarget ? inputValue : c)); if (currentCategory === editModeTarget) form.setValue('category', inputValue); toast({ title: t('toast_category_updated'), description: inputValue }); } else { if (!categories.includes(inputValue)) { setCategories(prev => [...prev, inputValue]); form.setValue('category', inputValue); toast({ title: t('toast_category_added'), description: inputValue }); } } setIsInputMode(false); setEditModeTarget(null); };
  const handleDeleteCategory = () => { if (!currentCategory || !confirm(t('confirm_delete_category', { category: currentCategory }))) return; setCategories(prev => prev.filter(c => c !== currentCategory)); form.setValue('category', ''); toast({ title: t('toast_category_deleted') }); };
  const cancelCategoryInput = () => { setIsInputMode(false); setEditModeTarget(null); };

  const onSubmit = async (values: FormValues) => {
    if (!activeOrgId) {
      toast({ variant: 'destructive', title: "Error", description: "Debes seleccionar un edificio primero." });
      return;
    }

    setIsLoading(true);
    try {
      const finalData: SupplierInput = { 
        ...values, 
        organizationId: activeOrgId,
        volumeDiscounts: values.volumeDiscounts 
      };

      if (supplier) {
        await updateSupplier(supplier.id, finalData);
        toast({ title: t('edit_supplier_success_title'), description: values.name });
      } else {
        await addSupplier(finalData);
        toast({ title: t('add_supplier_success_title'), description: values.name });
      }
      onOpenChange(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Could not save supplier." });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{supplier ? t('edit_supplier_modal_title') : t('add_supplier_modal_title')}</DialogTitle>
          <DialogDescription>{t('add_supplier_modal_desc')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{t('company_name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>{t('email_label')}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                  <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>{t('address_label')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                </div>
                <FormField control={form.control} name="category" render={({ field }) => ( <FormItem><FormLabel>{t('category')}</FormLabel><div className="flex items-center gap-2">{isInputMode ? ( <> <Input ref={categoryInputRef} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleSaveCategory(); }}} /> <Button type="button" size="icon" onClick={handleSaveCategory}><Check className="h-4 w-4" /></Button> <Button type="button" size="icon" variant="ghost" onClick={cancelCategoryInput}><Undo2 className="h-4 w-4" /></Button> </> ) : ( <> <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('category_placeholder')} /></SelectTrigger></FormControl> <SelectContent> {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)} </SelectContent> </Select> <div className="flex gap-1 shrink-0 bg-gray-50 p-1 rounded-md border"> <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!currentCategory} onClick={startEditingCategory}><Pencil className="h-3.5 w-3.5" /></Button> <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!currentCategory} onClick={handleDeleteCategory}><Trash2 className="h-3.5 w-3.5" /></Button> <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={startCreatingCategory}><Plus className="h-4 w-4" /></Button> </div> </> )}</div> <FormMessage /> </FormItem> )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField control={form.control} name="deliveryDays" render={({ field }) => ( <FormItem><FormLabel>{t('delivery_days')}</FormLabel><FormControl><Input placeholder={t('delivery_days_placeholder')} {...field} /></FormControl><FormMessage /></FormItem> )}/>
                   <FormField control={form.control} name="paymentTerms" render={({ field }) => ( <FormItem><FormLabel>{t('payment_terms')}</FormLabel> <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl> <SelectContent><SelectItem value="Net 7">Net 7</SelectItem><SelectItem value="Net 15">Net 15</SelectItem><SelectItem value="Net 30">Net 30</SelectItem><SelectItem value="COD">COD (Cash on Delivery)</SelectItem></SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                </div>
                
                <hr className="my-4"/>
                <FormLabel className="font-bold">{t('contacts_section_title')}</FormLabel>
                <div className="space-y-3">
                  {contactFields.map((field, index) => ( <div key={field.id} className="grid grid-cols-[1fr,1fr,1fr,auto,auto] gap-2 items-end p-2 border rounded-lg bg-muted/30"> <FormField control={form.control} name={`contacts.${index}.department`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">{t('contact_department')}</FormLabel><FormControl><Input {...field} placeholder={t('contact_department_placeholder')} /></FormControl><FormMessage /></FormItem> )}/> <FormField control={form.control} name={`contacts.${index}.name`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">{t('contact_name')}</FormLabel><FormControl><Input {...field} placeholder={t('contact_name_placeholder')} /></FormControl><FormMessage /></FormItem> )}/> <FormField control={form.control} name={`contacts.${index}.phone`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">{t('phone_label')}</FormLabel><FormControl><Input {...field} type="tel" /></FormControl><FormMessage /></FormItem> )}/> <FormField control={form.control} name={`contacts.${index}.isWhatsapp`} render={({ field }) => ( <FormItem className="flex flex-col items-center"><FormLabel className="text-xs flex items-center gap-1"><BotMessageSquare className="h-3 w-3"/> WhatsApp</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )}/> <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeContact(index)}><Trash2 className="h-4 w-4"/></Button> </div> ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendContact({ id: `contact-${Date.now()}`, department: 'Ventas', name: '', phone: '', isWhatsapp: false })}> <Plus className="mr-2 h-4 w-4" /> {t('add_contact_button')} </Button>
                </div>
                
                 <hr className="my-4"/>
                <FormLabel className="font-bold">{t('volume_discounts_title')}</FormLabel>
                <div className="space-y-3">
                  {discountFields.map((field, index) => (
                    <Controller
                        key={field.id}
                        control={form.control}
                        name={`volumeDiscounts.${index}`}
                        render={({ field: controllerField }) => {
                          const discountType = controllerField.value.type;
                          return (
                            <div className="p-2 border rounded-lg bg-muted/30">
                              <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
                                <FormField control={form.control} name={`volumeDiscounts.${index}.type`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">{t('discount_rule_type_label')}</FormLabel><Select onValueChange={(value) => { field.onChange(value); const scope = value === 'quantity' ? 'product' : 'order'; form.setValue(`volumeDiscounts.${index}.scope`, scope); }} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="amount">{t('discount_type_amount')}</SelectItem><SelectItem value="quantity">{t('discount_type_quantity')}</SelectItem><SelectItem value="monthlyVolume">{t('discount_type_monthly_volume')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`volumeDiscounts.${index}.scope`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">{t('discount_rule_scope_label')}</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="order">{t('discount_scope_order')}</SelectItem><SelectItem value="product">{t('discount_scope_product')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                 <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeDiscount(index)}><Trash2 className="h-4 w-4"/></Button>
                              </div>
                              <div className={cn("grid gap-2 mt-2", discountType === 'quantity' ? "grid-cols-3" : "grid-cols-2")}>
                                {discountType === 'quantity' && (
                                    <FormField control={form.control} name={`volumeDiscounts.${index}.productId`} render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">{t('product')}</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={productsLoading}><FormControl><SelectTrigger><SelectValue placeholder={t('product_select_placeholder')}/></SelectTrigger></FormControl><SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name.es}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                    )}/>
                                )}
                                <FormField control={form.control} name={`volumeDiscounts.${index}.from`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">{t('discount_threshold_label', { unit: discountType === 'quantity' ? t('discount_threshold_unit_units') : t('discount_threshold_unit_currency') })}</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`volumeDiscounts.${index}.discount`} render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">{t('discount_percentage_label')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                              </div>
                            </div>
                          )
                        }}
                    />
                  ))}
                   <Button type="button" variant="outline" size="sm" onClick={() => appendDiscount({ id: `discount-${Date.now()}`, type: 'amount', scope: 'order', from: 1000, discount: 5 })}>
                    <Plus className="mr-2 h-4 w-4" /> {t('add_discount_rule_button')}
                  </Button>
                </div>


                 <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>{t('internal_note')}</FormLabel><FormControl><Textarea placeholder={t('internal_note_placeholder')} {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{t('cancel')}</Button>
                  <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : t('save')}</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
