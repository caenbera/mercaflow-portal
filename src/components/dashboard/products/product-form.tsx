
"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { addProduct, updateProduct, getProductBySku } from '@/lib/firestore/products';
import type { Product, ProductCategory, ProductSupplier } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Plus, Check, Undo2, Pencil, Trash2, Percent, Loader2 } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { useSuppliers } from '@/hooks/use-suppliers';

const supplierSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required."),
  cost: z.coerce.number().min(0, "Cost cannot be negative."),
  isPrimary: z.boolean(),
});

const formSchema = z.object({
  sku: z.string().min(2, 'SKU must be at least 2 characters.'),
  name: z.object({
    es: z.string().min(2, 'El nombre en español es requerido.'),
    en: z.string().min(2, 'The name in English is required.'),
  }),
  category: z.object({
    es: z.string().min(1, 'La categoría en español es requerida.'),
    en: z.string().min(1, 'The category in English is required.'),
  }),
  unit: z.object({
    es: z.string().min(1, 'La unidad en español es requerida.'),
    en: z.string().min(1, 'The unit in English is required.'),
  }),
  suppliers: z.array(supplierSchema).min(1, "At least one supplier is required."),
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

const initialUnits: { es: string, en: string }[] = [
  { es: "Caja 20lb", en: "20lb Box" },
  { es: "Caja 40lb", en: "40lb Box" },
  { es: "Bulto", en: "Sack" },
  { es: "Kilogramo", en: "Kilogram" },
  { es: "Bidón", en: "Jug" },
  { es: "Manojo", en: "Bunch" },
  { es: "Paq 2kg", en: "2kg Pack" },
];

export function ProductForm({ product, onSuccess, defaultSupplierId }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSkuLoading, setIsSkuLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('ProductsPage');
  const { suppliers: allSuppliers, loading: suppliersLoading } = useSuppliers();
  
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [imgUrlInputValue, setImgUrlInputValue] = useState('');
  
  const [categories, setCategories] = useState(initialCategories);
  const [isCategoryInputMode, setIsCategoryInputMode] = useState(false);
  const [editCategoryTarget, setEditCategoryTarget] = useState<ProductCategory | null>(null);
  const esCategoryInputRef = useRef<HTMLInputElement>(null);
  const enCategoryInputRef = useRef<HTMLInputElement>(null);

  const [units, setUnits] = useState(initialUnits);
  const [isUnitInputMode, setIsUnitInputMode] = useState(false);
  const [editUnitTarget, setEditUnitTarget] = useState<{ es: string; en: string } | null>(null);
  const esUnitInputRef = useRef<HTMLInputElement>(null);
  const enUnitInputRef = useRef<HTMLInputElement>(null);

  const [isMarginInputFocused, setIsMarginInputFocused] = useState(false);
  const [margin, setMargin] = useState<string>('');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: '', name: { es: '', en: '' }, category: { es: '', en: '' }, unit: { es: '', en: '' },
      suppliers: [], salePrice: 0, stock: 0, minStock: 10, active: true, photoUrl: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "suppliers",
  });
  
  const watchedSuppliers = form.watch('suppliers');
  const primarySupplier = watchedSuppliers.find(s => s.isPrimary);
  const costValue = primarySupplier?.cost ?? 0;
  const salePriceValue = form.watch('salePrice');

  const getCleanProductData = (productData: Product | null): ProductFormValues => {
    if (productData) {
      const suppliersForForm: ProductSupplier[] = productData.suppliers?.length > 0
        ? [...productData.suppliers]
        : (defaultSupplierId ? [{ supplierId: defaultSupplierId, cost: 0, isPrimary: true }] : []);

      return {
        sku: productData.sku,
        name: productData.name,
        category: productData.category,
        unit: productData.unit,
        suppliers: suppliersForForm,
        salePrice: productData.salePrice,
        stock: productData.stock,
        minStock: productData.minStock,
        active: productData.active,
        photoUrl: productData.photoUrl || '',
      };
    } else {
      const initialSuppliers = defaultSupplierId
        ? [{ supplierId: defaultSupplierId, cost: 0, isPrimary: true }]
        : [{ supplierId: '', cost: 0, isPrimary: true }];
        
      return {
        sku: '',
        name: { es: '', en: '' },
        category: initialCategories[0],
        unit: initialUnits[0],
        suppliers: initialSuppliers,
        salePrice: 0,
        stock: 0,
        minStock: 10,
        active: true,
        photoUrl: '',
      };
    }
  };
  
  useEffect(() => {
    if (suppliersLoading) return;
    const initialData = getCleanProductData(product);
    form.reset(initialData);
    setImgUrlInputValue(initialData.photoUrl || '');
  }, [product, defaultSupplierId, suppliersLoading, form]);
  
  useEffect(() => {
    if (isMarginInputFocused) return;
    if (costValue > 0 && salePriceValue > costValue) {
        const calculatedMargin = ((salePriceValue - costValue) / salePriceValue) * 100;
        setMargin(calculatedMargin.toFixed(1).replace('.0', ''));
    } else {
        setMargin('');
    }
  }, [costValue, salePriceValue, isMarginInputFocused]);

  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const marginValue = e.target.value;
    setMargin(marginValue);
    const marginNum = parseFloat(marginValue);
    if (!isNaN(marginNum) && marginNum < 100 && costValue > 0) {
        const newSalePrice = costValue / (1 - marginNum / 100);
        form.setValue('salePrice', parseFloat(newSalePrice.toFixed(2)), { shouldValidate: true });
    }
  };

  const handleSkuBlur = async () => {
    const sku = form.getValues('sku');
    if (!sku || product) return;

    setIsSkuLoading(true);
    try {
      const existingProduct = await getProductBySku(sku);
      if (existingProduct) {
        toast({ title: "Producto Existente Encontrado", description: "Datos del producto han sido cargados." });
        const productDataForForm = getCleanProductData(existingProduct);
        form.reset(productDataForForm);
        setImgUrlInputValue(productDataForForm.photoUrl || '');
      }
    } catch (error) {
      console.error("Error in handleSkuBlur:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch product data." });
    } finally {
      setIsSkuLoading(false);
    }
  }

  const handleSetPrimary = (indexToSet: number) => {
    watchedSuppliers.forEach((_, index) => {
      if (form.getValues(`suppliers.${index}.isPrimary`) !== (index === indexToSet)) {
        update(index, { ...watchedSuppliers[index], isPrimary: index === indexToSet });
      }
    });
  };

  useEffect(() => {
    const lastSupplier = watchedSuppliers[watchedSuppliers.length - 1];
    if (lastSupplier && lastSupplier.supplierId) {
      append({ supplierId: '', cost: 0, isPrimary: false }, { shouldFocus: false });
    }
  }, [watchedSuppliers, append]);

  const photoUrl = form.watch('photoUrl');
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
  const startEditingCategory = () => { if (!currentCategory) return; setEditCategoryTarget(currentCategory); setIsCategoryInputMode(true); setTimeout(() => { if (esCategoryInputRef.current) esCategoryInputRef.current.value = currentCategory.es; if (enCategoryInputRef.current) enCategoryInputRef.current.value = currentCategory.en; esCategoryInputRef.current?.focus(); }, 100); };
  const handleSaveCategory = () => { const esValue = esCategoryInputRef.current?.value.trim(); const enValue = enCategoryInputRef.current?.value.trim(); if (!esValue || !enValue) { toast({ variant: 'destructive', title: 'Both category names are required.' }); return; } const newCategory: ProductCategory = { es: esValue, en: enValue }; if (editCategoryTarget) { setCategories(prev => prev.map(c => c.es === editCategoryTarget.es ? newCategory : c)); if (currentCategory.es === editCategoryTarget.es) form.setValue('category', newCategory); toast({ title: t('toast_category_updated'), description: newCategory.es }); } else { if (!categories.some(c => c.es.toLowerCase() === newCategory.es.toLowerCase())) { setCategories(prev => [...prev, newCategory]); form.setValue('category', newCategory); toast({ title: t('toast_category_added'), description: newCategory.es }); } } setIsCategoryInputMode(false); setEditCategoryTarget(null); };
  const handleDeleteCategory = () => { if (!currentCategory?.es || !confirm(t('confirm_delete_category', { category: currentCategory.es }))) return; const newCategories = categories.filter(c => c.es !== currentCategory.es); setCategories(newCategories); form.setValue('category', newCategories.length > 0 ? newCategories[0] : { es: '', en: '' }); toast({ title: t('toast_category_deleted') }); };
  const cancelCategoryInput = () => { setIsCategoryInputMode(false); setEditCategoryTarget(null); };

  const startCreatingUnit = () => { setEditUnitTarget(null); setIsUnitInputMode(true); setTimeout(() => esUnitInputRef.current?.focus(), 100); };
  const startEditingUnit = () => { if (!currentUnit) return; setEditUnitTarget(currentUnit); setIsUnitInputMode(true); setTimeout(() => { if (esUnitInputRef.current) esUnitInputRef.current.value = currentUnit.es; if (enUnitInputRef.current) enUnitInputRef.current.value = currentUnit.en; esUnitInputRef.current?.focus(); }, 100); };
  const handleSaveUnit = () => { const esValue = esUnitInputRef.current?.value.trim(); const enValue = enUnitInputRef.current?.value.trim(); if (!esValue || !enValue) { toast({ variant: 'destructive', title: 'Both unit names are required.' }); return; } const newUnit = { es: esValue, en: enValue }; if (editUnitTarget) { setUnits(prev => prev.map(u => u.es === editUnitTarget.es ? newUnit : u)); if (currentUnit.es === editUnitTarget.es) form.setValue('unit', newUnit); } else { if (!units.some(u => u.es.toLowerCase() === newUnit.es.toLowerCase())) { setUnits(prev => [...prev, newUnit]); form.setValue('unit', newUnit); } } setIsUnitInputMode(false); setEditUnitTarget(null); };
  const handleDeleteUnit = () => { if (!currentUnit?.es || !confirm(`Are you sure you want to delete the unit '${currentUnit.es}'?`)) return; const newUnits = units.filter(u => u.es !== currentUnit.es); setUnits(newUnits); form.setValue('unit', newUnits.length > 0 ? newUnits[0] : { es: '', en: '' }); };
  const cancelUnitInput = () => { setIsUnitInputMode(false); setEditUnitTarget(null); };

  async function onSubmit(values: ProductFormValues) {
    setIsLoading(true);
    const finalValues = { ...values, suppliers: values.suppliers.filter(s => s.supplierId) };
    if (finalValues.suppliers.length === 0) {
        form.setError("suppliers", { type: "manual", message: "At least one complete supplier entry is required." });
        setIsLoading(false);
        return;
    }
    
    try {
      if (product) {
        await updateProduct(product.id, finalValues);
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
                    {photoUrl ? <Image src={photoUrl} alt="Preview" width={96} height={96} className="object-cover w-full h-full" /> : <Camera className="h-8 w-8 text-muted-foreground/50" />}
                </div>

                <div className="flex-grow w-full space-y-4">
                    <FormField control={form.control} name="sku" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_sku')}</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input placeholder={t('form_placeholder_sku')} className="h-11 font-mono text-sm bg-gray-50/50 pr-10" {...field} onBlur={handleSkuBlur} disabled={!!product}/>
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
                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_category')}</FormLabel><div className="flex items-center gap-2">{isCategoryInputMode ? (<div className="flex-grow grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200"><Input ref={esCategoryInputRef} placeholder="Nombre en Español" className="border-primary/50 ring-2 ring-primary/10" /><Input ref={enCategoryInputRef} placeholder="Name in English" className="border-primary/50 ring-2 ring-primary/10" /><Button type="button" size="icon" className="bg-green-600 hover:bg-green-700 h-10 w-10" onClick={handleSaveCategory} title={t('save')}><Check className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" className="text-muted-foreground h-10 w-10" onClick={cancelCategoryInput} title={t('cancel')}><Undo2 className="h-4 w-4" /></Button></div>) : (<><Select onValueChange={(value) => { if (!value) return; try { const parsedValue = JSON.parse(value); field.onChange(parsedValue); } catch (e) { console.error("Failed to parse category value", e); } }} value={field.value?.es ? JSON.stringify(field.value) : ""}><FormControl><SelectTrigger className="h-10 bg-white flex-grow"><SelectValue placeholder={t('form_placeholder_select_category')}>{field.value?.es || t('form_placeholder_select_category')}</SelectValue></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c.es} value={JSON.stringify(c)}>{c.es}</SelectItem>)}</SelectContent></Select><div className="flex gap-1 shrink-0 bg-gray-50 p-1 rounded-md border border-gray-200"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!currentCategory?.es} onClick={startEditingCategory}><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={!currentCategory?.es} onClick={handleDeleteCategory}><Trash2 className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={startCreatingCategory}><Plus className="h-4 w-4" /></Button></div></>)}</div><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_unit')}</FormLabel><div className="flex items-center gap-2">{isUnitInputMode ? (<div className="flex-grow grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200"><Input ref={esUnitInputRef} placeholder="Unidad en Español" className="border-primary/50 ring-2 ring-primary/10" /><Input ref={enUnitInputRef} placeholder="Unit in English" className="border-primary/50 ring-2 ring-primary/10" /><Button type="button" size="icon" className="bg-green-600 hover:bg-green-700 h-10 w-10" onClick={handleSaveUnit} title={t('save')}><Check className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" className="text-muted-foreground h-10 w-10" onClick={cancelUnitInput} title={t('cancel')}><Undo2 className="h-4 w-4" /></Button></div>) : (<><Select onValueChange={(value) => { if (!value) return; try { const parsedValue = JSON.parse(value); field.onChange(parsedValue); } catch (e) { console.error("Failed to parse unit value", e); } }} value={field.value?.es ? JSON.stringify(field.value) : ""}><FormControl><SelectTrigger className="h-10 bg-white flex-grow"><SelectValue placeholder="Selecciona una unidad">{field.value?.es || "Selecciona una unidad"}</SelectValue></SelectTrigger></FormControl><SelectContent>{units.map(u => <SelectItem key={u.es} value={JSON.stringify(u)}>{u.es}</SelectItem>)}</SelectContent></Select><div className="flex gap-1 shrink-0 bg-gray-50 p-1 rounded-md border border-gray-200"><Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={!currentUnit?.es} onClick={startEditingUnit}><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={!currentUnit?.es} onClick={handleDeleteUnit}><Trash2 className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={startCreatingUnit}><Plus className="h-4 w-4" /></Button></div></>)}</div><FormMessage /></FormItem>)}/>
            </div>
            
            <hr className="my-2 border-dashed border-gray-200" />
            
            <div className="space-y-2">
                {fields.map((field, index) => {
                    const isLastRow = index === fields.length - 1;
                    if (isLastRow && field.supplierId) return null;
                    if (!isLastRow && !field.supplierId) return null;

                    return (
                        <div key={field.id} className={cn("p-3 border rounded-lg", watchedSuppliers[index]?.isPrimary ? "bg-primary/5 border-primary" : "bg-muted/30")}>
                            <div className="flex justify-between items-center mb-2">
                                <FormLabel className="text-primary text-xs font-bold uppercase tracking-wider">{isLastRow ? t('add_supplier_label') : `Proveedor #${index + 1}`}</FormLabel>
                                {(!isLastRow && fields.length > 2) && <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(index)}><Trash2 className="h-3 w-3" /></Button>}
                            </div>
                            <div className="grid grid-cols-[2fr,1fr,auto] gap-4 items-center">
                                <FormField control={form.control} name={`suppliers.${index}.supplierId`} render={({ field }) => (
                                    <FormItem><Select onValueChange={field.onChange} value={field.value} disabled={suppliersLoading}><FormControl><SelectTrigger className="h-10 bg-white"><SelectValue placeholder={t('form_placeholder_select_supplier')} /></SelectTrigger></FormControl><SelectContent>{allSuppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`suppliers.${index}.cost`} render={({ field }) => (
                                    <FormItem><FormControl><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span><Input type="number" className="pl-6 h-10 text-right bg-white" placeholder="0.00" step="0.01" {...field} /></div></FormControl><FormMessage /></FormItem>
                                )}/>
                                <div className="flex flex-col items-center">
                                    <FormLabel htmlFor={`isPrimary-${index}`} className="text-xs text-muted-foreground mb-1">{t('primary_button_label')}</FormLabel>
                                    <Switch
                                      id={`isPrimary-${index}`}
                                      checked={watchedSuppliers[index]?.isPrimary}
                                      onCheckedChange={(checked) => checked && handleSetPrimary(index)}
                                      disabled={!watchedSuppliers[index]?.supplierId || isLastRow}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
                <FormMessage>{form.formState.errors.suppliers?.root?.message}</FormMessage>
            </div>

          <hr className="my-2 border-dashed border-gray-200" />
            <div className="grid grid-cols-2 gap-4">
                 <FormItem>
                    <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_margin')}</FormLabel>
                    <FormControl><div className="relative"><Input type="number" value={margin} onChange={handleMarginChange} className="pl-3 pr-8 h-10 text-right font-bold" placeholder={t('form_placeholder_margin')} onFocus={() => setIsMarginInputFocused(true)} onBlur={() => setIsMarginInputFocused(false)}/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span></div></FormControl>
                </FormItem>
                <FormField control={form.control} name="salePrice" render={({ field }) => (<FormItem><FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_price')}</FormLabel><FormControl><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800 font-bold text-sm">$</span><Input type="number" className="pl-6 h-10 font-bold text-lg text-right bg-green-50" placeholder="0.00" step="0.01" {...field} /></div></FormControl><FormMessage /></FormItem>)}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_stock')}</FormLabel><FormControl><Input type="number" className="h-10" placeholder="0" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="minStock" render={({ field }) => (<FormItem><FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_min_stock')}</FormLabel><FormControl><Input type="number" className="h-10 border-orange-200 focus:border-orange-400" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="active" render={({ field }) => (<FormItem className="flex items-center gap-3 p-2.5 border rounded-lg bg-gray-50 h-10 mt-6 md:mt-0"><FormControl><Switch id="prodActive" checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel htmlFor="prodActive" className="!m-0 text-sm font-medium cursor-pointer">{field.value ? t('form_label_active_true') : t('form_label_active_false')}</FormLabel></FormItem>)}/>
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
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{t('form_label_image_url_modal_title')}</DialogTitle></DialogHeader><div className="space-y-4 py-2"><Input value={imgUrlInputValue} onChange={(e) => setImgUrlInputValue(e.target.value)} placeholder="https://..." className="h-11"/><div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">{imgUrlInputValue ? (<Image src={imgUrlInputValue} alt="Preview" width={150} height={150} className="object-contain h-full w-full rounded-lg" />) : (<span className="text-sm text-muted-foreground">{t('form_label_image_url_modal_preview')}</span>)}</div></div><DialogFooter><Button onClick={handleApplyImageUrl} className="w-full">{t('form_button_apply_image')}</Button></DialogFooter></DialogContent>
      </Dialog>
    </>
  );
}

    