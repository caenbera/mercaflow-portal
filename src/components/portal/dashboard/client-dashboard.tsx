"use client";

import { useMemo } from 'react';
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AlertCircle, PiggyBank, Wallet, Repeat } from 'lucide-react';
import type { Product } from '@/types';
import { format } from 'date-fns';
import { useRouter } from '@/navigation';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const spendChartData = [
  { name: 'Ago', Gasto: 2100 },
  { name: 'Sep', Gasto: 2400 },
  { name: 'Oct', Gasto: 1800 },
  { name: 'Nov', Gasto: 3200 },
  { name: 'Dic', Gasto: 4500 },
  { name: 'Ene', Gasto: 3250 },
];

const categoryChartData = [
  { name: 'Verduras', value: 55 },
  { name: 'Frutas', value: 25 },
  { name: 'Otros', value: 20 },
];

const COLORS = ['#27ae60', '#f1c40f', '#2c3e50'];


export function ClientDashboard() {
  const t = useTranslations('ClientDashboardPage');
  const router = useRouter();
  const { userProfile } = useAuth();
  const locale = useLocale();
  const { orders, loading: ordersLoading } = useOrders();
  const { products, loading: productsLoading } = useProducts();

  const loading = ordersLoading || productsLoading;

  const dashboardData = useMemo(() => {
    if (loading) {
      return {
        monthSpend: 0,
        topProducts: [],
      };
    }

    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const monthSpend = orders
      .filter(order => order.createdAt && format(order.createdAt.toDate(), 'yyyy-MM') === currentMonth)
      .reduce((sum, order) => sum + order.total, 0);

    const productCounts = orders
      .flatMap(order => order.items)
      .reduce((acc, item) => {
        acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

    const topProductIds = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    const topProducts = topProductIds.map(id => {
        const product = products.find(p => p.id === id);
        return {
            ...product,
            totalQuantity: productCounts[id],
            // Mocking total spent per product as it's not easily calculable
            totalSpent: Math.random() * 500 + 300 
        }
      }).filter((p): p is (Product & { totalQuantity: number, totalSpent: number }) => !!p?.id);

    return { monthSpend, topProducts };

  }, [orders, products, loading]);

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

        {/* Budget Card */}
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

       {/* Main Grid */}
       <div className="px-4 md:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Main content - Left Column on Desktop */}
          <div className="md:col-span-2 flex flex-col gap-4">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                  <Card>
                      <CardContent className="p-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-yellow-100 text-yellow-500 mb-2"><PiggyBank className="h-5 w-5"/></div>
                          <div className="text-xs text-muted-foreground font-semibold uppercase">{t('saved_ytd')}</div>
                          <div className="text-lg font-bold">{formatCurrency(845.00)}</div>
                          <small className="text-green-600 font-semibold text-xs">+12% {t('vs_2023')}</small>
                      </CardContent>
                  </Card>
                  <Card>
                       <CardContent className="p-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-500 mb-2"><Wallet className="h-5 w-5"/></div>
                          <div className="text-xs text-muted-foreground font-semibold uppercase">{t('pending_balance')}</div>
                          <div className="text-lg font-bold">{formatCurrency(1250.00)}</div>
                          <small className="text-muted-foreground text-xs">{t('due')}: 30 Jan</small>
                      </CardContent>
                  </Card>
              </div>

               {/* Spend Chart */}
              <Card>
                  <CardHeader>
                      <CardTitle className="text-base">{t('my_expenses_chart_title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={spendChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}/>
                                  <Bar dataKey="Gasto" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </CardContent>
              </Card>
          </div>

          {/* Right Column on Desktop */}
          <div className="flex flex-col gap-4">
              {/* Top Products */}
              <Card>
                  <CardHeader>
                      <CardTitle className="text-base">{t('what_you_buy_most_title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      {loading ? Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-12 w-full"/>) : (
                          dashboardData.topProducts.map(product => (
                              <div key={product.id} className="flex items-center gap-3 pb-2 border-b last:border-0">
                                <Image src={product.photoUrl} alt={product.name[locale as 'es' | 'en']} width={45} height={45} className="rounded-lg object-cover" data-ai-hint="product image"/>
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

                {/* Category Chart */}
               <Card>
                  <CardHeader>
                      <CardTitle className="text-base">{t('expense_by_category_title')}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4">
                      <div className="h-36 w-36">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={2}>
                                      {categoryChartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                   <Tooltip contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}/>
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{backgroundColor: COLORS[0]}}></div>{t('category_vegetables')} (55%)</div>
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{backgroundColor: COLORS[1]}}></div>{t('category_fruits')} (25%)</div>
                        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{backgroundColor: COLORS[2]}}></div>{t('category_others')} (20%)</div>
                      </div>
                  </CardContent>
              </Card>
          </div>
       </div>
    </div>
  );
}
