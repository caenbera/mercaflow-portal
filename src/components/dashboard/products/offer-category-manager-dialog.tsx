"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useOfferCategories } from '@/hooks/use-offer-categories';
import { addOfferCategory, updateOfferCategory, deleteOfferCategory } from '@/lib/firestore/offerCategories';
import { Pencil, Trash2, Check, X, Loader2, Plus, AlertTriangle } from 'lucide-react';
import type { OfferCategory } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const categorySchema = z.object({
  name: z.object({
    es: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
    en: z.string().min(2, "Name must be at least 2 characters."),
  }),
});
type FormValues = z.infer<typeof categorySchema>;

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfferCategoryManagerDialog({ open, onOpenChange }: CategoryManagerDialogProps) {
  const t = useTranslations('ProductsPage');
  const { toast } = useToast();
  const { categories, loading } = useOfferCategories();
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: { es: '', en: '' } },
  });

  const { isSubmitting } = form.formState;

  const handleAddNew = async (values: FormValues) => {
    await addOfferCategory(values);
    toast({ title: t('toast_category_added') });
    form.reset({ name: { es: '', en: '' } });
  };
  
  const handleStartEdit = (category: OfferCategory) => {
    setEditingId(category.id);
    form.reset({ name: category.name });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset({ name: { es: '', en: '' } });
  };
  
  const handleUpdate = async (values: FormValues) => {
    if (!editingId) return;
    await updateOfferCategory(editingId, values);
    toast({ title: t('toast_category_updated') });
    handleCancelEdit();
  };
  
  const handleDelete = async (id: string) => {
    await deleteOfferCategory(id);
    toast({ title: t('toast_category_deleted') });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('category_manager_title')}</DialogTitle>
          <DialogDescription>{t('category_manager_desc')}</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-60 pr-4 -mr-4 border-y -mx-6 px-6 py-2">
            <div className="space-y-2">
                {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>}
                {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2 p-2 rounded-md bg-muted">
                        <div className="flex-grow font-semibold">{cat.name.es} / {cat.name.en}</div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('delete_alert_title')}</AlertDialogTitle>
                                    <AlertDialogDescription>{t('confirm_delete_category', { category: cat.name.es })}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('delete_alert_cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-destructive hover:bg-destructive/90">{t('delete_alert_confirm')}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                ))}
            </div>
        </ScrollArea>
        
        <Form {...form}>
            <form onSubmit={form.handleSubmit(editingId ? handleUpdate : handleAddNew)} className="space-y-4">
                <p className="text-sm font-semibold">{editingId ? t('edit_category') : t('new_category')}</p>
                 <div className="grid grid-cols-2 gap-2 items-end">
                     <FormField control={form.control} name="name.es" render={({ field }) => (
                         <FormItem>
                             <FormLabel>{t('new_category_name_es')}</FormLabel>
                             <FormControl><Input {...field} /></FormControl>
                             <FormMessage />
                         </FormItem>
                     )}/>
                     <FormField control={form.control} name="name.en" render={({ field }) => (
                         <FormItem>
                             <FormLabel>{t('new_category_name_en')}</FormLabel>
                             <FormControl><Input {...field} /></FormControl>
                             <FormMessage />
                         </FormItem>
                     )}/>
                 </div>
                 <div className="flex gap-2">
                     <Button type="submit" disabled={isSubmitting} size="sm">
                        {editingId ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {editingId ? t('save') : t('add_category_button')}
                    </Button>
                    {editingId && (
                         <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}><X className="mr-2 h-4 w-4" /> {t('cancel')}</Button>
                    )}
                 </div>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
