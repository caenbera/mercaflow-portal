
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Organization } from '@/types';
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
import { useTranslations, useLocale } from 'next-intl';
import { LanguageSwitcher } from '@/components/landing/language-switcher';
import placeholders from '@/app/lib/placeholder-images.json';

export default function PublicStorePage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = useLocale() as 'es' | 'en';
  const { toast } = useToast();
  const t = useTranslations('B2CStore');
  
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

  // IMAGENES POR DEFECTO USANDO EL ARCHIVO DE REFERENCIA
  const defaultImages = {
    hero: placeholders.store.hero,
    fruits: placeholders.store.fruits,
    vegetables: placeholders.store.vegetables,
    groceries: placeholders.store.groceries
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] font-sans overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1a5f3f] font-extrabold text-xl">
            {config.logoUrl ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                <img src={config.logoUrl} alt={org.name} className="h-full w-full object-contain" />
              </div>
            ) : (
              <Leaf className="text-[#e8b931]" />
            )}
            <span className="hidden sm:inline">{org.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-semibold text-[#1a1a1a]">
            <a href="#inicio" className="hover:text-[#1a5f3f] transition-colors">{t('store_nav_home')}</a>
            <a href="#beneficios" className="hover:text-[#1a5f3f] transition-colors">{t('store_nav_benefits')}</a>
            <a href="#categorias" className="hover:text-[#1a5f3f] transition-colors">{t('store_nav_products')}</a>
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <Button className="rounded-full bg-[#1a5f3f] hover:bg-[#2d8a5e] px-6 font-bold" asChild>
                    <Link href={`/store/${org.slug}/order`}>{t('store_nav_order')}</Link>
                </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" asChild>
                <Link href={`/store/${org.slug}/order`}><ShoppingBag /></Link>
            </Button>
          </div>
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
              <Zap className="h-4 w-4 mr-2" /> {t('store_hero_delivery_badge')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
              {t.rich('store_hero_title_fallback', {
                yellow: (chunks) => <span className="text-[#e8b931]">{chunks}</span>
              })}
            </h1>
            <p className="text-lg opacity-90 mb-8 max-w-lg font-light leading-relaxed">
              {t('store_hero_subtitle_fallback')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="rounded-full bg-[#e8b931] text-[#1a1a1a] hover:bg-[#d4a628] h-14 px-8 text-lg font-bold shadow-xl transition-all hover:-translate-y-1" asChild>
                <Link href={`/store/${org.slug}/order`}>{t('store_hero_order_button')}</Link>
              </Button>
              <Button variant="outline" className="rounded-full bg-transparent text-white border-2 border-white hover:bg-white hover:text-[#1a5f3f] h-14 px-8 text-lg font-bold transition-all" asChild>
                <a href="#beneficios">{t('store_hero_how_button')}</a>
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative hidden md:block">
            <div className="relative aspect-[4/3] w-full rounded-[40px] overflow-hidden rotate-3 shadow-2xl transition-transform hover:rotate-0">
              <img 
                src={config.heroImage || defaultImages.hero} 
                alt="Store Hero" 
                className="w-full h-full object-cover" 
                data-ai-hint="supermarket products"
              />
            </div>
            {/* Floating Cards */}
            <div className="absolute -top-10 -left-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 text-slate-800 animate-bounce">
              <div className="bg-[#2d8a5e] text-white p-2 rounded-lg"><Clock className="h-5 w-5"/></div>
              <div><div className="font-bold text-sm">{t('store_hero_stat_time')}</div><div className="text-[10px] opacity-60">{t('store_hero_stat_time_label')}</div></div>
            </div>
            <div className="absolute -bottom-10 -right-5 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 text-slate-800 animate-bounce">
              <div className="bg-[#e8b931] text-white p-2 rounded-lg"><Star className="h-5 w-5"/></div>
              <div><div className="font-bold text-sm">{t('store_hero_stat_rating')}</div><div className="text-[10px] opacity-60">{t('store_hero_stat_clients')}</div></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="beneficios" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h4 className="text-[#1a5f3f] font-black uppercase tracking-widest text-sm mb-2">{t('store_benefits_tag')}</h4>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">{t('store_benefits_title')}</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Leaf />, title: t('store_benefit_fresh_title'), desc: t('store_benefit_fresh_desc') },
              { icon: <Truck />, title: t('store_benefit_delivery_title'), desc: t('store_benefit_delivery_desc') },
              { icon: <Tags />, title: t('store_benefit_prices_title'), desc: t('store_benefit_prices_desc') },
              { icon: <Headset />, title: t('store_benefit_support_title'), desc: t('store_benefit_support_desc') }
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
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-16">{t('store_categories_title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: t('store_category_fruits'), img: config.categoriesImages?.fruits || defaultImages.fruits, count: t('store_category_count', { count: 50 }), hint: "fruits" },
              { name: t('store_category_veggies'), img: config.categoriesImages?.vegetables || defaultImages.vegetables, count: t('store_category_count', { count: 80 }), hint: "vegetables" },
              { name: t('store_category_groceries'), img: config.categoriesImages?.groceries || defaultImages.groceries, count: t('store_category_count', { count: 200 }), hint: "groceries" }
            ].map((cat, i) => (
              <div key={i} className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-lg">
                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-ai-hint={cat.hint} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 text-left text-white">
                  <h3 className="text-2xl font-bold">{cat.name}</h3>
                  <p className="text-sm opacity-80">{cat.count}</p>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-12 rounded-full bg-[#1a5f3f] h-14 px-10 text-lg font-bold shadow-lg" asChild>
            <Link href={`/store/${org.slug}/order`}>{t('store_view_all_button')} <ChevronRight className="ml-2"/></Link>
          </Button>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-gradient-to-br from-[#1a5f3f] to-[#2d8a5e] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h4 className="text-[#e8b931] font-bold uppercase tracking-widest text-sm mb-2">{t('store_testimonials_tag')}</h4>
            <h2 className="text-3xl md:text-4xl font-extrabold">{t('store_testimonials_title')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                name: "María González", 
                role: "Cliente habitual", 
                text: "Increíble la frescura de las verduras. Llegaron en 45 minutos y todo estaba perfectamente seleccionado. Mi familia notó la diferencia.",
                avatar: placeholders.store.avatars.maria
              },
              { 
                name: "Carlos Mendoza", 
                role: "Restaurante El Sabor", 
                text: "Como dueño de restaurante, necesito calidad constante. Supermercado Fresco nunca me ha fallado. El servicio al cliente es excepcional.",
                avatar: placeholders.store.avatars.carlos
              },
              { 
                name: "Laura Jiménez", 
                role: "Profesional ocupada", 
                text: "La app es súper fácil de usar. Puedo hacer el pedido desde el trabajo y llego a casa justo cuando llegan los productos. ¡Genial!",
                avatar: placeholders.store.avatars.laura
              }
            ].map((test, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20 hover:-translate-y-2 transition-transform duration-300">
                <div className="flex text-[#e8b931] mb-6 gap-1">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="italic text-lg mb-8 opacity-90">"{test.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-full border-2 border-[#e8b931] overflow-hidden bg-slate-200 shrink-0">
                    <img src={test.avatar} alt={test.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold">{test.name}</div>
                    <div className="text-sm opacity-70">{test.role}</div>
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
              <h2 className="text-3xl md:text-5xl font-black mb-6">{t('store_cta_title')}</h2>
              <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto font-light">
                {t('store_cta_desc')}
              </p>
              <Button className="bg-[#e8b931] text-[#1a1a1a] hover:bg-[#d4a628] h-16 px-12 text-xl font-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl" asChild>
                <Link href={`/store/${org.slug}/order`}><ShoppingBag className="mr-3"/> {t('store_cta_button')}</Link>
              </Button>
              <div className="mt-6 flex items-center justify-center gap-2 opacity-80">
                <CheckCircle size={16} className="text-[#e8b931]"/>
                <span className="text-sm font-bold uppercase tracking-wider">{t('store_cta_promo')}</span>
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
                {t('store_footer_desc')}
              </p>
              <div className="flex gap-4">
                {config.socialLinks?.facebook && <a href={config.socialLinks.facebook} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#e8b931] hover:text-[#1a1a1a] transition-all"><Facebook size={18}/></a>}
                {config.socialLinks?.instagram && <a href={config.socialLinks.instagram} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#e8b931] hover:text-[#1a1a1a] transition-all"><Instagram size={18}/></a>}
                {config.contactWhatsapp && <a href={`https://wa.me/${config.contactWhatsapp}`} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#e8b931] hover:text-[#1a1a1a] transition-all"><MessageCircle size={18}/></a>}
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">{t('store_footer_links')}</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li><a href="#inicio" className="hover:text-[#e8b931]">{t('store_nav_home')}</a></li>
                <li><a href="#beneficios" className="hover:text-[#e8b931]">{t('store_nav_benefits')}</a></li>
                <li><a href="#categorias" className="hover:text-[#e8b931]">{t('store_nav_products')}</a></li>
                <li><Link href={`/store/${org.slug}/order`} className="hover:text-[#e8b931]">{t('store_nav_order')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">{t('store_footer_contact')}</h4>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li className="flex items-center gap-3"><Phone size={16} className="text-[#e8b931]"/> {config.contactPhone || "+1 (555) 000-0000"}</li>
                <li className="flex items-center gap-3"><MapPin size={16} className="text-[#e8b931]"/> {config.contactAddress || org.address}</li>
                <li className="flex items-center gap-3"><Clock size={16} className="text-[#e8b931]"/> {t('store_footer_hours')}</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">{t('store_footer_newsletter')}</h4>
              <p className="text-slate-400 text-xs mb-4">{t('store_footer_newsletter_desc')}</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder={t('store_footer_newsletter_placeholder')}
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
            {t('store_footer_copy', { year: new Date().getFullYear(), name: org.name })}
          </div>
        </div>
      </footer>
    </div>
  );
}
