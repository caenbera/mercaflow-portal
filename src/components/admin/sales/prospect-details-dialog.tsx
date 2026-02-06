
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations, useLocale } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { addProspectVisit, updateProspect } from '@/lib/firestore/prospects';
import { useProspectVisits } from '@/hooks/useProspectVisits';
import type { Prospect, ProspectVisit } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Globe, Phone, Clock, MessageSquare, Check, CircleDot, UserX, Loader2 } from 'lucide-react';

const visitSchema = z.object({
  notes: z.string().min(5, 'Please provide some details about the visit.'),
  outcome: z.enum(['successful', 'follow-up', 'no_show']),
});

type VisitFormValues = z.infer<typeof visitSchema>;

const OutcomeIcon = ({ outcome }: { outcome: ProspectVisit['outcome'] }) => {
  switch (outcome) {
    case 'successful':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'follow-up':
      return <CircleDot className="h-4 w-4 text-blue-500" />;
    case 'no_show':
      return <UserX className="h-4 w-4 text-red-500" />;
    default:
      return <MessageSquare className="h-4 w-4 text-gray-500" />;
  }
};

interface ProspectDetailsDialogProps {
  prospect: Prospect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProspectDetailsDialog({ prospect, open, onOpenChange }: ProspectDetailsDialogProps) {
  const t = useTranslations('AdminSalesPage');
  const locale = useLocale();
  const { toast } = useToast();
  const { visits, loading: visitsLoading } = useProspectVisits(prospect?.id || null);

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: { notes: '', outcome: 'follow-up' },
  });

  const { isSubmitting } = form.formState;

  if (!prospect) return null;

  const handleSaveVisit = async (data: VisitFormValues) => {
    try {
      await addProspectVisit(prospect.id, data);
      await updateProspect(prospect.id, { status: 'visited' });
      toast({ title: 'Visit saved', description: `Visit notes added for ${prospect.name}` });
      form.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save visit.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{prospect.name}</DialogTitle>
          <DialogDescription>{prospect.address}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground"/><span className="text-sm">{prospect.phone || t('no_phone')}</span></div>
              <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-muted-foreground"/><span className="text-sm">{prospect.web || 'N/A'}</span></div>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="capitalize">{prospect.ethnic}</Badge>
              <Badge variant="secondary" className="capitalize">{prospect.category}</Badge>
              {prospect.zone && <Badge variant="secondary" className="capitalize">{prospect.zone}</Badge>}
            </div>
            
            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-3">{t('visit_history_title')}</h3>
              <div className="space-y-4">
                {visitsLoading ? (
                  <Skeleton className="h-16 w-full"/>
                ) : visits.length > 0 ? (
                  visits.map(visit => (
                    <div key={visit.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <OutcomeIcon outcome={visit.outcome} />
                        <div className="w-px h-full bg-border mt-1"></div>
                      </div>
                      <div>
                        <p className="text-sm">{visit.notes}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Clock className="h-3 w-3"/>
                          {formatDistanceToNow(visit.date.toDate(), { addSuffix: true, locale: locale === 'es' ? es : undefined })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">{t('no_visits_yet')}</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-6 bg-muted/50 border-t">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveVisit)} className="w-full space-y-3">
               <Controller
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                     <Textarea {...field} placeholder={t('add_visit_note_placeholder')} className="bg-background"/>
                  )}
                />
              <div className="flex justify-between items-center">
                 <Controller
                    control={form.control}
                    name="outcome"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder={t('outcome_label')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="follow-up">{t('outcome_followup')}</SelectItem>
                            <SelectItem value="successful">{t('outcome_successful')}</SelectItem>
                            <SelectItem value="no_show">{t('outcome_noshow')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                  {t('save_visit_button')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
