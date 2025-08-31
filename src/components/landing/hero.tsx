"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/lib/i18n';

export function Hero() {
  const { locale } = useLanguage();
  const t = useTranslation(locale);

  return (
    <section className="container grid lg:grid-cols-2 gap-12 items-center py-20 sm:py-32">
      <div className="flex flex-col items-start gap-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold !leading-tight tracking-tighter">
          {t('hero_title')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('hero_subtitle')}
        </p>
        <Button size="lg" asChild>
          <Link href="/login">{t('hero_cta')}</Link>
        </Button>
      </div>
      <div className="relative">
        <Image
          src="https://picsum.photos/800/600"
          alt="Fresh produce"
          width={800}
          height={600}
          className="rounded-xl shadow-2xl"
          data-ai-hint="fresh produce"
        />
      </div>
    </section>
  );
}
