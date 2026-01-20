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
import type { Product } from '@/types';
import { suppliers } from '@/lib/placeholder-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  sku: z.string().min(2, 'SKU must be at least 2 characters.'),
  category: z.string().min(2, 'Category is required.'),
  unit: z.string().min(2, 'Unit is required.'),
  supplierId: z.string().min(1, 'Supplier is required.'),
  cost: z.coerce.number().min(0, 'Cost cannot be negative.'),
  salePrice: z.coerce.number().min(0.01, 'Price must be positive.'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative.'),
  minStock: z.coerce.number().int().min(0, 'Min. stock cannot be negative.'),
  active: z.boolean(),
  photoUrl: z.string().url('Please enter a valid URL.').or(z.literal('')),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  product: Product | null;
  onSuccess: () => void;
}

const initialCategories = ["Verduras", "Frutas", "Hierbas", "Abarrotes", "Congelados"];

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('ProductsPage');
  
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [imgUrlInputValue, setImgUrlInputValue] = useState('');
  const [categories, setCategories] = useState(initialCategories);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: 'Verduras',
      unit: 'Caja 20lb',
      supplierId: '',
      cost: 0,
      salePrice: 0,
      stock: 0,
      minStock: 10,
      active: true,
      photoUrl: '',
    },
  });

  useEffect(() => {
    if (product) {
      form.reset(product);
      setImgUrlInputValue(product.photoUrl);
    } else {
      form.reset({
         name: '', sku: '', category: 'Verduras', unit: 'Caja 20lb', supplierId: '',
         cost: 0, salePrice: 0, stock: 0, minStock: 10, active: true, photoUrl: '',
      });
      setImgUrlInputValue('');
    }
  }, [product, form]);

  const photoUrl = form.watch('photoUrl');

  const handleOpenUrlModal = () => {
    setImgUrlInputValue(photoUrl || '');
    setIsUrlModalOpen(true);
  };

  const handleApplyImageUrl = () => {
    form.setValue('photoUrl', imgUrlInputValue);
    setIsUrlModalOpen(false);
  };
  
  const toggleNewCategoryMode = () => {
    setIsAddingCategory(!isAddingCategory);
    if (!isAddingCategory) {
      setTimeout(() => newCategoryInputRef.current?.focus(), 100);
    }
  };

  const saveNewCategory = () => {
    const newCategoryName = newCategoryInputRef.current?.value.trim();
    if (newCategoryName && !categories.includes(newCategoryName)) {
      setCategories(prev => [...prev, newCategoryName]);
      form.setValue('category', newCategoryName);
      toast({ title: t('toast_new_category_success_title'), description: t('toast_new_category_success_desc', { categoryName: newCategoryName }) });
    }
    setIsAddingCategory(false);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
             <div 
                className="w-20 h-20 bg-muted border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer overflow-hidden shrink-0"
                onClick={handleOpenUrlModal}
                title={t('form_label_change_image')}
              >
                  {photoUrl ? (
                    <Image src={photoUrl} alt="Preview" width={80} height={80} className="object-cover w-full h-full" />
                  ) : (
                    <Camera className="h-8 w-8" />
                  )}
              </div>
              <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t('form_label_name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form_placeholder_name')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form_label_sku')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('form_placeholder_sku')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form_label_category')}</FormLabel>
                  <div className="flex items-center gap-1">
                    {isAddingCategory ? (
                      <Input ref={newCategoryInputRef} placeholder={t('form_placeholder_new_category')} className="flex-grow" />
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('form_placeholder_select_category')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    <Button type="button" variant="outline" size="icon" className="shrink-0" title={isAddingCategory ? t('form_button_save_category') : t('form_button_new_category')} onClick={isAddingCategory ? saveNewCategory : toggleNewCategoryMode}>
                      {isAddingCategory ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
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
                  <FormLabel>{t('form_label_unit')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                          <SelectTrigger>
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
          </div>

          <hr className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel className="text-primary">{t('form_label_supplier')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                              <SelectTrigger className="border-primary">
                                  <SelectValue placeholder={t('form_placeholder_select_supplier')} />
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
              <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>{t('form_label_cost')}</FormLabel>
                      <FormControl>
                      <Input type="number" placeholder="0.00" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>{t('form_label_price')}</FormLabel>
                      <FormControl>
                      <Input type="number" placeholder="0.00" step="0.01" className="font-bold" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
          </div>

          <hr className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form_label_stock')}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="100" {...field} />
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
                  <FormLabel>{t('form_label_min_stock')}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                  <FormItem className="flex items-center gap-2 pb-2">
                      <FormControl>
                          <Switch
                              id="prodActive"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                          />
                      </FormControl>
                       <FormLabel htmlFor="prodActive" className="!m-0">{t('form_label_active')}</FormLabel>
                  </FormItem>
                  )}
              />
          </div>

          <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onSuccess}>{t('dialog_cancel')}</Button>
              <Button type="submit" disabled={isLoading}>
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
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">{t('form_label_image_url_modal_desc')}</label>
            <Input 
              value={imgUrlInputValue}
              onChange={(e) => setImgUrlInputValue(e.target.value)}
              placeholder="https://..."
            />
            <div className="h-32 bg-muted rounded-md flex items-center justify-center border">
              {imgUrlInputValue ? (
                <Image src={imgUrlInputValue} alt="Preview" width={120} height={120} className="object-contain h-full w-full" />
              ) : (
                <span className="text-sm text-muted-foreground">{t('form_label_image_url_modal_preview')}</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleApplyImageUrl}>{t('form_button_apply_image')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
