"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Boxes, CheckCircle, ArrowRight, Bell, Box, Truck, FileText, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// --- MOCK DATA ---
const MOCK_ORDERS = [
    { id: "ORD-101", client: "Restaurante El Rey", time: "08:00 AM", items: [{ id: 1, name: "Tomate Chonto", qty: 5, unit: "Kg", img: "https://i.postimg.cc/TY6YMwmY/tomate_chonto.png", sku: "TOM-001" }, { id: 2, name: "Cebolla Blanca", qty: 10, unit: "Kg", img: "https://i.postimg.cc/TPwHKV88/cebolla_blanca.png", sku: "CEB-002" }] },
    { id: "ORD-102", client: "La Pizzería", time: "09:00 AM", items: [{ id: 1, name: "Tomate Chonto", qty: 3, unit: "Kg", img: "https://i.postimg.cc/TY6YMwmY/tomate_chonto.png", sku: "TOM-001" }, { id: 3, name: "Limón Tahití", qty: 20, unit: "Lb", img: "https://i.postimg.cc/43dFY6CX/limon.png", sku: "LIM-003" }] }
];

// --- TYPES ---
interface PickingItem {
  id: number;
  name: string;
  qty: number;
  unit: string;
  img: string;
  sku: string;
  totalQty: number;
  status: 'pending' | 'done' | 'shortage';
  cardId: string;
}
interface ShortageData {
  [productId: number]: number;
}
interface PackedOrder {
  id: string;
  client: string;
  time: string;
  items: (typeof MOCK_ORDERS)[0]['items'][0] & { finalQty: number, originalQty: number, hasShortage: boolean };
}

