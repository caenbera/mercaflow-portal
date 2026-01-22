"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Flame, Minus, Plus, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useOffers } from '@/hooks/use-offers';
import { useOfferCategories } from '@/hooks/use-offer-categories';
import type { Offer } from '@/types';
import { useCart } from '@/context/cart-context';
import { getFinalPrice } from '@/lib/pricing';

const OfferCardSkeleton = () => (
  <Card className="overflow-hidden shadow-sm">
    <div className="p-3 flex gap-3">
      <Skeleton className="h-[80px] w-[80px] rounded-md shrink-0" />
      <div className="flex-grow space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
    <div className="bg-muted/50 p-2 border-t flex justify-between items-center">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-9 w-24 rounded-full" />
    </div>
  </Card>
);

export function OffersPageClient() {
  const t = useTranslations('ClientOffersPage');
  const locale = useLocale() as 'es' | 'en';
  const { toast } = useToast();
  const { offers, loading: offersLoading } = useOffers();
  const { categories, loading: categoriesLoading } = useOfferCategories();
  const { cart, addToCart } = useCart();

  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 59, seconds: 59 });
  const [activeFilter, setActiveFilter] = useState('all');
  
  const loading = offersLoading || categoriesLoading;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) {
          hours = 0; minutes = 0; seconds = 0;
          clearInterval(timer);
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (time: number) => time.toString().padStart(2, '0');
  const countdownString = `${formatTime(timeLeft.hours)}:${formatTime(timeLeft.minutes)}:${formatTime(timeLeft.seconds)}`;

  const handleAddToCart = (offer: Offer, delta: number) => {
    addToCart(offer.productId, delta, offer);
    if (delta > 0) {
      toast({ title: t('toast_added'), description: t('toast_added_desc') });
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getDiscountLabel = (offer: Offer) => {
    switch (offer.type) {
      case 'percentage':
        return `-${offer.value}%`;
      case 'liquidation':
        return t('discount_liquidation');
      case 'combo':
        return t('discount_combo');
      case 'fixedPrice':
        return `${t('discount_fixed_price')}: ${formatCurrency(offer.value)}`;
      default:
        return 'OFERTA';
    }
  };

  const filteredOffers = activeFilter === 'all'
    ? offers
    : offers.filter(offer => offer.category.en.toLowerCase() === activeFilter);


  return (
    <div className="pb-20 md:pb-4">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-red-700 to-red-600 text-white p-4 text-center sticky top-0 z-20 shadow-lg md:rounded-b-2xl">
        <h1 className="font-bold text-lg flex items-center justify-center gap-2"><Flame /> {t('title')}</h1>
        <div className="text-sm opacity-80">{t('subtitle')}</div>
        <div className="bg-black/20 inline-block px-4 py-1 rounded-full font-bold font-mono text-lg mt-1 tracking-wider">
          {countdownString}
        </div>
      </div>

      {/* Filters */}
      <div className="py-4 px-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
        <Button 
            variant={activeFilter === 'all' ? 'destructive' : 'outline'}
            className="rounded-full mr-2"
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            {t('filter_all')}
        </Button>
        {loading ? (
            <Skeleton className="h-8 w-24 inline-block rounded-full" />
        ) : (
            categories.map(cat => (
            <Button 
                key={cat.id}
                variant={activeFilter === cat.name.en.toLowerCase() ? 'destructive' : 'outline'}
                className="rounded-full mr-2"
                size="sm"
                onClick={() => setActiveFilter(cat.name.en.toLowerCase())}
            >
                {cat.name[locale]}
            </Button>
            ))
        )}
      </div>

      {/* Offers List */}
      <div className="px-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {loading ? (
            Array.from({length: 3}).map((_,i) => <OfferCardSkeleton key={i} />)
        ) : filteredOffers.length > 0 ? (
            filteredOffers.map(offer => {
            const qty = cart[offer.productId]?.quantity || 0;
            const finalPrice = getFinalPrice({ salePrice: offer.originalPrice } as any, null, offer);
            
            return (
                <Card key={offer.id} className="overflow-hidden shadow-sm border-destructive/20 relative">
                <div className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground font-extrabold text-xs px-2 py-1 rounded-md shadow-md">
                    {getDiscountLabel(offer)}
                </div>

                <div className="p-3 flex gap-3">
                    <Image src={offer.productPhotoUrl || 'https://via.placeholder.com/80'} alt={offer.productName[locale]} width={80} height={80} className="rounded-md object-cover bg-muted shrink-0" />
                    <div className="flex-grow">
                    <h3 className="font-bold text-sm leading-tight">{offer.productName[locale]}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-destructive font-extrabold text-lg">{formatCurrency(finalPrice)}</span>
                        <span className="text-muted-foreground text-xs line-through">{formatCurrency(offer.originalPrice)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{t('unit_label')}: {offer.productUnit[locale]}</div>
                    
                    <Progress value={75} className="h-1.5 my-2" />
                    <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                        <Zap className="h-3 w-3"/>
                        {t('stock_few')}
                    </div>
                    </div>
                </div>
                
                <div className="bg-muted/50 p-2 border-t flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground">{t('add_to_order_label')}</span>
                    <div className="flex items-center gap-1 bg-background rounded-full border p-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => handleAddToCart(offer, -1)}>
                            <Minus className="h-4 w-4"/>
                        </Button>
                        <Input readOnly value={qty || ''} placeholder="0" className="h-7 w-8 text-center bg-transparent border-none p-0 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0"/>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => handleAddToCart(offer, 1)}>
                            <Plus className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
                </Card>
            )
            })
        ) : (
            <p className="col-span-full text-center text-muted-foreground py-10">{t('no_offers')}</p>
        )}
      </div>
    </div>
  );
}
