'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRewardData } from '@/hooks/useRewardData';
import { deleteTier } from '@/lib/firestore/rewards';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { RewardTier } from '@/types';
import * as LucideIcons from 'lucide-react';
import { TierDialog } from './TierDialog';
import { useTranslations } from 'next-intl';

type IconName = keyof typeof LucideIcons;

const Icon = ({ name, className }: { name: IconName; className?: string }) => {
  const LucideIcon = LucideIcons[name] as React.ElementType;
  if (!LucideIcon) {
    return <LucideIcons.Shield className={className} />;
  }
  return <LucideIcon className={className} />;
};

export function ManageTiersTab() {
  const { tiers, loading } = useRewardData();
  const { toast } = useToast();
  const t = useTranslations('AdminRewardsPage');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tierToEdit, setTierToEdit] = useState<RewardTier | null>(null);
  const [tierToDelete, setTierToDelete] = useState<RewardTier | null>(null);

  const handleEdit = (tier: RewardTier) => {
    setTierToEdit(tier);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setTierToEdit(null);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!tierToDelete) return;
    try {
      await deleteTier(tierToDelete.id);
      toast({ title: t('toast_tier_deleted') });
      setTierToDelete(null);
    } catch (error) {
      toast({ variant: 'destructive', title: t('toast_tier_delete_error') });
    }
  };

  return (
    <>
      <TierDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        tier={tierToEdit}
      />
      <AlertDialog open={!!tierToDelete} onOpenChange={(open) => !open && setTierToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('delete_reward_confirm_title')}</AlertDialogTitle>
                <AlertDialogDescription>{t('delete_tier_confirm_desc', { tierName: tierToDelete?.name })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel_button')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{t('delete_confirm_action')}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('create_tier_button')}
          </Button>
        </div>

        <div className="space-y-2">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            : tiers.map((tier) => (
                <Card key={tier.id} className="p-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                      <Icon name={tier.iconName as IconName} className="h-6 w-6 text-amber-500" />
                      <div>
                        <h3 className="font-bold">{tier.name}</h3>
                        <p className="text-sm text-muted-foreground">{t('tier_points_required', { points: tier.minPoints.toLocaleString() })}</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(tier)}>
                          <Edit className="mr-2 h-3 w-3" /> {t('edit_button')}
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive" onClick={() => setTierToDelete(tier)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                </Card>
              ))}
        </div>
      </CardContent>
    </>
  );
}
