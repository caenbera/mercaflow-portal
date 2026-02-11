"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addOffer } from '@/lib/firestore/offers';
import { useOfferCategories } from '@/hooks/use-offer-categories';
import { useProducts } from '@/hooks/use-products';
import { OfferCategoryManagerDialog } from './offer-category-manager-dialog';
import type { Product, Offer, OfferType, OfferCategory } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { Settings, Plus, Trash2 } from 'lucide-react';

const offerSchema = z.object({
  type: z.enum(['percentage', 'fixedPrice', 'liquidation', 'combo']),
  value: z.coerce.number().optional(),
  category: z.string().min(1, "Category is required."),
  duration: z.enum(['24h', '3d', '7d']),
  comboProductIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof offerSchema>;

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function OfferDialog({ open, onOpenChange, product }: OfferDialogProps) {
  const t = useTranslations('ProductsPage');
  const locale = useLocale();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  
  const { categories, loading: categoriesLoading } = useOfferCategories();
  const { products: allProducts, loading: productsLoading } = useProducts();

  const form = useForm<FormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: { 
      type: 'percentage', 
      duration: '24h', 
      comboProductIds: []
    },
  });

  // No usar useFieldArray - manejar manualmente el array
  const comboProductIds = form.watch('comboProductIds');
  const offerType = form.watch('type');
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const calculateFinalPrice = () => {
    if (!product) return 0;
    const formValues = form.getValues();
    switch(formValues.type) {
        case 'percentage':
            const discount = (product.salePrice * (formValues.value || 0)) / 100;
            return product.salePrice - discount;
        case 'fixedPrice':
            return formValues.value || 0;
        default:
            return product.salePrice;
    }
  };

  // Funciones para manejar el array manualmente
  const handleAddComboProduct = () => {
    form.setValue('comboProductIds', [...comboProductIds, '']);
  };

  const handleRemoveComboProduct = (index: number) => {
    const newComboProductIds = comboProductIds.filter((_, i) => i !== index);
    form.setValue('comboProductIds', newComboProductIds);
  };

  const handleComboProductChange = (index: number, value: string) => {
    const newComboProductIds = [...comboProductIds];
    newComboProductIds[index] = value;
    form.setValue('comboProductIds', newComboProductIds);
  };

  const onSubmit = async (values: FormValues) => {
    if (!product) return;
    setIsLoading(true);

    const expiresAt = new Date();
    if (values.duration === '24h') expiresAt.setDate(expiresAt.getDate() + 1);
    if (values.duration === '3d') expiresAt.setDate(expiresAt.getDate() + 3);
    if (values.duration === '7d') expiresAt.setDate(expiresAt.getDate() + 7);
    
    const selectedCategory = categories.find(c => c.id === values.category);
    if (!selectedCategory) {
        toast({ variant: 'destructive', title: 'Error', description: 'Invalid category selected.' });
        setIsLoading(false);
        return;
    }

    const offerData: Omit<Offer, 'id'|'createdAt'> = {
      productId: product.id,
      productName: product.name,
      productPhotoUrl: product.photoUrl,
      productUnit: product.unit,
      originalPrice: product.salePrice,
      type: values.type as OfferType,
      value: values.value || 0,
      comboProductIds: values.comboProductIds,
      category: selectedCategory.name,
      expiresAt: Timestamp.fromDate(expiresAt),
    };

    try {
      await addOffer(offerData);
      toast({ title: t('toast_offer_success') });
      onOpenChange(false);
      form.reset({ type: 'percentage', duration: '24h', comboProductIds: [] });
    } catch (error) {
      toast({ variant: 'destructive', title: t('toast_offer_error') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <OfferCategoryManagerDialog open={isCategoryManagerOpen} onOpenChange={setIsCategoryManagerOpen} />
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('offer_dialog_title')}</DialogTitle>
          <DialogDescription>{t('offer_dialog_desc')}</DialogDescription>
        </DialogHeader>
        {product && (
            <div className="bg-muted p-3 rounded-md flex justify-between items-center text-sm">
                <span className="font-semibold">{product.name[locale as 'es'|'en']}</span>
                <span className="font-bold">{formatCurrency(calculateFinalPrice())} <span className="line-through text-muted-foreground font-normal">{formatCurrency(product.salePrice)}</span></span>
            </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('offer_type_label')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">{t('offer_type_percentage')}</SelectItem>
                    <SelectItem value="fixedPrice">{t('offer_type_fixed')}</SelectItem>
                    <SelectItem value="liquidation">{t('offer_type_clearance')}</SelectItem>
                    <SelectItem value="combo">{t('offer_type_combo')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>

            { (offerType === 'percentage' || offerType === 'fixedPrice') &&
              <FormField control={form.control} name="value" render={({ field }) => (
                <FormItem>
                  <FormLabel>{offerType === 'percentage' ? t('percentage_discount_label') : t('fixed_price_label')}</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                  <FormMessage/>
                </FormItem>
              )}/>
            }

            { offerType === 'combo' && (
              <div className="space-y-2">
                <FormLabel>{t('combo_products_label')}</FormLabel>
                {comboProductIds.map((_, index) => (
                    <div key={index} className="flex gap-2">
                        <Select 
                            onValueChange={(value) => handleComboProductChange(index, value)} 
                            value={comboProductIds[index]} 
                            disabled={productsLoading}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('select_product_placeholder')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {allProducts.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name.es}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => handleRemoveComboProduct(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                 <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddComboProduct}
                >
                    <Plus className="mr-2 h-4 w-4"/>
                    {t('add_product_to_combo')}
                 </Button>
              </div>
            )}

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('offer_category_label')}</FormLabel>
                <div className="flex gap-2">
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={categoriesLoading}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t('select_category_placeholder')}/></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name.es}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setIsCategoryManagerOpen(true)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage/>
              </FormItem>
            )}/>

            <FormField control={form.control} name="duration" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('duration_label')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="24h">{t('duration_24h')}</SelectItem>
                    <SelectItem value="3d">{t('duration_3d')}</SelectItem>
                    <SelectItem value="7d">{t('duration_7d')}</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}/>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{t('dialog_cancel')}</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('saving_offer') : t('publish_offer_button')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}