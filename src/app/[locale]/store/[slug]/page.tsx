
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Organization } from '@/types';
import Image from 'next/image';
import { 
  ShoppingBag, Star, MapPin, Phone, Info, Loader2, Leaf, 
  ChevronRight, Facebook, Instagram, MessageCircle, Send,
  Truck, Clock, Tags, Headset, CheckCircle, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';

export default function PublicStorePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    async function fetchStoreData() {
      if (!slug) return;
      try {
        const orgQuery = query(collection(db, 'organizations'), where('slug', '==', slug), limit(1));
        const orgSnap = await getDocs(orgQuery);
        
        if (!orgSnap.empty) {
          const orgData = { id: orgSnap.docs[0].id, ...orgSnap.docs[0].data() } as Organization;
          setOrg(orgData);
        }
      } catch (e) {
        console.error("Error loading store:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStoreData();
  }, [slug]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !subscriberEmail) return;
    setIsSubscribing(true);
    try {
      await addDoc(collection(db, 'newsletterSubscribers'), {
        email: subscriberEmail,
        organizationId: org.id,
        createdAt: serverTimestamp()
      });
      toast({ title: "¡Te has suscrito!", description: "Recibirás nuestras mejores ofertas pronto." });
      setSubscriberEmail('');
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo completar la suscripción." });
    } finally {
      setIsSubscribing(false);
    }
  };

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
      <p className="text-muted-foreground mt-2 max-w-xs">Este comercio no tiene una tienda online activa en este momento.</p>
      <Button variant="outline" className="mt-6" asChild><Link href="/">Volver al Portal</Link></Button>
    </div>
  );

  const config = org.storeConfig;

  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1a5f3f] font-extrabold text-xl">
            {config.logoUrl ? (
              <Image src={config.logoUrl} alt={org.name} width={40} height={40} className="object-contain" />
            ) : (
              <Leaf className="text-[#e8b931]" />
            )}
            <span>{org.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-semibold text-[#1a1a1a]">
            <a href="#inicio" className="hover:text-[#1a5f3f] transition-colors">Inicio</a>
            <a href="#beneficios" className="hover:text-[#1a5f3f] transition-colors">Beneficios</a>
            <a href="#categorias" className="hover:text-[#1a5f3f] transition-colors">Productos</a>
            <Button className="rounded-full bg-[#1a5f3f] hover:bg-[#2d8a5e] px-6 font-bold" asChild>
              <Link href={`/store/${org.slug}/order`}>Hacer Pedido</Link>
            </Button>
          </div>
          <Button variant="ghost" className="md:hidden" size="icon" asChild>
            <Link href={`/store/${org.slug}/order`}><ShoppingBag /></Link>
          </Button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="inicio" className="relative min-h-screen pt-20 flex items-center bg-gradient-to-br from-[#1a5f3f] to-[#2d8a5e] overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
            <Badge className="bg-[#e8b931] text-[#1a1a1a] border-none mb-6 px-4 py-2 rounded-full font-bold">
              <Zap className="h-4 w-4 mr-2" /> Delivery en 90 minutos
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              {config.heroTitle?.es || "Tu mercado fresco"} <br />
              <span className="text-[#e8b931]">a la puerta de tu casa</span>
            </h1>
            <p className="text-lg opacity-90 mb-8 max-w-lg font-light leading-relaxed">
              {config.heroSubtitle?.es || "Frutas, verduras, abarrotes y productos seleccionados de la mejor calidad. Ordena fácil y recibe en minutos."}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="rounded-full bg-[#e8b931] text-[#1a1a1a] hover:bg-[#d4a628] h-14 px-8 text-lg font-bold shadow-xl transition-all hover:-translate-y-1" asChild>
                <Link href={`/store/${org.slug}/order`}>Ordenar Ahora</Link>
              </Button>
              <Button variant="outline" className="rounded-full text-white border-white/50 hover:bg-white hover:text-[#1a5f3f] h-14 px-8 text-lg font-bold transition-all" asChild>
                <a href="#como-funciona">Ver Cómo Funciona</a>
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative hidden md:block">
            <div className="relative rounded-[40px] overflow-hidden rotate-3 shadow-2xl transition-transform hover:rotate-0">
              <Image 
                src={config.heroImage || "https://i.postimg.cc/pVkYwqGR/hero_products.jpg"} 
                alt="Supermercado" 
                width={600} 
                height={400} 
                className="object-cover"
              />
            </div>
            {/* Floating Cards */}
            <div className="absolute -top-10 -left-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 text-slate-800 animate-bounce">
              <div className="bg-[#2d8a5e] text-white p-2 rounded-lg"><Clock className="h-5 w-5"/></div>
              <div><div className="font-bold text-sm">90 min</div><div className="text-[10px] opacity-60">Entrega promedio</div></div>
            </div>
            <div className="absolute -bottom-10 -right-5 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 text-slate-800">
              <div className="bg-[#e8b931] text-white p-2 rounded-lg"><Star className="h-5 w-5"/></div>
              <div><div className="font-bold text-sm">4.9/5 Rating</div><div className="text-[10px] opacity-60">+10,000 clientes</div></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="beneficios" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h4 className="text-[#1a5f3f] font-black uppercase tracking-widest text-sm mb-2">Por Qué Elegirnos</h4>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">La mejor experiencia de compra online</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Leaf />, title: "100% Fresco", desc: "Seleccionamos diariamente los mejores productos recién cosechados." },
              { icon: <Truck />, title: "Delivery Express", desc: "Recibe tu pedido en 90 minutos o programa la hora que prefieras." },
              { icon: <Tags />, title: "Mejores Precios", desc: "Eliminamos intermediarios. Precios de mercado directo en tu puerta." },
              { icon: <Headset />, title: "Soporte 24/7", desc: "¿Alguna duda? Nuestro equipo está siempre disponible para ayudarte." }
            ].map((benefit, i) => (
              <Card key={i} className="border-none bg-[#f8faf8] hover:bg-white hover:shadow-2xl transition-all group">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a5f3f] to-[#2d8a5e] flex items-center justify-center text-white mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    {benefit.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-slate-900">{benefit.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categorias" className="py-24 bg-[#f8faf8]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-16">Explora por categorías</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Frutas Frescas", img: config.categoriesImages?.fruits || "https://i.postimg.cc/FFGgMDP6/categorias_frutas.jpg", count: "+50 productos" },
              { name: "Verduras Orgánicas", img: config.categoriesImages?.vegetables || "https://i.postimg.cc/dQnmb4WX/categorias_verduras.jpg", count: "+80 productos" },
              { name: "Abarrotes", img: config.categoriesImages?.groceries || "https://i.postimg.cc/Df5d9BCH/categorias_abarrotes.jpg", count: "+200 productos" }
            ].map((cat, i) => (
              <div key={i} className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-lg">
                <Image src={cat.img} alt={cat.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 text-left text-white">
                  <h3 className="text-2xl font-bold">{cat.name}</h3>
                  <p className="text-sm opacity-80">{cat.count}</p>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-12 rounded-full bg-[#1a5f3f] h-14 px-10 text-lg font-bold shadow-lg" asChild>
            <Link href={`/store/${org.slug}/order`}>Ver Todo el Catálogo <ChevronRight className="ml-2"/></Link>
          </Button>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-gradient-to-br from-[#1a5f3f] to-[#2d8a5e] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h4 className="text-[#e8b931] font-bold uppercase tracking-widest text-sm mb-2">Testimonios</h4>
            <h2 className="text-3xl md:text-4xl font-extrabold">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {(config.testimonials || [
              { name: "María González", role: "Cliente habitual", text: "Increíble la frescura de las verduras. Llegaron en 45 minutos y todo estaba perfectamente seleccionado." },
              { name: "Carlos Mendoza", role: "Restaurante El Sabor", text: "Como dueño de restaurante, necesito calidad constante. Supermercado Fresco nunca me ha fallado." },
              { name: "Laura Jiménez", role: "Profesional ocupada", text: "La app es súper fácil de usar. Puedo hacer el pedido desde el trabajo y llego a casa justo cuando llegan." }
            ]).map((t, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20">
                <div className="flex text-[#e8b931] mb-6 gap-1"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                <p className="italic text-lg mb-8 opacity-90">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full border-2 border-[#e8b931] overflow-hidden bg-slate-200">
                    <Image src={t.avatarUrl || `https://ui-avatars.com/api/?name=${t.name}&background=e8b931&color=fff`} alt={t.name} width={56} height={56} />
                  </div>
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-sm opacity-70">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BOX */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-gradient-to-br from-[#1a5f3f] to-[#2d8a5e] rounded-[40px] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black mb-6">¿Listo para tu primera compra?</h2>
              <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto font-light">
                Únete a miles de familias que ya disfrutan de productos frescos sin salir de casa. Tu primer pedido tiene envío gratis.
              </p>
              <Button className="bg-[#e8b931] text-[#1a1a1a] hover:bg-[#d4a628] h-16 px-12 text-xl font-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl" asChild>
                <Link href={`/store/${org.slug}/order`}><ShoppingBag className="mr-3"/> Comenzar a Comprar</Link>
              </Button>
              <div className="mt-6 flex items-center justify-center gap-2 opacity-80">
                <CheckCircle size={16} className="text-[#e8b931]"/>
                <span className="text-sm font-bold uppercase tracking-wider">Código: BIENVENIDO para 10% OFF</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1a1a1a] text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 text-[#e8b931] font-bold text-2xl mb-6">
                <Leaf /> {org.name}
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Conectamos el campo con tu mesa. Productos frescos, de la mejor calidad y directo a tu puerta.
              </p>
              <div className="flex gap-4">
                <a href={config.socialLinks?.facebook} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#e8b931] hover:text-[#1a1a1a] transition-all"><Facebook size={18}/></a>
                <a href={config.socialLinks?.instagram} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#e8b931] hover:text-[#1a1a1a] transition-all"><Instagram size={18}/></a>
                <a href={`https://wa.me/${config.contactWhatsapp}`} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#e8b931] hover:text-[#1a1a1a] transition-all"><MessageCircle size={18}/></a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Enlaces Rápidos</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><a href="#inicio" className="hover:text-[#e8b931]">Inicio</a></li>
                <li><a href="#beneficios" className="hover:text-[#e8b931]">Beneficios</a></li>
                <li><a href="#categorias" className="hover:text-[#e8b931]">Categorías</a></li>
                <li><Link href={`/store/${org.slug}/order`} className="hover:text-[#e8b931]">Pedir Online</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Contacto</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li className="flex items-center gap-3"><Phone size={16} className="text-[#e8b931]"/> {config.contactPhone || "+1 (555) 000-0000"}</li>
                <li className="flex items-center gap-3"><MapPin size={16} className="text-[#e8b931]"/> {config.contactAddress || org.address}</li>
                <li className="flex items-center gap-3"><Clock size={16} className="text-[#e8b931]"/> Lun-Dom: 6am - 8pm</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Newsletter</h4>
              <p className="text-slate-400 text-xs mb-4">Recibe ofertas exclusivas y novedades semanales.</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Tu correo..." 
                  className="bg-white/10 border-none h-12 text-white" 
                  value={subscriberEmail}
                  onChange={(e) => setSubscriberEmail(e.target.value)}
                  disabled={isSubscribing}
                />
                <Button className="bg-[#e8b931] text-[#1a1a1a] hover:bg-[#d4a628] h-12 px-4">
                  {isSubscribing ? <Loader2 className="animate-spin h-4 w-4"/> : <Send size={18}/>}
                </Button>
              </form>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} {org.name} - Potenciado por MercaFlow Portal.
          </div>
        </div>
      </footer>
    </div>
  );
}
