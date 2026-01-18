"use client";

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  DollarSign,
  ShoppingBasket,
  UserPlus,
  Receipt,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Clock,
  Check,
  Trophy,
  Eye,
  Leaf
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

type Period = 'hoy' | 'semana' | 'mes' | 'trimestre' | 'anio';
type KpiMetric = 'sales' | 'orders' | 'clients' | 'ticket';

const kpiData = {
    sales: {
        hoy: { val: "$2,450", trend: "+12% vs ayer", trendType: "up" },
        semana: { val: "$18,500", trend: "+8% vs sem. ant.", trendType: "up" },
        mes: { val: "$74,200", trend: "-2% vs mes ant.", trendType: "down" },
        trimestre: { val: "$210,000", trend: "+15% vs Q ant.", trendType: "up" },
        anio: { val: "$850,000", trend: "+20% YTD", trendType: "up" }
    },
    orders: {
        hoy: { val: "18", trend: "5 pendientes", trendType: "pending" }, 
        semana: { val: "145", trend: "100% entregados", trendType: "up" },
        mes: { val: "620", trend: "98% a tiempo", trendType: "up" },
        trimestre: { val: "1,850", trend: "99% a tiempo", trendType: "up" },
        anio: { val: "7,400", trend: "Record histórico", trendType: "trophy" }
    },
    clients: {
        hoy: { val: "1", trend: "+1 vs ayer", trendType: "up" },
        semana: { val: "8", trend: "+3 vs sem. ant.", trendType: "up" },
        mes: { val: "25", trend: "+10% vs mes ant.", trendType: "up" },
        trimestre: { val: "65", trend: "-5% vs Q ant.", trendType: "down" },
        anio: { val: "240", trend: "+40% YTD", trendType: "up" }
    },
    ticket: {
        hoy: { val: "$320", trend: "+5%", trendType: "up" },
        semana: { val: "$450", trend: "+12%", trendType: "up" },
        mes: { val: "$410", trend: "-3%", trendType: "down" },
        trimestre: { val: "$390", trend: "+2%", trendType: "up" },
        anio: { val: "$385", trend: "+8%", trendType: "up" }
    }
};

const salesChartData = [
  { name: 'Lun', sales: 1500 },
  { name: 'Mar', sales: 2100 },
  { name: 'Mie', sales: 1800 },
  { name: 'Jue', sales: 2400 },
  { name: 'Vie', sales: 2350 },
  { name: 'Sab', sales: 2800 },
  { name: 'Dom', sales: 1900 },
];

const categoryChartData = [
  { name: 'Verduras', value: 45 },
  { name: 'Frutas', value: 25 },
  { name: 'Abarrotes', value: 20 },
  { name: 'Congelados', value: 10 },
];
const COLORS = ['#27ae60', '#f39c12', '#2980b9', '#8e44ad'];

const recentOrdersData = [
  { id: '#ORD-8852', client: 'Tacos El Rey USA', amount: 450.00, status: 'Nuevo' },
  { id: '#ORD-8851', client: 'Hotel Miami Beach', amount: 1200.50, status: 'En Ruta' },
  { id: '#ORD-8850', client: 'La Piazza Ristorante', amount: 210.00, status: 'Entregado' },
];

const topProductsData = [
    { name: 'Tomate Chonto', sold: '1,200 Kg vendidos', value: 18500, stockStatus: 'low', stockPercent: 15, img: 'https://i.postimg.cc/TY6YMwmY/tomate_chonto.png' },
    { name: 'Limón Tahití', sold: '980 Kg vendidos', value: 12400, stockStatus: 'ok', stockPercent: 0, img: 'https://i.postimg.cc/43dFY6CX/limon.png' }
];

const periodLabels: Record<Period, string> = {
  hoy: "Hoy",
  semana: "Esta Semana",
  mes: "Este Mes",
  trimestre: "Este Trimestre",
  anio: "Este Año"
};

const KpiTrend = ({ type, text }: { type: string, text: string }) => {
  const TrendIcon = useMemo(() => {
    switch (type) {
      case 'up': return <ArrowUp className="h-3 w-3" />;
      case 'down': return <ArrowDown className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'trophy': return <Trophy className="h-3 w-3" />;
      default: return null;
    }
  }, [type]);

  const className = useMemo(() => {
    switch (type) {
      case 'up': return "text-green-600 bg-green-100";
      case 'down': return "text-red-600 bg-red-100";
      case 'pending': return "text-orange-600 bg-orange-100";
      case 'trophy': return "text-amber-600 bg-amber-100";
      default: return "text-gray-600 bg-gray-100";
    }
  }, [type]);

  return (
    <div className={`text-xs font-semibold mt-1 inline-flex items-center gap-1 py-1 px-2 rounded-full ${className}`}>
      {TrendIcon}
      <span>{text}</span>
    </div>
  );
};


