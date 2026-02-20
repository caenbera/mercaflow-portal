
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useOrganization } from '@/context/organization-context';
import { useDrivers } from '@/hooks/use-drivers';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Truck, Route as RouteIcon, UserCheck, Plus, 
  MapPin, Clock, CheckCircle2, ChevronRight, Navigation,
  BarChart3, History, Timer, User, ShieldCheck, Package
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DriverDialog } from '@/components/admin/logistics/driver-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { DriverProfile, Route } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LogisticsPage() {
  const t = useTranslations('Logistics');
  const locale = useLocale();
  const { activeOrgId } = useOrganization();
  const { drivers, loading: driversLoading } = useDrivers(activeOrgId);
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);

  // Carga de historial de rutas
  useEffect(() => {
    if (!activeOrgId) return;
    const q = query(collection(db, 'routes'), where('organizationId', '==', activeOrgId));
    const unsub = onSnapshot(q, (snap) => {
      setRoutes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Route)));
      setRoutesLoading(false);
    });
    return () => unsub();
  }, [activeOrgId]);

  const stats = useMemo(() => {
    const completed = routes.filter(r => r.status === 'completed');
    
    let totalStopsDelivered = 0;
    let totalServiceTimeMs = 0;
    let serviceTimePointsCount = 0;
    let onTimeCount = 0;

    routes.forEach(route => {
      route.stops.forEach(stop => {
        if (stop.status === 'delivered') {
          totalStopsDelivered++;
          
          if (stop.arrivedAt && stop.completedAt) {
            const arrival = stop.arrivedAt.toMillis();
            const completion = stop.completedAt.toMillis();
            const duration = completion - arrival;
            
            totalServiceTimeMs += duration;
            serviceTimePointsCount++;

            // Consideramos "A tiempo" si el servicio (descarga) tomó menos de 45 minutos
            if (duration < 45 * 60 * 1000) {
              onTimeCount++;
            }
          }
        }
      });
    });

    const avgMinutes = serviceTimePointsCount > 0 
      ? Math.round((totalServiceTimeMs / serviceTimePointsCount) / 60000) 
      : 0;
    
    const onTimeRate = totalStopsDelivered > 0 
      ? Math.round((onTimeCount / totalStopsDelivered) * 100) 
      : 100;

    return {
      totalRoutes: routes.length,
      completedRoutes: completed.length,
      totalDeliveries: totalStopsDelivered,
      avgDeliveryTime: `${avgMinutes} min`,
      onTimeRate: `${onTimeRate}%`
    };
  }, [routes]);

  const handleAddDriver = () => {
    setSelectedDriver(null);
    setIsDriverDialogOpen(true);
  };

  const handleEditDriver = (driver: DriverProfile) => {
    setSelectedDriver(driver);
    setIsDriverDialogOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <DriverDialog 
        open={isDriverDialogOpen} 
        onOpenChange={setIsDriverDialogOpen} 
        driver={selectedDriver} 
      />

      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Truck className="text-primary h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="bg-white p-1 rounded-xl border shadow-sm mb-8 h-auto flex flex-wrap">
          <TabsTrigger value="routes" className="rounded-lg py-2.5 px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <RouteIcon className="h-4 w-4" />
            {t('tab_routes')}
          </TabsTrigger>
          <TabsTrigger value="stats" className="rounded-lg py-2.5 px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4" />
            {t('tab_stats')}
          </TabsTrigger>
          <TabsTrigger value="drivers" className="rounded-lg py-2.5 px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <UserCheck className="h-4 w-4" />
            {t('tab_drivers')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">{t('pending_orders')}</CardTitle>
                <CardDescription>{t('pending_orders_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-12 text-center border-2 border-dashed rounded-2xl bg-slate-50/50">
                  <MapPin className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500">{t('map_instructions')}</p>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold gap-2" disabled>
                  <Navigation className="h-4 w-4" />
                  {t('suggest_routes_ai')}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-md overflow-hidden bg-slate-100 min-h-[500px] flex items-center justify-center">
               <div className="text-center">
                  <p className="text-slate-400 font-medium">{t('map_title')}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">{t('map_loading')}</p>
               </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-center">
                  <Timer className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-black text-slate-900">{stats.avgDeliveryTime}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('stats_avg_delivery_time')}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-black text-slate-900">{stats.totalDeliveries}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('stats_total_deliveries')}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-black text-slate-900">{stats.onTimeRate}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">{t('stats_on_time_rate')}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 text-white">
                <CardContent className="p-4 text-center">
                  <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-black text-white">{stats.totalRoutes}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400">{t('stats_total_trips')}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" /> {t('log_title')}
                </CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">{t('log_driver')}</TableHead>
                    <TableHead>{t('log_header_date')}</TableHead>
                    <TableHead>{t('log_status')}</TableHead>
                    <TableHead>{t('log_header_points')}</TableHead>
                    <TableHead className="text-right pr-6">{t('log_header_reception')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routesLoading ? (
                    <TableRow><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                  ) : routes.length > 0 ? (
                    routes.map((route) => (
                      <TableRow key={route.id} className="group hover:bg-slate-50 transition-colors">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px]">{route.driverName.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-sm">{route.driverName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(route.createdAt.toDate(), 'dd MMM, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-[10px] uppercase font-bold px-2",
                            route.status === 'completed' ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"
                          )}>
                            {route.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{route.stops.length} {t('label_stops')}</TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex flex-col items-end">
                            {route.stops.filter(s => s.status === 'delivered').map(stop => (
                              <div key={stop.orderId} className="flex items-center gap-1.5 mb-1 last:mb-0">
                                <span className="text-[9px] text-slate-400 font-mono">#{stop.orderId.substring(0,4)}</span>
                                <Badge variant="secondary" className="text-[10px] h-5 py-0">
                                  {stop.receivedBy || '—'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">{t('no_history')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drivers">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{t('drivers_title')}</h2>
                <p className="text-sm text-muted-foreground">{t('drivers_desc')}</p>
              </div>
              <Button onClick={handleAddDriver} className="rounded-full shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> {t('add_driver_button')}
              </Button>
            </div>

            <Card className="border-none shadow-md overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="pl-6">{t('driver_header_name')}</TableHead>
                    <TableHead>{t('driver_header_type')}</TableHead>
                    <TableHead>{t('driver_header_vehicle')}</TableHead>
                    <TableHead>{t('driver_header_status')}</TableHead>
                    <TableHead className="text-right pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driversLoading ? (
                    <TableRow><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                  ) : drivers.length > 0 ? (
                    drivers.map((driver) => (
                      <TableRow key={driver.id} className="hover:bg-slate-50">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">{driver.name.substring(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-slate-800">{driver.name}</p>
                              <p className="text-xs text-muted-foreground">{driver.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-[10px] uppercase font-bold",
                            driver.type === 'internal' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                          )}>
                            {t(`type_${driver.type}` as any)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{driver.vehicleInfo}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t('status_active')}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="icon" onClick={() => handleEditDriver(driver)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                        {t('no_drivers_linked')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
