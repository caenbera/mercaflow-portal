
"use client";

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useOrders } from '@/hooks/use-orders';
import { useProducts } from '@/hooks/use-products';
import { useAuth } from '@/context/auth-context';
import { useTranslations, useLocale } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, PiggyBank, Wallet, Repeat, ArrowDown, ArrowUp, Truck, CheckCircle2 } from 'lucide-react';
import type { Order, Product } from '@/types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subYears } from 'date-fns';
import { useRouter } from '@/navigation';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const COLORS = ['#27ae60', '#f1c40f', '#2c3e50', '#e74c3c', '#8e44ad'];
type Period = "week" | "month" | "quarter" | "semester" | "year";

// Helper function to get semester dates
const getSemesterDetails = (date: Date) => {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month < 6) { // First semester (Jan - Jun)
    return { start: new Date(year, 0, 1), end: new Date(year, 5, 30, 23, 59, 59, 999) };
  } else { // Second semester (Jul - Dec)
    return { start: new Date(year, 6, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) };
  }
};

export function ClientDashboard() {
  const t = useTranslations('ClientDashboardPage');
  const tLog = useTranslations('Logistics');
  const router = useRouter();
  const { userProfile } = useAuth();
  const locale = useLocale();
  const { orders, loading: ordersLoading } = useOrders();
  const { products, loading: productsLoading } = useProducts();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('year');

  const loading = ordersLoading || productsLoading;

  const dashboardData = useMemo(() => {
    if (loading || !userProfile) {
        return {
            monthSpend: 0,
            pendingBalance: 0,
            topProducts: [],
            savingsData: { currentSavings: 0, comparison: null },
            spendChartData: [],
            categoryChartData: [],
            activeTrackingOrder: null,
        };
    }

    const now = new Date();

    // Active Tracking Order (shipped or active in route)
    const activeTrackingOrder = orders.find(o => o.status === 'shipped' || (o.status === 'delivered' && o.deliveryInfo?.deliveredAt && (now.getTime() - o.deliveryInfo.deliveredAt.toMillis() < 3600000)));

    // Month Spend
    const currentMonthStr = format(now, 'yyyy-MM');
    const monthSpend = orders
      .filter(order => order.createdAt && format(order.createdAt.toDate(), 'yyyy-MM') === currentMonthStr)
      .reduce((sum, order) => sum + order.total, 0);
    
    // Pending Balance
    const pendingBalance = orders
        .filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
        .reduce((sum, order) => sum + order.total, 0);

    // Top Products
    const productCounts = orders.flatMap(order => order.items).reduce((acc, item) => {
        acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>);
    const topProductIds = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(entry => entry[0]);
    const topProducts = topProductIds.map(id => {
        const product = products.find(p => p.id === id);
        if (!product) return null;
        const totalSpent = orders.flatMap(o => o.items).filter(i => i.productId === id).reduce((sum, i) => sum + i.price * i.quantity, 0);
        return { ...product, totalQuantity: productCounts[id], totalSpent };
    }).filter((p): p is (Product & { totalQuantity: number, totalSpent: number }) => !!p?.id);

    // Savings Card
    let startDate: Date, endDate: Date;
    switch (selectedPeriod) {
        case 'week': startDate = startOfWeek(now); endDate = endOfWeek(now); break;
        case 'month': startDate = startOfMonth(now); endDate = endOfMonth(now); break;
        case 'quarter': startDate = startOfQuarter(now); endDate = endOfQuarter(now); break;
        case 'semester': { const sem = getSemesterDetails(now); startDate = sem.start; endDate = sem.end; break; }
        case 'year': default: startDate = startOfYear(now); endDate = endOfYear(now); break;
    }
    const currentOrders = orders.filter(o => o.createdAt.toDate() >= startDate && o.createdAt.toDate() <= endDate);
    const currentSavings = currentOrders.reduce((sum, order) => sum + (order.discountApplied || 0), 0);
    
    let comparison = null;
    const registrationDate = userProfile.createdAt.toDate();
    if (registrationDate < subYears(now, 1)) {
        const prevStartDate = subYears(startDate, 1);
        const prevEndDate = subYears(endDate, 1);
        const prevOrders = orders.filter(o => o.createdAt.toDate() >= prevStartDate && o.createdAt.toDate() <= prevEndDate);
        const previousSavings = prevOrders.reduce((sum, order) => sum + (order.discountApplied || 0), 0);
        if (previousSavings > 0) {
            const percentageChange = ((currentSavings - previousSavings) / previousSavings) * 100;
            comparison = { value: percentageChange };
        } else if (currentSavings > 0) {
            comparison = { value: 100 }; // If no savings last year, any saving is a 100% increase
        }
    }
    const savingsData = { currentSavings, comparison };
    
    // Spend Chart
    const spendChartData = Array.from({ length: 6 }).map((_, i) => {
        const d = subYears(startOfMonth(now), i/12);
        const monthStr = format(d, 'MMM');
        const monthKey = format(d, 'yyyy-MM');
        const total = orders.filter(o => format(o.createdAt.toDate(), 'yyyy-MM') === monthKey).reduce((sum, o) => sum + o.total, 0);
        return { name: monthStr, Gasto: total };
    }).reverse();

    // Category Chart
    const salesByCategory: { [category: string]: number } = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if(product) {
                const categoryName = product.category[locale as 'es' | 'en'];
                salesByCategory[categoryName] = (salesByCategory[categoryName] || 0) + (item.price * item.quantity);
            }
        });
    });
    const totalSales = Object.values(salesByCategory).reduce((sum, val) => sum + val, 0);
    const categoryChartData = totalSales > 0 ? Object.entries(salesByCategory).map(([name, value]) => ({
      name,
      value: parseFloat(((value / totalSales) * 100).toFixed(1))
    })).sort((a, b) => b.value - a.value) : [];

    return { monthSpend, pendingBalance, topProducts, savingsData, spendChartData, categoryChartData, activeTrackingOrder };
  }, [orders, products, loading, userProfile, locale, selectedPeriod]);

  const budget = 5000;
  const budgetPercentage = Math.min((dashboardData.monthSpend / budget) * 100, 100);

  return (
    <div className="flex flex-col gap-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="bg-card p-4 rounded-b-2xl shadow-sm md:shadow-none md:rounded-none md:bg-transparent md:p-6 lg:p-8">
        <div className="flex justify-between items-center">
            <div>
                <div className="text-sm text-muted-foreground">{t('welcome_back')}</div>
                <div className="text-xl font-bold text-primary">{userProfile?.businessName || <Skeleton className="h-6 w-48"/>}</div>
            </div>
            <Avatar>
                <AvatarImage src={`https://ui-avatars.com/api/?name=${userProfile?.businessName}&background=27ae60&color=fff`} />
                <AvatarFallback>{userProfile ? getInitials(userProfile.businessName) : 'U'}</AvatarFallback>
            </Avatar>
        </div>

        {/* Tracking Card */}
        {dashboardData.activeTrackingOrder && (
          <Card className={cn(
            "mt-4 overflow-hidden border-none shadow-xl transition-all",
            dashboardData.activeTrackingOrder.status === 'delivered' ? "bg-green-600 text-white" : "bg-slate-900 text-white"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  {dashboardData.activeTrackingOrder.status === 'delivered' ? <CheckCircle2 className="h-4 w-4" /> : <Truck className="h-4 w-4 animate-bounce" />}
                  {dashboardData.activeTrackingOrder.status === 'delivered' ? "PEDIDO ENTREGADO" : tLog('tracking_card_title')}
                </h3>
                <Badge variant="outline" className="border-white/20 text-white text-[10px]">
                  #{dashboardData.activeTrackingOrder.id.substring(0,6).toUpperCase()}
                </Badge>
              </div>
              
              {dashboardData.activeTrackingOrder.status === 'delivered' ? (
                <p className="text-sm font-medium">
                  {tLog('tracking_delivered_msg', { 
                    person: dashboardData.activeTrackingOrder.deliveryInfo?.receivedBy || 'Usted',
                    time: format(dashboardData.activeTrackingOrder.deliveryInfo?.deliveredAt?.toDate() || new Date(), 'HH:mm')
                  })}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium opacity-90">
                    {tLog('tracking_driver_info', { 
                      driverName: dashboardData.activeTrackingOrder.deliveryInfo?.driverName || 'Nuestro equipo',
                      vehicle: 'Unidad de Reparto' 
                    })}
                  </p>
                  <div className="flex items-center gap-4 pt-2 border-t border-white/10 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Llegada</span>
                      <span className="text-lg font-black text-primary">15-20 MIN</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <p className="text-[10px] font-medium text-slate-400 italic">
                      {tLog('tracking_stop_number', { number: 3 })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mt-4 bg-primary text-primary-foreground border-none shadow-lg relative overflow-hidden">
            <div className="absolute w-24 h-24 bg-white/5 rounded-full -top-5 -right-5"></div>
            <div className="absolute w-16 h-16 bg-white/5 rounded-full bottom-2 left-2"></div>
            <CardContent className="p-4 relative z-10">
                <div className="flex justify-between text-sm">
                    <span className="opacity-90">{t('expenses_this_month')}</span>
                    {loading ? <Skeleton className="h-5 w-24 bg-white/20"/> : <span className="font-semibold">{formatCurrency(dashboardData.monthSpend)} <span className="opacity-70 font-normal">/ {formatCurrency(budget)}</span></span>}
                </div>
                <Progress value={budgetPercentage} className="h-2 my-3 bg-white/20 [&>div]:bg-accent" />
                <div className="flex items-center gap-2 text-xs opacity-90">
                    <AlertCircle className="h-4 w-4"/>
                    <span>{t('budget_message')}</span>
                </div>
            </CardContent>
        </Card>
      </div>

       <div className="px-4 md:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                  <Card>
                      <CardHeader className='pb-2'>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xs text-muted-foreground font-semibold uppercase">{t('saved_ytd')}</CardTitle>
                          <Select defaultValue="year" onValueChange={(value: Period) => setSelectedPeriod(value)}>
                            <SelectTrigger className="h-7 w-[120px] text-xs focus:ring-0 focus:ring-offset-0 border-0 bg-muted/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">{t('period_week')}</SelectItem>
                                <SelectItem value="month">{t('period_month')}</SelectItem>
                                <SelectItem value="quarter">{t('period_quarter')}</SelectItem>
                                <SelectItem value="semester">{t('period_semester')}</SelectItem>
                                <SelectItem value="year">{t('period_year')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">{formatCurrency(dashboardData.savingsData.currentSavings)}</div>
                          {dashboardData.savingsData.comparison && (
                            <small className={`font-semibold text-xs flex items-center gap-1 ${dashboardData.savingsData.comparison.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {dashboardData.savingsData.comparison.value >= 0 ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3" />}
                                {dashboardData.savingsData.comparison.value.toFixed(0)}% {t('vs_same_period_last_year')}
                            </small>
                          )}
                      </CardContent>
                  </Card>
                  <Card>
                       <CardContent className="p-4">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-500 mb-2"><Wallet className="h-5 w-5"/></div>
                          <div className="text-xs text-muted-foreground font-semibold uppercase">{t('pending_balance')}</div>
                          <div className="text-lg font-bold">{formatCurrency(dashboardData.pendingBalance)}</div>
                          <small className="text-muted-foreground text-xs">{t('due')}: 30 Ene</small>
                      </CardContent>
                  </Card>
              </div>

              <Card>
                  <CardHeader><CardTitle className="text-base">{t('my_expenses_chart_title')}</CardTitle></CardHeader>
                  <CardContent>
                      <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={dashboardData.spendChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => [formatCurrency(value), 'Gasto']}/>
                                  <Bar dataKey="Gasto" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </CardContent>
              </Card>
          </div>

          <div className="flex flex-col gap-4">
              <Card>
                  <CardHeader><CardTitle className="text-base">{t('what_you_buy_most_title')}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                      {loading ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-12 w-full"/>) : (
                          dashboardData.topProducts.map(product => (
                              <div key={product.id} className="flex items-center gap-3 pb-2 border-b last:border-0">
                                <Image src={product.photoUrl || ''} alt={product.name[locale as 'es' | 'en']} width={45} height={45} className="rounded-lg object-cover bg-muted" data-ai-hint="product image"/>
                                <div className="flex-grow">
                                    <div className="font-semibold text-sm">{product.name[locale as 'es' | 'en']}</div>
                                    <div className="text-xs text-muted-foreground">{t('units_purchased', {count: product.totalQuantity})}</div>
                                </div>
                                <div className="font-bold text-accent text-sm">{formatCurrency(product.totalSpent)}</div>
                              </div>
                          ))
                      )}
                      <Button variant="outline" className="w-full" onClick={() => router.push('/client/new-order')}>
                          <Repeat className="mr-2 h-4 w-4"/> {t('buy_again_button')}
                      </Button>
                  </CardContent>
              </Card>

               <Card>
                  <CardHeader><CardTitle className="text-base">{t('expense_by_category_title')}</CardTitle></CardHeader>
                  <CardContent className="flex items-center gap-4">
                      <div className="h-36 w-36">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={dashboardData.categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2}>
                                      {dashboardData.categoryChartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                   <Tooltip contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }} formatter={(value, name) => [`${value}%`, name]}/>
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-2 text-sm">
                        {dashboardData.categoryChartData.slice(0, 3).map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                                {entry.name} ({entry.value}%)
                            </div>
                        ))}
                      </div>
                  </CardContent>
              </Card>
          </div>
       </div>
    </div>
  );
}
