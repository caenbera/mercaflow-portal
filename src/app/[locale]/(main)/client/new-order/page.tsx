
"use client";

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { addOrder } from '@/lib/firestore/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import type { Product as ProductType, OrderItem } from '@/types';
import { CalendarIcon, Search, MessageSquarePlus, Pencil, Minus, Plus, ShoppingBasket, Star, Printer, MessageCircle, Check, Loader2, CheckCircle2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProducts } from '@/hooks/use-products';
import { useOrders } from '@/hooks/use-orders';
import { Skeleton } from '@/components/ui/skeleton';
import { usePriceLists } from '@/hooks/use-pricelists';
import { useCart } from '@/context/cart-context';
import { useOffers } from '@/hooks/use-offers';
import { calculateDiscount } from '@/lib/pricing';
import { useOrganization } from '@/context/organization-context';
import { Timestamp } from 'firebase/firestore';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const CheckoutContent = ({ 
  orderItems, 
  itemNotes, 
  generalObservations, 
  onGeneralObservationsChange, 
  subtotal, 
  discountAmount, 
  total, 
  deliveryDate, 
  isSubmitting, 
  isSuccess,
  handleSubmitOrder, 
  onClose,
  t, 
  locale, 
  activeOrg,
  userProfile
}: any) => {
  
  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!activeOrg?.storeConfig?.contactWhatsapp) {
      alert("El proveedor no tiene configurado un número de WhatsApp en su perfil de marca.");
      return;
    }
    
    const itemsText = orderItems.map((i: any) => `- ${i.quantity}x ${i.productName[locale]} (${formatCurrency(i.price)})`).join('\n');
    const msg = `*NUEVO PEDIDO - MERCAFLOW*\n\n*Cliente:* ${userProfile?.businessName}\n*Entrega:* ${deliveryDate ? format(deliveryDate, 'dd/MM/yyyy') : 'Pendiente'}\n\n*Productos:*\n${itemsText}\n\n*Subtotal:* ${formatCurrency(subtotal)}\n*Descuento:* -${formatCurrency(discountAmount)}\n*TOTAL:* ${formatCurrency(total)}\n\n*Notas:* ${generalObservations || 'Ninguna'}`;
    
    const phone = activeOrg.storeConfig.contactWhatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
        <div className="bg-green-100 p-6 rounded-full mb-6 animate-in zoom-in-50 duration-500">
          <CheckCircle2 className="h-20 w-20 text-green-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">¡Pedido Recibido!</h2>
        <p className="text-slate-500 mb-8 max-w-xs leading-relaxed">Tu orden ha sido enviada al proveedor. Puedes enviar un comprobante ahora por WhatsApp.</p>
        
        <div className="w-full space-y-3">
          <Button 
            className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-xl gap-2"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-6 w-6" />
            Enviar por WhatsApp
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-2xl font-bold"
            onClick={onClose}
          >
            Cerrar y Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <SheetHeader className="p-4 text-left border-b bg-slate-50/50 no-print">
        <SheetTitle className="text-lg font-bold flex items-center gap-2">
          <ShoppingBasket className="h-5 w-5 text-primary" />
          {t('confirmOrder')}
        </SheetTitle>
        <SheetDescription className="text-xs">Revisa los detalles de tu compra antes de finalizar.</SheetDescription>
      </SheetHeader>

      <div className="flex-grow overflow-y-auto p-4 space-y-6 print-area">
        <div className="hidden print:block mb-6 border-b pb-4">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">RESUMEN DE PEDIDO</h1>
          <div className="flex justify-between mt-2 text-sm">
            <p><b>Cliente:</b> {userProfile?.businessName}</p>
            <p><b>Fecha:</b> {format(new Date(), 'dd/MM/yyyy')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-2xl text-sm no-print">
          <CalendarIcon className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <span className="text-blue-800 font-bold block leading-none">{t('delivery')}</span>
            <span className="text-blue-600 font-medium">{deliveryDate ? format(deliveryDate, 'PPPP', { locale: locale === 'es' ? es : enUS }) : 'N/A'}</span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('selectedItems')}</h3>
          <div className="space-y-2">
            {orderItems.map((item: any) => (
              <div key={item.productId} className="flex gap-3 items-start p-3 bg-white border rounded-2xl shadow-sm">
                <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border bg-slate-50 no-print">
                  <Image src={item.photoUrl || '/placeholder.svg'} alt="" width={48} height={48} className="object-cover h-full w-full" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-sm text-slate-800 leading-tight">{item.productName[locale]}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.quantity} x {formatCurrency(item.price)}</p>
                  {itemNotes[item.productId] && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                      <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                        <span className="font-bold uppercase tracking-tighter mr-1">Nota:</span> 
                        {itemNotes[item.productId]}
                      </p>
                    </div>
                  )}
                </div>
                <p className="font-black text-sm text-slate-900 shrink-0">{formatCurrency(item.quantity * item.price)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 no-print">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('observations')}</label>
          <Textarea 
              placeholder={t('observationsPlaceholder')} 
              className="mt-1 bg-slate-50 border-none rounded-2xl min-h-[80px]" 
              value={generalObservations}
              onChange={(e) => onGeneralObservationsChange(e.target.value)}
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-2">
            <div className="flex justify-between text-sm text-slate-500">
                <span>{t('subtotal')}</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-primary font-bold">
                    <span>{t('discount')}</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                </div>
            )}
            <div className="pt-2 border-t flex justify-between items-center">
              <span className="font-black text-slate-900 uppercase tracking-tighter">{t('total')}</span>
              <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
            </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t space-y-3 no-print">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-12 rounded-2xl font-bold gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button 
            variant="outline" 
            className="h-12 rounded-2xl font-bold gap-2 border-green-200 text-green-700 hover:bg-green-50"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>
        <Button onClick={handleSubmitOrder} disabled={isSubmitting} size="lg" className="w-full h-14 rounded-2xl text-lg font-black shadow-xl">
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('sendingOrder')}</>
          ) : (
            <><Check className="mr-2 h-5 w-5" /> {t('sendOrder')}</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default function NewOrderPage() {
  const t = useTranslations('ClientNewOrderPage');
  const locale = useLocale() as 'es' | 'en';
  const { user, userProfile } = useAuth();
  const { activeOrg, activeOrgId } = useOrganization();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { products, loading: productsLoading } = useProducts();
  const { offers, loading: offersLoading } = useOffers();
  const { orders, loading: ordersLoading } = useOrders();
  const { priceLists, loading: priceListsLoading } = usePriceLists();
  const { cart, notes, addToCart, updateNote, clearCart, getNote } = useCart();

  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSubcategory, setActiveSubcategory] = useState('all');

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentProductForNote, setCurrentProductForNote] = useState<ProductType | null>(null);
  const [currentNote, setCurrentNote] = useState('');
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generalObservations, setGeneralObservations] = useState("");

  const loading = productsLoading || ordersLoading || priceListsLoading || offersLoading;

  const unifiedProductsForClient = useMemo(() => {
    if (loading) return [];
    const productMap = products.reduce((acc, product) => {
        const existing = acc.get(product.sku);
        if (existing) {
            existing.stock += product.stock;
        } else {
            acc.set(product.sku, { ...product });
        }
        return acc;
    }, new Map<string, ProductType>());
    return Array.from(productMap.values());
  }, [products, loading]);

  const favoriteProductIds = useMemo(() => {
    if (ordersLoading || !orders.length) return new Set<string>();
    const productOrderCounts: Record<string, number> = {};
    orders.forEach(order => {
        const productsInThisOrder = new Set<string>();
        order.items.forEach(item => productsInThisOrder.add(item.productId));
        productsInThisOrder.forEach(productId => {
            productOrderCounts[productId] = (productOrderCounts[productId] || 0) + 1;
        });
    });
    return new Set<string>(Object.keys(productOrderCounts).filter(id => productOrderCounts[id] >= 3));
  }, [orders, ordersLoading]);

  const allCategories = useMemo(() => {
    if (loading) return [];
    const uniqueCategories = Array.from(new Map(unifiedProductsForClient.map(p => [p.category.es, p.category])).values());
    const favCategory: any = { es: t('favorites'), en: 'Favorites', isFavorite: true };
    return [favCategory, ...uniqueCategories.sort((a,b) => a.es.localeCompare(b.es))];
  }, [unifiedProductsForClient, loading, t]);
  
  useEffect(() => {
    if (allCategories.length > 0 && !activeCategory) {
      setActiveCategory(allCategories[0].es);
    }
  }, [allCategories, activeCategory]);

  const subcategories = useMemo(() => {
    if (!activeCategory || loading) return [];
    const productsInCategory = unifiedProductsForClient.filter(p => p.category.es === activeCategory);
    const uniqueSubcats = new Map<string, { es: string; en: string }>();
    productsInCategory.forEach(p => {
      if (p.subcategory?.es) uniqueSubcats.set(p.subcategory.es, p.subcategory);
    });
    return Array.from(uniqueSubcats.values()).sort((a, b) => a.es.localeCompare(b.es));
  }, [activeCategory, unifiedProductsForClient, loading]);

  const filteredProducts = useMemo(() => {
    if (loading) return [];
    let productList = activeCategory === t('favorites') 
      ? unifiedProductsForClient.filter(p => favoriteProductIds.has(p.id))
      : unifiedProductsForClient.filter(p => p.category.es === activeCategory);
    
    // Solo filtramos por subcategoría si el usuario ha seleccionado una específica (no "all")
    if (activeSubcategory !== 'all') {
      productList = productList.filter(p => p.subcategory?.es === activeSubcategory);
    }
    
    if (searchTerm) {
      productList = productList.filter(p => p.name[locale].toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return productList.sort((a, b) => a.name[locale].localeCompare(b.name[locale]));
  }, [activeCategory, activeSubcategory, searchTerm, unifiedProductsForClient, loading, favoriteProductIds, t, locale]);

  const { orderItems, subtotal, discountAmount, total, totalItems, priceListName, discountPercentage } = useMemo(() => {
    if (loading) return { orderItems: [], subtotal: 0, discountAmount: 0, total: 0, totalItems: 0, priceListName: '', discountPercentage: 0 };
    const clientPriceList = priceLists.find(pl => pl.name === userProfile?.priceList) || null;
    let runningSubtotal = 0, runningDiscount = 0, runningTotalItems = 0;
    const runningOrderItems: (OrderItem & { photoUrl: string })[] = [];
    for (const productId in cart) {
        const cartItem = cart[productId];
        const product = products.find(p => p.id === productId);
        if (!product || !cartItem) continue;
        const offer = offers.find(o => o.id === cartItem.offerId);
        const { finalPrice, discount } = calculateDiscount(product, clientPriceList, offer);
        runningSubtotal += product.salePrice * cartItem.quantity;
        runningDiscount += discount * cartItem.quantity;
        runningTotalItems += cartItem.quantity;
        runningOrderItems.push({
            productId: product.id, productName: product.name, quantity: cartItem.quantity,
            price: finalPrice, photoUrl: product.photoUrl || '', isBox: product.isBox || false,
        });
    }
    return { 
      orderItems: runningOrderItems, 
      subtotal: runningSubtotal, 
      discountAmount: runningDiscount, 
      total: runningSubtotal - runningDiscount, 
      totalItems: runningTotalItems, 
      priceListName: clientPriceList?.name || '',
      discountPercentage: (clientPriceList?.tiers && clientPriceList.tiers[0]?.discount) || 0,
    };
  }, [cart, products, offers, userProfile, priceLists, loading]);

  const handleOpenNoteModal = (product: ProductType) => {
    setCurrentProductForNote(product);
    setCurrentNote(getNote(product.id) || '');
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = () => {
    if (currentProductForNote) updateNote(currentProductForNote.id, currentNote);
    setIsNoteModalOpen(false);
    setCurrentProductForNote(null);
    setCurrentNote('');
  };

  const handleSubmitOrder = async () => {
    if (!user || !userProfile || !activeOrgId) return;
    if (orderItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await addOrder({
        organizationId: activeOrgId, userId: user.uid, businessName: userProfile.businessName,
        items: orderItems.map(({ photoUrl, ...item }) => item), total, status: 'pending',
        shippingAddress: userProfile.address, discountApplied: discountAmount,
        notes: { general: generalObservations, items: notes },
        deliveryDate: Timestamp.fromDate(deliveryDate || new Date()),
      });
      setIsSuccess(true);
      clearCart();
    } catch (error: any) {
      toast({ variant: "destructive", title: t('orderFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    setIsSuccess(false);
  };

  const checkoutProps = {
    orderItems,
    itemNotes: notes,
    generalObservations,
    onGeneralObservationsChange: setGeneralObservations,
    subtotal,
    discountAmount,
    total,
    deliveryDate,
    isSubmitting,
    isSuccess,
    handleSubmitOrder,
    onClose: handleCloseCheckout,
    t,
    locale,
    priceListName,
    discountPercentage,
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b py-1.5 overflow-x-hidden no-print">
        <div className="flex items-center gap-2 px-3 mb-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("flex-1 justify-start text-left h-9 rounded-xl border-none bg-slate-100", !deliveryDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {deliveryDate ? format(deliveryDate, "PPP", { locale: locale === 'es' ? es : enUS }) : <span>{t('pickDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={deliveryDate} onSelect={setDeliveryDate} initialFocus />
            </PopoverContent>
          </Popover>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              className="pl-8 h-9 text-sm rounded-xl border-none bg-slate-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="relative h-9 overflow-x-auto hide-scrollbar mt-1">
          <div className="absolute left-0 top-0 flex items-center gap-1.5 px-3 min-w-full">
            {allCategories.map((cat: any) => (
              <Button key={cat.es} variant={activeCategory === cat.es ? 'default' : 'outline'} size="sm" className="rounded-full h-7 px-3 text-[11px] font-bold" onClick={() => { setActiveCategory(cat.es); setActiveSubcategory('all'); }}>
                {cat.isFavorite && <Star className="h-3.5 w-3.5 mr-1 text-yellow-400 fill-yellow-400" />}
                {cat[locale] || cat.es}
              </Button>
            ))}
          </div>
        </div>
        
        {subcategories.length > 0 && (
          <div className="relative h-11 overflow-x-auto hide-scrollbar mt-1 border-t flex items-center">
            <div className="flex items-center gap-1.5 px-3 min-w-full h-full">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full h-7 px-3 text-[10px] font-bold uppercase tracking-wider border transition-all",
                  activeSubcategory === 'all' 
                    ? "bg-[#AFA428] text-white border-[#AFA428] hover:bg-[#AFA428]/90 shadow-sm" 
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                )}
                onClick={() => setActiveSubcategory('all')}
              >
                Todos
              </Button>
              {subcategories.map((sub: any) => (
                <Button
                  key={sub.es}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-full h-7 px-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all",
                    activeSubcategory === sub.es 
                      ? "bg-[#AFA428] text-white border-[#AFA428] hover:bg-[#AFA428]/90 shadow-sm" 
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  )}
                  onClick={() => setActiveSubcategory(sub.es)}
                >
                  {sub[locale] || sub.es}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto pb-32 no-print">
        {loading ? (
             <div className="p-2 space-y-px">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-background border-b p-2 flex items-center gap-2">
                        <Skeleton className="h-[50px] w-[50px] rounded-lg shrink-0" />
                        <div className="flex-grow min-w-0 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                        <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                    </div>
                ))}
            </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(p => {
            const quantity = cart[p.id]?.quantity || 0;
            const hasNote = !!notes[p.id];
            const unitText = typeof p.unit === 'object' && p.unit?.[locale] ? p.unit[locale] : (p.unit as any);
            return (
              <div key={p.id} className="bg-background border-b p-2 flex items-center gap-3">
                <button type="button" onClick={() => setImageToView(p.photoUrl || '/placeholder.svg')} className="shrink-0 rounded-xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
                  <Image src={p.photoUrl || '/placeholder.svg'} alt={p.name[locale]} width={56} height={56} className="rounded-xl object-cover bg-slate-50" />
                </button>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-sm leading-tight text-slate-800">{p.name[locale]}</p>
                  <div className="text-xs text-slate-500 flex items-center mt-1 font-medium">
                    <span>{formatCurrency(p.salePrice)} / {unitText}</span>
                    <Button variant="ghost" size="sm" className={cn("h-auto px-1.5 py-0.5 ml-2 text-[10px] font-bold uppercase tracking-tighter rounded-full border", hasNote ? "bg-primary/10 text-primary border-primary/20" : "bg-slate-50 text-slate-400 border-slate-200")} onClick={() => handleOpenNoteModal(p)}>
                      {hasNote ? <Pencil className="h-2.5 w-2.5 mr-1" /> : <MessageSquarePlus className="h-2.5 w-2.5 mr-1" />}
                      {t('note')}
                    </Button>
                  </div>
                  {quantity > 0 && <p className="font-black text-primary text-sm mt-1">{formatCurrency(quantity * p.salePrice)}</p>}
                </div>
                <div className="flex items-center gap-1 bg-slate-100 rounded-2xl border p-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => addToCart(p.id, -1)}><Minus className="h-3.5 w-3.5" /></Button>
                  <div className="w-7 text-center text-sm font-black">{quantity || '0'}</div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => addToCart(p.id, 1)}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-muted-foreground mt-16 text-sm italic">{t('noProducts')}</div>
        )}
      </div>

      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Instrucciones para el Picker</DialogTitle>
            <SheetDescription>Indica detalles de maduración o empaque.</SheetDescription>
          </DialogHeader>
          <Textarea value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} placeholder="Ej: Necesito aguacates muy maduros..." className="bg-slate-50 border-none rounded-2xl min-h-[120px]" />
          <DialogFooter><Button onClick={handleSaveNote} size="lg" className="w-full rounded-2xl font-bold">{t('saveNote')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isCheckoutOpen} onOpenChange={handleCloseCheckout}>
        <SheetContent side="bottom" className="h-[95dvh] max-h-[95dvh] p-0 flex flex-col rounded-t-[40px] overflow-hidden border-none shadow-2xl">
          <CheckoutContent {...{ ...checkoutProps, activeOrg, userProfile }} />
        </SheetContent>
      </Sheet>

      {totalItems > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-[75px] inset-x-4 z-30 sm:max-w-md sm:left-1/2 sm:-translate-x-1/2 no-print">
          <Button onClick={() => setIsCheckoutOpen(true)} className="w-full h-16 rounded-3xl shadow-2xl bg-slate-900 text-white flex justify-between items-center px-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary p-2 rounded-xl"><ShoppingBasket className="h-6 w-6" /></div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">{totalItems} {t('items')}</p>
                <p className="font-black text-xl leading-none">{formatCurrency(total)}</p>
              </div>
            </div>
            <span className="font-bold text-sm uppercase tracking-widest">{t('viewOrder')}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
