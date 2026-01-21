"use client";

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter as TableFoot,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, CalendarDays, Info } from 'lucide-react';
import type { Order } from '@/types';
import { useTranslations } from 'next-intl';

interface OrderDetailsDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  const t = useTranslations('OrdersPage');
  const locale = useLocale();

  const handlePrint = () => {
    document.body.classList.add('is-printing');
    window.print();
  };

  useEffect(() => {
    const afterPrint = () => {
      document.body.classList.remove('is-printing');
    };
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  if (!order) return null;

  const client = { // Placeholder data from prototype
    address: order.shippingAddress,
    phone: "(305) 555-0123"
  }

  const getNextStatus = () => {
    switch (order.status) {
      case 'pending': return 'processing';
      case 'processing': return 'shipped';
      case 'shipped': return 'delivered';
      default: return null;
    }
  };
  const nextStatus = getNextStatus();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl print-this-dialog">
        <div className="no-print">
          <DialogHeader>
            <DialogTitle>{t('details_title')} #{order.id.substring(0,7).toUpperCase()}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="print-header hidden print:block mb-4">
             <h1 className="text-2xl font-bold">Detalle Pedido #{order.id.substring(0,7).toUpperCase()}</h1>
        </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            <div>
              <h3 className="text-xs text-muted-foreground font-bold uppercase">{t('details_client_label')}</h3>
              <p className="font-bold">{order.businessName}</p>
              <p className="text-sm text-muted-foreground">{client.address}</p>
              <p className="text-sm text-muted-foreground">{client.phone}</p>
            </div>
            <div className="text-left sm:text-right">
              <h3 className="text-xs text-muted-foreground font-bold uppercase">{t('details_delivery_label')}</h3>
              <p className="font-bold flex items-center gap-2 justify-start sm:justify-end">
                <CalendarDays className="h-4 w-4" />
                Tomorrow, {new Date(new Date().getTime() + 24*60*60*1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
              </p>
              <Badge variant="secondary">North Route</Badge>
            </div>
          </div>

          <ScrollArea className="h-64 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('details_product_header')}</TableHead>
                  <TableHead className="text-center">{t('details_qty_header')}</TableHead>
                  <TableHead className="text-right">{t('details_price_header')}</TableHead>
                  <TableHead className="text-right">{t('details_total_header')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.productName[locale as 'es' | 'en']}
                      {/* Placeholder for notes */}
                      {index === 0 && <p className="text-xs text-muted-foreground italic">Nota: "Que estén verdes"</p>}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(item.price * item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFoot>
                <TableRow className="text-lg font-bold">
                  <TableCell colSpan={3} className="text-right">{t('details_total_header').toUpperCase()}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(order.total)}</TableCell>
                </TableRow>
              </TableFoot>
            </Table>
          </ScrollArea>
           
           <Alert className="mt-4">
             <Info className="h-4 w-4" />
             <AlertDescription>
                <strong>{t('details_client_note')}</strong> "Por favor llegar antes de las 10am, entrar por la puerta trasera."
             </AlertDescription>
           </Alert>

        <DialogFooter className="mt-4 no-print">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            {t('details_print_button')}
          </Button>
          {nextStatus && (
            <Button>
              {t('details_update_button', { status: t(`status_${nextStatus}` as any) })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
