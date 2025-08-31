"use client";

import Link from 'next/link';
import { Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/landing/language-switcher';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/lib/i18n';

export function LandingHeader() {
  const { locale } = useLanguage();
  const t = useTranslation(locale);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">Fresh Hub</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link href="#features" className="text-foreground/60 transition-colors hover:text-foreground/80">{t('nav_features')}</Link>
        </nav>
        <div className="flex items-center justify-end space-x-2">
          <LanguageSwitcher />
          <Button variant="ghost" asChild>
            <Link href="/login">{t('nav_login')}</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">{t('nav_signup')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
