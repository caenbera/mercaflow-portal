
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
import { 
  ShoppingBag, Globe, Copy, ExternalLink, 
  Palette, MessageSquare, Image as ImageIcon, Check, Loader2 
} from 'lucide-react';
import { updateOrganization } from '@/lib/firestore/organizations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function StoreManagementPage() {
  const { activeOrg, activeOrgId } = useOrganization();
  const { toast } = useToast();
  const locale = useLocale();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    enabled: false,
    welcomeMessage: '',
    logoUrl: '',
    minOrderAmount: 0,
  });

  useEffect(() => {
    if (activeOrg) {
      setFormData({
        enabled: activeOrg.storeConfig?.enabled || false,
        welcomeMessage: activeOrg.storeConfig?.welcomeMessage?.es || '',
        logoUrl: activeOrg.storeConfig?.logoUrl || '',
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
          welcomeMessage: { es: formData.welcomeMessage, en: formData.welcomeMessage },
          logoUrl: formData.logoUrl,
          minOrderAmount: formData.minOrderAmount,
        }
      });
      toast({ title: "Configuración guardada", description: "Tu tienda ha sido actualizada." });
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
        Este módulo solo está disponible para edificios de tipo <strong>Minorista / Supermercado</strong>.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
          <Globe className="text-primary" />
          Mi Tienda Online B2C
        </h1>
        <p className="text-muted-foreground">Activa y personaliza la web pública para tus clientes del barrio.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* ESTADO DE TIENDA */}
          <Card className={cn("border-2 transition-all", formData.enabled ? "border-primary/20 bg-primary/5" : "border-slate-200")}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", formData.enabled ? "bg-primary text-white" : "bg-slate-200 text-slate-500")}>
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">Estatus de la Tienda</h3>
                    <p className="text-sm text-muted-foreground">
                      {formData.enabled ? "Tu tienda es visible en internet." : "La tienda está en mantenimiento."}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={formData.enabled} 
                  onCheckedChange={(val) => setFormData(prev => ({...prev, enabled: val}))} 
                />
              </div>
            </CardContent>
          </Card>

          {/* CONFIGURACIÓN VISUAL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Personalización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>URL del Logo</Label>
                  <Input 
                    placeholder="https://..." 
                    value={formData.logoUrl} 
                    onChange={(e) => setFormData(prev => ({...prev, logoUrl: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pedido Mínimo ($)</Label>
                  <Input 
                    type="number" 
                    value={formData.minOrderAmount} 
                    onChange={(e) => setFormData(prev => ({...prev, minOrderAmount: parseFloat(e.target.value)}))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mensaje de Bienvenida</Label>
                <Textarea 
                  placeholder="¡Haz tu pedido y te lo llevamos a casa!" 
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData(prev => ({...prev, welcomeMessage: e.target.value}))}
                />
              </div>
              <div className="pt-4 border-t flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PREVIEW Y ENLACE */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 text-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm">Enlace Público</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-white/10 rounded-lg border border-white/20 font-mono text-xs break-all">
                {storeUrl}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={copyUrl}>
                  <Copy className="h-4 w-4 mr-2" /> Copiar
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent text-white border-white/20 hover:bg-white/10" asChild>
                  <a href={storeUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> Ver
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm">Tu inventario es tu tienda</h4>
            <p className="text-xs text-muted-foreground">
              Solo los productos marcados como <strong>Activos</strong> en tu catálogo interno aparecerán en la tienda online.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
