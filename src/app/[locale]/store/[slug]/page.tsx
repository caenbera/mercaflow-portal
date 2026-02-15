
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Organization, Product } from '@/types';
import Image from 'next/image';
import { ShoppingBag, Star, MapPin, Phone, Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PublicStorePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [org, setOrg] = useState<Organization | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStoreData() {
      if (!slug) return;
      try {
        // 1. Buscar la organización por slug
        const orgQuery = query(collection(db, 'organizations'), where('slug', '==', slug), limit(1));
        const orgSnap = await getDocs(orgQuery);
        
        if (!orgSnap.empty) {
          const orgData = { id: orgSnap.docs[0].id, ...orgSnap.docs[0].data() } as Organization;
          setOrg(orgData);

          // 2. Si la tienda está activa, traer sus productos
          if (orgData.storeConfig?.enabled) {
            const prodQuery = query(collection(db, 'products'), where('organizationId', '==', orgData.id), where('active', '==', true));
            const prodSnap = await getDocs(prodQuery);
            const prods = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(prods);
          }
        }
      } catch (e) {
        console.error("Error loading store:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStoreData();
  }, [slug]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium text-sm">Cargando tienda...</p>
    </div>
  );

  if (!org || !org.storeConfig?.enabled) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
        <Info className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold">Tienda no disponible</h1>
      <p className="text-muted-foreground mt-2 max-w-xs">El edificio seleccionado no tiene una tienda online configurada o activa en este momento.</p>
      <Button variant="outline" className="mt-6" onClick={() => window.location.href = '/'}>Volver al Portal</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header de Tienda */}
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b overflow-hidden">
        <div className="bg-primary h-2 w-full"></div>
        <div className="px-4 py-4 flex items-center gap-4 max-w-5xl mx-auto">
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 border">
            {org.storeConfig.logoUrl ? (
              <Image src={org.storeConfig.logoUrl} alt={org.name} width={56} height={56} className="object-contain" />
            ) : (
              <ShoppingBag className="text-primary h-8 w-8" />
            )}
          </div>
          <div className="flex-grow min-w-0">
            <h1 className="text-lg font-bold truncate leading-tight">{org.name}</h1>
            <div className="flex items-center gap-3 mt-1 overflow-x-auto hide-scrollbar whitespace-nowrap">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 shrink-0">
                <Star className="h-3 w-3 fill-current" /> 4.9
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <MapPin className="h-3 w-3" /> {org.address?.split(',')[0]}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Banner de Bienvenida */}
        <div className="bg-gradient-to-br from-primary to-green-700 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-2">¡Hola, vecino! 👋</h2>
          <p className="text-green-50 text-sm leading-relaxed opacity-90">
            {org.storeConfig.welcomeMessage?.es || "Bienvenido a nuestra tienda online. Haz tu pedido y recíbelo hoy mismo."}
          </p>
        </div>

        {/* Listado de Productos */}
        <div>
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            Nuestros Productos
            <Badge variant="secondary" className="rounded-full h-5 px-2 text-[10px]">{products.length}</Badge>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map(prod => (
              <Card key={prod.id} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow group flex flex-col h-full">
                <div className="relative aspect-square bg-white p-2">
                  <Image 
                    src={prod.photoUrl || 'https://via.placeholder.com/300'} 
                    alt={prod.name.es} 
                    fill 
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-3 flex flex-col flex-grow">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{prod.category.es}</div>
                  <h4 className="font-bold text-sm leading-tight line-clamp-2 h-10">{prod.name.es}</h4>
                  <div className="mt-auto pt-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-lg font-extrabold text-primary">${prod.salePrice.toFixed(2)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{prod.unit.es}</div>
                      </div>
                      <Button size="sm" className="h-8 w-8 rounded-full p-0 shadow-md">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer / Carrito Flotante (Simulado) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40">
        <Button className="w-full h-14 rounded-2xl bg-black hover:bg-black/90 text-white shadow-2xl flex justify-between items-center px-6 font-bold">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg h-8 w-8 flex items-center justify-center text-sm">0</div>
            <span>Ver mi canasta</span>
          </div>
          <span>$0.00</span>
        </Button>
      </div>
    </div>
  );
}
