'use client';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { LanguageSwitcher } from './language-switcher';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

export function LandingPageHeader() {
  const t = useTranslations('Auth');
  
  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-3">
                    <Image src="https://i.postimg.cc/y86gF4Cp/the-fresh-hub-noback.png" alt="The Fresh Hub" width={48} height={48} className="h-12 w-auto" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 font-headline">The Fresh Hub</h1>
                        <p className="text-sm text-gray-600">Tu Socio de Confianza</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="hidden lg:flex items-center space-x-2 text-green-600">
                        <MessageCircle />
                        <span className="font-semibold">Hablamos Español</span>
                    </div>
                    <Button asChild className="hidden md:flex bg-accent text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition">
                      <a href="tel:+1-555-FRESH">
                          <Phone className="mr-2" size={16} />Llámanos Ahora
                      </a>
                    </Button>
                    <LanguageSwitcher />
                    <Button asChild variant="outline" className="hidden sm:inline-flex">
                        <Link href="/login">{t('nav_login')}</Link>
                    </Button>
                     <Button asChild>
                        <Link href="/signup">{t('nav_signup')}</Link>
                    </Button>
                </div>
            </div>
        </div>
    </header>
  );
}
