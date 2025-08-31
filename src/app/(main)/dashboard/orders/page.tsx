"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";
import { useTranslation } from "@/lib/i18n";

export default function ManageOrdersPage() {
  const { locale } = useLanguage();
  const t = useTranslation(locale);
  
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-headline font-bold">{t('orders_title')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('orders_card_title')}</CardTitle>
          <CardDescription>{t('orders_card_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{t('orders_table_placeholder')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
