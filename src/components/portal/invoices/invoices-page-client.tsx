
"use client";

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Wallet, FileDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from '@/navigation';
import { useInvoices } from '@/hooks/use-invoices';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import type { Invoice } from '@/types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export function InvoicesPageClient() {
  const t = useTranslations('ClientInvoicesPage');
  const router = useRouter();
  const { toast } = useToast();
  const { invoices, loading } = useInvoices();

  const [activeTab, setActiveTab] = useState('unpaid');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { totalBalance, overdueBalance, unpaidInvoices, paidInvoices } = useMemo(() => {
    if (loading) {
      return { totalBalance: 0, overdueBalance: 0, unpaidInvoices: [], paidInvoices: [] };
    }
    const unpaid = invoices.filter(inv => inv.status !== 'paid');
    const paid = invoices.filter(inv => inv.status === 'paid');
    const total = unpaid.reduce((sum, inv) => sum + inv.amount, 0);
    const overdue = unpaid.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);
    return {
      totalBalance: total,
      overdueBalance: overdue,
      unpaidInvoices: unpaid,
      paidInvoices: paid,
    };
  }, [invoices, loading]);

  const selectedTotal = useMemo(() => {
    return selectedInvoices.reduce((sum, id) => {
      const invoice = invoices.find(inv => inv.id === id);
      return sum + (invoice?.amount || 0);
    }, 0);
  }, [selectedInvoices, invoices]);

  const handleSelectInvoice = (invoiceId: string, isChecked: boolean) => {
    setSelectedInvoices(prev => {
      if (isChecked) {
        return [...prev, invoiceId];
      } else {
        return prev.filter(id => id !== invoiceId);
      }
    });
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      toast({
        title: t('payment_success_title'),
        description: t('payment_success_desc', { amount: formatCurrency(selectedTotal) }),
      });
      setIsProcessing(false);
      setSelectedInvoices([]);
    }, 2000);
  };
  
  const renderInvoiceList = (invoicesToRender: Invoice[]) => {
    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }
    if (invoicesToRender.length === 0) {
      return <p className="text-center text-muted-foreground py-10">{t('no_invoices')}</p>;
    }

    return invoicesToRender.map(inv => (
      <Card key={inv.id} className={cn("p-3 flex items-center gap-3 transition-colors", inv.status === 'overdue' && 'border-l-4 border-destructive')}>
        {activeTab === 'unpaid' ? (
          <Checkbox
            id={`inv-${inv.id}`}
            checked={selectedInvoices.includes(inv.id)}
            onCheckedChange={(checked) => handleSelectInvoice(inv.id, !!checked)}
            className="w-5 h-5"
          />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <label htmlFor={`inv-${inv.id}`} className="font-bold cursor-pointer">{inv.id.substring(0, 8).toUpperCase()}</label>
            <span className="font-bold text-sm">{formatCurrency(inv.amount)}</span>
          </div>
          <div className="flex justify-between items-end text-xs">
            <span className="text-muted-foreground">{t('issued_date', { date: format(inv.invoiceDate.toDate(), 'dd MMM, yyyy') })}</span>
            {inv.status === 'overdue' && <span className="font-semibold text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {t('due_date_overdue', { date: format(inv.dueDate.toDate(), 'dd MMM, yyyy') })}</span>}
            {inv.status === 'open' && <span className="text-muted-foreground">{t('due_date_open', { date: format(inv.dueDate.toDate(), 'dd MMM, yyyy') })}</span>}
            {inv.status === 'paid' && <span className="font-semibold text-green-600">{t('paid_status')}</span>}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 bg-blue-50 hover:bg-blue-100 shrink-0">
          <FileDown className="h-4 w-4" />
          <span className="sr-only">{t('download_pdf')}</span>
        </Button>
      </Card>
    ));
  };


  return (
    <div className="pb-40 md:pb-4">
      {/* Header */}
      <div className="bg-card p-4 md:p-6 sticky top-0 z-20 md:shadow-sm">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-bold">{t('title')}</h1>
        </div>

        <Card className="bg-gradient-to-br from-primary to-[#34495e] text-white p-4 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80 uppercase font-semibold">{t('total_to_pay')}</p>
              {loading ? <Skeleton className="h-8 w-32 bg-white/20 mt-1" /> : <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>}
              {overdueBalance > 0 && !loading && <p className="text-xs bg-red-500/80 text-white rounded-md px-2 py-0.5 mt-1 inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>{t('overdue_amount', { amount: formatCurrency(overdueBalance) })}</p>}
            </div>
            <Button variant="secondary" size="sm">{t('payment_methods')}<Wallet className="ml-2 h-4 w-4"/></Button>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 px-4 md:px-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unpaid">{t('pending_tab', { count: unpaidInvoices.length })}</TabsTrigger>
          <TabsTrigger value="paid">{t('history_tab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="unpaid" className="space-y-2 mt-4">
          {renderInvoiceList(unpaidInvoices)}
        </TabsContent>
        <TabsContent value="paid" className="space-y-2 mt-4">
          {renderInvoiceList(paidInvoices)}
        </TabsContent>
      </Tabs>
      
      {activeTab === 'unpaid' && selectedTotal > 0 && (
        <div className="fixed bottom-16 left-0 w-full bg-card p-4 border-t shadow-lg z-30 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md md:rounded-xl">
           <div className="flex justify-between items-center">
             <div>
                <p className="text-sm text-muted-foreground">{t('selected_total')}</p>
                <p className="font-bold text-xl">{formatCurrency(selectedTotal)}</p>
             </div>
             <Button size="lg" disabled={isProcessing} onClick={handleProcessPayment}>
                {isProcessing ? t('processing_payment') : t('pay_button_with_amount', { amount: formatCurrency(selectedTotal) })}
             </Button>
           </div>
        </div>
      )}
    </div>
  );
}
