
"use client";

import { useState, useEffect } from 'react';
import { useOrganization } from '@/context/organization-context';
import { useLocale } from 'next-intl';
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
  ChevronRight, Info, Lock, CreditCard, Wallet, Zap, Fingerprint
} from 'lucide-react';
import { updateOrganization } from '@/lib/firestore/organizations';
import { useToast } from '@/hooks/use-toast';
import type { StoreConfig, Newsletter, EmailConfig, PaymentConfig } from '@/types';
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
  
  const labels = {
    es: {
      identity_hub_title: "Identidad y Marca",
      identity_hub_subtitle: "Gestiona cómo te presentas ante el ecosistema y tus clientes finales.",
      preview_button: "Ver Web Pública",
      publish_button: "Guardar Cambios",
      publishing: "Guardando...",
      site_status_label: "Estado del Perfil",
      site_active: "Perfil Activo",
      site_maintenance: "Bajo Ajustes",
      public_link_label: "Enlace de Invitación",
      copy_link: "Copiar enlace",
      tab_branding: "Marca y Logo",
      tab_contact: "Contacto y Redes",
      tab_marketing: "Marketing y Campañas",
      tab_email: "Conexión de Email",
      tab_payments: "Pasarela de Pagos",
      main_logo_title: "Logotipo de la Empresa",
      logo_url_label: "Enlace del Logo (URL)",
      logo_hint: "Pega la dirección de tu imagen (JPG, PNG o SVG). Se usará en tus invitaciones y pantallas de acceso. Te sugerimos usar ",
      logo_hint_action: "PostImages.org",
      logo_hint_suffix: " y seleccionar la opción de 'Enlace directo'.",
      main_images_title: "Imágenes de la Web",
      hero_image_label: "URL Foto de Portada",
      category_images_title: "Imágenes de Categorías",
      fruits_label: "Frutas",
      vegetables_label: "Verduras",
      groceries_label: "Abarrotes",
      url_placeholder: "URL...",
      testimonial_images_title: "Fotos de Clientes",
      avatar_label_1: "Foto Cliente 1",
      avatar_label_2: "Foto Cliente 2",
      avatar_label_3: "Foto Cliente 3",
      public_phone_label: "Teléfono de Contacto",
      direct_whatsapp_label: "WhatsApp de Pedidos",
      whatsapp_placeholder: "Número sin espacios...",
      local_address_label: "Dirección Física",
      address_placeholder: "Calle, Ciudad, Estado...",
      facebook_link_label: "Link Facebook",
      instagram_link_label: "Link Instagram",
      min_order_label: "Compra Mínima ($)",
      subscribers_list_title: "Lista de Suscriptores",
      campaign_history_title: "Historial de Newsletters",
      table_opens: "Lecturas",
      campaign_create_button: "Crear Campaña",
      status_sent: "Enviado",
      status_scheduled: "Pendiente",
      label_readers: "Lectores",
      no_campaigns_message: "No has configurado ninguna campaña aún.",
      subscribers_list_desc: (count: number) => `Tienes ${count} personas registradas para recibir tus ofertas.`,
      export_csv_button: "Descargar Lista (CSV)",
      email_title: "Conexión Profesional de Email",
      email_subtitle: "Usa tu propia cuenta para que los clientes confíen más en tus correos.",
      email_status_connected: "Conectado",
      email_status_disconnected: "Desconectado",
      email_provider_label: "Proveedor de Email",
      email_provider_placeholder: "Selecciona un proveedor",
      email_provider_none: "Ninguno",
      email_provider_sendgrid: "SendGrid",
      email_provider_mailgun: "Mailgun",
      email_provider_smtp: "Servidor SMTP",
      email_apikey_label: "API Key / Contraseña",
      email_apikey_placeholder: "Introduce la llave de API",
      email_sender_name_label: "Nombre del Remitente",
      email_sender_name_placeholder: "Ej: Frutería Doña Rosa",
      email_reply_to_label: "Email para Respuestas",
      email_reply_to_placeholder: "ejemplo@correo.com",
      email_how_to_title: "Cómo configurar",
      email_step_1: "Obtén una <b>API Key</b> de tu proveedor.",
      email_step_2: "Verifica tu <b>dominio</b> en el panel de control del proveedor.",
      email_step_3: "Pega la llave aquí y completa los datos.",
      email_step_4: "Guarda los cambios para activar el servicio.",
      email_guide_button: "Ver Guía Paso a Paso",
      email_info_card: "MercaFlow utiliza estos datos para enviar notificaciones automáticas y newsletters en nombre de tu empresa.",
      payments_title: "Cobros y Pagos Directos",
      payments_subtitle: "Configure su cuenta de Stripe o PayPal para recibir el dinero de sus ventas.",
      payments_status_enabled: "Pasarela Activa",
      payments_status_disabled: "Pasarela Inactiva",
      payments_provider_label: "Proveedor de Pagos",
      payments_provider_placeholder: "Selecciona un proveedor",
      payments_provider_stripe: "Stripe",
      payments_provider_paypal: "PayPal",
      payments_mode_label: "Modo",
      payments_mode_test: "Pruebas (Test)",
      payments_mode_live: "Producción (Live)",
      payments_public_key_label: "Llave Pública (Publishable Key)",
      payments_secret_key_label: "Llave Secreta (Secret Key)",
      payments_webhook_label: "Secreto de Webhook",
      payments_currency_label: "Moneda",
      dialog_campaign_title: "Nueva Campaña",
      dialog_campaign_desc: "Describe los detalles de tu nueva campaña de marketing.",
      dialog_campaign_subject_label: "Asunto del Email",
      dialog_campaign_subject_placeholder: "Ej: ¡Super Oferta de Fin de Semana!",
      dialog_campaign_message_label: "Cuerpo del Mensaje",
      dialog_campaign_message_placeholder: "Describe tu oferta aquí...",
      dialog_campaign_pdf_label: "URL del Catálogo PDF",
      dialog_campaign_pdf_placeholder: "https://tudominio.com/catalogo.pdf",
      dialog_campaign_date_label: "Fecha de Envío",
      dialog_campaign_date_placeholder: "Selecciona una fecha",
      dialog_campaign_submit_button: "Crear Campaña",
      select_org_message: "Por favor selecciona una organización para administrar la tienda.",
      toast_save_success_title: "Guardado",
      toast_save_success_desc: "Configuración guardada correctamente.",
      toast_save_error_title: "Error",
      toast_save_error_desc: "Hubo un error al guardar.",
      toast_category_deleted: "Campaña eliminada",
      confirm_delete_category: "Estás seguro que deseas borrar esta campaña?",
      cancel: "Cancelar"
    },
    en: {
      identity_hub_title: "Identity & Branding",
      identity_hub_subtitle: "Manage how you present yourself to the ecosystem and your final customers.",
      preview_button: "View Public Web",
      publish_button: "Save Changes",
      publishing: "Saving...",
      site_status_label: "Profile Status",
      site_active: "Active Profile",
      site_maintenance: "Under Adjustments",
      public_link_label: "Invitation Link",
      copy_link: "Copy link",
      tab_branding: "Brand & Logo",
      tab_contact: "Contact & Social",
      tab_marketing: "Marketing & Campaigns",
      tab_email: "Email Connection",
      tab_payments: "Payment Gateway",
      main_logo_title: "Company Logo",
      logo_url_label: "Logo Link (URL)",
      logo_hint: "Paste the address of your image (JPG, PNG or SVG). It will be used in your invitations and login screens. We suggest using ",
      logo_hint_action: "PostImages.org",
      logo_hint_suffix: " and selecting the 'Direct Link' option.",
      main_images_title: "Web Images",
      hero_image_label: "Cover Photo URL",
      category_images_title: "Category Images",
      fruits_label: "Fruits",
      vegetables_label: "Vegetables",
      groceries_label: "Groceries",
      url_placeholder: "URL...",
      testimonial_images_title: "Customer Photos",
      avatar_label_1: "Customer Photo 1",
      avatar_label_2: "Customer Photo 2",
      avatar_label_3: "Customer Photo 3",
      public_phone_label: "Contact Phone",
      direct_whatsapp_label: "Orders WhatsApp",
      whatsapp_placeholder: "Number without spaces...",
      local_address_label: "Physical Address",
      address_placeholder: "Street, City, State...",
      facebook_link_label: "Facebook Link",
      instagram_link_label: "Instagram Link",
      min_order_label: "Minimum Purchase ($)",
      subscribers_list_title: "Subscriber List",
      campaign_history_title: "Newsletter History",
      table_opens: "Reads",
      campaign_create_button: "Create Campaign",
      status_sent: "Sent",
      status_scheduled: "Pending",
      label_readers: "Readers",
      no_campaigns_message: "No campaigns configured yet.",
      subscribers_list_desc: (count: number) => `You have ${count} people registered to receive your offers.`,
      export_csv_button: "Download List (CSV)",
      email_title: "Professional Email Connection",
      email_subtitle: "Use your own account so customers trust your emails more.",
      email_status_connected: "Connected",
      email_status_disconnected: "Disconnected",
      email_provider_label: "Email Provider",
      email_provider_placeholder: "Select a provider",
      email_provider_none: "None",
      email_provider_sendgrid: "SendGrid",
      email_provider_mailgun: "Mailgun",
      email_provider_smtp: "SMTP Server",
      email_apikey_label: "API Key / Password",
      email_apikey_placeholder: "Enter the API key",
      email_sender_name_label: "Sender Name",
      email_sender_name_placeholder: "Ex: Doña Rosa Fruits",
      email_reply_to_label: "Reply-to Email",
      email_reply_to_placeholder: "example@email.com",
      email_how_to_title: "How to configure",
      email_step_1: "Get an <b>API Key</b> from your provider.",
      email_step_2: "Verify your <b>domain</b> in the provider's dashboard.",
      email_step_3: "Paste the key here and complete the info.",
      email_step_4: "Save changes to activate the service.",
      email_guide_button: "View Step-by-Step Guide",
      email_info_card: "MercaFlow uses this data to send automatic notifications and newsletters on behalf of your company.",
      payments_title: "Direct Collection & Payments",
      payments_subtitle: "Configure your Stripe or PayPal account to receive the money from your sales.",
      payments_status_enabled: "Gateway Active",
      payments_status_disabled: "Gateway Inactive",
      payments_provider_label: "Payment Provider",
      payments_provider_placeholder: "Select a provider",
      payments_provider_stripe: "Stripe",
      payments_provider_paypal: "PayPal",
      payments_mode_label: "Mode",
      payments_mode_test: "Testing (Test)",
      payments_mode_live: "Production (Live)",
      payments_public_key_label: "Publishable Key",
      payments_secret_key_label: "Secret Key",
      payments_webhook_label: "Webhook Secret",
      payments_currency_label: "Currency",
      dialog_campaign_title: "New Campaign",
      dialog_campaign_desc: "Describe the details of your new marketing campaign.",
      dialog_campaign_subject_label: "Email Subject",
      dialog_campaign_subject_placeholder: "Ex: Weekend Super Offer!",
      dialog_campaign_message_label: "Message Body",
      dialog_campaign_message_placeholder: "Describe your offer here...",
      dialog_campaign_pdf_label: "PDF Catalog URL",
      dialog_campaign_pdf_placeholder: "https://yourdomain.com/catalog.pdf",
      dialog_campaign_date_label: "Send Date",
      dialog_campaign_date_placeholder: "Select a date",
      dialog_campaign_submit_button: "Create Campaign",
      select_org_message: "Please select an organization to manage the store.",
      toast_save_success_title: "Saved",
      toast_save_success_desc: "Settings saved successfully.",
      toast_save_error_title: "Error",
      toast_save_error_desc: "There was an error saving.",
      toast_category_deleted: "Campaign deleted",
      confirm_delete_category: "Are you sure you want to delete this campaign?",
      cancel: "Cancel"
    }
  };

  const l = (locale === 'es' ? labels.es : labels.en) as any;

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('images'); 
  
  // Newsletter Logic
  const { subscribers, loading: subsLoading } = useNewsletterSubscribers(activeOrgId);
  const { newsletters, loading: newsLoading } = useNewsletters(activeOrgId);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());

  const isRetailer = activeOrg?.type === 'retailer';

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
    logoUrl: '',
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    provider: 'none',
    apiKey: '',
    senderName: '',
    senderEmail: '',
    replyTo: '',
    verified: false,
  });

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    provider: 'none',
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    currency: 'USD',
    mode: 'test',
    enabled: false,
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
        logoUrl: activeOrg.storeConfig?.logoUrl || '',
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

      if (activeOrg.storeConfig?.paymentConfig) {
        setPaymentConfig(activeOrg.storeConfig.paymentConfig);
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
        logoUrl: formData.logoUrl,
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
        paymentConfig: paymentConfig,
      };

      await updateOrganization(activeOrgId, {
        storeConfig: newConfig,
        address: formData.contactAddress,
        phone: formData.contactPhone,
      });
      toast({ title: l.toast_save_success_title, description: l.toast_save_success_desc });
    } catch (e) {
      toast({ variant: "destructive", title: l.toast_save_error_title, description: l.toast_save_error_desc });
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
      toast({ title: l.dialog_campaign_title, description: l.toast_save_success_desc });
      setIsNewCampaignOpen(false);
      setCampaignForm({ subject: '', message: '', pdfUrl: '' });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error" });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (confirm(l.confirm_delete_category)) {
      try {
        await deleteNewsletter(id);
        toast({ title: l.toast_category_deleted });
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
    toast({ title: l.toast_link_copied_title, description: l.toast_link_copied_desc });
  };

  if (!activeOrg) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {l.select_org_message}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-6xl mx-auto">
      <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{l.dialog_campaign_title}</DialogTitle>
            <DialogDescription>{l.dialog_campaign_desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{l.dialog_campaign_subject_label}</Label>
              <Input 
                placeholder={l.dialog_campaign_subject_placeholder} 
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm(prev => ({...prev, subject: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label>{l.dialog_campaign_message_label}</Label>
              <Textarea 
                placeholder={l.dialog_campaign_message_placeholder} 
                className="min-h-[120px]"
                value={campaignForm.message}
                onChange={(e) => setCampaignForm(prev => ({...prev, message: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label>{l.dialog_campaign_pdf_label}</Label>
              <div className="relative">
                <FileDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={l.dialog_campaign_pdf_placeholder} 
                  className="pl-9"
                  value={campaignForm.pdfUrl}
                  onChange={(e) => setCampaignForm(prev => ({...prev, pdfUrl: e.target.value}))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{l.dialog_campaign_date_label}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-11">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP", { locale: locale === 'es' ? es : undefined }) : l.dialog_campaign_date_placeholder}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewCampaignOpen(false)}>{l.cancel}</Button>
            <Button onClick={handleCreateCampaign} disabled={isCreatingCampaign || !campaignForm.subject || !campaignForm.message}>
              {isCreatingCampaign ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {l.dialog_campaign_submit_button}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Fingerprint className="text-primary h-8 w-8" />
            {l.identity_hub_title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{l.identity_hub_subtitle}</p>
        </div>
        <div className="flex gap-2">
            {isRetailer && (
              <Button variant="outline" onClick={() => window.open(storeUrl, '_blank')} className="h-11">
                  <ExternalLink className="mr-2 h-4 w-4" /> {l.preview_button}
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving} className="h-11 px-8 font-bold shadow-lg">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                {isSaving ? l.publishing : l.publish_button}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-900 text-white overflow-hidden border-none shadow-xl">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">{l.site_status_label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isRetailer ? (
                      <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                          <span className="text-sm font-semibold">{formData.enabled ? l.site_active : l.site_maintenance}</span>
                          <Switch 
                              checked={formData.enabled} 
                              onCheckedChange={(val) => setFormData(prev => ({...prev, enabled: val}))} 
                          />
                      </div>
                    ) : (
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-semibold">Perfil de Red Activo</span>
                      </div>
                    )}
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 space-y-2">
                        <p className="text-[10px] uppercase font-bold text-primary tracking-widest">{l.public_link_label}</p>
                        <p className="text-xs font-mono break-all opacity-80">{storeUrl}</p>
                        <Button variant="link" onClick={copyUrl} className="text-white p-0 h-auto text-xs hover:text-primary">
                            <Copy className="h-3 w-3 mr-1" /> {l.copy_link}
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
                    <ImageIcon className="mr-3 h-4 w-4" /> {l.tab_branding}
                </Button>
                <Button 
                    variant={activeTab === 'contact' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start h-12 rounded-xl"
                    onClick={() => setActiveTab('contact')}
                >
                    <Share2 className="mr-3 h-4 w-4" /> {l.tab_contact}
                </Button>
                {isRetailer && (
                  <>
                    <Button 
                        variant={activeTab === 'marketing' ? 'secondary' : 'ghost'} 
                        className="w-full justify-start h-12 rounded-xl"
                        onClick={() => setActiveTab('marketing')}
                    >
                        <MailQuestion className="mr-3 h-4 w-4" /> {l.tab_marketing}
                    </Button>
                    <Button 
                        variant={activeTab === 'email' ? 'secondary' : 'ghost'} 
                        className="w-full justify-start h-12 rounded-xl"
                        onClick={() => setActiveTab('email')}
                    >
                        <MailCheck className="mr-3 h-4 w-4" /> {l.tab_email}
                    </Button>
                    <Button 
                        variant={activeTab === 'payments' ? 'secondary' : 'ghost'} 
                        className="w-full justify-start h-12 rounded-xl"
                        onClick={() => setActiveTab('payments')}
                    >
                        <CreditCard className="mr-3 h-4 w-4" /> {l.tab_payments}
                    </Button>
                  </>
                )}
            </div>
        </div>

        <div className="lg:col-span-3">
            <Card className="border-none shadow-md overflow-hidden">
                <CardContent className="p-6 md:p-8">
                    {activeTab === 'images' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-primary border-b pb-2"><ImageIcon className="h-4 w-4"/> {l.main_logo_title}</h3>
                                <div className="grid md:grid-cols-3 gap-6 items-center">
                                  <div className="md:col-span-2 space-y-2">
                                      <Label className="text-xs font-semibold">{l.logo_url_label}</Label>
                                      <Input 
                                          value={formData.logoUrl} 
                                          onChange={(e) => setFormData(prev => ({...prev, logoUrl: e.target.value}))}
                                          placeholder="https://miweb.com/logo.png"
                                          className="bg-slate-50 h-11"
                                      />
                                      <p className="text-[10px] text-muted-foreground">
                                          {l.logo_hint}
                                          <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold ml-1">
                                            {l.logo_hint_action}
                                          </a>
                                          {l.logo_hint_suffix}
                                      </p>
                                  </div>
                                  <div className="h-24 w-24 bg-slate-50 border-2 border-dashed rounded-2xl flex items-center justify-center overflow-hidden mx-auto">
                                    {formData.logoUrl ? (
                                      <img src={formData.logoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                                    ) : (
                                      <ImageIcon className="h-8 w-8 text-slate-200" />
                                    )}
                                  </div>
                                </div>
                            </div>

                            {isRetailer && (
                              <>
                                <div className="space-y-4">
                                    <h3 className="font-bold flex items-center gap-2 text-primary border-b pb-2"><ImageIcon className="h-4 w-4"/> {l.main_images_title}</h3>
                                    <div className="grid gap-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-semibold">{l.hero_image_label}</Label>
                                            <span className="text-[10px] text-muted-foreground font-medium">{l.size_hint_hero}</span>
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
                                        <h3 className="font-bold flex items-center gap-2 text-primary"><ShoppingBag className="h-4 w-4"/> {l.category_images_title}</h3>
                                        <span className="text-[10px] text-muted-foreground font-medium">{l.size_hint_category}</span>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">{l.fruits_label}</Label>
                                            <Input 
                                                value={formData.fruitsImage} 
                                                onChange={(e) => setFormData(prev => ({...prev, fruitsImage: e.target.value}))}
                                                placeholder={l.url_placeholder}
                                                className="bg-slate-50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">{l.vegetables_label}</Label>
                                            <Input 
                                                value={formData.veggiesImage} 
                                                onChange={(e) => setFormData(prev => ({...prev, veggiesImage: e.target.value}))}
                                                placeholder={l.url_placeholder}
                                                className="bg-slate-50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">{l.groceries_label}</Label>
                                            <Input 
                                                value={formData.groceriesImage} 
                                                onChange={(e) => setFormData(prev => ({...prev, groceriesImage: e.target.value}))}
                                                placeholder={l.url_placeholder}
                                                className="bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b pb-2">
                                        <h3 className="font-bold flex items-center gap-2 text-primary"><Users className="h-4 w-4"/> {l.testimonial_images_title}</h3>
                                        <span className="text-[10px] text-muted-foreground font-medium">{l.size_hint_category}</span>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">{l.avatar_label_1}</Label>
                                            <Input 
                                                value={formData.testi1Image} 
                                                onChange={(e) => setFormData(prev => ({...prev, testi1Image: e.target.value}))}
                                                placeholder={l.url_placeholder}
                                                className="bg-slate-50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">{l.avatar_label_2}</Label>
                                            <Input 
                                                value={formData.testi2Image} 
                                                onChange={(e) => setFormData(prev => ({...prev, testi2Image: e.target.value}))}
                                                placeholder={l.url_placeholder}
                                                className="bg-slate-50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">{l.avatar_label_3}</Label>
                                            <Input 
                                                value={formData.testi3Image} 
                                                onChange={(e) => setFormData(prev => ({...prev, testi3Image: e.target.value}))}
                                                placeholder={l.url_placeholder}
                                                className="bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                              </>
                            )}
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">{l.public_phone_label}</Label>
                                    <Input 
                                        value={formData.contactPhone} 
                                        onChange={(e) => setFormData(prev => ({...prev, contactPhone: e.target.value}))}
                                        placeholder="+1..."
                                        className="h-12 bg-slate-50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">{l.direct_whatsapp_label}</Label>
                                    <Input 
                                        value={formData.contactWhatsapp} 
                                        onChange={(e) => setFormData(prev => ({...prev, contactWhatsapp: e.target.value}))}
                                        placeholder={l.whatsapp_placeholder}
                                        className="h-12 bg-slate-50"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">{l.local_address_label}</Label>
                                <Input 
                                    value={formData.contactAddress} 
                                    onChange={(e) => setFormData(prev => ({...prev, contactAddress: e.target.value}))}
                                    placeholder={l.address_placeholder}
                                    className="h-12 bg-slate-50"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">{l.facebook_link_label}</Label>
                                    <Input 
                                        value={formData.fbLink} 
                                        onChange={(e) => setFormData(prev => ({...prev, fbLink: e.target.value}))}
                                        placeholder="https://facebook.com/..."
                                        className="h-12 bg-slate-50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">{l.instagram_link_label}</Label>
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

                    {isRetailer && (
                      <>
                        {activeTab === 'marketing' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                                <div className="grid gap-4 max-w-sm mb-8">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">{l.min_order_label}</Label>
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
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{l.subscribers_list_title}</p>
                                    </CardContent>
                                  </Card>
                                  <Card className="bg-blue-50 border-blue-200">
                                    <CardContent className="p-4 text-center">
                                      <Mail className="mx-auto h-6 w-6 text-blue-600 mb-2" />
                                      <p className="text-2xl font-black text-slate-900">{newsLoading ? '...' : newsletters.length}</p>
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{l.campaign_history_title}</p>
                                    </CardContent>
                                  </Card>
                                  <Card className="bg-orange-50 border-orange-200">
                                    <CardContent className="p-4 text-center">
                                      <MousePointer2 className="mx-auto h-6 w-6 text-orange-600 mb-2" />
                                      <p className="text-2xl font-black text-slate-900">
                                        {newsLoading ? '...' : newsletters.reduce((acc, curr) => acc + (curr.opens || 0), 0)}
                                      </p>
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{l.table_opens}</p>
                                    </CardContent>
                                  </Card>
                                </div>

                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h3 className="font-bold flex items-center gap-2 text-slate-800">
                                      <Mail className="h-5 w-5 text-primary" /> {l.campaign_history_title}
                                    </h3>
                                    <Button onClick={() => setIsNewCampaignOpen(true)} size="sm" className="rounded-full shadow-md bg-slate-900 hover:bg-slate-800">
                                      <Plus className="mr-2 h-4 w-4" /> {l.campaign_create_button}
                                    </Button>
                                  </div>

                                  <div className="border rounded-2xl overflow-hidden bg-white">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                          <TableHead className="text-[10px] uppercase font-bold">{l.table_subject_status}</TableHead>
                                          <TableHead className="text-[10px] uppercase font-bold text-center">{l.table_opens}</TableHead>
                                          <TableHead className="text-[10px] uppercase font-bold text-right">{l.table_opens}</TableHead>
                                          <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {newsLoading ? (
                                          <TableRow><TableCell colSpan={4}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                                        ) : newsletters.length > 0 ? (
                                          newsletters.map((news) => (
                                            <TableRow key={news.id} className="hover:bg-slate-50 transition-colors">
                                              <TableCell>
                                                <p className="text-sm font-bold text-slate-800">{news.subject}</p>
                                                <Badge variant="outline" className={cn(
                                                  "text-[9px] uppercase h-4 px-1 border-none",
                                                  news.status === 'sent' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                                )}>
                                                  {news.status === 'sent' ? l.status_sent : l.status_scheduled}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                  <span className="font-black text-slate-900">{news.opens || 0}</span>
                                                  <span className="text-[9px] text-muted-foreground uppercase font-bold">{l.label_readers}</span>
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                  <span className="text-xs font-medium text-slate-600">
                                                    {news.scheduledAt ? format(news.scheduledAt.toDate(), 'dd MMM, HH:mm') : '-'}
                                                  </span>
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
                                              {l.no_campaigns_message}
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
                                    <h3 className="text-xl font-bold">{l.subscribers_list_title}</h3>
                                    <p className="text-muted-foreground max-w-md text-sm">
                                        {l.subscribers_list_desc(subscribers.length)}
                                    </p>
                                    <Button variant="outline" disabled={subscribers.length === 0} className="rounded-xl">
                                      <FileDown className="mr-2 h-4 w-4" /> {l.export_csv_button}
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
                                            {l.email_title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">{l.email_subtitle}</p>
                                    </div>
                                    <Badge className={cn("px-3 py-1", emailConfig.verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                        {emailConfig.verified ? <><ShieldCheck className="h-3 w-3 mr-1" /> {l.email_status_connected}</> : <><AlertTriangle className="h-3 w-3 mr-1" /> {l.email_status_disconnected}</>}
                                    </Badge>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>{l.email_provider_label}</Label>
                                            <Select 
                                                value={emailConfig.provider} 
                                                onValueChange={(val: any) => setEmailConfig(prev => ({...prev, provider: val}))}
                                            >
                                                <SelectTrigger className="h-12 bg-slate-50 rounded-xl">
                                                    <SelectValue placeholder={l.email_provider_placeholder} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">{l.email_provider_none}</SelectItem>
                                                    <SelectItem value="sendgrid">{l.email_provider_sendgrid}</SelectItem>
                                                    <SelectItem value="mailgun">{l.email_provider_mailgun}</SelectItem>
                                                    <SelectItem value="smtp">{l.email_provider_smtp}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{l.email_apikey_label}</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input 
                                                    type="password"
                                                    placeholder={l.email_apikey_placeholder}
                                                    className="h-12 pl-10 bg-slate-50 rounded-xl"
                                                    value={emailConfig.apiKey}
                                                    onChange={(e) => setEmailConfig(prev => ({...prev, apiKey: e.target.value}))}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>{l.email_sender_name_label}</Label>
                                                <Input 
                                                    placeholder={l.email_sender_name_placeholder}
                                                    className="h-12 bg-slate-50 rounded-xl"
                                                    value={emailConfig.senderName}
                                                    onChange={(e) => setEmailConfig(prev => ({...prev, senderName: e.target.value}))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{l.email_reply_to_label}</Label>
                                                <Input 
                                                    placeholder={l.email_reply_to_placeholder}
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
                                                {l.email_how_to_title}
                                        </h4>
                                        <ol className="space-y-4 text-sm text-slate-300 list-decimal pl-4">
                                            <li dangerouslySetInnerHTML={{ __html: l.email_step_1 }}></li>
                                            <li dangerouslySetInnerHTML={{ __html: l.email_step_2 }}></li>
                                            <li dangerouslySetInnerHTML={{ __html: l.email_step_3 }}></li>
                                            <li dangerouslySetInnerHTML={{ __html: l.email_step_4 }}></li>
                                        </ol>
                                        <Button variant="link" className="text-primary p-0 h-auto mt-4 font-bold">
                                            {l.email_guide_button} <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>

                                    <Card className="border-primary/20 bg-primary/5">
                                        <CardContent className="p-4 flex gap-3 items-start">
                                            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: l.email_info_card }}></p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Wallet className="text-primary h-6 w-6" />
                                        {l.payments_title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{l.payments_subtitle}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground uppercase">{paymentConfig.enabled ? l.payments_status_enabled : l.payments_status_disabled}</span>
                                    <Switch 
                                        checked={paymentConfig.enabled} 
                                        onCheckedChange={(val) => setPaymentConfig(prev => ({...prev, enabled: val}))} 
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{l.payments_provider_label}</Label>
                                            <Select 
                                                value={paymentConfig.provider} 
                                                onValueChange={(val: any) => setPaymentConfig(prev => ({...prev, provider: val}))}
                                            >
                                                <SelectTrigger className="h-12 bg-slate-50 rounded-xl">
                                                    <SelectValue placeholder={l.payments_provider_placeholder} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">{l.email_provider_none}</SelectItem>
                                                    <SelectItem value="stripe">{l.payments_provider_stripe}</SelectItem>
                                                    <SelectItem value="paypal">{l.payments_provider_paypal}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{l.payments_mode_label}</Label>
                                            <Select 
                                                value={paymentConfig.mode} 
                                                onValueChange={(val: any) => setPaymentConfig(prev => ({...prev, mode: val}))}
                                            >
                                                <SelectTrigger className="h-12 bg-slate-50 rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="test">{l.payments_mode_test}</SelectItem>
                                                    <SelectItem value="live">{l.payments_mode_live}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{l.payments_public_key_label}</Label>
                                        <div className="relative">
                                            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input 
                                                placeholder="pk_test_..."
                                                className="h-12 pl-10 bg-slate-50 rounded-xl"
                                                value={paymentConfig.publicKey}
                                                onChange={(e) => setPaymentConfig(prev => ({...prev, publicKey: e.target.value}))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{l.payments_secret_key_label}</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input 
                                                type="password"
                                                placeholder="sk_test_..."
                                                className="h-12 pl-10 bg-slate-50 rounded-xl"
                                                value={paymentConfig.secretKey}
                                                onChange={(e) => setPaymentConfig(prev => ({...prev, secretKey: e.target.value}))}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{l.payments_webhook_label}</Label>
                                            <Input 
                                                placeholder="whsec_..."
                                                className="h-12 bg-slate-50 rounded-xl"
                                                value={paymentConfig.webhookSecret}
                                                onChange={(e) => setPaymentConfig(prev => ({...prev, webhookSecret: e.target.value}))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{l.payments_currency_label}</Label>
                                            <Select 
                                                value={paymentConfig.currency} 
                                                onValueChange={(val) => setPaymentConfig(prev => ({...prev, currency: val}))}
                                            >
                                                <SelectTrigger className="h-12 bg-slate-50 rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="USD">USD</SelectItem>
                                                    <SelectItem value="COP">COP</SelectItem>
                                                    <SelectItem value="MXN">MXN</SelectItem>
                                                    <SelectItem value="EUR">EUR</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-6 bg-slate-900 text-white rounded-3xl border shadow-xl">
                                        <h4 className="font-bold flex items-center gap-2 mb-4">
                                            <HelpCircle className="h-4 w-4 text-primary" />
                                            {l.email_how_to_title}
                                        </h4>
                                        <ol className="space-y-4 text-sm text-slate-300 list-decimal pl-4">
                                            <li dangerouslySetInnerHTML={{ __html: l.email_step_1 }}></li>
                                            <li dangerouslySetInnerHTML={{ __html: l.email_step_2 }}></li>
                                            <li dangerouslySetInnerHTML={{ __html: l.email_step_3 }}></li>
                                            <li dangerouslySetInnerHTML={{ __html: l.email_step_4 }}></li>
                                        </ol>
                                        <Button variant="link" className="text-primary p-0 h-auto mt-4 font-bold">
                                            {l.email_guide_button} <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>

                                    <Card className="border-primary/20 bg-primary/5">
                                        <CardContent className="p-4 flex gap-3 items-start">
                                            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                            <p className="text-xs text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: l.email_info_card }}></p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                  </>
                )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
