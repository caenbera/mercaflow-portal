"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useTranslations } from 'next-intl';
import { useAllOrders } from "@/hooks/use-all-orders";
import { Skeleton } from "@/components/ui/skeleton";
import { OrdersTable } from "@/components/dashboard/orders/orders-table";
import { OrderDetailsDialog } from '@/components/dashboard/orders/order-details-dialog';
import type { Order } from '@/types';

export default function ManageOrdersPage() {
  const t = useTranslations('Dashboard');
  const { orders, loading } = useAllOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };
  
  return (
    <>
      <OrderDetailsDialog 
        order={selectedOrder}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-headline font-bold">{t('orders_title')}</h1>
        <Card>
          <CardHeader>
            <CardTitle>{t('orders_card_title')}</CardTitle>
            <CardDescription>{t('orders_card_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <OrdersTable orders={orders} onViewDetails={handleViewDetails} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
