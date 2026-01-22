
"use client";

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Phone, Camera, Check, BotMessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addSupportTicket } from '@/lib/firestore/tickets';

const WhatsappIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
)

export function SupportPageClient() {
  const t = useTranslations('SupportPage');
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  
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
  
  const faqs = [
      { q: 'faq1_q', a: 'faq1_a'},
      { q: 'faq2_q', a: 'faq2_a'},
      { q: 'faq3_q', a: 'faq3_a'},
  ]

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

      <div className="p-4 space-y-6">
        {/* Contact Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center cursor-pointer transition-transform active:scale-[0.98] shadow-sm" onClick={() => window.open('https://wa.me/15551234567', '_blank')}>
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-green-100 text-green-600 mb-2">
                <BotMessageSquare />
            </div>
            <h3 className="font-bold text-sm">{t('whatsapp_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('whatsapp_subtitle')}</p>
          </Card>
          <Card className="p-4 text-center cursor-pointer transition-transform active:scale-[0.98] shadow-sm" onClick={() => window.location.href='tel:+18001234567'}>
             <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 mb-2">
                <Phone />
            </div>
            <h3 className="font-bold text-sm">{t('call_title')}</h3>
            <p className="text-xs text-muted-foreground">{t('call_subtitle')}</p>
          </Card>
        </div>

        {/* Report Form */}
        <Card className="p-4">
          <h2 className="text-xs font-bold text-muted-foreground uppercase mb-4">{t('report_title')}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('issue_label')}</label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="mt-1">
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
                <SelectTrigger className="mt-1">
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
                <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('details_placeholder')} className="mt-1" />
            </div>

             <div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <Button variant="outline" className="w-full justify-center gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-4 w-4" />
                    <span>{fileName ? t('upload_success', {fileName}) : t('upload_icon_text')}</span>
                </Button>
            </div>

             <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isSubmitting} onClick={handleSendTicket}>
                {isSubmitting ? t('sending_report_button') : t('send_report_button')}
             </Button>
          </div>
        </Card>

        {/* FAQ */}
         <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase mb-3 px-1">{t('faq_title')}</h2>
             <Accordion type="single" collapsible className="w-full space-y-2">
                {faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`item-${i+1}`} className="bg-card rounded-xl border shadow-sm">
                        <AccordionTrigger className="p-4 text-sm text-left">{t(faq.q as any)}</AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                           <p className="text-sm text-muted-foreground">
                                {t.rich(faq.a as any, {
                                  strong: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
                                })}
                            </p>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
         </div>
      </div>
    </div>
  );
}
