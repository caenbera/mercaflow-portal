"use client";

import { useMemo } from 'react';
import { useOrders } from '@/hooks/use-orders';
import { useProducts } from '@/hooks/use-products';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRight, History, Info, Package, Repeat, ShoppingCart, TrendingUp } from 'lucide-react';
import type { Order, OrderItem, Product } from '@/types';
import { format } from 'date-fns';
import { useRouter } from '@/navigation';

export function ClientDashboard() {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const { orders, loading: ordersLoading } = useOrders();
  const { products, loading: productsLoading } = useProducts();

  const loading = ordersLoading || productsLoading;

  const dashboardData = useMemo(() => {
    if (loading || orders.length === 0) {
      return {
        lastOrder: null,
        frequentProducts: [],
        monthSpend: 0,
        recentOrders: [],
      };
    }

    const lastOrder = orders[0];

    const productCounts = orders
      .flatMap(order => order.items)
      .reduce((acc, item) => {
        acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

    const frequentProductIds = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    const frequentProducts = frequentProductIds
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined);

    const monthSpend = orders
      .filter(order => order.createdAt && format(order.createdAt.toDate(), 'yyyy-MM') === format(new Date(), 'yyyy-MM'))
      .reduce((sum, order) => sum + order.total, 0);

    const recentOrders = orders.slice(0, 3);

    return { lastOrder, frequentProducts, monthSpend, recentOrders };

  }, [orders, products, loading]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM dd, yyyy');
  };

  const getStatusVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'default';
      case 'processing': return 'secondary';
      case 'shipped': return 'secondary';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const handleRepeatOrder = () => {
    if (dashboardData.lastOrder) {
      const items = dashboardData.lastOrder.items.map(item => `${item.productId}:${item.quantity}`).join(',');
      router.push(`/client/new-order?repeat=${items}`);
    }
  };
  
  const handleAddFrequentToOrder = (productId: string) => {
     router.push(`/client/new-order?add=${productId}:1`);
  };

  return (
    <div className="flex flex-col gap-8">
       <div>
        <h1 className="text-3xl font-headline font-bold">Client Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's a quick overview of your account.</p>
      </div>

      {/* Main Actions & Last Order Status */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <Card className="h-full">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Package className="text-primary"/> Your Last Order Status</CardTitle>
                 </CardHeader>
                 <CardContent>
                    {loading ? <Skeleton className="h-20 w-full" /> : (
                        dashboardData.lastOrder ? (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Order on {formatDate(dashboardData.lastOrder.createdAt)}</p>
                                    <p className="text-lg font-semibold">{formatCurrency(dashboardData.lastOrder.total)}</p>
                                </div>
                                 <Badge variant={getStatusVariant(dashboardData.lastOrder.status)} className="text-lg capitalize py-2 px-4">
                                    {dashboardData.lastOrder.status}
                                </Badge>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                        )
                    )}
                 </CardContent>
            </Card>
        </div>
        <div className="flex flex-col gap-4">
            <Button size="lg" onClick={() => router.push('/client/new-order')} className="h-full">
                <ShoppingCart className="mr-2"/>
                Place a New Order
            </Button>
            <Button size="lg" variant="outline" onClick={handleRepeatOrder} disabled={!dashboardData.lastOrder || loading} className="h-full">
                <Repeat className="mr-2"/>
                Repeat Last Order
            </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
             {/* Frequent Products */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="text-primary" /> Your Frequent Products</CardTitle>
                    <CardDescription>Quickly add your most-ordered items to a new order.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-40 w-full" /> : (
                        dashboardData.frequentProducts.length > 0 ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {dashboardData.frequentProducts.map(product => (
                                    <div key={product.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                                        <div>
                                            <p className="font-semibold">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
                                        </div>
                                        <Button size="sm" onClick={() => handleAddFrequentToOrder(product.id)}>Add to Order</Button>
                                    </div>
                                ))}
                             </div>
                        ) : (
                           <div className="text-center py-8">
                             <Info className="mx-auto h-8 w-8 text-muted-foreground mb-2"/>
                             <p className="text-muted-foreground">Once you place a few orders, your favorite products will appear here for quick access.</p>
                           </div>
                        )
                    )}
                </CardContent>
            </Card>
             {/* Recent History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="text-primary"/> Recent Order History</CardTitle>
                    <CardDescription>Your last 3 orders. For a full history, visit the Order History page.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? <Skeleton className="h-48 w-full" /> : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dashboardData.recentOrders.length > 0 ? (
                                    dashboardData.recentOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{formatDate(order.createdAt)}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">No recent orders found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                         </Table>
                     )}
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                     <CardTitle>Spend This Month</CardTitle>
                </CardHeader>
                <CardContent>
                     {loading ? <Skeleton className="h-10 w-1/2" /> : (
                         <p className="text-3xl font-bold">{formatCurrency(dashboardData.monthSpend)}</p>
                     )}
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                     <CardTitle>New & On Sale</CardTitle>
                     <CardDescription>Check out the latest additions to our catalog.</CardDescription>
                </CardHeader>
                <CardContent>
                   {/* This is a placeholder for the carousel */}
                    <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                        <p className="text-muted-foreground">Promotions will appear here</p>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
