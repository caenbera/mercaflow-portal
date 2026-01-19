"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus } from '@/types';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Bell, Box, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { updateOrder } from '@/lib/firestore/orders';
import { useTranslations } from 'next-intl';

interface OrdersTableProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
}

export function OrdersTable({ orders, onViewDetails }: OrdersTableProps) {
  const { toast } = useToast();
  const t = useTranslations('OrdersPage');

  const getStatusBadge = (status: OrderStatus) => {
    switch(status) {
      case 'pending': return <Badge className="badge-status status-new"><Bell className="h-3 w-3" />{t('status_new')}</Badge>;
      case 'processing': return <Badge className="badge-status status-prep"><Box className="h-3 w-3" />{t('status_preparing')}</Badge>;
      case 'shipped': return <Badge className="badge-status status-route"><Truck className="h-3 w-3" />{t('status_in_route')}</Badge>;
      case 'delivered': return <Badge className="badge-status status-done"><CheckCircle className="h-3 w-3" />{t('status_delivered')}</Badge>;
      case 'cancelled': return <Badge className="badge-status status-cancel"><XCircle className="h-3 w-3" />{t('status_cancelled')}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrder(orderId, { status: newStatus });
      toast({ title: "Success", description: `Order #${orderId.substring(0,4)} status updated to ${newStatus}.`});
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update order status."});
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM dd, yyyy, hh:mm a');
  };
  
  const availableStatuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('table_header_id')}</TableHead>
          <TableHead>{t('table_header_client')}</TableHead>
          <TableHead>{t('table_header_date')}</TableHead>
          <TableHead className="text-right">{t('table_header_total')}</TableHead>
          <TableHead>{t('table_header_status')}</TableHead>
          <TableHead className="text-right">{t('table_header_actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length > 0 ? (
          orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-bold">#{order.id.substring(0, 7).toUpperCase()}</TableCell>
              <TableCell>
                <div className="font-semibold">{order.businessName}</div>
                <small className="text-muted-foreground">{t('table_recurrent_client')}</small>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{formatDate(order.createdAt)}</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(order.total)}</TableCell>
              <TableCell>
                {getStatusBadge(order.status)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetails(order)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('actions_menu_label')}</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => onViewDetails(order)}>
                        {t('actions_view_details')}
                      </DropdownMenuItem>
                       <DropdownMenuItem onSelect={() => {
                         onViewDetails(order);
                         setTimeout(() => document.body.classList.add('is-printing'), 100);
                         setTimeout(() => window.print(), 200);
                       }}>
                        {t('actions_print')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>{t('actions_change_status_label')}</DropdownMenuLabel>
                      {availableStatuses.map(status => (
                        <DropdownMenuItem 
                          key={status}
                          disabled={order.status === status}
                          onSelect={() => handleStatusChange(order.id, status)}
                          className="capitalize"
                        >
                          {t('actions_set_to', { status: t(`status_${status.replace('-', '_')}` as any) || status })}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              {t('table_no_orders')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
