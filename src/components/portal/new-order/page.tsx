
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import type { Product as ProductType, OrderItem } from '@/types';
import { CalendarIcon, Search, MessageSquarePlus, Pencil, Minus, Plus, ShoppingBasket, Star } from 'lucide-react';
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

const CheckoutContent = ({ orderItems, itemNotes, generalObservations, onGeneralObservationsChange, subtotal, discountAmount, total, deliveryDate, isSubmitting, handleSubmitOrder, t, locale, priceListName, discountPercentage }: any) => (
  <div className="flex flex-col h-full">
    <SheetHeader className="p-3 text-left border-b">
      <SheetTitle className="text-base">{t('confirmOrder')}</SheetTitle>
    </SheetHeader>
    <div className="p-3 flex-grow overflow-y-auto">
      <div className="flex items-center gap-2 p-2 mb-3 bg-gray-100 rounded-md text-sm">
        <CalendarIcon className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">{t('delivery')}:</span>
        <span className="font-semibold">{deliveryDate ? format(deliveryDate, 'PPP', { locale: locale === 'es' ? es : enUS }) : 'N/A'}</span>
      </div>
      <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{t('selectedItems')}</h3>
      <div className="space-y-2">
        {orderItems.map((item: any) => (
          <div key={item.productId} className="flex gap-2 items-start p-1.5 border-b">
            <Image src={item.photoUrl} alt={item.productName[locale]} width={36} height={36} className="rounded-md object-cover shrink-0" />
            <div className="flex-grow min-w-0">
              <p className="font-medium text-sm truncate">{item.productName[locale]}</p>
              <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(item.price)}</p>
              {itemNotes[item.productId] && (
                <p className="text-xs text-blue-600 bg-blue-50 p-1 rounded mt-1">
                  <b className="font-bold">Nota:</b> {itemNotes[item.productId]}
                </p>
              )}
            </div>
            <p className="font-semibold text-sm shrink-0">{formatCurrency(item.quantity * item.price)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('observations')}</label>
        <Textarea 
            placeholder={t('observationsPlaceholder')} 
            className="mt-1 text-sm" 
            value={generalObservations}
            onChange={(e) => onGeneralObservationsChange(e.target.value)}
        />
      </div>
    </div>
    <div className="p-3 bg-gray-50 border-t">
       <div className="space-y-1 text-sm mb-3">
          <div className="flex justify-between">
              <span className="text-muted-foreground">{t('subtotal')}</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
              <div className="flex justify-between text-primary">
                  <span className="font-medium">{t('discount')} {discountPercentage > 0 ? `(${priceListName} ${discountPercentage}%)` : ''}</span>
                  <span className="font-medium">-{formatCurrency(discountAmount)}</span>
              </div>
          )}
      </div>
      <div className="flex justify-between items-center mb-2 pt-2 border-t">
        <span className="text-muted-foreground font-medium">{t('total')}</span>
        <span className="text-xl font-bold">{formatCurrency(total)}</span>
      </div>
      <Button onClick={handleSubmitOrder} disabled={isSubmitting} size="lg" className="w-full text-sm">
        {isSubmitting ? t('sendingOrder') : t('sendOrder')}
      </Button>
    </div>
  </div>
);

