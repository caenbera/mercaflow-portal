"use client";

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Supplier } from '@/types';
import { Eye, History, Mail, Phone, Plus, Star, Truck, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

interface SupplierCardProps {
  supplier: Supplier;
}

const Rating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

export function SupplierCard({ supplier }: SupplierCardProps) {
  const t = useTranslations('SuppliersPage');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  return (
    <Card className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200 rounded-2xl relative">
       <Link href={`/admin/suppliers/${supplier.id}`} className="absolute top-3 right-3 z-10">
         <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm hover:bg-background">
            <Eye className="h-4 w-4" />
         </Button>
       </Link>
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Image
          src={supplier.logo}
          alt={`${supplier.name} logo`}
          width={60}
          height={60}
          className="rounded-xl border p-1"
        />
        <div className="flex-1">
          <h3 className="font-bold text-base text-gray-800">{supplier.name}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{supplier.category}</p>
          <Rating rating={supplier.rating} />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{supplier.contact.name}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{supplier.contact.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Truck className="h-4 w-4" />
          <span>{t('delivery_days')}: {supplier.deliveryDays}</span>
        </div>

        <div className="bg-muted p-2.5 rounded-lg flex justify-between items-center mt-2">
            <span className="text-xs font-semibold text-muted-foreground">{t('pending_balance')}</span>
            <span className={`font-bold ${supplier.finance.pendingBalance > 3000 ? 'text-destructive' : 'text-foreground'}`}>
                {supplier.finance.pendingBalance > 0 ? formatCurrency(supplier.finance.pendingBalance) : <span className="text-green-600">Al día</span>}
            </span>
        </div>

      </CardContent>
      <CardFooter className="p-2 border-t bg-gray-50/50 rounded-b-2xl">
        <div className="flex w-full gap-2">
            <Button variant="outline" size="sm" className="flex-1">
                <History className="mr-2 h-4 w-4" /> {t('orders')}
            </Button>
            <Button size="sm" className="flex-1">
                <Plus className="mr-2 h-4 w-4" /> {t('stock_up')}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
