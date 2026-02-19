"use client";

import { useState, useRef, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Phone, Camera, Check, BotMessageSquare, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addSupportTicket } from '@/lib/firestore/tickets';
import { useFaqs } from '@/hooks/use-faqs';
import { Skeleton } from '@/components/ui/skeleton';

export function SupportPageClient() {
  const t = useTranslations('SupportPage');
  const locale = useLocale() as 'es' | 'en';
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  
  // Resolve Org ID for FAQs
  const activeOrgId = userProfile?.organizationId || userProfile?.belongsToOrgId || null;
  const { faqs, loading: faqsLoading } = useFaqs(activeOrgId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueType, setIssueType] = useState('bad_product');
  const [orderDetails, setOrderDetails] = useState('');
  const [details, setDetails] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      toast({
        title: t('upload_success', { fileName: file.name }),
      });
    }
  };

  const handleSendTicket = async () => {
    if (!user || !userProfile || !details) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in all required fields.' });
      return;
    }

    setIsSubmitting(true);
    let photoUrl;

    try {
      if (selectedFile) {
        const filePath = `support-tickets/${user.uid}/${Date.now()}-${selectedFile.name}`;
        const storageRef = ref(storage, filePath);
        const uploadResult = await uploadBytes(storageRef, selectedFile);
        photoUrl = await getDownloadURL(uploadResult.ref);
      }
      
      await addSupportTicket({
        userId: user.uid,
        userName: userProfile.businessName,
        issueType,
        orderId: orderDetails,
        details,
        photoUrl,
        status: 'new',
      });

      toast({
        title: t('report_sent_title'),
        description: t('report_sent_desc'),
      });
      router.back();

    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send report. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20 md:pb-4">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-card p-3 shadow-sm md:hidden">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-bold">{t('title')}</h1>
        <div className="w-9"></div> {/* Spacer */}
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Contact Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center cursor-pointer transition-transform active:scale-[0.98] shadow-sm hover:bg-slate-50" onClick={() => window.open('https://wa.me/15551234567', '_blank')}>
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-green-100 text-green-600 mb-2">
                <BotMessageSquare />
            </div>
            <h3 className="font-bold text-sm">{t('whatsapp_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('whatsapp_subtitle')}</p>
          </Card>
          <Card className="p-4 text-center cursor-pointer transition-transform active:scale-[0.98] shadow-sm hover:bg-slate-50" onClick={() => window.location.href='tel:+18001234567'}>
             <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 mb-2">
                <Phone />
            </div>
            <h3 className="font-bold text-sm">{t('call_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('call_subtitle')}</p>
          </Card>
        </div>

        {/* FAQ Section (Dynamic) */}
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase mb-3 px-1 flex items-center gap-2">
            <HelpCircle className="h-3 w-3" />
            {t('faq_title')}
          </h2>
          {faqsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : faqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
                  <AccordionTrigger className="p-4 text-sm text-left font-bold hover:no-underline hover:bg-slate-50 transition-colors">
                    {faq.question[locale]}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2 text-slate-600 bg-slate-50/50 italic border-t border-dashed">
                    {faq.answer[locale]}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <Card className="p-6 text-center border-dashed bg-slate-50/50">
              <p className="text-sm text-muted-foreground">No hay preguntas frecuentes configuradas para este comercio.</p>
            </Card>
          )}
        </div>

        {/* Report Form */}
        <Card className="p-4 shadow-md border-none rounded-2xl">
          <h2 className="text-xs font-bold text-muted-foreground uppercase mb-4 px-1">{t('report_title')}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('issue_label')}</label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="mt-1 h-11 bg-slate-50 rounded-xl border-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bad_product">{t('issue_option_bad_product')}</SelectItem>
                  <SelectItem value="missing_product">{t('issue_option_missing_product')}</SelectItem>
                  <SelectItem value="late_order">{t('issue_option_late_order')}</SelectItem>
                  <SelectItem value="invoice_problem">{t('issue_option_invoice_problem')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">{t('order_label')}</label>
               <Select value={orderDetails} onValueChange={setOrderDetails}>
                <SelectTrigger className="mt-1 h-11 bg-slate-50 rounded-xl border-none">
                  <SelectValue placeholder={t('order_option_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order1">{t('order_option_example_1')}</SelectItem>
                  <SelectItem value="order2">{t('order_option_example_2')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

             <div>
                <label className="text-sm font-medium">{t('details_label')}</label>
                <Textarea 
                  value={details} 
                  onChange={(e) => setDetails(e.target.value)} 
                  placeholder={t('details_placeholder')} 
                  className="mt-1 bg-slate-50 border-none rounded-xl min-h-[100px]" 
                />
            </div>

             <div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <Button variant="outline" className="w-full h-11 justify-center gap-2 rounded-xl border-dashed border-2 hover:bg-slate-50" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-4 w-4" />
                    <span className="font-semibold">{fileName ? t('upload_success', {fileName}) : t('upload_icon_text')}</span>
                </Button>
            </div>

             <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg" disabled={isSubmitting} onClick={handleSendTicket}>
                {isSubmitting ? t('sending_report_button') : t('send_report_button')}
             </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
