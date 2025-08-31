"use client";

import { Package, Leaf, Truck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/lib/i18n';

export function Features() {
  const { locale } = useLanguage();
  const t = useTranslation(locale);
  
  const features = [
    {
      icon: <Package className="w-8 h-8 text-primary" />,
      title: t('feature_1_title'),
      description: t('feature_1_desc'),
    },
    {
      icon: <Leaf className="w-8 h-8 text-primary" />,
      title: t('feature_2_title'),
      description: t('feature_2_desc'),
    },
    {
      icon: <Truck className="w-8 h-8 text-primary" />,
      title: t('feature_3_title'),
      description: t('feature_3_desc'),
    },
  ];

  return (
    <section id="features" className="container py-20 sm:py-32">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="text-center flex flex-col items-center p-6">
            <CardHeader>
              <div className="mb-4">{feature.icon}</div>
              <CardTitle className="font-headline">{feature.title}</CardTitle>
            </CardHeader>
            <CardDescription>{feature.description}</CardDescription>
          </Card>
        ))}
      </div>
    </section>
  );
}
