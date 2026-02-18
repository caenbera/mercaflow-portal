
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
import { useToast } from '@/hooks/use-toast';
import { addProduct } from '@/lib/firestore/products';
import { useOrganization } from '@/context/organization-context';
import type { Product, Supplier } from '@/types';
import { Check, Loader2, ArrowRight, Info, Calculator, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remoteProduct: Product | null;
  supplier: Supplier;
  onSuccess: () => void;
}

export function ImportWizardDialog({ open, onOpenChange, remoteProduct, supplier, onSuccess }: ImportWizardDialogProps) {
  const t = useTranslations('SuppliersPage');
  const tp = useTranslations('ProductsPage');
  const locale = useLocale() as 'es' | 'en';
  const { toast } = useToast();
  const { activeOrgId } = useOrganization();

  const [isLoading, setIsLoading] = useState(false);
  const [percentageValue, setPercentageValue] = useState('');
  const [pricingMethod, setPricingMethod] = useState<'margin' | 'markup'>('margin');
  const [calculationDirection, setCalculationDirection] = useState<'costToPrice' | 'priceToCost'>('costToPrice');

  const cost = remoteProduct?.salePrice || 0;

  const calculatedSalePrice = useMemo(() => {
    const val = parseFloat(percentageValue);
    if (isNaN(val) || val === 0) return 0;

    if (calculationDirection === 'costToPrice') {
      if (pricingMethod === 'margin') {
        if (val >= 100) return 0;
        return cost / (1 - (val / 100));
      } else {
        return cost * (1 + (val / 100));
      }
    } else {
      // Si calculamos desde precio de venta, el input representa el precio final
      // Pero el usuario quiere poner un porcentaje, así que en este wizard
      // el input siempre es el porcentaje deseado sobre el costo o margen.
      // Si la dirección es priceToCost, el costo se ajustaría, pero al importar
      // el costo es FIJO (lo pone el proveedor). Por tanto, forzamos costToPrice.
      return 0; 
    }
  }, [cost, percentageValue, pricingMethod, calculationDirection]);

  // Forzamos costToPrice en la importación inicial porque el costo es el dato dado por el proveedor
  useEffect(() => {
    if (open) {
      setPercentageValue('');
      setCalculationDirection('costToPrice');
    }
  }, [open]);

  const handleImport = async () => {
    if (!remoteProduct || !activeOrgId || !calculatedSalePrice) return;

    setIsLoading(true);
    try {
      await addProduct({
        sku: remoteProduct.sku,
        organizationId: activeOrgId,
        name: remoteProduct.name,
        category: remoteProduct.category,
        subcategory: remoteProduct.subcategory,
        unit: remoteProduct.unit,
        photoUrl: remoteProduct.photoUrl,
        salePrice: parseFloat(calculatedSalePrice.toFixed(2)),
        stock: 0,
        minStock: 10,
        active: true,
        isBox: remoteProduct.isBox,
        pricingMethod: pricingMethod,
        calculationDirection: calculationDirection,
        suppliers: [
          {
            supplierId: supplier.id,
            cost: remoteProduct.salePrice,
            isPrimary: true,
            supplierProductName: remoteProduct.name.es
          }
        ]
      });
      toast({ title: "Producto Importado", description: `${remoteProduct.name.es} añadido con éxito.` });
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error al importar" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  if (!remoteProduct) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="p-6 bg-slate-900 text-white">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Configurar Precio de Venta
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Define cómo quieres calcular tu precio para <strong>{remoteProduct.name[locale]}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 border bg-white">
              <Image src={remoteProduct.photoUrl || '/placeholder.svg'} alt="Product" width={64} height={64} className="object-cover h-full w-full" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Costo del Proveedor</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(cost)}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Toggles de Lógica */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 border rounded-xl bg-white shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Método de Cálculo</Label>
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

              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50 opacity-60">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Dirección</Label>
                  <p className="text-[10px] text-muted-foreground">Fijado: Calcular desde Costo</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">COSTO → PRECIO</Badge>
              </div>
            </div>

            {/* Input de Porcentaje */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Introduce el {pricingMethod === 'margin' ? 'Margen' : 'Recargo'} deseado</Label>
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

            {/* Previsualización del Resultado */}
            {calculatedSalePrice > 0 && (
              <div className="p-4 rounded-2xl bg-green-50 border-2 border-green-100 flex items-center justify-between animate-in zoom-in-95 duration-200">
                <div>
                  <p className="text-[10px] uppercase font-bold text-green-600 tracking-widest">Precio de Venta Sugerido</p>
                  <p className="text-3xl font-black text-green-700">{formatCurrency(calculatedSalePrice)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-green-600 uppercase">Tu Ganancia</p>
                  <p className="font-bold text-green-700">+{formatCurrency(calculatedSalePrice - cost)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancelar</Button>
          <Button 
            disabled={isLoading || !calculatedSalePrice} 
            onClick={handleImport}
            className="rounded-xl h-12 px-8 font-bold shadow-lg"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Confirmar e Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
