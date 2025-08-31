"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";
import { useTranslation } from "@/lib/i18n";

export default function ManageUsersPage() {
  const { locale } = useLanguage();
  const t = useTranslation(locale);

  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-headline font-bold">{t('users_title')}</h1>
        <Card>
          <CardHeader>
            <CardTitle>{t('users_card_title')}</CardTitle>
            <CardDescription>{t('users_card_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{t('users_table_placeholder')}</p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
