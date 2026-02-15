
'use client';
import { MessageCircle, Phone, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { LanguageSwitcher } from './language-switcher';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

export function LandingPageHeader() {
  const t = useTranslations('LandingPageHeader');
  const tAuth = useTranslations('Auth');
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3 md:py-4">
                <div className="flex items-center space-x-3">
                    <Image src="https://i.postimg.cc/y86gF4Cp/the-fresh_hub-noback.png" alt="MercaFlow Portal" width={48} height={48} className="h-10 w-auto md:h-12" />
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 font-headline tracking-tight">MercaFlow Portal</h1>
                        <p className="text-xs md:text-sm text-gray-600">{t('header_subtitle')}</p>
                    </div>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-2 sm:space-x-4">
                    <div className="hidden lg:flex items-center space-x-2 text-green-600">
                        <MessageCircle />
                        <span className="font-semibold">{t('header_speaks_spanish')}</span>
                    </div>
                    <Button asChild className="bg-accent text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition">
                      <a href="tel:+1-555-FRESH">
                          <Phone className="mr-2" size={16} />{t('header_call_now')}
                      </a>
                    </Button>
                    <LanguageSwitcher />
                    <Button asChild variant="outline">
                        <Link href="/login">{tAuth('nav_login')}</Link>
                    </Button>
                     <Button asChild>
                        <Link href="/signup">{tAuth('nav_signup')}</Link>
                    </Button>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden flex items-center gap-1">
                    <LanguageSwitcher />
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Menu />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <nav className="flex flex-col gap-4 py-8">
                            <SheetClose asChild>
                                <Button asChild variant="outline" className="w-full"><Link href="/login">{tAuth('nav_login')}</Link></Button>
                            </SheetClose>
                             <SheetClose asChild>
                                <Button asChild className="w-full"><Link href="/signup">{tAuth('nav_signup')}</Link></Button>
                             </SheetClose>
                            <hr className="my-2"/>
                            <SheetClose asChild>
                              <Button asChild className="w-full bg-accent text-white rounded-lg font-semibold hover:bg-orange-600 transition">
                                <a href="tel:+1-555-FRESH">
                                    <Phone className="mr-2" size={16} />{t('header_call_now')}
                                </a>
                              </Button>
                            </SheetClose>
                            <div className="flex items-center space-x-2 text-green-600 justify-center pt-4">
                                <MessageCircle />
                                <span className="font-semibold">{t('header_speaks_spanish')}</span>
                            </div>
                        </nav>
                      </SheetContent>
                    </Sheet>
                </div>
            </div>
        </div>
    </header>
  );
}
