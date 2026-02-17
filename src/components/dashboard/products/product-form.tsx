
"use client";

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { addProduct, updateProduct, getProductBySku } from '@/lib/firestore/products';
import type { Product, ProductCategory, ProductSupplier } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Plus, Check, Undo2, Pencil, Trash2, Loader2, Box } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useOrganization } from '@/context/organization-context';

import { useProductCategories, type ProductCategoryWithId } from '@/hooks/useProductCategories';
import { useProductUnits, type ProductUnit } from '@/hooks/useProductUnits';
import { addProductCategory, updateProductCategory, deleteProductCategory } from '@/lib/firestore/productCategories';
import { addProductUnit, updateProductUnit, deleteProductUnit } from '@/lib/firestore/productUnits';

const supplierSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required."),
  cost: z.coerce.number().min(0, "Cost cannot be negative."),
  isPrimary: z.boolean(),
  supplierProductName: z.string().optional(),
});

const formSchema = z.object({
  sku: z.string().min(1, 'SKU is required.'),
  name: z.object({
    es: z.string().min(2, 'El nombre en español es requerido.'),
    en: z.string().min(2, 'The name in English is required.'),
  }),
  category: z.object({
    es: z.string().min(1, 'La categoría en español es requerida.'),
    en: z.string().min(1, 'The category in English is required.'),
  }),
  subcategory: z.object({
    es: z.string().optional(),
    en: z.string().optional(),
  }).partial().optional(),
  unit: z.object({
    es: z.string().min(1, 'La unidad en español es requerida.'),
    en: z.string().min(1, 'The unit in English is required.'),
  }),
  suppliers: z.array(supplierSchema).min(1, "At least one supplier is required."),
  salePrice: z.coerce.number().min(0.01),
  pricingMethod: z.enum(['margin', 'markup']).optional(),
  calculationDirection: z.enum(['costToPrice', 'priceToCost']).optional(),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  active: z.boolean(),
  isBox: z.boolean().optional(),
  photoUrl: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  product: Product | null;
  onSuccess: () => void;
  defaultSupplierId?: string;
}

export function ProductForm({ product, onSuccess, defaultSupplierId }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSkuLoading, setIsLoadingSku] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('ProductsPage');
  const { suppliers: allSuppliers, loading: suppliersLoading } = useSuppliers();
  const { activeOrgId } = useOrganization();
  const pathname = usePathname();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [imgUrlInputValue, setImgUrlInputValue] = useState('');
  
  const { categories, loading: categoriesLoading } = useProductCategories();
  const [isCategoryInputMode, setIsCategoryInputMode] = useState(false);
  const [editCategoryTarget, setEditCategoryTarget] = useState<ProductCategoryWithId | null>(null);
  const esCategoryInputRef = useRef<HTMLInputElement>(null);
  const enCategoryInputRef = useRef<HTMLInputElement>(null);

  const { units, loading: unitsLoading } = useProductUnits();
  const [isUnitInputMode, setIsUnitInputMode] = useState(false);
  const [editUnitTarget, setEditUnitTarget] = useState<ProductUnit | null>(null);
  const esUnitInputRef = useRef<HTMLInputElement>(null);
  const enUnitInputRef = useRef<HTMLInputElement>(null);
  
  const [marginInput, setMarginInput] = useState('');
  const [markupInput, setMarkupInput] = useState('');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: '', name: { es: '', en: '' }, category: { es: '', en: '' }, subcategory: { es: '', en: '' }, unit: { es: '', en: '' },
      suppliers: [], salePrice: 0, stock: 0, minStock: 10, active: true, isBox: false, photoUrl: '', pricingMethod: 'margin', calculationDirection: 'costToPrice',
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "suppliers",
  });
  
  const watchedSuppliers = form.watch('suppliers');
  const watchedSalePrice = form.watch('salePrice');
  const watchedPricingMethod = form.watch('pricingMethod');
  const watchedCalculationDirection = form.watch('calculationDirection');

  const updatePercentageInputs = useCallback(() => {
    const primarySupplier = form.getValues('suppliers').find(s => s.isPrimary);
    const cost = primarySupplier?.cost || 0;
    const price = form.getValues('salePrice') || 0;

    if (!price || !cost || price <= 0 || cost <= 0) {
        setMarginInput('');
        setMarkupInput('');
        return;
    }

    const margin = ((price - cost) / price) * 100;
    const markup = ((price - cost) / cost) * 100;
    
    const formatValue = (val: number) => isNaN(val) || !isFinite(val) ? '' : val.toFixed(1);

    setMarginInput(formatValue(margin));
    setMarkupInput(formatValue(markup));
  }, [form]);
  
  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMarginStr = e.target.value;
    setMarginInput(newMarginStr);
    const newMargin = parseFloat(newMarginStr);
    if(isNaN(newMargin)) return;

    const direction = form.getValues('calculationDirection');

    if(direction === 'costToPrice') {
        const cost = form.getValues('suppliers').find(s => s.isPrimary)?.cost || 0;
        if(cost > 0 && newMargin < 100) {
            const newSalePrice = cost / (1 - (newMargin / 100));
            form.setValue('salePrice', parseFloat(newSalePrice.toFixed(2)));
        }
    } else { // priceToCost
        const salePrice = form.getValues('salePrice');
        const primarySupplierIndex = form.getValues('suppliers').findIndex(s => s.isPrimary);
        if(salePrice > 0 && newMargin < 100 && primarySupplierIndex !== -1) {
            const newCost = salePrice * (1 - (newMargin / 100));
            form.setValue(`suppliers.${primarySupplierIndex}.cost`, parseFloat(newCost.toFixed(2)));
        }
    }
    updatePercentageInputs();
  }

  const handleMarkupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMarkupStr = e.target.value;
      setMarkupInput(newMarkupStr);
      const newMarkup = parseFloat(newMarkupStr);
      if(isNaN(newMarkup)) return;

      const direction = form.getValues('calculationDirection');

      if(direction === 'costToPrice') {
          const cost = form.getValues('suppliers').find(s => s.isPrimary)?.cost || 0;
          if(cost > 0) {
              const newSalePrice = cost * (1 + (newMarkup / 100));
              form.setValue('salePrice', parseFloat(newSalePrice.toFixed(2)));
          }
      } else { // priceToCost
          const salePrice = form.getValues('salePrice');
          const primarySupplierIndex = form.getValues('suppliers').findIndex(s => s.isPrimary);
          if(salePrice > 0 && primarySupplierIndex !== -1) {
              const newCost = salePrice / (1 + (newMarkup / 100));
              form.setValue(`suppliers.${primarySupplierIndex}.cost`, parseFloat(newCost.toFixed(2)));
          }
      }
      updatePercentageInputs();
  }

  const getInitialFormData = (): ProductFormValues => {
    if (product) {
      const suppliersArray = product.suppliers && product.suppliers.length > 0
        ? product.suppliers
        : ('supplierId' in product && product.supplierId)
          ? [{ supplierId: (product as any).supplierId, cost: (product as any).cost || 0, isPrimary: true }]
          : [];
      return {
        ...product,
        photoUrl: product.photoUrl || '',
        subcategory: product.subcategory || { es: '', en: '' },
        suppliers: suppliersArray,
        pricingMethod: product.pricingMethod || 'margin',
        calculationDirection: product.calculationDirection || 'costToPrice',
        isBox: product.isBox || false,
      };
    }
    const supplierContextId = pathname.includes('/suppliers/') ? pathname.split('/suppliers/')[1].split('/')[0] : defaultSupplierId;
    return {
      sku: '', name: { es: '', en: '' }, category: { es: '', en: '' }, subcategory: { es: '', en: '' }, unit: { es: '', en: '' },
      suppliers: supplierContextId ? [{ supplierId: supplierContextId, cost: 0, isPrimary: true, supplierProductName: '' }] : [],
      salePrice: 0, stock: 0, minStock: 10, active: true, isBox: false, photoUrl: '', pricingMethod: 'margin', calculationDirection: 'costToPrice'
    };
  };
  
  useEffect(() => {
    if (suppliersLoading || categoriesLoading || unitsLoading) return;
    const initialData = getInitialFormData();
    form.reset(initialData);
    setEditingProduct(product);
    setImgUrlInputValue(initialData.photoUrl || '');
    updatePercentageInputs();
  }, [product, defaultSupplierId, pathname, suppliersLoading, categoriesLoading, unitsLoading, form, updatePercentageInputs]);


  const handleSkuBlur = async () => {
    const sku = form.getValues('sku');
    if (!sku) return;

    setIsLoadingSku(true);
    try {
      const existingProduct = await getProductBySku(sku);
      if (existingProduct) {
        toast({ title: "Producto Existente Encontrado", description: "Datos del producto han sido cargados." });
        setEditingProduct(existingProduct);
        
        const existingSuppliers = existingProduct.suppliers || [];
        const supplierContextId = pathname.includes('/suppliers/') ? pathname.split('/suppliers/')[1].split('/')[0] : defaultSupplierId;
        
        let finalSuppliers = [...existingSuppliers];
        if (supplierContextId && !finalSuppliers.some(s => s.supplierId === supplierContextId)) {
          finalSuppliers.push({ supplierId: supplierContextId, cost: 0, isPrimary: finalSuppliers.length === 0, supplierProductName: '' });
        }
        
        form.reset({ ...existingProduct, suppliers: finalSuppliers, photoUrl: existingProduct.photoUrl || '', pricingMethod: existingProduct.pricingMethod || 'margin', subcategory: existingProduct.subcategory || { es: '', en: '' }, calculationDirection: existingProduct.calculationDirection || 'costToPrice' });
        setImgUrlInputValue(existingProduct.photoUrl || '');
        updatePercentageInputs();
      } else {
          setEditingProduct(null);
          const supplierContextId = pathname.includes('/suppliers/') ? pathname.split('/suppliers/')[1].split('/')[0] : defaultSupplierId;
          const newSuppliers = supplierContextId ? [{ supplierId: supplierContextId, cost: 0, isPrimary: true, supplierProductName: '' }] : [];
          replace(newSuppliers);
          updatePercentageInputs();
      }
    } catch (error) {
      console.error("Error in handleSkuBlur:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch product data by SKU." });
    } finally {
      setIsLoadingSku(false);
    }
  }
  
  const handleSetPrimary = (indexToSet: number) => {
    const currentSuppliers = form.getValues('suppliers');
    const newSuppliers = currentSuppliers.map((supplier, index) => ({
      ...supplier,
      isPrimary: index === indexToSet
    }));
    replace(newSuppliers);
    updatePercentageInputs();
  };

  const photoUrl = form.watch('photoUrl');
  const safePhotoUrl = photoUrl && (photoUrl.startsWith('http') || photoUrl.startsWith('/')) ? photoUrl : null;
  const safeImgUrlInputValue = imgUrlInputValue && (imgUrlInputValue.startsWith('http') || imgUrlInputValue.startsWith('/')) ? imgUrlInputValue : null;

  const currentCategory = form.watch('category');
  const currentUnit = form.watch('unit');

  const handleOpenUrlModal = () => {
    setImgUrlInputValue(photoUrl || '');
    setIsUrlModalOpen(true);
  };
  const handleApplyImageUrl = () => {
    form.setValue('photoUrl', imgUrlInputValue);
    setIsUrlModalOpen(false);
  };
  
  const startCreatingCategory = () => { setEditCategoryTarget(null); setIsCategoryInputMode(true); setTimeout(() => esCategoryInputRef.current?.focus(), 100); };
  const startEditingCategory = () => { if (!currentCategory?.es) return; const categoryToEdit = categories.find(c => c.es === currentCategory.es); if (!categoryToEdit) return; setEditCategoryTarget(categoryToEdit); setIsCategoryInputMode(true); setTimeout(() => { if (esCategoryInputRef.current) esCategoryInputRef.current.value = currentCategory.es; if (enCategoryInputRef.current) enCategoryInputRef.current.value = currentCategory.en; esCategoryInputRef.current?.focus(); }, 100); };
  const handleSaveCategory = async () => { const esValue = esCategoryInputRef.current?.value.trim(); const enValue = enCategoryInputRef.current?.value.trim(); if (!esValue || !enValue) { toast({ variant: 'destructive', title: 'Both category names are required.' }); return; } const newCategory: ProductCategory = { es: esValue, en: enValue }; try { if (editCategoryTarget) { await updateProductCategory(editCategoryTarget.id, newCategory); if (currentCategory.es === editCategoryTarget.es) form.setValue('category', newCategory); toast({ title: t('toast_category_updated'), description: newCategory.es }); } else { if (!categories.some(c => c.es.toLowerCase() === newCategory.es.toLowerCase())) { await addProductCategory(newCategory); form.setValue('category', newCategory); toast({ title: t('toast_category_added'), description: newCategory.es }); } } } catch (error) { toast({ variant: 'destructive', title: 'Error saving category' }); } setIsCategoryInputMode(false); setEditCategoryTarget(null); };
  const handleDeleteCategory = async () => { if (!currentCategory?.es) return; const categoryToDelete = categories.find(c => c.es === currentCategory.es); if (!categoryToDelete || !confirm(t('confirm_delete_category', { category: currentCategory.es }))) return; try { await deleteProductCategory(categoryToDelete.id); form.setValue('category', { es: '', en: '' }); toast({ title: t('toast_category_deleted') }); } catch (error) { toast({ variant: 'destructive', title: 'Error deleting category' }); } };
  const cancelCategoryInput = () => { setIsCategoryInputMode(false); setEditCategoryTarget(null); };

  const startCreatingUnit = () => { setEditUnitTarget(null); setIsUnitInputMode(true); setTimeout(() => esUnitInputRef.current?.focus(), 100); };
  const startEditingUnit = () => { if (!currentUnit?.es) return; const unitToEdit = units.find(u => u.es === currentUnit.es); if (!unitToEdit) return; setEditUnitTarget(unitToEdit); setIsUnitInputMode(true); setTimeout(() => { if (esUnitInputRef.current) esUnitInputRef.current.value = currentUnit.es; if (enUnitInputRef.current) enUnitInputRef.current.value = currentUnit.en; esUnitInputRef.current?.focus(); }, 100); };
  const handleSaveUnit = async () => { const esValue = esUnitInputRef.current?.value.trim(); const enValue = enUnitInputRef.current?.value.trim(); if (!esValue || !enValue) { toast({ variant: 'destructive', title: 'Both unit names are required.' }); return; } const newUnit = { es: esValue, en: enValue }; try { if (editUnitTarget) { await updateProductUnit(editUnitTarget.id, newUnit); if (currentUnit.es === editUnitTarget.es) form.setValue('unit', newUnit); toast({ title: "Unit updated" }); } else { if (!units.some(u => u.es.toLowerCase() === newUnit.es.toLowerCase())) { await addProductUnit(newUnit); form.setValue('unit', newUnit); toast({ title: "Unit created" }); } } } catch(e) { toast({ variant: 'destructive', title: 'Error saving unit' }); } setIsUnitInputMode(false); setEditUnitTarget(null); };
  const handleDeleteUnit = async () => { if (!currentUnit?.es) return; const unitToDelete = units.find(u => u.es === currentUnit.es); if (!unitToDelete || !confirm(`Are you sure you want to delete the unit '${currentUnit.es}'?`)) return; try { await deleteProductUnit(unitToDelete.id); form.setValue('unit', { es: '', en: '' }); toast({ title: "Unit deleted" }); } catch(e) { toast({ variant: 'destructive', title: 'Error deleting unit' }); }};
  const cancelUnitInput = () => { setIsUnitInputMode(false); setEditUnitTarget(null); };

  async function onSubmit(values: ProductFormValues) {
    if (!activeOrgId) {
      toast({ variant: 'destructive', title: "Error", description: "Debes seleccionar un edificio primero." });
      return;
    }

    setIsLoading(true);
    const finalValues: any = { 
      ...values, 
      organizationId: activeOrgId,
      suppliers: values.suppliers.filter(s => s.supplierId) 
    };

    if (!finalValues.subcategory?.es || !finalValues.subcategory?.en) {
      delete finalValues.subcategory;
    }

    if (finalValues.suppliers.length === 0) {
        form.setError("suppliers", { type: "manual", message: "At least one complete supplier entry is required." });
        setIsLoading(false);
        return;
    }
    
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, finalValues);
        toast({ title: t('toast_save_success_title'), description: t('toast_save_success_edit_desc') });
      } else {
        await addProduct(finalValues);
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
                <div className={cn("w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden shrink-0 transition-all", photoUrl ? "border-transparent bg-muted" : "border-gray-300 bg-gray-50 hover:border-primary hover:text-primary hover:bg-green-50")} onClick={handleOpenUrlModal} title={t('form_label_change_image')}>
                    {safePhotoUrl ? <Image src={safePhotoUrl} alt="Preview" width={96} height={96} className="object-cover w-full h-full" /> : <Camera className="h-8 w-8 text-muted-foreground/50" />}
                </div>

                <div className="flex-grow w-full space-y-4">
                    <FormField control={form.control} name="sku" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_sku')}</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input placeholder={t('form_placeholder_sku')} className="h-11 font-mono text-sm bg-gray-50/50 pr-10" {...field} onBlur={handleSkuBlur} disabled={!!editingProduct}/>
                                {isSkuLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                            </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name.es" render={({ field }) => ( <FormItem> <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_name_es')}</FormLabel> <FormControl><Input placeholder={t('form_placeholder_name_es')} className="h-11 font-medium text-base bg-gray-50/50" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="name.en" render={({ field }) => ( <FormItem> <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_name_en')}</FormLabel> <FormControl><Input placeholder={t('form_placeholder_name_en')} className="h-11 font-medium text-base bg-gray-50/50" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_category')}</FormLabel><div className="flex items-center gap-2">{isCategoryInputMode ? (<div className="flex-grow grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200"><Input ref={esCategoryInputRef} placeholder="Nombre en Español" className="border-primary/50 ring-2 ring-primary/10" /><Input ref={enCategoryInputRef} placeholder="Name in English" className="border-primary/50 ring-2 ring-primary/10" /><Button type="button" size="icon" className="bg-green-600 hover:bg-green-700 h-10 w-10" onClick={handleSaveCategory} title={t('save')}><Check className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" className="text-muted-foreground h-10 w-10" onClick={cancelCategoryInput} title={t('cancel')}><Undo2 className="h-4 w-4" /></Button></div>) : (<><Select onValueChange={(value) => { if (!value) return; try { const parsedValue = JSON.parse(value); field.onChange(parsedValue); } catch (e) { console.error("Failed to parse category value", e); } }} value={field.value?.es ? JSON.stringify(field.value) : ""}><FormControl><SelectTrigger className="h-10 bg-white flex-grow"><SelectValue placeholder={t('form_placeholder_select_category')}>{field.value?.es || t('form_placeholder_select_category')}</SelectValue></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c.id} value={JSON.stringify(c)}>{c.es}</SelectItem>)}</SelectContent></Select><div className="flex gap-1 shrink-0 bg-gray-50 p-1 rounded-md border border-gray-200"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!currentCategory?.es} onClick={startEditingCategory}><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={!currentCategory?.es} onClick={handleDeleteCategory}><Trash2 className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={startCreatingCategory}><Plus className="h-4 w-4" /></Button></div></>)}</div><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_unit')}</FormLabel><div className="flex items-center gap-2">{isUnitInputMode ? (<div className="flex-grow grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200"><Input ref={esUnitInputRef} placeholder="Unidad en Español" className="border-primary/50 ring-2 ring-primary/10" /><Input ref={enUnitInputRef} placeholder="Unit in English" className="border-primary/50 ring-2 ring-primary/10" /><Button type="button" size="icon" className="bg-green-600 hover:bg-green-700 h-10 w-10" onClick={handleSaveUnit} title={t('save')}><Check className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" className="text-muted-foreground h-10 w-10" onClick={cancelUnitInput} title={t('cancel')}><Undo2 className="h-4 w-4" /></Button></div>) : (<><Select onValueChange={(value) => { if (!value) return; try { const parsedValue = JSON.parse(value); field.onChange(parsedValue); } catch (e) { console.error("Failed to parse unit value", e); } }} value={field.value?.es ? JSON.stringify(field.value) : ""}><FormControl><SelectTrigger className="h-10 bg-white flex-grow"><SelectValue placeholder="Selecciona una unidad">{field.value?.es || "Selecciona una unidad"}</SelectValue></SelectTrigger></FormControl><SelectContent>{units.map(u => <SelectItem key={u.id} value={JSON.stringify(u)}>{u.es}</SelectItem>)}</SelectContent></Select><div className="flex gap-1 shrink-0 bg-gray-50 p-1 rounded-md border border-gray-200"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!currentUnit?.es} onClick={startEditingUnit}><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={!currentUnit?.es} onClick={handleDeleteUnit}><Trash2 className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={startCreatingUnit}><Plus className="h-4 w-4" /></Button></div></>)}</div><FormMessage /></FormItem>)}/>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="subcategory.es" render={({ field }) => ( <FormItem><FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Subcategoría (Opcional)</FormLabel><FormControl><Input placeholder="Ej: Vasos, Platos" className="h-10 bg-white" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="subcategory.en" render={({ field }) => ( <FormItem><FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Subcategory (Optional)</FormLabel><FormControl><Input placeholder="e.g., Cups, Plates" className="h-10 bg-white" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            
            <hr className="my-2 border-dashed border-gray-200" />
            
            <div className="space-y-2">
                <FormLabel className="text-slate-800 font-bold">{t('suppliers_title')}</FormLabel>
                {fields.length === 0 && (
                    <div className="text-center py-4 px-3 bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-sm text-muted-foreground">{t('no_suppliers_yet')}</p>
                    </div>
                )}
                {fields.map((field, index) => (
                    <div key={field.id} className={cn("p-3 border rounded-lg grid grid-cols-1 md:grid-cols-[2fr,2fr,1fr,auto] gap-4 items-center", watchedSuppliers[index]?.isPrimary ? "bg-primary/5 border-primary" : "bg-muted/30")}>
                        <FormField control={form.control} name={`suppliers.${index}.supplierId`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-medium">Proveedor</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={suppliersLoading}><FormControl><SelectTrigger className="h-10 bg-white"><SelectValue placeholder={t('form_placeholder_select_supplier')} /></SelectTrigger></FormControl><SelectContent>{allSuppliers.map(s => <SelectItem key={s.id} value={s.id} disabled={watchedSuppliers.some((ws, i) => i !== index && ws.supplierId === s.id)}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name={`suppliers.${index}.supplierProductName`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-medium">Nombre del Proveedor</FormLabel><FormControl><Input placeholder="Ej: Roma Tomato #1" className="h-10 bg-white" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name={`suppliers.${index}.cost`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs font-medium">Costo</FormLabel><FormControl><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <Input
                                type="number"
                                className="pl-6 h-10 text-right bg-white"
                                placeholder="0.00"
                                step="0.01"
                                {...field}
                                onChange={(e) => {
                                    field.onChange(e.target.valueAsNumber || 0);
                                }}
                                onBlur={updatePercentageInputs}
                                disabled={watchedCalculationDirection === 'priceToCost' && watchedSuppliers[index]?.isPrimary}
                            />
                            </div></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="flex items-center gap-2">
                             <div className="flex flex-col items-center">
                                <FormLabel htmlFor={`isPrimary-${index}`} className="text-xs text-muted-foreground mb-1">{t('primary_button_label')}</FormLabel>
                                <Switch
                                  id={`isPrimary-${index}`}
                                  checked={field.isPrimary}
                                  onCheckedChange={(checked) => checked && handleSetPrimary(index)}
                                  disabled={!watchedSuppliers[index]?.supplierId}
                                />
                            </div>
                            {fields.length > 1 &&
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive self-end" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                            }
                        </div>
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ supplierId: '', cost: 0, isPrimary: fields.length === 0, supplierProductName: '' })}>
                    <Plus className="mr-2 h-4 w-4"/>
                    {t('add_supplier_label')}
                 </Button>
                <FormMessage>{form.formState.errors.suppliers?.root?.message}</FormMessage>
            </div>

          <hr className="my-2 border-dashed border-gray-200" />
            
            <FormField
              control={form.control}
              name="calculationDirection"
              render={({ field }) => (
                <div className="flex justify-center items-center gap-3">
                    <Label className={cn("text-sm font-medium", field.value === 'costToPrice' ? 'text-primary' : 'text-muted-foreground')}>Calcular desde Costo</Label>
                    <FormControl>
                        <Switch
                            checked={field.value === 'priceToCost'}
                            onCheckedChange={(checked) => field.onChange(checked ? 'priceToCost' : 'costToPrice')}
                        />
                    </FormControl>
                    <Label className={cn("text-sm font-medium", field.value === 'priceToCost' ? 'text-primary' : 'text-muted-foreground')}>Calcular desde Precio de Venta</Label>
                </div>
            )}/>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                            {watchedPricingMethod === 'margin' ? "Margen (%)" : "Recargo (Markup) (%)"}
                        </FormLabel>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="price-calc-switch" className={cn("text-xs font-medium", watchedPricingMethod === 'margin' ? 'text-primary' : 'text-muted-foreground')}>
                                Margen
                            </Label>
                            <FormField control={form.control} name="pricingMethod" render={({ field }) => ( <Switch id="price-calc-switch" checked={field.value === 'markup'} onCheckedChange={(checked) => { const newMethod = checked ? 'markup' : 'margin'; field.onChange(newMethod); }} /> )}/>
                            <Label htmlFor="price-calc-switch" className={cn("text-xs font-medium", watchedPricingMethod === 'markup' ? 'text-primary' : 'text-muted-foreground')}>
                                Recargo
                            </Label>
                        </div>
                    </div>
                    <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                             <div className="relative">
                                <Input type="number" value={marginInput} onChange={handleMarginChange} className="pl-3 pr-8 h-10 text-right font-bold disabled:bg-muted/30" placeholder={t('form_placeholder_margin')} disabled={watchedPricingMethod === 'markup'}/>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                            </div>
                            <div className="relative">
                                <Input type="number" value={markupInput} onChange={handleMarkupChange} className="pl-3 pr-8 h-10 text-right font-bold disabled:bg-muted/30" placeholder="e.g., 42.9" disabled={watchedPricingMethod === 'margin'}/>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                            </div>
                        </div>
                    </FormControl>
                </div>

                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_price')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800 font-bold text-sm">$</span>
                          <Input
                            type="number"
                            className="pl-6 h-10 font-bold text-lg text-right bg-green-50"
                            placeholder="0.00"
                            step="0.01"
                            {...field}
                            onBlur={updatePercentageInputs}
                            disabled={watchedCalculationDirection === 'costToPrice'}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_stock')}</FormLabel><FormControl><Input type="number" className="h-10" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="minStock" render={({ field }) => (<FormItem><FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_min_stock')}</FormLabel><FormControl><Input type="number" className="h-10 border-orange-200 focus:border-orange-400" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                 <FormField control={form.control} name="isBox" render={({ field }) => (
                    <FormItem className="flex items-center gap-3 p-2.5 border rounded-lg bg-gray-50 h-10 mt-0">
                        <FormControl><Switch id="isBox" checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel htmlFor="isBox" className="!m-0 text-sm font-medium cursor-pointer flex items-center gap-2">
                           <Box className="h-4 w-4 text-muted-foreground"/> {t('form_label_is_box')}
                        </FormLabel>
                    </FormItem>
                )}/>
                <FormField control={form.control} name="active" render={({ field }) => (<FormItem className="flex items-center gap-3 p-2.5 border rounded-lg bg-gray-50 h-10 mt-0"><FormControl><Switch id="prodActive" checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel htmlFor="prodActive" className="!m-0 text-sm font-medium cursor-pointer">{field.value ? t('form_label_active_true') : t('form_label_active_false')}</FormLabel></FormItem>)}/>
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
            <Input value={imgUrlInputValue} onChange={(e) => setImgUrlInputValue(e.target.value)} placeholder="https://..." className="h-11"/>
            <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
              {safeImgUrlInputValue ? (<Image src={safeImgUrlInputValue} alt="Preview" width={150} height={150} className="object-contain h-full w-full rounded-lg" />) : (<span className="text-sm text-muted-foreground">{t('form_label_image_url_modal_preview')}</span>)}
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
