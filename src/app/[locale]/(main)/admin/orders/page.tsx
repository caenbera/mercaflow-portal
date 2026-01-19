"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslations } from 'next-intl';
import { useAllOrders } from "@/hooks/use-all-orders";
import { Skeleton } from "@/components/ui/skeleton";
import { OrdersTable } from "@/components/dashboard/orders/orders-table";
import { OrderDetailsDialog } from '@/components/dashboard/orders/order-details-dialog';
import type { Order } from '@/types';
import { PlusCircle, Search, Bell, Box, Truck, CheckCircle, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const KpiCard = ({ title, value, icon: Icon, iconBg }: { title: string, value: string | number, icon: React.ElementType, iconBg: string }) => (
  <Card className="shadow-sm">
    <CardContent className="p-4 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBg)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-2xl font-bold">{value}</h4>
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
    </CardContent>
  </Card>
);

export default function ManageOrdersPage() {
  const t = useTranslations('OrdersPage');
  const { orders, loading } = useAllOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const kpis = [
    { title: t('kpi_new'), value: orders.filter(o => o.status === 'pending').length, icon: Bell, iconBg: "status-new" },
    { title: t('kpi_preparing'), value: orders.filter(o => o.status === 'processing').length, icon: Box, iconBg: "status-prep" },
    { title: t('kpi_in_route'), value: orders.filter(o => o.status === 'shipped').length, icon: Truck, iconBg: "status-route" },
    { title: t('kpi_completed'), value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle, iconBg: "status-done" },
  ];
  
  return (
    <>
      <OrderDetailsDialog 
        order={selectedOrder}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-headline">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('manual_order_button')}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />) : kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
        </div>

        {/* Filters */}
         <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4 flex-wrap">
            <div className="relative flex-grow w-full sm:w-auto">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t('filter_search_placeholder')} className="pl-8" />
            </div>
            <Select>
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder={t('filter_all_statuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter_all_statuses')}</SelectItem>
                <SelectItem value="pending">{t('status_new')}</SelectItem>
                <SelectItem value="processing">{t('status_preparing')}</SelectItem>
                <SelectItem value="shipped">{t('status_in_route')}</SelectItem>
                <SelectItem value="delivered">{t('status_delivered')}</SelectItem>
                <SelectItem value="cancelled">{t('status_cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-auto justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>{t('filter_pick_date')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" className="w-full sm:w-auto"><Filter className="mr-2 h-4 w-4" />{t('filter_button')}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
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
