'use client';
import { Button } from '@/components/ui/button';
import { Gift, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function SpecialOffer() {
  const t = useTranslations('LandingPageSpecialOffer');
  const items = [
    t('offer_item_1'),
    t('offer_item_2'),
    t('offer_item_3'),
    t('offer_item_4'),
  ];

  return (
    <section id="muestra" className="py-16 bg-accent text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold mb-6 flex items-center justify-center gap-3"><Gift size={40} /> {t('offer_title')}</h2>
            <div className="bg-white bg-opacity-20 p-8 rounded-xl mb-8">
                <h3 className="text-3xl font-bold mb-4">{t('offer_subtitle')}</h3>
                <p className="text-xl mb-6">{t('offer_desc')}</p>
                <ul className="text-lg space-y-2 mb-6 text-left inline-block">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2"><Check /> {item}</li>
                    ))}
                </ul>
                <p className="text-2xl font-bold mb-4">{t('offer_value')}</p>
            </div>
            <Button asChild size="lg" className="bg-white text-orange-600 px-10 py-4 text-xl font-bold hover:bg-gray-100 transition animate-pulse h-auto">
              <a href="#formulario-muestra">
                  <Gift className="mr-2" />{t('offer_cta')}
              </a>
            </Button>
        </div>
    </section>
  );
}
