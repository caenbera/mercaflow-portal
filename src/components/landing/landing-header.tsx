"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/landing/language-switcher';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/lib/i18n';
import { Phone, MessageSquare } from 'lucide-react';

export function LandingHeader() {
  const { locale } = useLanguage();
  const t = useTranslation(locale);

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-3">
                    <Image src="https://i.postimg.cc/y86gF4Cp/the-fresh-hub-noback.png" alt="The Fresh Hub" width={48} height={48} className="h-12 w-auto" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">The Fresh Hub</h1>
                        <p className="text-sm text-gray-600">{t('header_subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="hidden md:flex items-center space-x-4">
                       <div className="flex items-center space-x-2 text-green-600">
                           <MessageSquare className="h-5 w-5" />
                           <span className="font-semibold">{t('header_speaks_spanish')}</span>
                       </div>
                       <LanguageSwitcher />
                       <Button variant="ghost" asChild>
                          <Link href="/login">{t('nav_login')}</Link>
                      </Button>
                      <Button asChild>
                          <Link href="/signup">{t('nav_signup')}</Link>
                      </Button>
                    </div>
                    <div className="md:hidden flex items-center space-x-2">
                      <LanguageSwitcher />
                      <Button asChild size="icon" className="bg-accent-orange hover:bg-orange-600">
                        <a href="tel:+1-555-FRESH">
                          <Phone className="h-5 w-5" />
                          <span className="sr-only">{t('header_call_now')}</span>
                        </a>
                      </Button>
                    </div>
                </div>
            </div>
        </div>
    </header>
  );
}