export default function DashboardPage() {
  const [salesPeriod, setSalesPeriod] = useState<Period>('hoy');
  const [ordersPeriod, setOrdersPeriod] = useState<Period>('hoy');
  const [clientsPeriod, setClientsPeriod] = useState<Period>('hoy');
  const [ticketPeriod, setTicketPeriod] = useState<Period>('hoy');

  const currentDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  const kpiCards = [
    { 
      metric: 'sales' as KpiMetric, 
      label: 'Ventas', 
      period: salesPeriod, 
      setPeriod: setSalesPeriod, 
      data: kpiData.sales[salesPeriod], 
      icon: <DollarSign />,
      iconBg: 'bg-green-100 text-green-600'
    },
    { 
      metric: 'orders' as KpiMetric, 
      label: 'Pedidos', 
      period: ordersPeriod, 
      setPeriod: setOrdersPeriod, 
      data: kpiData.orders[ordersPeriod], 
      icon: <ShoppingBasket />,
      iconBg: 'bg-blue-100 text-blue-600'
    },
    { 
      metric: 'clients' as KpiMetric, 
      label: 'Clientes', 
      period: clientsPeriod, 
      setPeriod: setClientsPeriod, 
      data: kpiData.clients[clientsPeriod], 
      icon: <UserPlus />,
      iconBg: 'bg-purple-100 text-purple-600'
    },
    { 
      metric: 'ticket' as KpiMetric, 
      label: 'Ticket Prom.', 
      period: ticketPeriod, 
      setPeriod: setTicketPeriod, 
      data: kpiData.ticket[ticketPeriod], 
      icon: <Receipt />,
      iconBg: 'bg-orange-100 text-orange-600'
    },
  ];

   const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Nuevo': return <Badge className="bg-[#e3f2fd] text-[#2196f3] hover:bg-[#e3f2fd]/80">Nuevo</Badge>;
      case 'En Ruta': return <Badge className="bg-[#fff3e0] text-[#ff9800] hover:bg-[#fff3e0]/80">En Ruta</Badge>;
      case 'Entregado': return <Badge className="bg-[#e8f5e9] text-[#2ecc71] hover:bg-[#e8f5e9]/80">Entregado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-8 bg-gray-50/50 p-0 sm:p-4 rounded-xl">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Hola, Administrador 👋</h1>
        <p className="text-muted-foreground">Resumen de actividad, <span id="currentDate">{currentDate}</span></p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map(({ metric, label, period, setPeriod, data, icon, iconBg }) => (
          <Card key={metric} className="shadow-sm hover:shadow-md transition-shadow duration-200 rounded-2xl">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-gray-500 uppercase">{label} {periodLabels[period]}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(Object.keys(periodLabels) as Period[]).map(p => (
                      <DropdownMenuItem key={p} onSelect={() => setPeriod(p)}>
                        {periodLabels[p]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-3xl font-extrabold text-gray-800">{data.val}</div>
                  <KpiTrend type={data.trendType} text={data.trend} />
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                  {icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">Rendimiento de Ventas</h3>
            <Button variant="ghost" size="sm">Este Mes</Button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#27ae60" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#27ae60" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} dy={10} />
                <YAxis tickLine={false} axisLine={false} dx={-10}/>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '0.75rem', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0' 
                  }}
                  itemStyle={{ fontWeight: '600' }}
                  labelStyle={{ fontWeight: 'normal', color: '#64748b' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#27ae60" strokeWidth={3} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="shadow-sm rounded-2xl p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Top Categorías</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={10} />
                 <Tooltip formatter={(value, name) => [`${value}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-center text-sm text-gray-500">Verduras representa el 45% del ingreso</p>
        </Card>
      </div>

      {/* RECENT ORDERS & TOP PRODUCTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="shadow-sm rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">Pedidos Recientes</h3>
            <Button variant="link" size="sm">Ver Todos</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrdersData.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-bold">{order.id}</TableCell>
                  <TableCell>{order.client}</TableCell>
                  <TableCell className="font-bold">${order.amount.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

         <Card className="shadow-sm rounded-2xl p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Top Productos (Alerta Stock)</h3>
            <div className="space-y-4">
              {topProductsData.map((product) => (
                <div key={product.name} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                    <Image src={product.img} alt={product.name} width={40} height={40} className="rounded-md" />
                    <div className="flex-grow">
                        <div className="font-bold text-gray-800">{product.name}</div>
                        <small className="text-gray-500">{product.sold}</small>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-green-600">${product.value.toLocaleString()}</div>
                        {product.stockStatus === 'low' ? (
                          <small className="font-bold text-yellow-600">Stock Bajo ({product.stockPercent}%)</small>
                        ) : (
                          <small className="text-green-500">Stock OK</small>
                        )}
                    </div>
                </div>
              ))}
            </div>
         </Card>
      </div>

    </div>
  );
}
