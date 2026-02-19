
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useOrganization } from '@/context/organization-context';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ShoppingBag, Globe, Copy, ExternalLink, 
  Image as ImageIcon, Check, Loader2, Layout, Share2, 
  MailQuestion, Users, Plus, Send, Calendar as CalendarIcon,
  Mail, MousePointer2, Clock, Trash2, FileDown, X, MailCheck, ShieldCheck, HelpCircle, AlertTriangle,
  ChevronRight, Info, Lock
} from 'lucide-react';
import { updateOrganization } from '@/lib/firestore/organizations';
import { useToast } from '@/hooks/use-toast';
import type { StoreConfig, Newsletter, EmailConfig } from '@/types';
import { useNewsletterSubscribers } from '@/hooks/use-newsletter-subscribers';
import { useNewsletters } from '@/hooks/use-newsletters';
import { addNewsletter, deleteNewsletter } from '@/lib/firestore/newsletters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export default function StoreManagementPage() {
  const { activeOrg, activeOrgId } = useOrganization();
  const { toast } = useToast();
  const locale = useLocale();
  const t = useTranslations('B2CStore');
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('images'); 
  
  // Newsletter Logic
  const { subscribers, loading: subsLoading } = useNewsletterSubscribers(activeOrgId);
  const { newsletters, loading: newsLoading } = useNewsletters(activeOrgId);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());

  const [formData, setFormData] = useState({
    enabled: false,
    heroImage: '',
    fruitsImage: '',
    veggiesImage: '',
    groceriesImage: '',
    testi1Image: '',
    testi2Image: '',
    testi3Image: '',
    contactPhone: '',
    contactWhatsapp: '',
    contactAddress: '',
    fbLink: '',
    igLink: '',
    minOrderAmount: 0,
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    provider: 'none',
    apiKey: '',
    senderName: '',
    senderEmail: '',
    replyTo: '',
    verified: false,
  });

  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    message: '',
    pdfUrl: '',
  });

  useEffect(() => {
    if (activeOrg) {
      setFormData({
        enabled: activeOrg.storeConfig?.enabled || false,
        heroImage: activeOrg.storeConfig?.heroImage || '',
        fruitsImage: activeOrg.storeConfig?.categoriesImages?.fruits || '',
        veggiesImage: activeOrg.storeConfig?.categoriesImages?.vegetables || '',
        groceriesImage: activeOrg.storeConfig?.categoriesImages?.groceries || '',
        testi1Image: activeOrg.storeConfig?.testimonialAvatars?.t1 || '',
        testi2Image: activeOrg.storeConfig?.testimonialAvatars?.t2 || '',
        testi3Image: activeOrg.storeConfig?.testimonialAvatars?.t3 || '',
        contactPhone: activeOrg.storeConfig?.contactPhone || '',
        contactWhatsapp: activeOrg.storeConfig?.contactWhatsapp || '',
        contactAddress: activeOrg.storeConfig?.contactAddress || activeOrg.address || '',
        fbLink: activeOrg.storeConfig?.socialLinks?.facebook || '',
        igLink: activeOrg.storeConfig?.socialLinks?.instagram || '',
        minOrderAmount: activeOrg.storeConfig?.minOrderAmount || 0,
      });

      if (activeOrg.storeConfig?.emailConfig) {
        setEmailConfig(activeOrg.storeConfig.emailConfig);
      }
    }
  }, [activeOrg]);

  const handleSave = async () => {
    if (!activeOrgId) return;
    setIsSaving(true);
    try {
      const newConfig: StoreConfig = {
        ...activeOrg?.storeConfig,
        enabled: formData.enabled,
        heroImage: formData.heroImage,
        categoriesImages: {
          fruits: formData.fruitsImage,
          vegetables: formData.veggiesImage,
          groceries: formData.groceriesImage,
        },
        testimonialAvatars: {
          t1: formData.testi1Image,
          t2: formData.testi2Image,
          t3: formData.testi3Image,
        },
        contactPhone: formData.contactPhone,
        contactWhatsapp: formData.contactWhatsapp,
        contactAddress: formData.contactAddress,
        socialLinks: {
          facebook: formData.fbLink,
          instagram: formData.igLink,
        },
        minOrderAmount: formData.minOrderAmount,
        emailConfig: emailConfig,
      };

      await updateOrganization(activeOrgId, {
        storeConfig: newConfig
      });
      toast({ title: t('toast_save_success_title'), description: t('toast_save_success_desc') });
    } catch (e) {
      toast({ variant: "destructive", title: t('toast_save_error_title'), description: t('toast_save_error_desc') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!activeOrgId || !scheduledDate) return;
    setIsCreatingCampaign(true);
    try {
      await addNewsletter({
        organizationId: activeOrgId,
        subject: campaignForm.subject,
        message: campaignForm.message,
        pdfUrl: campaignForm.pdfUrl,
        status: 'scheduled',
        scheduledAt: Timestamp.fromDate(scheduledDate),
      });
      toast({ title: t('dialog_campaign_title'), description: t('toast_save_success_desc') });
      setIsNewCampaignOpen(false);
      setCampaignForm({ subject: '', message: '', pdfUrl: '' });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error" });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (confirm(t('confirm_delete_category', { category: '' }))) {
      try {
        await deleteNewsletter(id);
        toast({ title: t('toast_category_deleted') });
      } catch (e) {
        toast({ variant: 'destructive', title: "Error" });
      }
    }
  };

  const storeUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/${locale}/store/${activeOrg?.slug}` 
    : '';

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: t('toast_link_copied_title'), description: t('toast_link_copied_desc') });
  };

  if (!activeOrg || activeOrg.type !== 'retailer') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t.rich('not_available_message', {
          strong: (chunks) => <strong>{chunks}</strong>
        })}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-6xl mx-auto">
      <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('dialog_campaign_title')}</DialogTitle>
            <DialogDescription>{t('dialog_campaign_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('dialog_campaign_subject_label')}</Label>
              <Input 
                placeholder={t('dialog_campaign_subject_placeholder')} 
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm(prev => ({...prev, subject: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dialog_campaign_message_label')}</Label>
              <Textarea 
                placeholder={t('dialog_campaign_message_placeholder')} 
                className="min-h-[120px]"
                value={campaignForm.message}
                onChange={(e) => setCampaignForm(prev => ({...prev, message: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('dialog_campaign_pdf_label')}</Label>
              <div className="relative">
                <FileDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={t('dialog_campaign_pdf_placeholder')} 
                  className="pl-9"
                  value={campaignForm.pdfUrl}
                  onChange={(e) => setCampaignForm(prev => ({...prev, pdfUrl: e.target.value}))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('dialog_campaign_date_label')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-11">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP", { locale: locale === 'es' ? es : undefined }) : t('dialog_campaign_date_placeholder')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewCampaignOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreateCampaign} disabled={isCreatingCampaign || !campaignForm.subject || !campaignForm.message}>
              {isCreatingCampaign ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {t('dialog_campaign_submit_button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Layout className="text-primary h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(storeUrl, '_blank')} className="h-11">
                <ExternalLink className="mr-2 h-4 w-4" /> {t('preview_button')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="h-11 px-8 font-bold shadow-lg">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                {isSaving ? t('publishing') : t('publish_button')}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-900 text-white overflow-hidden border-none shadow-xl">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('site_status_label')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                        <span className="text-sm font-semibold">{formData.enabled ? t('site_active') : t('site_maintenance')}</span>
                        <Switch 
                            checked={formData.enabled} 
                            onCheckedChange={(val) => setFormData(prev => ({...prev, enabled: val}))} 
                        />
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 space-y-2">
                        <p className="text-[10px] uppercase font-bold text-primary tracking-widest">{t('public_link_label')}</p>
                        <p className="text-xs font-mono break-all opacity-80">{storeUrl}</p>
                        <Button variant="link" onClick={copyUrl} className="text-white p-0 h-auto text-xs hover:text-primary">
                            <Copy className="h-3 w-3 mr-1" /> {t('copy_link')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-1">
                <Button 
                    variant={activeTab === 'images' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start h-12 rounded-xl"
                    onClick={() => setActiveTab('images')}
                >
                    <ImageIcon className="mr-3 h-4 w-4" /> {t('tab_images')}
                </Button>
                <Button 
                    variant={activeTab === 'contact' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start h-12 rounded-xl"
                    onClick={() => setActiveTab('contact')}
                >
                    <Share2 className="mr-3 h-4 w-4" /> {t('tab_contact')}
                </Button>
                <Button 
                    variant={activeTab === 'marketing' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start h-12 rounded-xl"
                    onClick={() => setActiveTab('marketing')}
                >
                    <MailQuestion className="mr-3 h-4 w-4" /> {t('tab_marketing')}
                </Button>
                <Button 
                    variant={activeTab === 'email' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start h-12 rounded-xl"
                    onClick={() => setActiveTab('email')}
                >
                    <MailCheck className="mr-3 h-4 w-4" /> {t('tab_email')}
                </Button>
            </div>
        </div>

        <div className="lg:col-span-3">
            <Card className="border-none shadow-md overflow-hidden">
                <CardContent className="p-6 md:p-8">
                    {activeTab === 'images' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-primary border-b pb-2"><ImageIcon className="h-4 w-4"/> {t('main_images_title')}</h3>
                                <div className="grid gap-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs font-semibold">{t('hero_image_label')}</Label>
                                        <span className="text-[10px] text-muted-foreground font-medium">{t('size_hint_hero')}</span>
                                    </div>
                                    <Input 
                                        value={formData.heroImage} 
                                        onChange={(e) => setFormData(prev => ({...prev, heroImage: e.target.value}))}
                                        placeholder="https://..."
                                        className="bg-slate-50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b pb-2">
                                    <h3 className="font-bold flex items-center gap-2 text-primary"><ShoppingBag className="h-4 w-4"/> {t('category_images_title')}</h3>
                                    <span className="text-[10px] text-muted-foreground font-medium">{t('size_hint_category')}</span>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('fruits_label')}</Label>
                                        <Input 
                                            value={formData.fruitsImage} 
                                            onChange={(e) => setFormData(prev => ({...prev, fruitsImage: e.target.value}))}
                                            placeholder={t('url_placeholder')}
                                            className="bg-slate-50"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('vegetables_label')}</Label>
                                        <Input 
                                            value={formData.veggiesImage} 
                                            onChange={(e) => setFormData(prev => ({...prev, veggiesImage: e.target.value}))}
                                            placeholder={t('url_placeholder')}
                                            className="bg-slate-50"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('groceries_label')}</Label>
                                        <Input 
                                            value={formData.groceriesImage} 
                                            onChange={(e) => setFormData(prev => ({...prev, groceriesImage: e.target.value}))}
                                            placeholder={t('url_placeholder')}
                                            className="bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b pb-2">
                                    <h3 className="font-bold flex items-center gap-2 text-primary"><Users className="h-4 w-4"/> {t('testimonial_images_title')}</h3>
                                    <span className="text-[10px] text-muted-foreground font-medium">{t('size_hint_avatar')}</span>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('avatar_label_1')}</Label>
                                        <Input 
                                            value={formData.testi1Image} 
                                            onChange={(e) => setFormData(prev => ({...prev, testi1Image: e.target.value}))}
                                            placeholder={t('url_placeholder')}
                                            className="bg-slate-50"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('avatar_label_2')}</Label>
                                        <Input 
                                            value={formData.testi2Image} 
                                            onChange={(e) => setFormData(prev => ({...prev, testi2Image: e.target.value}))}
                                            placeholder={t('url_placeholder')}
                                            className="bg-slate-50"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t('avatar_label_3')}</Label>
                                        <Input 
                                            value={formData.testi3Image} 
                                            onChange={(e) => setFormData(prev => ({...prev, testi3Image: e.target.value}))}
                                            placeholder={t('url_placeholder')}
                                            className="bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('public_phone_label')}</Label>
                                    <Input 
                                        value={formData.contactPhone} 
                                        onChange={(e) => setFormData(prev => ({...prev, contactPhone: e.target.value}))}
                                        placeholder="+1..."
                                        className="h-12 bg-slate-50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('direct_whatsapp_label')}</Label>
                                    <Input 
                                        value={formData.contactWhatsapp} 
                                        onChange={(e) => setFormData(prev => ({...prev, contactWhatsapp: e.target.value}))}
                                        placeholder={t('whatsapp_placeholder')}
                                        className="h-12 bg-slate-50"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">{t('local_address_label')}</Label>
                                <Input 
                                    value={formData.contactAddress} 
                                    onChange={(e) => setFormData(prev => ({...prev, contactAddress: e.target.value}))}
                                    placeholder={t('address_placeholder')}
                                    className="h-12 bg-slate-50"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('facebook_link_label')}</Label>
                                    <Input 
                                        value={formData.fbLink} 
                                        onChange={(e) => setFormData(prev => ({...prev, fbLink: e.target.value}))}
                                        placeholder="https://facebook.com/..."
                                        className="h-12 bg-slate-50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">{t('instagram_link_label')}</Label>
                                    <Input 
                                        value={formData.igLink} 
                                        onChange={(e) => setFormData(prev => ({...prev, igLink: e.target.value}))}
                                        placeholder="https://instagram.com/..."
                                        className="h-12 bg-slate-50"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'marketing' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                            <div className="grid gap-4 max-w-sm mb-8">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">{t('min_order_label')}</Label>
                                <Input 
                                    type="number" 
                                    value={formData.minOrderAmount} 
                                    onChange={(e) => setFormData(prev => ({...prev, minOrderAmount: parseFloat(e.target.value)}))}
                                    className="h-12 bg-slate-50"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="p-4 text-center">
                                  <Users className="mx-auto h-6 w-6 text-primary mb-2" />
                                  <p className="text-2xl font-black text-slate-900">{subsLoading ? '...' : subscribers.length}</p>
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('subscribers_list_title')}</p>
                                </CardContent>
                              </Card>
                              <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="p-4 text-center">
                                  <Mail className="mx-auto h-6 w-6 text-blue-600 mb-2" />
                                  <p className="text-2xl font-black text-slate-900">{newsLoading ? '...' : newsletters.length}</p>
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('campaign_history_title')}</p>
                                </CardContent>
                              </Card>
                              <Card className="bg-orange-50 border-orange-200">
                                <CardContent className="p-4 text-center">
                                  <MousePointer2 className="mx-auto h-6 w-6 text-orange-600 mb-2" />
                                  <p className="text-2xl font-black text-slate-900">
                                    {newsLoading ? '...' : newsletters.reduce((acc, curr) => acc + (curr.opens || 0), 0)}
                                  </p>
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('table_opens')}</p>
                                </CardContent>
                              </Card>
                            </div>

                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2 text-slate-800">
                                  <Mail className="h-5 w-5 text-primary" /> {t('campaign_history_title')}
                                </h3>
                                <Button onClick={() => setIsNewCampaignOpen(true)} size="sm" className="rounded-full shadow-md bg-slate-900 hover:bg-slate-800">
                                  <Plus className="mr-2 h-4 w-4" /> {t('campaign_create_button')}
                                </Button>
                              </div>

                              <div className="border rounded-2xl overflow-hidden bg-white">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                      <TableHead className="text-[10px] uppercase font-bold">{t('table_subject_status')}</TableHead>
                                      <TableHead className="text-[10px] uppercase font-bold text-center">{t('table_opens')}</TableHead>
                                      <TableHead className="text-[10px] uppercase font-bold text-right">{t('table_scheduled')}</TableHead>
                                      <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {newsLoading ? (
                                      <TableRow><TableCell colSpan={4}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                                    ) : newsletters.length > 0 ? (
                                      newsletters.map((news) => (
                                        <TableRow key={news.id}>
                                          <TableCell>
                                            <p className="text-sm font-bold text-slate-800">{news.subject}</p>
                                            <Badge variant="outline" className={cn(
                                              "text-[9px] uppercase h-4 px-1 border-none",
                                              news.status === 'sent' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                              {news.status === 'sent' ? t('status_sent') : t('status_scheduled')}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                              <span className="font-black text-slate-900">{news.opens || 0}</span>
                                              <span className="text-[9px] text-muted-foreground uppercase font-bold">{t('label_readers')}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                              <span className="text-xs font-medium text-slate-600">{format(news.scheduledAt.toDate(), 'dd MMM, HH:mm')}</span>
                                              <Clock className="h-3 w-3 text-slate-300" />
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCampaign(news.id)}>
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic text-sm">
                                          {t('no_campaigns_message')}
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                            
                            <div className="p-8 border-2 border-dashed rounded-[30px] flex flex-col items-center text-center gap-4 bg-slate-50">
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                    <Users className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold">{t('subscribers_list_title')}</h3>
                                <p className="text-muted-foreground max-w-md text-sm">
                                    {t('subscribers_list_desc', { count: subscribers.length })}
                                </p>
                                <Button variant="outline" disabled={subscribers.length === 0} className="rounded-xl">
                                  <FileDown className="mr-2 h-4 w-4" /> {t('export_csv_button')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'email' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <MailCheck className="text-primary h-6 w-6" />
                                        {t('email_title')}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{t('email_subtitle')}</p>
                                </div>
                                <Badge className={cn("px-3 py-1", emailConfig.verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                    {emailConfig.verified ? <><ShieldCheck className="h-3 w-3 mr-1" /> {t('email_status_connected')}</> : <><AlertTriangle className="h-3 w-3 mr-1" /> {t('email_status_disconnected')}</>}
                                </Badge>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="font-bold">{t('email_provider_label')}</Label>
                                        <Select 
                                            value={emailConfig.provider} 
                                            onValueChange={(val: any) => setEmailConfig(prev => ({...prev, provider: val}))}
                                        >
                                            <SelectTrigger className="h-12 bg-slate-50 rounded-xl">
                                                <SelectValue placeholder={t('email_provider_placeholder')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">{t('email_provider_none')}</SelectItem>
                                                <SelectItem value="sendgrid">{t('email_provider_sendgrid')}</SelectItem>
                                                <SelectItem value="mailgun">{t('email_provider_mailgun')}</SelectItem>
                                                <SelectItem value="smtp">{t('email_provider_smtp')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="font-bold">{t('email_apikey_label')}</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input 
                                                type="password"
                                                placeholder={t('email_apikey_placeholder')}
                                                className="h-12 pl-10 bg-slate-50 rounded-xl"
                                                value={emailConfig.apiKey}
                                                onChange={(e) => setEmailConfig(prev => ({...prev, apiKey: e.target.value}))}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold">{t('email_sender_name_label')}</Label>
                                            <Input 
                                                placeholder={t('email_sender_name_placeholder')}
                                                className="h-12 bg-slate-50 rounded-xl"
                                                value={emailConfig.senderName}
                                                onChange={(e) => setEmailConfig(prev => ({...prev, senderName: e.target.value}))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold">{t('email_reply_to_label')}</Label>
                                            <Input 
                                                placeholder={t('email_reply_to_placeholder')}
                                                className="h-12 bg-slate-50 rounded-xl"
                                                value={emailConfig.replyTo}
                                                onChange={(e) => setEmailConfig(prev => ({...prev, replyTo: e.target.value}))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-6 bg-slate-900 text-white rounded-3xl border shadow-xl">
                                        <h4 className="font-bold flex items-center gap-2 mb-4">
                                            <HelpCircle className="h-4 w-4 text-primary" />
                                            {t('email_how_to_title')}
                                        </h4>
                                        <ol className="space-y-4 text-sm text-slate-300 list-decimal pl-4">
                                            <li dangerouslySetInnerHTML={{ __html: t('email_step_1') }}></li>
                                            <li dangerouslySetInnerHTML={{ __html: t('email_step_2') }}></li>
                                            <li dangerouslySetInnerHTML={{ __html: t('email_step_3') }}></li>
                                            <li dangerouslySetInnerHTML={{ __html: t('email_step_4') }}></li>
                                        </ol>
                                        <Button variant="link" className="text-primary p-0 h-auto mt-4 font-bold">
                                            {t('email_guide_button')} <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>

                                    <Card className="border-primary/20 bg-primary/5">
                                        <CardContent className="p-4 flex gap-3 items-start">
                                            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('email_info_card') }}></p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
