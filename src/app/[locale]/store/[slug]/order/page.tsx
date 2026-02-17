
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { collection, query, where, getDocs, limit, doc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, ShoppingBasket, Star, Minus, Plus, 
  CalendarIcon, MessageSquarePlus, Pencil, Loader2, ArrowLeft,
  ChevronRight, Lock
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useRouter } from '@/navigation';
import type { Product, Organization, OrderItem } from '@/types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function StoreOrderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale() as 'es' | 'en';
  const t = useTranslations('ClientNewOrderPage');
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [org, setOrg] = useState<Organization | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carga inicial de datos de la tienda y sus productos
  useEffect(() => {
    async function loadStoreData() {
      if (!slug) return;
      try {
        // 1. Obtener la organización por slug
        const orgQuery = query(collection(db, 'organizations'), where('slug', '==', slug), limit(1));
        const orgSnap = await getDocs(orgQuery);
        
        if (!orgSnap.empty) {
          const orgData = { id: orgSnap.docs[0].id, ...orgSnap.docs[0].data() } as Organization;
          setOrg(orgData);

          // 2. Obtener los productos de esa organización
          const prodQuery = query(collection(db, 'products'), where('organizationId', '==', orgData.id), where('active', '==', true));
          const prodSnap = await getDocs(prodQuery);
          const productsList = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          setProducts(productsList);
        }
      } catch (e) {
        console.error("Error loading store order page:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStoreData();
  }, [slug]);

  // Filtrado de productos
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category.es));
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === 'all' || p.category.es === activeCategory;
      const matchSearch = p.name[locale].toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    }).sort((a, b) => a.name[locale].localeCompare(b.name[locale]));
  }, [products, activeCategory, searchTerm, locale]);

  // Gestión del carrito
  const addToCart = (productId: string, delta: number) => {
    setCart(prev => {
      const newQty = (prev[productId] || 0) + delta;
      if (newQty <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const prod = products.find(p => p.id === id);
      return sum + (prod?.salePrice || 0) * qty;
    }, 0);
  }, [cart, products]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Inicio de sesión requerido",
        description: "Por favor regístrate o inicia sesión para finalizar tu pedido.",
      });
      router.push(`/store/${slug}/login`);
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleSubmitOrder = async () => {
    if (!user || !org || !userProfile) return;
    setIsSubmitting(true);
    try {
      const orderItems: OrderItem[] = Object.entries(cart).map(([id, qty]) => {
        const prod = products.find(p => p.id === id)!;
        return {
          productId: id,
          productName: prod.name,
          quantity: qty,
          price: prod.salePrice,
          isBox: prod.isBox
        };
      });

      await addDoc(collection(db, 'orders'), {
        organizationId: org.id,
        userId: user.uid,
        businessName: userProfile.businessName || userProfile.email,
        items: orderItems,
        total: cartTotal,
        status: 'pending',
        shippingAddress: userProfile.address || 'Recoger en tienda',
        createdAt: serverTimestamp(),
        deliveryDate: deliveryDate ? Timestamp.fromDate(deliveryDate) : serverTimestamp(),
        notes: { items: notes }
      });

      toast({ title: "¡Pedido enviado!", description: "El supermercado ha recibido tu orden." });
      setCart({});
      setIsCheckoutOpen(false);
      router.push(`/store/${slug}`);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "No se pudo procesar el pedido." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium text-sm">Cargando catálogo...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Fijo */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm p-3">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href={`/store/${slug}`}><ArrowLeft className="h-5 w-5"/></Link>
          </Button>
          <div className="flex-grow">
            <h1 className="font-bold text-lg leading-none">{org?.name}</h1>
            <p className="text-xs text-muted-foreground mt-1">Hacer pedido online</p>
          </div>
          <div className="relative">
            <ShoppingBasket className="h-6 w-6 text-primary" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-dark font-bold text-[10px] h-4 w-4 rounded-full flex items-center justify-center shadow-md">
                {cartCount}
              </span>
            )}
          </div>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="¿Qué buscas hoy?" 
            className="pl-10 h-11 bg-gray-100 border-none rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              className="rounded-full h-8 px-4 whitespace-nowrap text-xs capitalize"
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'Todos' : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Productos */}
      <div className="flex-grow overflow-y-auto p-3 space-y-3 pb-32">
        {filteredProducts.length > 0 ? filteredProducts.map(p => {
          const qty = cart[p.id] || 0;
          return (
            <Card key={p.id} className="p-3 flex items-center gap-3 border-none shadow-sm rounded-2xl overflow-hidden">
              <div className="h-20 w-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <Image 
                  src={p.photoUrl || '/placeholder.svg'} 
                  alt={p.name[locale]} 
                  width={80} height={80} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-bold text-sm leading-tight line-clamp-2">{p.name[locale]}</h3>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{p.unit[locale]}</p>
                <div className="mt-2 font-black text-primary text-lg">
                  {formatCurrency(p.salePrice)}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                {qty > 0 ? (
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1 border">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => addToCart(p.id, -1)}><Minus className="h-4 w-4"/></Button>
                    <span className="font-bold text-sm w-4 text-center">{qty}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => addToCart(p.id, 1)}><Plus className="h-4 w-4"/></Button>
                  </div>
                ) : (
                  <Button size="sm" className="rounded-full h-9 px-4 font-bold bg-primary text-white" onClick={() => addToCart(p.id, 1)}>
                    Añadir
                  </Button>
                )}
              </div>
            </Card>
          );
        }) : (
          <div className="text-center py-20">
            <Info className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
            <p className="text-muted-foreground">No encontramos lo que buscas.</p>
          </div>
        )}
      </div>

      {/* Barra de Carrito Flotante */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-30">
          <Button 
            className="w-full h-14 rounded-2xl shadow-xl bg-primary text-white flex justify-between px-6 font-bold text-lg animate-in slide-in-from-bottom-4"
            onClick={handleCheckout}
          >
            <div className="flex items-center gap-3">
              <ShoppingBasket className="h-6 w-6" />
              <span>Ver mi pedido</span>
            </div>
            <span>{formatCurrency(cartTotal)}</span>
          </Button>
        </div>
      )}

      {/* Checkout Sheet */}
      <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 flex flex-col overflow-hidden">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Confirmar Pedido</SheetTitle>
          </SheetHeader>
          <div className="flex-grow overflow-y-auto p-4 space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-muted-foreground">Productos</h4>
              {Object.entries(cart).map(([id, qty]) => {
                const p = products.find(prod => prod.id === id)!;
                return (
                  <div key={id} className="flex justify-between items-center text-sm border-b pb-2">
                    <div className="flex gap-3">
                      <span className="font-bold text-primary">{qty}x</span>
                      <span className="font-medium">{p.name[locale]}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(p.salePrice * qty)}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-muted-foreground">Instrucciones de Entrega</h4>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left h-12 rounded-xl">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deliveryDate ? format(deliveryDate, "PPP", { locale: es }) : "Elegir fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={deliveryDate} onSelect={setDeliveryDate} />
                </PopoverContent>
              </Popover>
              <Textarea 
                placeholder="Ej: Favor dejar en portería..." 
                className="rounded-xl bg-gray-50 border-none"
                value={notes['general'] || ''}
                onChange={(e) => setNotes(prev => ({...prev, general: e.target.value}))}
              />
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-muted-foreground">Total a pagar:</span>
              <span className="text-2xl font-black text-primary">{formatCurrency(cartTotal)}</span>
            </div>
            <Button className="w-full h-14 rounded-2xl font-bold text-lg" onClick={handleSubmitOrder} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Confirmar Orden Ahora"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
