
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseOrder, PurchaseOrderItem } from '@/types';
import { updatePurchaseOrder } from '@/lib/firestore/purchaseOrders';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const itemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  orderedQty: z.number(),
  price: z.number(),
  receivedQty: z.coerce.number().min(0, "Cannot be negative"),
});

const formSchema = z.object({
  items: z.array(itemSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface ReceptionConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export function ReceptionConfirmationDialog({ open, onOpenChange, purchaseOrder }: ReceptionConfirmationDialogProps) {
  const t = useTranslations('PurchasingPage');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items"
  });

  useEffect(() => {
    if (purchaseOrder) {
      form.reset({
        items: purchaseOrder.items.map(item => ({
          ...item,
          receivedQty: item.orderedQty, // Default received to ordered
        })),
      });
    }
  }, [purchaseOrder, form]);

  const watchedItems = form.watch('items');
  const newSubtotal = watchedItems.reduce((sum, item) => sum + item.price * item.receivedQty, 0);
  // For display, I'll just calculate the new total.
  const newTotal = newSubtotal; // Simplified for now.

  const onSubmit = async (values: FormValues) => {
    if (!purchaseOrder) return;
    setIsSubmitting(true);
    try {
      await updatePurchaseOrder(purchaseOrder.id, {
        status: 'completed',
        items: values.items.map(item => ({
          ...item,
          receivedQty: item.receivedQty,
        })),
      });
      toast({ title: t('reception_confirmed_title'), description: t('reception_confirmed_desc', { poId: purchaseOrder.poId }) });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: t('reception_confirmed_error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!purchaseOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('confirm_reception_title')}</DialogTitle>
          <DialogDescription>
            {t('confirm_reception_desc', { poId: purchaseOrder.poId, supplierName: purchaseOrder.supplierName })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-96">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('product_header')}</TableHead>
                            <TableHead className="text-center">{t('reception_ordered_qty')}</TableHead>
                            <TableHead className="text-center">{t('reception_received_qty')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell className="font-medium">{field.name}</TableCell>
                                <TableCell className="text-center">{field.orderedQty}</TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.receivedQty`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" {...field} className="w-24 mx-auto text-center" />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
             <div className="mt-4 p-4 bg-muted rounded-lg text-right">
                <div className="text-sm">Original Total: {formatCurrency(purchaseOrder.total)}</div>
                <div className="font-bold text-lg">New Total (Approx): {formatCurrency(newTotal)}</div>
                <div className="text-xs text-muted-foreground">{t('final_discount_note')}</div>
             </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                {t('confirm_and_finalize_button')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
