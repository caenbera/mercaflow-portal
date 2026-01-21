"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { addProduct, updateProduct } from '@/lib/firestore/products';
import type { Product, ProductCategory } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Plus, Check, Undo2, Pencil, Trash2, Percent } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/use-suppliers';

const formSchema = z.object({
  name: z.object({
    es: z.string().min(2, 'El nombre en español es requerido.'),
    en: z.string().min(2, 'The name in English is required.'),
  }),
  sku: z.string().min(2, 'SKU must be at least 2 characters.'),
  category: z.object({
    es: z.string().min(1, 'La categoría en español es requerida.'),
    en: z.string().min(1, 'The category in English is required.'),
  }),
  unit: z.string().min(1, 'Unit is required.'),
  supplierId: z.string().min(1, 'Supplier is required.'),
  cost: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0.01),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  active: z.boolean(),
  photoUrl: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  product: Product | null;
  onSuccess: () => void;
  defaultSupplierId?: string;
}

const initialCategories: ProductCategory[] = [
  { es: "Verduras", en: "Vegetables" },
  { es: "Frutas", en: "Fruits" },
  { es: "Hierbas", en: "Herbs" },
  { es: "Abarrotes", en: "Groceries" },
  { es: "Congelados", en: "Frozen" },
];

export function ProductForm({ product, onSuccess, defaultSupplierId }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('ProductsPage');
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [imgUrlInputValue, setImgUrlInputValue] = useState('');
  
  const [categories, setCategories] = useState(initialCategories);
  const [isInputMode, setIsInputMode] = useState(false);
  const [editModeTarget, setEditModeTarget] = useState<ProductCategory | null>(null);
  const esCategoryInputRef = useRef<HTMLInputElement>(null);
  const enCategoryInputRef = useRef<HTMLInputElement>(null);

  const [margin, setMargin] = useState<string>('');
  const [isMarginInputFocused, setIsMarginInputFocused] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: { es: '', en: '' }, sku: '', category: initialCategories[0], unit: 'Caja 20lb', supplierId: '',
      cost: 0, salePrice: 0, stock: 0, minStock: 10, active: true, photoUrl: '',
    },
  });

  const costValue = form.watch('cost');
  const salePriceValue = form.watch('salePrice');

  useEffect(() => {
    if (suppliersLoading) return;

    const defaultValues: ProductFormValues = {
      name: { es: '', en: '' }, sku: '', category: initialCategories[0], unit: 'Caja 20lb',
      supplierId: defaultSupplierId || '',
      cost: 0, salePrice: 0, stock: 0, minStock: 10, active: true, photoUrl: '',
    };
  
    if (product) {
      form.reset({ ...product, supplierId: product.supplierId || defaultSupplierId || '' });
      setImgUrlInputValue(product.photoUrl || '');
    } else {
      form.reset(defaultValues);
      setImgUrlInputValue('');
    }
  }, [product, defaultSupplierId, form, suppliersLoading]);
  
  useEffect(() => {
    if (isMarginInputFocused) return;
    if (costValue > 0 && salePriceValue > costValue) {
        const calculatedMargin = ((salePriceValue - costValue) / salePriceValue) * 100;
        setMargin(calculatedMargin.toFixed(2).replace('.00', ''));
    } else {
        setMargin('');
    }
  }, [costValue, salePriceValue, isMarginInputFocused]);

  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const marginValue = e.target.value;
    setMargin(marginValue);
    const marginNum = parseFloat(marginValue);
    const currentCost = form.getValues('cost');
    if (!isNaN(marginNum) && marginNum < 100 && currentCost > 0) {
        const newSalePrice = currentCost / (1 - marginNum / 100);
        form.setValue('salePrice', parseFloat(newSalePrice.toFixed(2)), { shouldValidate: true });
    }
  };

  const photoUrl = form.watch('photoUrl');
  const currentCategory = form.watch('category');

  const handleOpenUrlModal = () => {
    setImgUrlInputValue(photoUrl || '');
    setIsUrlModalOpen(true);
  };

  const handleApplyImageUrl = () => {
    form.setValue('photoUrl', imgUrlInputValue);
    setIsUrlModalOpen(false);
  };
  
  const startCreatingCategory = () => {
    setEditModeTarget(null);
    setIsInputMode(true);
    setTimeout(() => esCategoryInputRef.current?.focus(), 100);
  };

  const startEditingCategory = () => {
    if (!currentCategory) return;
    setEditModeTarget(currentCategory);
    setIsInputMode(true);
    setTimeout(() => {
      if (esCategoryInputRef.current) esCategoryInputRef.current.value = currentCategory.es;
      if (enCategoryInputRef.current) enCategoryInputRef.current.value = currentCategory.en;
      esCategoryInputRef.current?.focus();
    }, 100);
  };

  const handleSaveCategory = () => {
    const esValue = esCategoryInputRef.current?.value.trim();
    const enValue = enCategoryInputRef.current?.value.trim();

    if (!esValue || !enValue) {
      toast({ variant: 'destructive', title: 'Both category names are required.' });
      return;
    }

    const newCategory: ProductCategory = { es: esValue, en: enValue };

    if (editModeTarget) {
      setCategories(prev => prev.map(c => c.es === editModeTarget.es ? newCategory : c));
      if (currentCategory.es === editModeTarget.es) {
        form.setValue('category', newCategory);
      }
      toast({ title: t('toast_category_updated'), description: newCategory.es });
    } else {
      if (!categories.some(c => c.es.toLowerCase() === newCategory.es.toLowerCase())) {
        setCategories(prev => [...prev, newCategory]);
        form.setValue('category', newCategory);
        toast({ title: t('toast_category_added'), description: newCategory.es });
      }
    }
    setIsInputMode(false);
    setEditModeTarget(null);
  };

  const handleDeleteCategory = () => {
    if (!currentCategory || !confirm(t('confirm_delete_category', { category: currentCategory.es }))) return;
    setCategories(prev => prev.filter(c => c.es !== currentCategory.es));
    form.setValue('category', initialCategories[0]);
    toast({ title: t('toast_category_deleted') });
  };

  const cancelCategoryInput = () => {
    setIsInputMode(false);
    setEditModeTarget(null);
  };

  async function onSubmit(values: ProductFormValues) {
    setIsLoading(true);
    try {
      if (product) {
        await updateProduct(product.id, values);
        toast({ title: t('toast_save_success_title'), description: t('toast_save_success_edit_desc') });
      } else {
        await addProduct(values);
        toast({ title: t('toast_save_success_title'), description: t('toast_save_success_add_desc') });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('toast_save_error_title'),
        description: error.message || t('toast_save_error_desc'),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          
          <div className="flex flex-col md:flex-row gap-5 items-start">
             <div 
                className={cn(
                  "w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden shrink-0 transition-all",
                  photoUrl ? "border-transparent bg-muted" : "border-gray-300 bg-gray-50 hover:border-primary hover:text-primary hover:bg-green-50"
                )}
                onClick={handleOpenUrlModal}
                title={t('form_label_change_image')}
              >
                  {photoUrl ? (
                    <Image src={photoUrl} alt="Preview" width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground/50" />
                  )}
              </div>

              <div className="flex-grow w-full space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name.es"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_name_es')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('form_placeholder_name_es')} className="h-11 font-medium text-base bg-gray-50/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name.en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_name_en')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('form_placeholder_name_en')} className="h-11 font-medium text-base bg-gray-50/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_sku')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('form_placeholder_sku')} className="h-11 font-mono text-sm bg-gray-50/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
          </div>
          
          <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_category')}</FormLabel>
                  <div className="flex items-center gap-2">
                    {isInputMode ? (
                      <div className="flex-grow grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200">
                        <Input ref={esCategoryInputRef} placeholder="Nombre en Español" className="border-primary/50 ring-2 ring-primary/10" />
                        <Input ref={enCategoryInputRef} placeholder="Name in English" className="border-primary/50 ring-2 ring-primary/10" />
                        <Button type="button" size="icon" className="bg-green-600 hover:bg-green-700 h-10 w-10" onClick={handleSaveCategory} title={t('save')}><Check className="h-4 w-4" /></Button>
                        <Button type="button" size="icon" variant="ghost" className="text-muted-foreground h-10 w-10" onClick={cancelCategoryInput} title={t('cancel')}><Undo2 className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <>
                        <Select
                          onValueChange={(value) => {
                              try {
                                  const parsedValue = JSON.parse(value);
                                  field.onChange(parsedValue);
                              } catch (e) {
                                  console.error("Failed to parse category value", e);
                              }
                          }}
                          value={field.value ? JSON.stringify(field.value) : ""}
                        >
                            <FormControl>
                                <SelectTrigger className="h-10 bg-white flex-grow">
                                    <SelectValue placeholder={t('form_placeholder_select_category')}>
                                        {field.value?.es || t('form_placeholder_select_category')}
                                    </SelectValue>
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c.es} value={JSON.stringify(c)}>{c.es}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        
                        <div className="flex gap-1 shrink-0 bg-gray-50 p-1 rounded-md border border-gray-200">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!currentCategory} onClick={startEditingCategory}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={!currentCategory} onClick={handleDeleteCategory}><Trash2 className="h-3.5 w-3.5" /></Button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={startCreatingCategory}><Plus className="h-4 w-4" /></Button>
                        </div>
                      </>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_unit')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                          <SelectTrigger className="h-10 bg-white">
                              <SelectValue />
                          </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="Caja 20lb">Caja 20lb</SelectItem>
                          <SelectItem value="Caja 40lb">Caja 40lb</SelectItem>
                          <SelectItem value="Bulto">Bulto</SelectItem>
                          <SelectItem value="Kg">Kilogramo</SelectItem>
                          <SelectItem value="Bidón">Bidón</SelectItem>
                          <SelectItem value="Manojo">Manojo</SelectItem>
                          <SelectItem value="Paq 2kg">Paq 2kg</SelectItem>
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
            />

          <hr className="my-2 border-dashed border-gray-200" />
          
          <div className="grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-5 items-end">
              <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel className="text-primary text-xs font-bold uppercase tracking-wider">{t('form_label_supplier')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!!defaultSupplierId || suppliersLoading}>
                          <FormControl>
                              <SelectTrigger className="h-10 border-primary/30 focus:ring-primary/20 bg-primary/5">
                                  {suppliersLoading ? <SelectValue placeholder="Loading suppliers..." /> : <SelectValue placeholder={t('form_placeholder_select_supplier')} />}
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_cost')}</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <Input type="number" className="pl-6 h-10 text-right" placeholder="0.00" step="0.01" {...field} />
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormItem>
                    <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_margin')}</FormLabel>
                    <FormControl>
                        <div className="relative">
                           <Input 
                            type="number" 
                            value={margin} 
                            onChange={handleMarginChange} 
                            className="pl-3 pr-8 h-10 text-right font-bold" 
                            placeholder={t('form_placeholder_margin')}
                            onFocus={() => setIsMarginInputFocused(true)}
                            onBlur={() => setIsMarginInputFocused(false)}
                           />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                    </FormControl>
                </FormItem>
                <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_price')}</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800 font-bold text-sm">$</span>
                            <Input type="number" className="pl-6 h-10 font-bold text-lg text-right bg-green-50" placeholder="0.00" step="0.01" {...field} />
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
          </div>

          <hr className="my-2 border-dashed border-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_stock')}</FormLabel>
                  <FormControl>
                    <Input type="number" className="h-10" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_min_stock')}</FormLabel>
                  <FormControl>
                    <Input type="number" className="h-10 border-orange-200 focus:border-orange-400" placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                  <FormItem className="flex items-center gap-3 p-2.5 border rounded-lg bg-gray-50 h-10 mt-6 md:mt-0">
                      <FormControl>
                          <Switch
                              id="prodActive"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                          />
                      </FormControl>
                       <FormLabel htmlFor="prodActive" className="!m-0 text-sm font-medium cursor-pointer">
                           {field.value ? t('form_label_active_true') : t('form_label_active_false')}
                        </FormLabel>
                  </FormItem>
                  )}
              />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-4">
              <Button type="button" variant="outline" size="lg" onClick={onSuccess}>{t('dialog_cancel')}</Button>
              <Button type="submit" size="lg" disabled={isLoading} className="font-bold px-8">
                  {isLoading ? t('dialog_saving') : t('dialog_save')}
              </Button>
          </div>
        </form>
      </Form>

      <Dialog open={isUrlModalOpen} onOpenChange={setIsUrlModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('form_label_image_url_modal_title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input 
              value={imgUrlInputValue}
              onChange={(e) => setImgUrlInputValue(e.target.value)}
              placeholder="https://..."
              className="h-11"
            />
            <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
              {imgUrlInputValue ? (
                <Image src={imgUrlInputValue} alt="Preview" width={150} height={150} className="object-contain h-full w-full rounded-lg" />
              ) : (
                <span className="text-sm text-muted-foreground">{t('form_label_image_url_modal_preview')}</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleApplyImageUrl} className="w-full">{t('form_button_apply_image')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
