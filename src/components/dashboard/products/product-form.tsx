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
import { Camera, Plus, Check, Undo2, Pencil, Trash2 } from 'lucide-react'; // Iconos nuevos
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  sku: z.string().min(2, 'SKU must be at least 2 characters.'),
  category: z.string().min(1, 'Category is required.'),
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

const initialCategories = ["Verduras", "Frutas", "Hierbas", "Abarrotes", "Congelados"];

export function ProductForm({ product, onSuccess, defaultSupplierId }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('ProductsPage');
  
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [imgUrlInputValue, setImgUrlInputValue] = useState('');
  
  // ESTADOS PARA GESTIÓN DE CATEGORÍAS
  const [categories, setCategories] = useState(initialCategories);
  const [isInputMode, setIsInputMode] = useState(false); // true si estamos escribiendo (crear o editar)
  const [editModeTarget, setEditModeTarget] = useState<string | null>(null); // Guardamos qué categoría estamos editando
  const categoryInputRef = useRef<HTMLInputElement>(null);

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
      setImgUrlInputValue(product.photoUrl || '');
    } else {
      form.reset({
         name: '', sku: '', category: 'Verduras', unit: 'Caja 20lb', supplierId: defaultSupplierId || '',
         cost: 0, salePrice: 0, stock: 0, minStock: 10, active: true, photoUrl: '',
      });
      setImgUrlInputValue('');
    }
  }, [product, form, defaultSupplierId]);

  const photoUrl = form.watch('photoUrl');
  const currentCategory = form.watch('category'); // Observar categoría actual para habilitar botones

  // Manejo de Imagen
  const handleOpenUrlModal = () => {
    setImgUrlInputValue(photoUrl || '');
    setIsUrlModalOpen(true);
  };

  const handleApplyImageUrl = () => {
    form.setValue('photoUrl', imgUrlInputValue);
    setIsUrlModalOpen(false);
  };
  
  // --- LÓGICA DE CATEGORÍAS ---

  // 1. Iniciar Creación
  const startCreatingCategory = () => {
    setEditModeTarget(null); // Null significa "Nuevo"
    setIsInputMode(true);
    // Limpiamos el input visualmente (aunque el ref lo manejamos al renderizar)
    if (categoryInputRef.current) categoryInputRef.current.value = "";
    setTimeout(() => categoryInputRef.current?.focus(), 100);
  };

  // 2. Iniciar Edición
  const startEditingCategory = () => {
    if (!currentCategory) return;
    setEditModeTarget(currentCategory); // Guardamos "Verduras"
    setIsInputMode(true);
    // Ponemos el valor actual en el input
    setTimeout(() => {
        if(categoryInputRef.current) {
            categoryInputRef.current.value = currentCategory;
            categoryInputRef.current.focus();
        }
    }, 100);
  };

  // 3. Guardar (Crear o Renombrar)
  const handleSaveCategory = () => {
    const inputValue = categoryInputRef.current?.value.trim();
    if (!inputValue) {
        setIsInputMode(false);
        return;
    }

    if (editModeTarget) {
        // MODO EDICIÓN: Renombrar
        setCategories(prev => prev.map(c => c === editModeTarget ? inputValue : c));
        // Actualizar el valor seleccionado en el formulario
        if (currentCategory === editModeTarget) {
            form.setValue('category', inputValue);
        }
        toast({ title: t('toast_category_updated'), description: inputValue });
    } else {
        // MODO CREACIÓN: Agregar nuevo
        if (!categories.includes(inputValue)) {
            setCategories(prev => [...prev, inputValue]);
            form.setValue('category', inputValue);
            toast({ title: t('toast_category_added'), description: inputValue });
        }
    }
    setIsInputMode(false);
    setEditModeTarget(null);
  };

  // 4. Eliminar Categoría
  const handleDeleteCategory = () => {
    if (!currentCategory) return;
    if (confirm(t('confirm_delete_category', { category: currentCategory }))) {
        setCategories(prev => prev.filter(c => c !== currentCategory));
        form.setValue('category', ''); // Limpiar selección
        toast({ title: t('toast_category_deleted') });
    }
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
          
          {/* SECCIÓN SUPERIOR: IMAGEN + DATOS */}
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

              <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_name')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Tomate Chonto Maduro" className="h-11 font-medium text-base bg-gray-50/50" {...field} />
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
                      <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_sku')}</FormLabel>
                      <FormControl>
                        <Input placeholder="AUTO" className="h-11 font-mono text-sm bg-gray-50/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
          </div>
          
          {/* SECCIÓN CATEGORÍA (CON GESTIÓN AVANZADA) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_category')}</FormLabel>
                  <div className="flex items-center gap-2">
                    {isInputMode ? (
                      // MODO INPUT (Crear o Editar)
                      <>
                        <Input 
                          ref={categoryInputRef} 
                          placeholder={editModeTarget ? t('form_placeholder_edit_category') : t('form_placeholder_new_category')} 
                          className="h-10 animate-in fade-in zoom-in-95 duration-200 border-primary/50 ring-2 ring-primary/10"
                          onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleSaveCategory(); }}}
                        />
                        <Button 
                          type="button" size="icon" variant="default" 
                          className="shrink-0 bg-green-600 hover:bg-green-700 h-10 w-10"
                          onClick={handleSaveCategory} title={t('save')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          type="button" size="icon" variant="ghost" 
                          className="shrink-0 h-10 w-10 text-muted-foreground"
                          onClick={cancelCategoryInput} title={t('cancel')}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      // MODO SELECT (Normal)
                      <>
                        <div className="flex-grow">
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="h-10 bg-white">
                                <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                            </Select>
                        </div>
                        
                        {/* Botones de Gestión */}
                        <div className="flex gap-1 shrink-0 bg-gray-50 p-1 rounded-md border border-gray-200">
                            <Button 
                                type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                                disabled={!currentCategory} 
                                onClick={startEditingCategory}
                                title={t('edit_category')}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                                type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                                disabled={!currentCategory} 
                                onClick={handleDeleteCategory}
                                title={t('delete_category')}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <div className="w-px bg-gray-200 mx-0.5 h-5 self-center"></div>
                            <Button 
                                type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
                                onClick={startCreatingCategory}
                                title={t('new_category')}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          </div>

          <hr className="my-2 border-dashed border-gray-200" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel className="text-primary text-xs font-bold uppercase tracking-wider">{t('form_label_supplier')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!!defaultSupplierId}>
                          <FormControl>
                              <SelectTrigger className="h-10 border-primary/30 focus:ring-primary/20 bg-primary/5">
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
              <div className="grid grid-cols-2 gap-4">
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
                <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{t('form_label_price')}</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800 font-bold text-sm">$</span>
                            <Input type="number" className="pl-6 h-10 font-bold text-lg text-right" placeholder="0.00" step="0.01" {...field} />
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
                           {field.value ? "Producto Activo" : "Producto Inactivo"}
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

      {/* MODAL URL DE IMAGEN */}
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
    