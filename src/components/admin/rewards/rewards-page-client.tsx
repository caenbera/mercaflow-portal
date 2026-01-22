
"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

// You will create these components in subsequent steps
// import { ManageRewardsTab } from './manage-rewards-tab';
// import { ManageTiersTab } from './manage-tiers-tab';
// import { ManageRulesTab } from './manage-rules-tab';

// Placeholder components for now
const ManageRewardsTab = () => <CardContent>Manage rewards content coming soon.</CardContent>;
const ManageTiersTab = () => <CardContent>Manage tiers content coming soon.</CardContent>;
const ManageRulesTab = () => <CardContent>Manage rules content coming soon.</CardContent>;


export function RewardsPageClient() {
  const t = useTranslations('AdminRewardsPage');

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="rules">{t('tabs_rules')}</TabsTrigger>
          <TabsTrigger value="rewards">{t('tabs_rewards')}</TabsTrigger>
          <TabsTrigger value="tiers">{t('tabs_tiers')}</TabsTrigger>
        </TabsList>
        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('rules_title')}</CardTitle>
              <CardDescription>{t('rules_desc')}</CardDescription>
            </CardHeader>
            <ManageRulesTab />
          </Card>
        </TabsContent>
        <TabsContent value="rewards" className="mt-4">
          <Card>
             <CardHeader>
              <CardTitle>{t('rewards_title')}</CardTitle>
              <CardDescription>{t('rewards_desc')}</CardDescription>
            </CardHeader>
            <ManageRewardsTab />
          </Card>
        </TabsContent>
        <TabsContent value="tiers" className="mt-4">
           <Card>
             <CardHeader>
              <CardTitle>{t('tiers_title')}</CardTitle>
              <CardDescription>{t('tiers_desc')}</CardDescription>
            </CardHeader>
            <ManageTiersTab />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
