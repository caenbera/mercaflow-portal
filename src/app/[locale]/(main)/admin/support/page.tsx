"use client";

import { RoleGuard } from '@/components/auth/role-guard';
import { SupportPageClient } from '@/components/admin/support/support-page-client';
import { FaqManager } from '@/components/admin/support/faq-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { TicketCheck, HelpCircle } from 'lucide-react';

export default function AdminSupportPage() {
  const t = useTranslations('AdminSupportPage');

  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-slate-900">{t('page_title')}</h1>
          <p className="text-slate-500 mt-1">{t('subtitle')}</p>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="bg-white p-1 rounded-xl border shadow-sm mb-8 h-auto">
            <TabsTrigger value="tickets" className="rounded-lg py-2.5 px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <TicketCheck className="h-4 w-4" />
              {t('tab_tickets')}
            </TabsTrigger>
            <TabsTrigger value="faqs" className="rounded-lg py-2.5 px-6 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <HelpCircle className="h-4 w-4" />
              {t('tab_faqs')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="mt-0 outline-none">
            <SupportPageClient />
          </TabsContent>

          <TabsContent value="faqs" className="mt-0 outline-none">
            <FaqManager />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
