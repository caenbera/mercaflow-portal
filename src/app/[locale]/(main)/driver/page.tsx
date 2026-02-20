
"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, Navigation, CheckCircle2, 
  MapPin, Phone, MessageSquare, 
  Clock, Package, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock active route for demonstration
const MOCK_ROUTE = {
  id: "RT-101",
  stops: [
    { id: "S1", orderId: "ORD-8852", client: "Restaurante El Rey", address: "123 Main St, Chicago, IL", status: "pending", items: 12 },
    { id: "S2", orderId: "ORD-8853", client: "Super Market Central", address: "456 North Ave, Chicago, IL", status: "pending", items: 24 },
  ]
};

export default function DriverTerminalPage() {
  const t = useTranslations('Logistics');
  const [route, setRoute] = useState(MOCK_ROUTE);
  const [activeStopIndex, setActiveStopIndex] = useState(0);

  const currentStop = route.stops[activeStopIndex];

  const handleDeliver = () => {
    if (activeStopIndex < route.stops.length - 1) {
      setActiveStopIndex(prev => prev + 1);
    } else {
      setRoute({ ...route, stops: [] }); // Route completed
    }
  };

  if (route.stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{t('route_completed')}</h1>
        <p className="text-slate-500 mt-2">Buen trabajo por hoy. Espera nuevas asignaciones.</p>
        <Button className="mt-8 rounded-xl h-12 px-8" onClick={() => window.location.reload()}>Actualizar</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto space-y-6">
      <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg"><Truck className="text-primary h-6 w-6" /></div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Ruta Activa</p>
            <p className="font-bold text-lg">{route.id}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400">Progreso</p>
          <p className="font-bold text-lg text-primary">{activeStopIndex + 1} / {route.stops.length}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStop.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="border-none shadow-2xl overflow-hidden rounded-[32px]">
            <CardHeader className="bg-slate-50 border-b pb-6">
              <div className="flex justify-between items-start mb-4">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 uppercase font-black text-[10px] px-3">
                  {t('next_stop')}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  ETA: 15 MIN
                </div>
              </div>
              <CardTitle className="text-2xl font-black text-slate-900 leading-tight">
                {currentStop.client}
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

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-200 p-2.5 rounded-xl"><Package className="h-5 w-5 text-slate-600" /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carga a Entregar</p>
                    <p className="text-sm font-black text-slate-800">{currentStop.items} Unidades / Cajas</p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">#{currentStop.orderId.substring(0,6)}</Badge>
              </div>

              <Button 
                className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-lg shadow-xl"
                onClick={handleDeliver}
              >
                <CheckCircle2 className="mr-2 h-6 w-6" />
                {t('mark_delivered')}
              </Button>

              <button className="w-full text-center text-xs font-bold text-red-500 uppercase tracking-widest pt-2 flex items-center justify-center gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                Reportar Problema en la Entrega
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