export default function NewOrderPage() {
  const t = useTranslations('ClientNewOrderPage');
  const locale = useLocale() as 'es' | 'en';
  const { user, userProfile } = useAuth();
  const { activeOrgId } = useOrganization();
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
      if (p.subcategory?.es) {
        uniqueSubcats.set(p.subcategory.es, p.subcategory);
      }
    });
    return Array.from(uniqueSubcats.values()).sort((a, b) => a.es.localeCompare(b.es));
  }, [activeCategory, unifiedProductsForClient, loading]);

  const filteredProducts = useMemo(() => {
    if (loading) return [];

    let productList: ProductType[];

    if (activeCategory === t('favorites')) {
      productList = unifiedProductsForClient.filter(p => favoriteProductIds.has(p.id));
    } else {
      productList = unifiedProductsForClient.filter(p => p.category.es === activeCategory);
    }
    
    if (activeSubcategory !== 'all') {
      productList = productList.filter(p => p.subcategory?.es === activeSubcategory);
    }
    
    if (searchTerm) {
      productList = productList.filter(p => p.name[locale].toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    // Sort the resulting list alphabetically by name based on the current locale
    return productList.sort((a, b) => a.name[locale].localeCompare(b.name[locale]));
    
  }, [activeCategory, activeSubcategory, searchTerm, unifiedProductsForClient, loading, favoriteProductIds, t, locale]);

  const { orderItems, subtotal, discountAmount, total, totalItems, priceListName, discountPercentage } = useMemo(() => {
    if (loading) return { orderItems: [], subtotal: 0, discountAmount: 0, total: 0, totalItems: 0, priceListName: '', discountPercentage: 0 };
    
    const clientPriceList = priceLists.find(pl => pl.name === userProfile?.priceList) || null;
    let runningSubtotal = 0;
    let runningDiscount = 0;
    let runningTotalItems = 0;
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
            productId: product.id,
            productName: product.name,
            quantity: cartItem.quantity,
            price: finalPrice, // Use the final price after the best discount
            photoUrl: product.photoUrl || '',
            isBox: product.isBox || false,
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
    if (currentProductForNote) {
      updateNote(currentProductForNote.id, currentNote);
    }
    setIsNoteModalOpen(false);
    setCurrentProductForNote(null);
    setCurrentNote('');
  };

  const handleSubmitOrder = async () => {
    if (!user || !userProfile || !activeOrgId) {
      toast({ variant: "destructive", title: t('error'), description: t('noUserError') });
      return;
    }
    if (orderItems.length === 0) {
      toast({ variant: "destructive", title: t('error'), description: t('emptyCartError') });
      return;
    }
    if (!userProfile.address) {
      toast({ variant: "destructive", title: t('error'), description: t('noAddressError') });
      return;
    }
    if (!deliveryDate) {
      toast({ variant: "destructive", title: t('error'), description: t('noDateError') });
      return;
    }

    setIsSubmitting(true);
    try {
      await addOrder({
        organizationId: activeOrgId,
        userId: user.uid,
        businessName: userProfile.businessName,
        items: orderItems.map(({ photoUrl, ...item }) => item),
        total,
        status: 'pending',
        shippingAddress: userProfile.address,
        discountApplied: discountAmount,
        notes: {
            general: generalObservations,
            items: notes
        },
        deliveryDate: Timestamp.fromDate(deliveryDate),
      });
      toast({ title: t('orderPlaced'), description: t('orderPlacedDesc') });
      clearCart();
      setIsCheckoutOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: t('orderFailed'), description: error.message || t('orderFailedDesc') });
    } finally {
      setIsSubmitting(false);
    }
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
    handleSubmitOrder,
    t,
    locale,
    priceListName,
    discountPercentage,
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b py-1.5 overflow-x-hidden">
        <div className="flex items-center gap-2 px-3 mb-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal text-sm h-9", !deliveryDate && "text-muted-foreground")}>
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
              className="pl-8 pr-2 h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="relative h-9 overflow-x-auto hide-scrollbar">
          <div className="absolute left-0 top-0 flex items-center gap-1.5 px-3 min-w-full">
            {allCategories.map((cat: any) => (
              <Button
                key={cat.es}
                variant={activeCategory === cat.es ? 'default' : 'outline'}
                size="sm"
                className="rounded-full h-7 px-2.5 text-xs flex-shrink-0 whitespace-nowrap"
                onClick={() => {
                  setActiveCategory(cat.es);
                  setActiveSubcategory('all');
                }}
              >
                {cat.isFavorite && <Star className="h-3.5 w-3.5 mr-1 text-yellow-400" />}
                {cat[locale] || cat.es}
              </Button>
            ))}
          </div>
        </div>
        {subcategories.length > 0 && (
          <div className="relative h-9 overflow-x-auto hide-scrollbar mt-1">
            <div className="absolute left-0 top-0 flex items-center gap-1.5 px-3 min-w-full">
              <Button
                key="all"
                variant={activeSubcategory === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                className="border rounded-full h-7 px-2.5 text-xs flex-shrink-0 whitespace-nowrap bg-blue-50 hover:bg-blue-100 text-blue-800"
                onClick={() => setActiveSubcategory('all')}
              >
                Todos
              </Button>
              {subcategories.map((subcat: any) => (
                <Button
                  key={subcat.es}
                  variant={activeSubcategory === subcat.es ? 'secondary' : 'ghost'}
                  size="sm"
                  className="border rounded-full h-7 px-2.5 text-xs flex-shrink-0 whitespace-nowrap bg-blue-50 hover:bg-blue-100 text-blue-800"
                  onClick={() => setActiveSubcategory(subcat.es)}
                >
                  {subcat[locale] || subcat.es}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="flex-grow overflow-y-auto pb-32">
        {loading ? (
             <div className="p-2 space-y-px">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-background border-b p-2 flex items-center gap-2">
                        <Skeleton className="h-[50px] w-[50px] rounded-lg shrink-0" />
                        <div className="flex-grow min-w-0 space-y-2">
                           <Skeleton className="h-4 w-3/4" />
                           <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-full shrink-0" />
                    </div>
                ))}
            </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(p => {
            const quantity = cart[p.id]?.quantity || 0;
            const hasNote = !!notes[p.id];
            const unitText = typeof p.unit === 'object' && p.unit?.[locale] ? p.unit[locale] : (p.unit as any);
            const categoryText = typeof p.category === 'object' && p.category?.[locale] ? p.category[locale] : (p.category as any);
            const subCategoryText = typeof p.subcategory === 'object' && p.subcategory?.[locale] ? p.subcategory[locale] : (p.subcategory as any);
            return (
              <div key={p.id} className="bg-background border-b p-2 flex items-center gap-2">
                <button type="button" onClick={() => setImageToView(p.photoUrl || '/placeholder.svg')} className="shrink-0 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <Image
                    src={p.photoUrl || '/placeholder.svg'}
                    alt={p.name[locale]}
                    width={50}
                    height={50}
                    className="rounded-lg object-cover bg-gray-100"
                  />
                </button>
                <div className="flex-grow min-w-0">
                  <p className="font-medium text-sm leading-tight">{p.name[locale]}</p>
                  <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                    <span>{formatCurrency(p.salePrice)} / {unitText}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-auto px-1 py-0 ml-1 text-xs", hasNote && "text-primary hover:text-primary")}
                      onClick={() => handleOpenNoteModal(p)}
                    >
                      {hasNote ? <Pencil className="h-3 w-3 mr-0.5" /> : <MessageSquarePlus className="h-3 w-3 mr-0.5" />}
                      {t('note')}
                    </Button>
                  </div>
                  {quantity > 0 && (
                    <p className="font-bold text-primary text-sm mt-0.5">{formatCurrency(quantity * p.salePrice)}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-full border p-0.5 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full"
                    onClick={() => addToCart(p.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    readOnly
                    value={quantity || ''}
                    placeholder="0"
                    className="h-6 w-8 text-center bg-transparent border-none p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full"
                    onClick={() => addToCart(p.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-muted-foreground mt-16 text-sm">{t('noProducts')}</div>
        )}
      </div>

      {/* Note Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">{t('addNoteFor')} {currentProductForNote?.name[locale]}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder={t('notePlaceholder')}
            className="text-sm"
          />
          <DialogFooter>
            <Button onClick={handleSaveNote} size="sm">{t('saveNote')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Zoom Modal */}
      <Dialog open={!!imageToView} onOpenChange={(isOpen) => !isOpen && setImageToView(null)}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-xl">
          {imageToView && (
            <Image
              src={imageToView}
              alt="Product image zoom"
              width={500}
              height={500}
              className="rounded-lg object-contain w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout */}
      {isMobile ? (
        <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <SheetContent side="bottom" className="h-[90dvh] max-h-[90dvh] p-0 flex flex-col">
            <CheckoutContent {...checkoutProps} />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="max-w-md p-0 sm:max-w-md">
            <CheckoutContent {...checkoutProps} />
          </DialogContent>
        </Dialog>
      )}

      {/* Floating Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-[65px] inset-x-3 z-30 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md">
          <div className="bg-background/80 backdrop-blur-lg rounded-xl shadow-lg p-2.5 flex justify-between items-center border">
            <div>
              <p className="text-xs text-muted-foreground">{totalItems} {t('items')}</p>
              <p className="font-bold text-base">{formatCurrency(total)}</p>
            </div>
            <Button onClick={() => setIsCheckoutOpen(true)} size="sm" className="whitespace-nowrap">
              <ShoppingBasket className="mr-1.5 h-3.5 w-3.5" />
              {t('viewOrder')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
