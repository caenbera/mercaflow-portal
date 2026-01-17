"use client";

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  ArrowUp,
  PackageX,
  User,
  Crown,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAllOrders } from '@/hooks/use-all-orders';
import { useProducts } from '@/hooks/use-products';
import { isThisMonth, subDays, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/types';

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const { orders, loading: ordersLoading } = useAllOrders();
  const { products, loading: productsLoading } = useProducts();

  const dashboardData = useMemo(() => {
    if (ordersLoading || productsLoading) {
      return null;
    }

    const today = new Date();
    
    // Resumen Operativo
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const deliveriesToday = orders.filter(order => order.status === 'shipped').length; // Simplified logic
    const lowStockProducts = products.filter(product => product.stock < 10).slice(0, 5);

    // Rendimiento Financiero
    const monthSales = orders
      .filter(order => order.createdAt && isThisMonth(order.createdAt.toDate()))
      .reduce((sum, order) => sum + order.total, 0);

    const thirtyDaysAgo = subDays(today, 30);
    const salesLast30Days = orders.filter(
      order => order.createdAt && order.createdAt.toDate() > thirtyDaysAgo
    );

    const salesByDay = salesLast30Days.reduce((acc, order) => {
        const date = format(order.createdAt.toDate(), 'MMM d');
        if (!acc[date]) {
            acc[date] = { date, total: 0 };
        }
        acc[date].total += order.total;
        return acc;
    }, {} as Record<string, { date: string, total: number }>);
    
    const chartData = Object.values(salesByDay).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const monthOrders = orders.filter(order => order.createdAt && isThisMonth(order.createdAt.toDate()));
    const averageOrderValue = monthOrders.length > 0 ? monthSales / monthOrders.length : 0;
    
    // Información de Clientes
    const salesByClient = monthOrders.reduce((acc, order) => {
        if (!acc[order.businessName]) {
            acc[order.businessName] = 0;
        }
        acc[order.businessName] += order.total;
        return acc;
    }, {} as Record<string, number>);

    const topClients = Object.entries(salesByClient)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, total]) => ({ name, total }));

    // Información de Productos
    const salesByProduct = monthOrders.flatMap(o => o.items).reduce((acc, item) => {
        if (!acc[item.productName]) {
            acc[item.productName] = 0;
        }
        acc[item.productName] += item.quantity;
        return acc;
    }, {} as Record<string, number>);

    const topProducts = Object.entries(salesByProduct)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

    return {
      pendingOrders,
      deliveriesToday,
      lowStockProducts,
      monthSales,
      chartData,
      averageOrderValue,
      topClients,
      topProducts
    };
  }, [orders, products, ordersLoading, productsLoading]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const loading = ordersLoading || productsLoading;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('dashboard_title')}</h1>
        <p className="text-muted-foreground">Una visión 360° de tu negocio.</p>
      </div>

      {/* Resumen Operativo */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Resumen Operativo</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pendientes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{dashboardData?.pendingOrders}</div>}
              <p className="text-xs text-muted-foreground">Pedidos que necesitan ser preparados.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregas para Hoy</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{dashboardData?.deliveriesToday}</div>}
              <p className="text-xs text-muted-foreground">Pedidos en estado 'Enviado'.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Rendimiento Financiero */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Rendimiento Financiero</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{formatCurrency(dashboardData?.monthSales || 0)}</div>}
                    <p className="text-xs text-muted-foreground">+12% vs. mes anterior (ejemplo)</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Promedio de Pedido (AOV)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{formatCurrency(dashboardData?.averageOrderValue || 0)}</div>}
                    <p className="text-xs text-muted-foreground">En el mes actual</p>
                </CardContent>
            </Card>
        </div>
         <Card className="mt-4">
            <CardHeader>
                <CardTitle>Ventas (Últimos 30 días)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                {loading ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardData?.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" fontSize={12} />
                            <YAxis tickFormatter={(value) => formatCurrency(value as number)} fontSize={12} />
                            <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '0.5rem' }} formatter={(value) => [formatCurrency(value as number), 'Ventas']} />
                            <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
      </section>

      {/* Información de Clientes y Productos */}
      <section className="grid md:grid-cols-2 gap-8">
        <div>
            <h2 className="text-xl font-semibold mb-4">Información de Clientes</h2>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Crown className="text-yellow-500" /> Top 5 Clientes (este Mes)</CardTitle>
                </CardHeader>
                <CardContent>
                   {loading ? <Skeleton className="h-40 w-full" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre del Negocio</TableHead>
                                    <TableHead className="text-right">Total Gastado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dashboardData?.topClients.map(client => (
                                    <TableRow key={client.name}>
                                        <TableCell className="font-medium">{client.name}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(client.total)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                   )}
                </CardContent>
            </Card>
        </div>
         <div>
            <h2 className="text-xl font-semibold mb-4">Información de Productos</h2>
             <Card>
                <CardHeader>
                    <CardTitle>Productos Más Vendidos (este Mes)</CardTitle>
                </CardHeader>
                <CardContent>
                     {loading ? <Skeleton className="h-40 w-full" /> : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">Cantidad Vendida</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {dashboardData?.topProducts.map(product => (
                                    <TableRow key={product.name}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="text-right">{product.quantity} uds.</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </Card>
             <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="text-base">Productos con Bajo Stock</CardTitle>
                    <CardDescription>Menos de 10 unidades disponibles.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-20 w-full" /> : (
                        <ul className="space-y-2 text-sm">
                            {dashboardData?.lowStockProducts.map(p => (
                                <li key={p.id} className="flex justify-between items-center">
                                    <span>{p.name}</span>
                                    <Badge variant="destructive">{p.stock} en stock</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}
