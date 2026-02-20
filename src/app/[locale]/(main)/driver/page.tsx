
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Truck, Navigation, CheckCircle2, 
  MapPin, Phone, Clock, Package, AlertTriangle,
  UserCheck, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Route, RouteStop } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function DriverTerminalPage() {
  const t = useTranslations('Logistics');
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiverName, setReceiverBy] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Escuchar rutas activas o pendientes para este conductor
    const q = query(
      collection(db, 'routes'), 
      where('driverId', '==', user.uid),
      where('status', 'in', ['pending', 'active'])
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        // Tomamos la primera ruta encontrada
        const routeData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Route;
        setActiveRoute(routeData);
      } else {
        setActiveRoute(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const currentStop = useMemo(() => {
    if (!activeRoute) return null;
    return activeRoute.stops.find(s => s.status === 'pending' || s.status === 'arrived');
  }, [activeRoute]);

  const handleStartRoute = async () => {
    if (!activeRoute) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'routes', activeRoute.id), {
        status: 'active',
        startTime: serverTimestamp()
      });
      toast({ title: t('delivery_started') });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArrive = async () => {
    if (!activeRoute || !currentStop) return;
    setIsProcessing(true);
    try {
      const updatedStops = activeRoute.stops.map(s => 
        s.orderId === currentStop.orderId ? { ...s, status: 'arrived', arrivedAt: Timestamp.now() } : s
      );
      await updateDoc(doc(db, 'routes', activeRoute.id), { stops: updatedStops });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeliver = async () => {
    if (!activeRoute || !currentStop || !receiverName.trim()) return;
    setIsProcessing(true);
    try {
      const now = Timestamp.now();
      const updatedStops = activeRoute.stops.map(s => 
        s.orderId === currentStop.orderId ? { 
          ...s, 
          status: 'delivered', 
          completedAt: now,
          receivedBy: receiverName 
        } : s
      );

      // 1. Actualizar Hoja de Ruta
      const isLastStop = updatedStops.every(s => s.status === 'delivered' || s.status === 'failed');
      await updateDoc(doc(db, 'routes', activeRoute.id), { 
        stops: updatedStops,
        status: isLastStop ? 'completed' : 'active',
        completedAt: isLastStop ? now : null
      });

      // 2. Actualizar el Pedido individual para el cliente
      await updateDoc(doc(db, 'orders', currentStop.orderId), {
        status: 'delivered',
        deliveryInfo: {
          deliveredAt: now,
          receivedBy: receiverName,
          driverName: activeRoute.driverName
        }
      });

      setReceiverBy('');
      toast({ title: t('mark_delivered') });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error al confirmar entrega" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium">Cargando terminal...</p>
    </div>
  );

  if (!activeRoute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
          <Truck className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{t('no_pending_routes')}</h1>
        <p className="text-slate-500 mt-2">No tienes rutas asignadas por el momento.</p>
        <Button className="mt-8 rounded-xl h-12 px-8" variant="outline" onClick={() => window.location.reload()}>Actualizar</Button>
      </div>
    );
  }

  const activeStopIndex = activeRoute.stops.findIndex(s => s.orderId === currentStop?.orderId);

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto space-y-6 pb-20">
      {/* Header de Ruta */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg"><Truck className="text-primary h-6 w-6" /></div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Ruta: {activeRoute.driverName}</p>
            <p className="font-bold text-lg">{activeRoute.id.substring(0,8).toUpperCase()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400">Progreso</p>
          <p className="font-bold text-lg text-primary">
            {activeRoute.stops.filter(s => s.status === 'delivered').length} / {activeRoute.stops.length}
          </p>
        </div>
      </div>

      {activeRoute.status === 'pending' ? (
        <Card className="border-none shadow-lg text-center p-8 rounded-[32px]">
          <Package className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Nueva Ruta Lista</h2>
          <p className="text-muted-foreground mb-6">Presiona el botón cuando hayas cargado el camión y estés listo para salir de bodega.</p>
          <Button 
            className="w-full h-16 rounded-2xl font-black text-xl shadow-xl" 
            onClick={handleStartRoute}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : "INICIAR DESPACHO"}
          </Button>
        </Card>
      ) : currentStop ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStop.orderId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-none shadow-2xl overflow-hidden rounded-[32px]">
              <CardHeader className="bg-slate-50 border-b pb-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 uppercase font-black text-[10px] px-3">
                    {currentStop.status === 'arrived' ? 'EN EL PUNTO' : t('next_stop')}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    STOP #{activeStopIndex + 1}
                  </div>
                </div>
                <CardTitle className="text-2xl font-black text-slate-900 leading-tight">
                  {currentStop.customerName}
                </CardTitle>
                <div className="flex items-start gap-2 mt-2 text-slate-500">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-1" />
                  <p className="text-sm font-medium leading-relaxed">{currentStop.address}</p>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-14 rounded-2xl border-slate-200 gap-2 font-bold"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentStop.address)}`)}
                  >
                    <Navigation className="h-5 w-5 text-blue-600" />
                    {t('navigation_button')}
                  </Button>
                  <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-200 shrink-0">
                    <Phone className="h-5 w-5 text-green-600" />
                  </Button>
                </div>

                {currentStop.status === 'pending' ? (
                  <Button 
                    className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg shadow-xl"
                    onClick={handleArrive}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : t('mark_arrived')}
                  </Button>
                ) : (
                  <div className="space-y-4 animate-in fade-in zoom-in-95">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-slate-400">{t('received_by_label')}</Label>
                      <Input 
                        placeholder={t('received_by_placeholder')} 
                        className="h-14 rounded-xl text-lg font-bold"
                        value={receiverName}
                        onChange={(e) => setReceiverBy(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-lg shadow-xl"
                      disabled={!receiverName.trim() || isProcessing}
                      onClick={handleDeliver}
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : (
                        <><CheckCircle2 className="mr-2 h-6 w-6" /> {t('mark_delivered')}</>
                      )}
                    </Button>
                  </div>
                )}

                <button className="w-full text-center text-xs font-bold text-red-500 uppercase tracking-widest pt-2 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Reportar Problema en la Entrega
                </button>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="text-center p-12 bg-white rounded-[32px] shadow-lg">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black">{t('route_completed')}</h2>
          <p className="text-muted-foreground mt-2">Todas las entregas han sido registradas.</p>
        </div>
      )}
    </div>
  );
}
