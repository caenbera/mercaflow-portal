"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Minus, Plus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';


const MOCK_OFFERS = [
    {
        id: 101,
        name: "Tomate Maduro (Salsa)",
        unit: "Caja 20lb",
        oldPrice: 18.50,
        newPrice: 12.95,
        discount: "-30%",
        stockLeft: 15,
        stockMsg: "¡Solo quedan 4 cajas!",
        stockMsgKey: "stock_left",
        stockMsgValues: { count: 4 },
        img: "https://i.postimg.cc/TY6YMwmY/tomate_chonto.png"
    },
    {
        id: 102,
        name: "Limón Amarillo (Imperfecto)",
        unit: "Bulto",
        oldPrice: 45.00,
        newPrice: 29.99,
        discount: "LIQUIDACIÓN",
        discountKey: "discount_liquidation",
        stockLeft: 40,
        stockMsg: "Quedan pocos",
        stockMsgKey: "stock_few",
        img: "https://i.postimg.cc/43dFY6CX/limon.png"
    },
    {
        id: 103,
        name: "Combo Salsa Verde",
        unit: "Tomatillo + Cilantro + Chile",
        oldPrice: 60.00,
        newPrice: 49.50,
        discount: "COMBO",
        discountKey: "discount_combo",
        stockLeft: 80,
        stockMsg: "Oferta Semanal",
        stockMsgKey: "stock_weekly_offer",
        img: "https://i.postimg.cc/BQBZq0cs/tomatillo.png"
    }
];

const FILTERS = ['all', 'expiring', 'volume', 'new'];

export function OffersPageClient() {
  const t = useTranslations('ClientOffersPage');
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 59, seconds: 59 });
  const [activeFilter, setActiveFilter] = useState('all');
  const [cart, setCart] = useState<{[key: number]: number}>({});

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

  const handleUpdateQty = (id: number, delta: number) => {
    setCart(prev => {
        const newCart = {...prev};
        const currentQty = newCart[id] || 0;
        const newQty = currentQty + delta;
        newCart[id] = Math.max(0, newQty);
        return newCart;
    });
    if(delta > 0) {
        toast({ title: "Product added", description: "Item added to your order." });
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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
        {FILTERS.map(filter => (
          <Button 
            key={filter}
            variant={activeFilter === filter ? 'destructive' : 'outline'}
            className="rounded-full mr-2"
            size="sm"
            onClick={() => setActiveFilter(filter)}
          >
            {t(`filter_${filter}` as any)}
          </Button>
        ))}
      </div>

      {/* Offers List */}
      <div className="px-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {MOCK_OFFERS.map(offer => {
          const qty = cart[offer.id] || 0;
          return (
            <Card key={offer.id} className="overflow-hidden shadow-sm border-destructive/20 relative">
              <div className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground font-extrabold text-xs px-2 py-1 rounded-md shadow-md">
                {offer.discountKey ? t(offer.discountKey as any) : offer.discount}
              </div>

              <div className="p-3 flex gap-3">
                <Image src={offer.img} alt={offer.name} width={80} height={80} className="rounded-md object-cover bg-muted shrink-0" />
                <div className="flex-grow">
                  <h3 className="font-bold text-sm leading-tight">{offer.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-destructive font-extrabold text-lg">{formatCurrency(offer.newPrice)}</span>
                    <span className="text-muted-foreground text-xs line-through">{formatCurrency(offer.oldPrice)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{t('unit_label')}: {offer.unit}</div>
                  
                   {/* Stock Bar */}
                    <Progress value={offer.stockLeft} className="h-1.5 my-2" />
                    <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                        <Zap className="h-3 w-3"/>
                        {offer.stockMsgValues ? t(offer.stockMsgKey as any, offer.stockMsgValues as any) : t(offer.stockMsgKey as any)}
                    </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-2 border-t flex justify-between items-center">
                 <span className="text-xs font-semibold text-muted-foreground">{t('add_to_order_label')}</span>
                 <div className="flex items-center gap-1 bg-background rounded-full border p-0.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => handleUpdateQty(offer.id, -1)}>
                        <Minus className="h-4 w-4"/>
                    </Button>
                     <Input readOnly value={qty || ''} placeholder="0" className="h-7 w-8 text-center bg-transparent border-none p-0 text-sm font-bold focus-visible:ring-0 focus-visible:ring-offset-0"/>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => handleUpdateQty(offer.id, 1)}>
                        <Plus className="h-4 w-4"/>
                    </Button>
                 </div>
              </div>
            </Card>
          )
        })}
      </div>

    </div>
  );
}
