'use client';

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
import { ManualOrderDialog } from '@/components/dashboard/orders/manual-order-dialog';
import type { Order } from '@/types';
import { PlusCircle, Search, Bell, Box, Truck, CheckCircle, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const KpiCard = ({ title, value, icon: Icon, iconBg }: { title: string, value: string | number, icon: any, iconBg: string }) => (
  <Card className="shadow-sm border-none">
    <CardContent className="p-4 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", 
        iconBg === "status-new" ? "bg-blue-100 text-blue-600" : 
        iconBg === "status-prep" ? "bg-orange-100 text-orange-600" : 
        iconBg === "status-route" ? "bg-purple-100 text-purple-600" : 
        "bg-green-100 text-green-600")}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{title}</span>
      </div>
    </CardContent>
  </Card>
);

export default function ManageOrdersPage() {
  const t = useTranslations('OrdersPage');
  const { orders, loading } = useAllOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.businessName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesDate = !date || format(order.createdAt.toDate(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const kpis = [
    { title: t('kpi_new'), value: orders.filter(o => o.status === 'pending').length, icon: Bell, iconBg: "status-new" },
    { title: t('kpi_preparing'), value: orders.filter(o => o.status === 'processing').length, icon: Box, iconBg: "status-prep" },
    { title: t('kpi_in_route'), value: orders.filter(o => o.status === 'shipped').length, icon: Truck, iconBg: "status-route" },
    { title: t('kpi_completed'), value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle, iconBg: "status-done" },
  ];
  
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <OrderDetailsDialog 
        order={selectedOrder}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <ManualOrderDialog 
        open={isManualOrderOpen}
        onOpenChange={setIsManualOrderOpen}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-slate-900">{t('title')}</h1>
          <p className="text-slate-500">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setIsManualOrderOpen(true)} className="rounded-xl shadow-lg bg-primary hover:bg-primary/90 h-11 font-bold px-6">
          <PlusCircle className="mr-2 h-5 w-5" />
          {t('manual_order_button')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />) : kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
      </div>

      {/* Filters */}
       <Card className="border-none shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4 flex-wrap">
          <div className="relative flex-grow w-full sm:w-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={t('filter_search_placeholder')} 
                className="pl-8 bg-slate-50 border-none h-11" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-auto bg-slate-50 border-none h-11">
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
                  "w-full sm:w-auto justify-start text-left font-medium bg-slate-50 border-none h-11",
                  !date && "text-slate-400"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>{t('filter_pick_date')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
              {date && (
                <div className="p-2 border-t">
                  <Button variant="ghost" className="w-full text-xs" onClick={() => setDate(undefined)}>Limpiar fecha</Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <OrdersTable orders={filteredOrders} onViewDetails={handleViewDetails} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
