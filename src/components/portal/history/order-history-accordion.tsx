"use client";

import { useRouter } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Order, OrderStatus } from '@/types';
import { format } from 'date-fns';
import { Repeat } from 'lucide-react';

interface OrderHistoryAccordionProps {
  orders: Order[];
}

export function OrderHistoryAccordion({ orders }: OrderHistoryAccordionProps) {
  const t = useTranslations('ClientHistoryPage');
  const router = useRouter();
  const { toast } = useToast();
  const locale = useLocale();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'dd MMM, yyyy');
  };

  const statusMap: Record<OrderStatus, { text: string; className: string }> = {
    delivered: { text: t('status_delivered'), className: 'status-delivered' },
    pending: { text: t('status_pending'), className: 'status-pending' },
    processing: { text: t('status_processing'), className: 'status-pending' },
    shipped: { text: t('status_shipped'), className: 'status-pending' },
    cancelled: { text: t('status_cancelled'), className: 'status-cancelled' },
  };

  const handleReorder = (orderId: string) => {
    // In a real app, this would add items to the cart context/state
    toast({
      title: t('reorder_toast_title'),
      description: t('reorder_toast_description'),
    });
    router.push('/client/new-order');
  };

  if (orders.length === 0) {
    return <p className="text-center text-muted-foreground py-10">You have no orders yet.</p>
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {orders.map((order) => {
        const statusInfo = statusMap[order.status] || { text: order.status, className: '' };
        return (
          <AccordionItem value={order.id} key={order.id} className="bg-card rounded-xl border overflow-hidden shadow-sm">
            <AccordionTrigger className="p-4 hover:no-underline [&[data-state=open]>div>div>svg]:rotate-180">
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className="font-bold text-primary">{`#${order.id.substring(0, 7).toUpperCase()}`}</div>
                  <div className="text-xs text-muted-foreground text-left">{formatDate(order.createdAt)}</div>
                  <Badge variant="outline" className={`mt-2 text-xs font-bold ${statusInfo.className}`}>{statusInfo.text}</Badge>
                </div>
                <div className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(order.total)}</div>
                     <svg className="h-4 w-4 text-muted-foreground inline-block transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-muted/30 border-t border-dashed px-4 pt-4 pb-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">{t('product_summary')}</h4>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{item.productName[locale as 'es' | 'en']}</span>
                    <span className="text-muted-foreground">{item.quantity}</span>
                  </div>
                ))}
              </div>
              <hr className="my-4 opacity-25" />
              <Button variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground" onClick={() => handleReorder(order.id)}>
                <Repeat className="mr-2 h-4 w-4" />
                {t('reorder_button')}
              </Button>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
