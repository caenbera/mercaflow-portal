"use client";

import React, { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUsers } from '@/hooks/use-users';
import { useProducts } from '@/hooks/use-products';
import { usePriceLists } from '@/hooks/use-pricelists';
import { addOrder } from '@/lib/firestore/orders';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/context/organization-context';
import { 
  Search, 
  User, 
  ShoppingCart, 
  Calendar as CalendarIcon, 
  Plus, 
  Minus, 
  ChevronRight, 
  Loader2,
  Trash2
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { calculateDiscount } from '@/lib/pricing';
import Image from 'next/image';
import { Timestamp } from 'firebase/firestore';

interface ManualOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualOrderDialog({ open, onOpenChange }: ManualOrderDialogProps) {
  const locale = useLocale() as 'es' | 'en';
  const { toast } = useToast();
  const { activeOrgId } = useOrganization();
  
  const { users: clients, loading: clientsLoading } = useUsers();
  const { products, loading: productsLoading } = useProducts();
  const { priceLists } = usePriceLists();

  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [deliveryDate, setDeliveryDate] = useState<Date>(addDays(new Date(), 1));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Textos estáticos para evitar errores de traducción faltante
  const labels = {
    title: locale === 'es' ? "Crear Pedido Manual" : "Create Manual Order",
    step1: locale === 'es' ? "Cliente" : "Customer",
    step2: locale === 'es' ? "Productos" : "Products",
    step3: locale === 'es' ? "Confirmación" : "Confirmation",
    searchClient: locale === 'es' ? "Buscar cliente por nombre..." : "Search customer by name...",
    searchProduct: locale === 'es' ? "Buscar producto..." : "Search product...",
    deliveryDate: locale === 'es' ? "Fecha de entrega" : "Delivery date",
    summary: locale === 'es' ? "Resumen del Pedido" : "Order Summary",
    subtotal: locale === 'es' ? "Subtotal" : "Subtotal",
    discount: locale === 'es' ? "Descuento aplicado" : "Discount applied",
    total: locale === 'es' ? "Total" : "Total",
    cancel: locale === 'es' ? "Cancelar" : "Cancel",
    back: locale === 'es' ? "Atrás" : "Back",
    next: locale === 'es' ? "Siguiente" : "Next",
    finish: locale === 'es' ? "Crear Pedido" : "Create Order",
    creating: locale === 'es' ? "Creando..." : "Creating...",
    orderNotes: locale === 'es' ? "Notas del pedido" : "Order Notes",
    notesPlaceholder: locale === 'es' ? "Instrucciones especiales..." : "Special instructions..."
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name[locale].toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch, locale]);

  const cartResumen = useMemo(() => {
    if (!selectedClient) return { items: [], subtotal: 0, discount: 0, total: 0 };
    
    const clientPriceList = priceLists.find(pl => pl.name === selectedClient.priceList) || null;
    let subtotal = 0;
    let discount = 0;
    const items: any[] = [];

    Object.entries(cart).forEach(([id, qty]) => {
      const product = products.find(p => p.id === id);
      if (product) {
        const { finalPrice, discount: unitDiscount } = calculateDiscount(product, clientPriceList);
        subtotal += product.salePrice * qty;
        discount += unitDiscount * qty;
        items.push({
          ...product,
          quantity: qty,
          calculatedPrice: finalPrice
        });
      }
    });

    return { items, subtotal, discount, total: subtotal - discount };
  }, [cart, selectedClient, products, priceLists, locale]);

  const handleAddToCart = (id: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const handleCreateOrder = async () => {
    if (!selectedClient || !activeOrgId) return;
    setIsSubmitting(true);
    try {
      await addOrder({
        organizationId: activeOrgId,
        userId: selectedClient.uid,
        businessName: selectedClient.businessName,
        items: cartResumen.items.map(i => ({
          productId: i.id,
          productName: i.name,
          quantity: i.quantity,
          price: i.calculatedPrice,
          isBox: i.isBox
        })),
        total: cartResumen.total,
        status: 'pending',
        shippingAddress: selectedClient.address,
        discountApplied: cartResumen.discount,
        notes: { general: notes },
        deliveryDate: Timestamp.fromDate(deliveryDate)
      });

      toast({ title: "Pedido creado", description: "El pedido manual ha sido registrado con éxito." });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "No se pudo crear el pedido." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedClient(null);
    setCart({});
    setNotes('');
    setSearchTerm('');
    setProductSearch('');
  };

  const formatPrice = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        <DialogHeader className="p-6 bg-slate-900 text-white">
          <DialogTitle className="text-xl flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {labels.title}
          </DialogTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-widest", step >= 1 ? "text-primary" : "text-slate-500")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center border-2", step >= 1 ? "border-primary bg-primary text-white" : "border-slate-500 text-slate-500")}>1</span>
              {labels.step1}
            </div>
            <div className="h-px w-8 bg-slate-700" />
            <div className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-widest", step >= 2 ? "text-primary" : "text-slate-500")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center border-2", step >= 2 ? "border-primary bg-primary text-white" : "border-slate-500 text-slate-500")}>2</span>
              {labels.step2}
            </div>
            <div className="h-px w-8 bg-slate-700" />
            <div className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-widest", step >= 3 ? "text-primary" : "text-slate-500")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center border-2", step >= 3 ? "border-primary bg-primary text-white" : "border-slate-500 text-slate-500")}>3</span>
              {labels.step3}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-6 bg-white">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={labels.searchClient} 
                  className="pl-9 bg-slate-50 border-none h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                {clientsLoading ? <Loader2 className="animate-spin mx-auto" /> : 
                  filteredClients.map(client => (
                    <div 
                      key={client.uid} 
                      onClick={() => { setSelectedClient(client); setStep(2); }}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 hover:border-primary/50",
                        selectedClient?.uid === client.uid ? "border-primary bg-primary/5" : "border-slate-100 bg-slate-50"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase">
                        {client.businessName.substring(0, 2)}
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-slate-800">{client.businessName}</p>
                        <p className="text-xs text-slate-500">{client.contactPerson} • {client.address}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between mb-4 bg-slate-900 text-white p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">{selectedClient?.businessName}</span>
                </div>
                <Badge className="bg-primary/20 text-primary border-none text-[10px]">
                  LISTA: {selectedClient?.priceList || 'GENERAL'}
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={labels.searchProduct} 
                  className="pl-9 bg-slate-50 border-none h-11"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                {productsLoading ? <Loader2 className="animate-spin mx-auto" /> : 
                  filteredProducts.map(product => (
                    <div key={product.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-slate-200 overflow-hidden relative border border-slate-200">
                        <Image src={product.photoUrl || 'https://via.placeholder.com/80'} alt="" fill className="object-cover" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">{product.name[locale]}</p>
                        <p className="text-xs text-primary font-bold">
                          {formatPrice(calculateDiscount(product, priceLists.find(pl => pl.name === selectedClient.priceList) || null).finalPrice)} 
                          <span className="text-slate-400 font-normal line-through ml-1">{formatPrice(product.salePrice)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-full p-1 border shadow-sm">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-full"
                          onClick={() => handleAddToCart(product.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center font-bold text-sm">{cart[product.id] || 0}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 rounded-full"
                          onClick={() => handleAddToCart(product.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-4 border border-slate-100">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{labels.summary}</span>
                  <span className="text-xs font-bold text-primary">{cartResumen.items.length} {labels.step2}</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {cartResumen.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-600">{item.quantity}x {item.name[locale]}</span>
                      <span className="font-bold text-slate-800">{formatPrice(item.calculatedPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 pt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{labels.subtotal}</span>
                    <span className="text-slate-500">{formatPrice(cartResumen.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-primary font-bold">{labels.discount}</span>
                    <span className="text-primary font-bold">-{formatPrice(cartResumen.discount)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2">
                    <span className="font-black text-slate-900 uppercase">{labels.total}</span>
                    <span className="font-black text-primary">{formatPrice(cartResumen.total)}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{labels.deliveryDate}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-11 bg-slate-50 border-none rounded-xl font-bold">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(deliveryDate, "PPP", { locale: locale === 'es' ? es : enUS })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={deliveryDate} onSelect={(d) => d && setDeliveryDate(d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{labels.orderNotes}</Label>
                  <Textarea 
                    placeholder={labels.notesPlaceholder} 
                    className="bg-slate-50 border-none rounded-xl min-h-[80px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => step === 1 ? onOpenChange(false) : setStep(step - 1)}
            className="rounded-xl font-bold"
          >
            {step === 1 ? labels.cancel : labels.back}
          </Button>
          <Button 
            onClick={() => step === 3 ? handleCreateOrder() : setStep(step + 1)}
            disabled={
              (step === 1 && !selectedClient) || 
              (step === 2 && Object.keys(cart).length === 0) ||
              isSubmitting
            }
            className="rounded-xl px-8 bg-primary hover:bg-primary/90 font-bold h-11 shadow-lg"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            {step === 3 ? labels.finish : labels.next}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
