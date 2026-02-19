"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addFaq, updateFaq } from '@/lib/firestore/faqs';
import { useOrganization } from '@/context/organization-context';
import type { FAQ } from '@/types';
import { Loader2 } from 'lucide-react';

const faqSchema = z.object({
  question: z.object({
    es: z.string().min(5, "Requerido"),
    en: z.string().min(5, "Required"),
  }),
  answer: z.object({
    es: z.string().min(10, "Requerido"),
    en: z.string().min(10, "Required"),
  }),
});

type FormValues = z.infer<typeof faqSchema>;

interface FaqDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq: FAQ | null;
}

export function FaqDialog({ open, onOpenChange, faq }: FaqDialogProps) {
  const t = useTranslations('AdminSupportPage');
  const { toast } = useToast();
  const { activeOrgId } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: { es: '', en: '' },
      answer: { es: '', en: '' },
    },
  });

  useEffect(() => {
    if (open) {
      if (faq) {
        form.reset({
          question: faq.question,
          answer: faq.answer,
        });
      } else {
        form.reset({
          question: { es: '', en: '' },
          answer: { es: '', en: '' },
        });
      }
    }
  }, [open, faq, form]);

  const onSubmit = async (values: FormValues) => {
    if (!activeOrgId) return;
    setIsSubmitting(true);
    try {
      if (faq) {
        await updateFaq(faq.id, values);
      } else {
        await addFaq({
          organizationId: activeOrgId,
          ...values,
        });
      }
      toast({ title: t('toast_faq_saved') });
      onOpenChange(false);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Could not save FAQ." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{faq ? t('edit_faq_title') : t('new_faq_title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase text-slate-400">Español</h4>
                <FormField
                  control={form.control}
                  name="question.es"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('faq_question_label_es')}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="answer.es"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('faq_answer_label_es')}</FormLabel>
                      <FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase text-slate-400">English</h4>
                <FormField
                  control={form.control}
                  name="question.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('faq_question_label_en')}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="answer.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('faq_answer_label_en')}</FormLabel>
                      <FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('dialog_close')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('dialog_close') === 'Close' ? 'Save FAQ' : 'Guardar FAQ'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
