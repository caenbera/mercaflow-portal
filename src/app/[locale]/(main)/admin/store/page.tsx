
"use client";

import { useState, useEffect } from 'react';
import { useOrganization } from '@/context/organization-context';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, Globe, Copy, ExternalLink, 
  Palette, MessageSquare, Image as ImageIcon, Check, Loader2,
  Type, Layout, Users, Phone, Mail, Share2, MailQuestion
} from 'lucide-react';
import { updateOrganization } from '@/lib/firestore/organizations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function StoreManagementPage() {
  const { activeOrg, activeOrgId } = useOrganization();
  const { toast } = useToast();
  const locale = useLocale();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [formData, setFormData] = useState({
    enabled: false,
    heroTitle: '',
    heroSubtitle: '',
    heroImage: '',
    fruitsImage: '',
    veggiesImage: '',
    groceriesImage: '',
    contactPhone: '',
    contactWhatsapp: '',
    contactAddress: '',
    fbLink: '',
    igLink: '',
    minOrderAmount: 0,
  });

  useEffect(() => {
    if (activeOrg) {
      setFormData({
        enabled: activeOrg.storeConfig?.enabled || false,
        heroTitle: activeOrg.storeConfig?.heroTitle?.es || '',
        heroSubtitle: activeOrg.storeConfig?.heroSubtitle?.es || '',
        heroImage: activeOrg.storeConfig?.heroImage || '',
        fruitsImage: activeOrg.storeConfig?.categoriesImages?.fruits || '',
        veggiesImage: activeOrg.storeConfig?.categoriesImages?.vegetables || '',
        groceriesImage: activeOrg.storeConfig?.categoriesImages?.groceries || '',
        contactPhone: activeOrg.storeConfig?.contactPhone || '',
        contactWhatsapp: activeOrg.storeConfig?.contactWhatsapp || '',
        contactAddress: activeOrg.storeConfig?.contactAddress || activeOrg.address || '',
        fbLink: activeOrg.storeConfig?.socialLinks?.facebook || '',
        igLink: activeOrg.storeConfig?.socialLinks?.instagram || '',
        minOrderAmount: activeOrg.storeConfig?.minOrderAmount || 0,
      });
    }
  }, [activeOrg]);

  const handleSave = async () => {
    if (!activeOrgId) return;
    setIsSaving(true);
    try {
      await updateOrganization(activeOrgId, {
        storeConfig: {
          ...activeOrg?.storeConfig,
          enabled: formData.enabled,
          heroTitle: { es: formData.heroTitle, en: formData.heroTitle },
          heroSubtitle: { es: formData.heroSubtitle, en: formData.heroSubtitle },
          heroImage: formData.heroImage,
          categoriesImages: {
            fruits: formData.fruitsImage,
            vegetables: formData.veggiesImage,
            groceries: formData.groceriesImage,
          },
          contactPhone: formData.contactPhone,
          contactWhatsapp: formData.contactWhatsapp,
          contactAddress: formData.contactAddress,
          socialLinks: {
            facebook: formData.fbLink,
            instagram: formData.igLink,
          },
          minOrderAmount: formData.minOrderAmount,
        }
      });
      toast({ title: "Landing Page actualizada", description: "Los cambios ya son visibles en tu web pública." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la configuración." });
    } finally {
      setIsSaving(false);
    }
  };

  const storeUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/${locale}/store/${activeOrg?.slug}` 
    : '';

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    toast({ title: "Enlace copiado", description: "Ya puedes compartirlo con tus clientes." });
  };

  if (!activeOrg || activeOrg.type !== 'retailer') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Este módulo de Landing Page solo está disponible para edificios de tipo <strong>Minorista / Supermercado</strong>.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Layout className="text-primary h-8 w-8" />
            Constructor de Web Pública
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Personaliza cómo te ven tus clientes en internet sin saber programar.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.open(storeUrl, '_blank')} className="h-11">
                <ExternalLink className="mr-2 h-4 w-4" /> Previsualizar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="h-11 px-8 font-bold shadow-lg">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Publicar Cambios
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR DE OPCIONES */}
        <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-900 text-white overflow-hidden border-none shadow-xl">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">Estado del Sitio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                        <span className="text-sm font-semibold">{formData.enabled ? "Sitio Activo" : "En Mantenimiento"}</span>
                        <Switch 
                            checked={formData.enabled} 
                            onCheckedChange={(val) => setFormData(prev => ({...prev, enabled: val}))} 
                        />
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 space-y-2">
                        <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Enlace Público</p>
                        <p className="text-xs font-mono break-all opacity-80">{storeUrl}</p>
                        <Button variant="link" onClick={copyUrl} className="text-white p-0 h-auto text-xs hover:text-primary">
                            <Copy className="h-3 w-3 mr-1" /> Copiar enlace
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-1">
                <Button 
                    variant={activeTab === 'general' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start h-12 rounded-xl"
                    onClick={() => setActiveTab('general')}
                >
                    <Type className="mr-3 h-4 w-4" /> Cabecera y Textos
                </Button>
                <Button 
                    variant={activeTab === 'images' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start h-12 rounded-xl"
                    onClick={() => setActiveTab('images')}
                >
                    <ImageIcon className="mr-3 h-4 w-4" /> Galería de Fotos
                </Button>
                <Button 
                    variant={activeTab === 'contact' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start h-12 rounded-xl"
                    onClick={() => setActiveTab('contact')}
                >
                    <Share2 className="mr-3 h-4 w-4" /> Contacto y Redes
                </Button>
                <Button 
                    variant={activeTab === 'marketing' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start h-12 rounded-xl"
                    onClick={() => setActiveTab('marketing')}
                >
                    <MailQuestion className="mr-3 h-4 w-4" /> Newsletter
                </Button>
            </div>
        </div>

        {/* AREA DE EDICIÓN */}
        <div className="lg:col-span-3">
            <Card className="border-none shadow-md overflow-hidden">
                <CardContent className="p-6 md:p-8">
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Título Principal (Hero)</Label>
                                <Input 
                                    value={formData.heroTitle} 
                                    onChange={(e) => setFormData(prev => ({...prev, heroTitle: e.target.value}))}
                                    placeholder="Ej: Tu mercado fresco a la puerta de casa"
                                    className="h-12 bg-slate-50 border-slate-200 text-lg font-bold"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Subtítulo Descriptivo</Label>
                                <Textarea 
                                    value={formData.heroSubtitle} 
                                    onChange={(e) => setFormData(prev => ({...prev, heroSubtitle: e.target.value}))}
                                    placeholder="Describe brevemente tu servicio y calidad..."
                                    className="bg-slate-50 border-slate-200 min-h-[100px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Compra Mínima ($)</Label>
                                    <Input 
                                        type="number" 
                                        value={formData.minOrderAmount} 
                                        onChange={(e) => setFormData(prev => ({...prev, minOrderAmount: parseFloat(e.target.value)}))}
                                        className="h-12 bg-slate-50"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'images' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-primary border-b pb-2"><ImageIcon className="h-4 w-4"/> Imágenes Principales</h3>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-semibold">URL Foto del Hero (Portada)</Label>
                                        <Input 
                                            value={formData.heroImage} 
                                            onChange={(e) => setFormData(prev => ({...prev, heroImage: e.target.value}))}
                                            placeholder="https://..."
                                            className="bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold flex items-center gap-2 text-primary border-b pb-2"><ShoppingBag className="h-4 w-4"/> Imágenes de Categorías</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Frutas</Label>
                                        <Input 
                                            value={formData.fruitsImage} 
                                            onChange={(e) => setFormData(prev => ({...prev, fruitsImage: e.target.value}))}
                                            placeholder="URL..."
                                            className="bg-slate-50"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Verduras</Label>
                                        <Input 
                                            value={formData.veggiesImage} 
                                            onChange={(e) => setFormData(prev => ({...prev, veggiesImage: e.target.value}))}
                                            placeholder="URL..."
                                            className="bg-slate-50"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Abarrotes</Label>
                                        <Input 
                                            value={formData.groceriesImage} 
                                            onChange={(e) => setFormData(prev => ({...prev, groceriesImage: e.target.value}))}
                                            placeholder="URL..."
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
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Teléfono Público</Label>
                                    <Input 
                                        value={formData.contactPhone} 
                                        onChange={(e) => setFormData(prev => ({...prev, contactPhone: e.target.value}))}
                                        placeholder="+1..."
                                        className="h-12 bg-slate-50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">WhatsApp Directo</Label>
                                    <Input 
                                        value={formData.contactWhatsapp} 
                                        onChange={(e) => setFormData(prev => ({...prev, contactWhatsapp: e.target.value}))}
                                        placeholder="Número sin espacios..."
                                        className="h-12 bg-slate-50"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Dirección Local</Label>
                                <Input 
                                    value={formData.contactAddress} 
                                    onChange={(e) => setFormData(prev => ({...prev, contactAddress: e.target.value}))}
                                    placeholder="Calle, Ciudad, Estado..."
                                    className="h-12 bg-slate-50"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Link Facebook</Label>
                                    <Input 
                                        value={formData.fbLink} 
                                        onChange={(e) => setFormData(prev => ({...prev, fbLink: e.target.value}))}
                                        placeholder="https://facebook.com/..."
                                        className="h-12 bg-slate-50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Link Instagram</Label>
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
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="p-8 border-2 border-dashed rounded-[30px] flex flex-col items-center text-center gap-4 bg-slate-50">
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                    <MailQuestion className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold">Gestión de Suscriptores</h3>
                                <p className="text-muted-foreground max-w-md text-sm">
                                    Próximamente podrás ver y descargar la lista de correos de clientes que se inscribieron a tu newsletter desde la web pública.
                                </p>
                                <Badge variant="secondary" className="px-4 py-1">Función en Desarrollo</Badge>
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

function Search({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}

function MailQuestion({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h7"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      <path d="M18 15.28c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2"/>
      <path d="M20 22v.01"/>
    </svg>
  );
}
