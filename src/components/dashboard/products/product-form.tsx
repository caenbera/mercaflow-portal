"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addProduct, updateProduct } from '@/lib/firestore/products';
import type { Product } from '@/types';
import { suppliers } from '@/lib/placeholder-data';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  sku: z.string().min(2, 'SKU must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  category: z.string().min(2, 'Category is required.'),
  unit: z.string().min(2, 'Unit is required.'),
  supplierId: z.string().min(1, 'Supplier is required.'),
  cost: z.coerce.number().min(0, 'Cost cannot be negative.'),
  salePrice: z.coerce.number().min(0.01, 'Price must be positive.'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative.'),
  minStock: z.coerce.number().int().min(0, 'Min. stock cannot be negative.'),
  active: z.boolean(),
  photoUrl: z.string().url('Please enter a valid URL.'),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  product: Product | null;
  onSuccess: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('ProductsPage');
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      description: product?.description || '',
      category: product?.category || 'Verduras',
      unit: product?.unit || 'Caja 20lb',
      supplierId: product?.supplierId || '',
      cost: product?.cost || 0,
      salePrice: product?.salePrice || 0,
      stock: product?.stock || 0,
      minStock: product?.minStock || 10,
      active: product?.active ?? true,
      photoUrl: product?.photoUrl || '',
    },
  });

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
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
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the product..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('form_label_category')}</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Frutas" {...field} />
                </FormControl>
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
                <FormControl>
                    <Input placeholder="e.g., Caja 20lb" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('form_label_supplier')}</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a supplier" />
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
                    <Input type="number" placeholder="0.00" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <FormItem className="flex flex-col pt-2">
                    <FormLabel className="mb-2">{t('form_label_active')}</FormLabel>
                    <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    </FormControl>
                </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="photoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form_label_image_url')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form_placeholder_image_url')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onSuccess}>{t('dialog_cancel')}</Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : t('dialog_save')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
