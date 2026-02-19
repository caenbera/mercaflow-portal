"use client";

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useFaqs } from '@/hooks/use-faqs';
import { useOrganization } from '@/context/organization-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, HelpCircle } from 'lucide-react';
import { FaqDialog } from './faq-dialog';
import { deleteFaq } from '@/lib/firestore/faqs';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqManager() {
  const t = useTranslations('AdminSupportPage');
  const locale = useLocale() as 'es' | 'en';
  const { activeOrgId } = useOrganization();
  const { faqs, loading } = useFaqs(activeOrgId);
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<any | null>(null);

  const handleAdd = () => {
    setSelectedFaq(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (faq: any) => {
    setSelectedFaq(faq);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirm_delete_faq'))) {
      try {
        await deleteFaq(id);
        toast({ title: t('toast_faq_deleted') });
      } catch (e) {
        toast({ variant: 'destructive', title: "Error" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <FaqDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        faq={selectedFaq} 
      />

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="text-primary h-6 w-6" />
            {t('faq_manager_title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('faq_manager_desc')}</p>
        </div>
        <Button onClick={handleAdd} className="rounded-full shadow-lg">
          <Plus className="mr-2 h-4 w-4" /> {t('add_faq_button')}
        </Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : faqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-b last:border-0 px-6">
                  <div className="flex items-center gap-2">
                    <AccordionTrigger className="flex-grow hover:no-underline font-bold text-slate-800 text-left py-6">
                      {faq.question[locale]}
                    </AccordionTrigger>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleEdit(faq)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" onClick={() => handleDelete(faq.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="pb-6 pt-0 text-slate-600 leading-relaxed">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                      {faq.answer[locale]}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t('no_faqs_message')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
