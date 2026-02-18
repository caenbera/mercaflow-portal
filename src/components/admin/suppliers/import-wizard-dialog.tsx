
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { addProduct } from '@/lib/firestore/products';
import { useOrganization } from '@/context/organization-context';
import type { Product, Supplier } from '@/types';
import { Check, Loader2, ArrowRight, Info, Calculator, Percent, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remoteProducts: Product[];
  supplier: Supplier;
  onSuccess: () => void;
}

export function ImportWizardDialog({ open, onOpenChange, remoteProducts, supplier, onSuccess }: ImportWizardDialogProps) {
  const t = useTranslations('SuppliersPage');
  const locale = useLocale() as 'es' | 'en';
  const { toast } = useToast();
  const { activeOrgId } = useOrganization();

  const [isLoading, setIsLoading] = useState(false);
  const [percentageValue, setPercentageValue] = useState('');
  const [pricingMethod, setPricingMethod] = useState<'margin' | 'markup'>('margin');
  
  const isBulk = remoteProducts.length > 1;

  useEffect(() => {
    if (open) {
      setPercentageValue('');
    }
  }, [open]);

  const handleImport = async () => {
    if (remoteProducts.length === 0 || !activeOrgId || !percentageValue) return;

    const val = parseFloat(percentageValue);
    if (isNaN(val)) return;

    setIsLoading(true);
    try {
      let count = 0;
      for (const remote of remoteProducts) {
        const cost = remote.salePrice;
        let calculatedSalePrice = 0;

        if (pricingMethod === 'margin') {
          if (val < 100) calculatedSalePrice = cost / (1 - (val / 100));
        } else {
          calculatedSalePrice = cost * (1 + (val / 100));
        }

        if (calculatedSalePrice > 0) {
          await addProduct({
            sku: remote.sku,
            organizationId: activeOrgId,
            name: remote.name,
            category: remote.category,
            subcategory: remote.subcategory,
            unit: remote.unit,
            photoUrl: remote.photoUrl,
            salePrice: parseFloat(calculatedSalePrice.toFixed(2)),
            stock: 0,
            minStock: 10,
            active: true,
            isBox: remote.isBox,
            pricingMethod: pricingMethod,
            calculationDirection: 'costToPrice',
            suppliers: [
              {
                supplierId: supplier.id,
                cost: cost,
                isPrimary: true,
                supplierProductName: remote.name.es
              }
            ]
          });
          count++;
        }
      }
      
      toast({ 
        title: isBulk ? "Importación Masiva Exitosa" : "Producto Importado", 
        description: isBulk ? `Se han añadido ${count} productos a tu catálogo.` : `${remoteProducts[0].name.es} añadido con éxito.` 
      });
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error al importar" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="p-6 bg-slate-900 text-white">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            {isBulk ? 'Estrategia de Precios Masiva' : 'Configurar Precio de Venta'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isBulk 
              ? `Define el margen para los ${remoteProducts.length} productos seleccionados.` 
              : `Configura tu precio para ${remoteProducts[0]?.name[locale]}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {!isBulk && remoteProducts[0] && (
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 border bg-white">
                <Image src={remoteProducts[0].photoUrl || '/placeholder.svg'} alt="Product" width={64} height={64} className="object-cover h-full w-full" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Costo del Proveedor</p>
                <p className="text-2xl font-black text-slate-900">{formatCurrency(remoteProducts[0].salePrice)}</p>
              </div>
            </div>
          )}

          {isBulk && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Lote de {remoteProducts.length} productos</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Importación desde: {supplier.name}</p>
                </div>
              </div>
              <ScrollArea className="h-24 pr-2">
                <div className="flex flex-wrap gap-1.5">
                  {remoteProducts.map(p => (
                    <Badge key={p.sku} variant="secondary" className="text-[10px] py-0 px-1.5 bg-white border font-normal">
                      {p.name[locale]}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-xl bg-white shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-500 uppercase">Estrategia Global</Label>
                <p className="text-[10px] text-muted-foreground">¿Margen sobre venta o recargo sobre costo?</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-bold", pricingMethod === 'margin' ? 'text-primary' : 'text-muted-foreground')}>MARGEN</span>
                <Switch 
                  checked={pricingMethod === 'markup'} 
                  onCheckedChange={(val) => setPricingMethod(val ? 'markup' : 'margin')} 
                />
                <span className={cn("text-[10px] font-bold", pricingMethod === 'markup' ? 'text-primary' : 'text-muted-foreground')}>RECARGO</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Introduce el {pricingMethod === 'margin' ? 'Margen' : 'Recargo'} para el lote (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="number"
                  placeholder="Ej: 30"
                  className="h-12 pl-10 text-lg font-bold border-2 focus:border-primary"
                  value={percentageValue}
                  onChange={(e) => setPercentageValue(e.target.value)}
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-[10px] text-blue-800 leading-relaxed">
                Esta configuración se aplicará a todos los productos seleccionados. Podrás ajustar precios individuales más tarde desde tu inventario.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancelar</Button>
          <Button 
            disabled={isLoading || !percentageValue} 
            onClick={handleImport}
            className="rounded-xl h-12 px-8 font-bold shadow-lg"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Confirmar e Importar {isBulk ? `(${remoteProducts.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
