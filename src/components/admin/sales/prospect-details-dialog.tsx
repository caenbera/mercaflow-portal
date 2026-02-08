'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Prospect } from '@/types';
import { addProspectVisit, updateProspect } from '@/lib/firestore/prospects';
import { Check, CircleDot, UserX } from 'lucide-react';

const visitSchema = z.object({
  notes: z.string().min(5, "Please provide some details about the visit."),
  outcome: z.enum(['successful', 'follow-up', 'no_show'], { required_error: 'Please select an outcome.' }),
});

type FormValues = z.infer<typeof visitSchema>;

interface ProspectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospect: Prospect | null;
}

export function ProspectDetailsDialog({ open, onOpenChange, prospect }: ProspectDetailsDialogProps) {
  const t = useTranslations('AdminSalesPage');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const outcomeOptions = [
      { value: 'successful' as const, label: t('outcome_successful'), icon: Check },
      { value: 'follow-up' as const, label: t('outcome_followup'), icon: CircleDot },
      { value: 'no_show' as const, label: t('outcome_noshow'), icon: UserX },
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: { notes: '', outcome: 'successful' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ notes: '', outcome: 'successful' });
    }
  }, [open, form]);

  const onSubmit = async (values: FormValues) => {
    if (!prospect) return;

    setIsLoading(true);
    try {
      // Add the visit note
      await addProspectVisit(prospect.id, values);
      
      // Update the prospect's main status to 'visited' if it's currently 'pending' or 'contacted'
      if (prospect.status === 'pending' || prospect.status === 'contacted') {
        await updateProspect(prospect.id, { status: 'visited' });
      }

      toast({ title: "Visita registrada", description: `Se ha guardado la nota para ${prospect.name}.` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Error", description: error.message || "No se pudo guardar la visita." });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!prospect) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('details_title')}: {prospect.name}</DialogTitle>
          <DialogDescription>{prospect.address}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('add_visit_note_label')}</FormLabel>
                <FormControl>
                    <Textarea placeholder={t('add_visit_note_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>

             <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('outcome_label')}</FormLabel>
                   <FormControl>
                    <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-3 gap-2"
                    >
                        {outcomeOptions.map((option) => (
                           <FormItem key={option.value}>
                             <FormControl>
                                <RadioGroupItem value={option.value} id={option.value} className="sr-only"/>
                             </FormControl>
                             <FormLabel 
                                htmlFor={option.value}
                                className="flex flex-col items-center justify-center p-3 rounded-md border-2 border-muted bg-popover hover:bg-accent/50 hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer"
                             >
                                <option.icon className="mb-2 h-5 w-5" />
                                {option.label}
                             </FormLabel>
                           </FormItem>
                        ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>{t('cancel')}</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? t('saving') : t('save_visit_button')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
