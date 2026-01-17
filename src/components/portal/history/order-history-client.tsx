"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from 'next-intl';
import { useOrders } from "@/hooks/use-orders";
import { OrderHistoryTable } from "./order-history-table";

export function OrderHistoryClient() {
  const t = useTranslations('Dashboard');
  const { orders, loading } = useOrders();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-headline font-bold">{t('history_title')}</h1>
       <Card>
        <CardHeader>
          <CardTitle>{t('history_card_title')}</CardTitle>
          <CardDescription>{t('history_card_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <OrderHistoryTable orders={orders} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
