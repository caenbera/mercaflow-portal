"use client";

import { Sprout } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/lib/i18n';

export function Footer() {
  const { locale } = useLanguage();
  const t = useTranslation(locale);

  return (
    <footer className="border-t">
      <div className="container flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
        <div className="flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">{t('footer_made_with_love')}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} The Fresh Hub. {t('footer_all_rights_reserved')}
        </p>
      </div>
    </footer>
  );
}