export function PickingPageClient() {
  const t = useTranslations('PickingPage');
  const { toast } = useToast();

  const [sessionStarted, setSessionStarted] = useState(false);
  const [pickerName, setPickerName] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState('picking');

  const [pickingList, setPickingList] = useState<PickingItem[]>([]);
  const [packedOrders, setPackedOrders] = useState<PackedOrder[]>([]);
  const [shortageData, setShortageData] = useState<ShortageData>({});

  const [isShortageModalOpen, setIsShortageModalOpen] = useState(false);
  const [currentItemForShortage, setCurrentItemForShortage] = useState<PickingItem | null>(null);
  
  const actualQtyInputRef = useRef<HTMLInputElement>(null);

  // Timer effect
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted]);

  // Handle Session Start
  const handleStartSession = () => {
    if (!pickerName) {
      toast({ variant: 'destructive', title: t('enter_name_toast') });
      return;
    }
    setSessionStarted(true);

    const productMap: { [key: number]: PickingItem } = {};
    MOCK_ORDERS.forEach(order => {
      order.items.forEach(item => {
        if (!productMap[item.id]) {
          productMap[item.id] = { ...item, totalQty: 0, status: 'pending', cardId: `card-${item.id}` };
        }
        productMap[item.id].totalQty += item.qty;
      });
    });
    setPickingList(Object.values(productMap));
  };
  
  // Handle Item Completion
  const handleCompleteItem = (itemId: number) => {
    setPickingList(prev => prev.map(item => item.id === itemId ? { ...item, status: 'done' } : item));
    // Remove from shortage if it was previously reported
    setShortageData(prev => {
        const newShortage = { ...prev };
        delete newShortage[itemId];
        return newShortage;
    });
  };
  
  // Handle Shortage Reporting
  const handleOpenShortageModal = (item: PickingItem) => {
    setCurrentItemForShortage(item);
    setIsShortageModalOpen(true);
    setTimeout(() => actualQtyInputRef.current?.focus(), 100);
  };
  
  const handleConfirmShortage = () => {
    if (!currentItemForShortage || !actualQtyInputRef.current) return;
    const actualQty = parseFloat(actualQtyInputRef.current.value);

    if (isNaN(actualQty) || actualQty < 0) {
      toast({ variant: 'destructive', title: t('invalid_number_toast') });
      return;
    }

    const productId = currentItemForShortage.id;
    setShortageData(prev => ({ ...prev, [productId]: actualQty }));
    setPickingList(prev => prev.map(item => item.id === productId ? { ...item, status: 'shortage' } : item));
    setIsShortageModalOpen(false);
  };

  // Calculate packing list when switching tabs
  const handleTabChange = (value: string) => {
    if (value === 'packing' && packedOrders.length === 0) {
        const tempShortageData = { ...shortageData };
        
        const newPackedOrders = MOCK_ORDERS.map(order => {
            const newItems = order.items.map(item => {
                let finalQty = item.qty;
                let hasShortage = false;

                if (tempShortageData.hasOwnProperty(item.id)) {
                    const available = tempShortageData[item.id];
                    if (available >= item.qty) {
                        tempShortageData[item.id] -= item.qty;
                        finalQty = item.qty;
                    } else if (available > 0) {
                        finalQty = available;
                        tempShortageData[item.id] = 0;
                        hasShortage = true;
                    } else {
                        finalQty = 0;
                        hasShortage = true;
                    }
                }
                return { ...item, finalQty, originalQty: item.qty, hasShortage };
            });
            return { ...order, items: newItems };
        });
        setPackedOrders(newPackedOrders);
    }
    setActiveTab(value);
  };

  const handleFinishProcess = () => {
    toast({ title: t('process_finished_toast') });
    // Reset state
    setSessionStarted(false);
    setPickerName('');
    setSecondsElapsed(0);
    setActiveTab('picking');
    setPickingList([]);
    setPackedOrders([]);
    setShortageData({});
  };

  const timerDisplay = useMemo(() => {
    const minutes = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const seconds = (secondsElapsed % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [secondsElapsed]);

  const pendingItems = useMemo(() => pickingList.filter(item => item.status === 'pending'), [pickingList]);

  // --- RENDER ---
  if (!sessionStarted) {
    return (
      <div className="fixed inset-0 bg-primary text-white flex flex-col justify-center p-6 text-center z-50">
        <Boxes className="h-16 w-16 mx-auto mb-4 text-accent" />
        <h1 className="text-3xl font-extrabold mb-4">{t('title')}</h1>
        <Input 
          type="text" 
          value={pickerName}
          onChange={(e) => setPickerName(e.target.value)}
          placeholder={t('picker_name_placeholder')}
          className="bg-background/20 border-white/30 text-white placeholder:text-white/70 text-center text-lg h-12 mb-4"
        />
        <Button size="lg" className="w-full font-bold py-6 text-lg bg-accent hover:bg-accent/90" onClick={handleStartSession}>
          {t('start_route_button')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground p-3 shadow-md flex justify-between items-center">
        <div>
          <div className="font-bold">{pickerName}</div>
          <div className="text-xs opacity-80">{t('picking_in_progress')}</div>
        </div>
        <div className="bg-black/20 text-white font-mono font-bold text-lg rounded-full px-4 py-1.5">
          {timerDisplay}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full p-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="picking">{t('tab_pick')}</TabsTrigger>
          <TabsTrigger value="packing">{t('tab_pack')}</TabsTrigger>
        </TabsList>
        
        {/* PICKING VIEW */}
        <TabsContent value="picking" className="mt-0">
           <Alert className="mx-1 text-center text-sm">
                <Bell className="h-4 w-4"/>
                <AlertDescription>{t('pick_instructions')}</AlertDescription>
           </Alert>
           <AnimatePresence>
            {pendingItems.map((item) => (
               <motion.div
                key={item.cardId}
                layout
                initial={{ opacity: 1, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100, marginBottom: -96, transition: { duration: 0.4 } }}
                className="p-2"
              >
                  <div className="bg-card rounded-xl p-3 flex items-center gap-3 shadow-sm border-l-4 border-transparent">
                      <Image src={item.img} alt={item.name} width={60} height={60} className="rounded-lg object-cover bg-muted" />
                      <div className="flex-grow">
                          <h3 className="font-bold leading-tight">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                              <div className="bg-muted rounded-md px-2 py-0.5 text-center">
                                  <span className="text-lg font-extrabold text-primary leading-none">{item.totalQty}</span>
                                  <span className="text-xs text-muted-foreground uppercase leading-none block">{item.unit}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">{t('total_grouped')}</div>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <Button variant="destructive" size="icon" className="h-12 w-12 rounded-xl bg-yellow-500 hover:bg-yellow-600" onClick={() => handleOpenShortageModal(item)}>
                              <AlertTriangle />
                          </Button>
                          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground data-[state=checked]:border-accent" data-state={item.status === 'done' ? 'checked' : 'unchecked'} onClick={() => handleCompleteItem(item.id)}>
                              <Check className="h-7 w-7" />
                          </Button>
                      </div>
                  </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {pickingList.length > 0 && pendingItems.length === 0 && (
              <div className="text-center p-10 text-muted-foreground animate-fade-in">
                  <CheckCircle className="h-16 w-16 text-accent mx-auto mb-3"/>
                  <h3 className="text-xl font-bold text-foreground">{t('all_picked_title')}</h3>
                  <p>{t('all_picked_subtitle')}</p>
                  <Button size="lg" className="mt-4 rounded-full animate-pulse" onClick={() => handleTabChange('packing')}>
                      {t('go_to_packing_button')} <ArrowRight className="ml-2"/>
                  </Button>
              </div>
          )}
        </TabsContent>
        
        {/* PACKING VIEW */}
        <TabsContent value="packing" className="mt-0">
            <Alert className="mx-1 text-center text-sm">
                <Box className="h-4 w-4"/>
                <AlertDescription>{t('pack_instructions')}</AlertDescription>
            </Alert>
            <div className="space-y-4 p-2">
                {packedOrders.map(order => (
                    <div key={order.id} className="bg-card rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-primary/90 text-primary-foreground p-3 flex justify-between items-center">
                            <div>
                                <div className="font-bold">{order.client}</div>
                                <div className="text-xs opacity-80">{t('delivery_time')}: {order.time}</div>
                            </div>
                            <Truck />
                        </div>
                        <div className="p-2 space-y-2">
                           {order.items.map(item => {
                               if (item.finalQty === 0 && !item.hasShortage) return null;
                               return (
                                    <div key={item.id} className="flex items-start gap-3 p-2 border-b last:border-0">
                                       <input type="checkbox" className="h-6 w-6 mt-1 rounded border-gray-300 text-primary focus:ring-primary" disabled={item.finalQty === 0}/>
                                       <div className="flex-grow">
                                            <p className="font-semibold">{item.name}</p>
                                            <p><strong className="text-lg">{item.finalQty}</strong> <span className="text-sm text-muted-foreground">{item.unit}</span></p>
                                            {item.hasShortage && item.finalQty > 0 && (
                                                <div className="text-xs bg-yellow-100 text-yellow-800 p-1 rounded mt-1">
                                                    <strong>{t('cut_alert_title')}:</strong> {t('cut_alert_text', {actual: item.finalQty, target: item.originalQty})}
                                                </div>
                                            )}
                                            {item.hasShortage && item.finalQty === 0 && (
                                                 <div className="text-xs bg-destructive text-destructive-foreground p-1 rounded mt-1 font-bold">
                                                    {t('out_of_stock_text')}
                                                </div>
                                            )}
                                       </div>
                                    </div>
                               )
                           })}
                        </div>
                    </div>
                ))}
            </div>
             <div className="p-2 mt-4">
                <Button size="lg" className="w-full font-bold" onClick={handleFinishProcess}>
                    {t('finish_process_button')}
                </Button>
            </div>
        </TabsContent>
      </Tabs>
      
      {/* Shortage Modal */}
       <Dialog open={isShortageModalOpen} onOpenChange={setIsShortageModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-yellow-600 flex items-center gap-2"><AlertTriangle/>{t('report_shortage_title')}</DialogTitle>
                <DialogDescription>
                    {currentItemForShortage?.name} - {t('sku_code')}: #{currentItemForShortage?.sku}
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-muted p-3 rounded-lg text-center">
                    <label className="text-xs font-bold uppercase text-muted-foreground">{t('target_qty_label')}</label>
                    <div className="text-3xl font-extrabold">{currentItemForShortage?.totalQty}</div>
                </div>
                 <div className="bg-yellow-100 p-3 rounded-lg text-center">
                    <label className="text-xs font-bold uppercase text-yellow-700">{t('actual_qty_label')}</label>
                    <Input 
                        ref={actualQtyInputRef}
                        type="number" 
                        placeholder={t('actual_qty_placeholder')}
                        className="bg-transparent border-0 text-center text-3xl font-extrabold h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
            </div>
             <Alert variant="default" className="text-sm">
                <Info className="h-4 w-4" />
                <AlertDescription>{t('shortage_info')}</AlertDescription>
            </Alert>
            <Button className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-foreground" onClick={handleConfirmShortage}>
                {t('confirm_qty_button')}
            </Button>
        </DialogContent>
       </Dialog>
    </div>
  );
}

    