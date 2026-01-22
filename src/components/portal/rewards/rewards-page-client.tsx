
"use client";

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
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
import { ArrowLeft, Crown, PiggyBank, Truck, Utensils, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useRewardData } from '@/hooks/useRewardData';
import { useRewardActivity } from '@/hooks/useRewardActivity';
import * as LucideIcons from 'lucide-react';
import { redeemReward } from '@/lib/firestore/rewards';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

type IconName = keyof typeof LucideIcons;

const Icon = ({ name, className }: { name: IconName; className?: string }) => {
  const LucideIcon = LucideIcons[name] as React.ElementType;
  if (!LucideIcon) {
    return <LucideIcons.Gift className={className} />;
  }
  return <LucideIcon className={className} />;
};


export function RewardsPageClient() {
  const t = useTranslations('ClientRewardsPage');
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { rewards, tiers, loading: rewardsLoading } = useRewardData();
  const { activities, loading: activityLoading } = useRewardActivity(user?.uid);
  
  const [selectedReward, setSelectedReward] = useState<{id: string; name: string, pointCost: number} | null>(null);

  const loading = authLoading || rewardsLoading || activityLoading;
  const points = userProfile?.rewardPoints || 0;

  const { currentTier, nextTier, progressToNextTier } = useMemo(() => {
    if (loading || tiers.length === 0) return { currentTier: null, nextTier: null, progressToNextTier: 0 };

    const sortedTiers = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
    let current = sortedTiers[0];
    let next = null;

    for (let i = 0; i < sortedTiers.length; i++) {
      if (points >= sortedTiers[i].minPoints) {
        current = sortedTiers[i];
      } else {
        next = sortedTiers[i];
        break;
      }
    }
    
    let progress = 100;
    if (next) {
        const pointsInTier = points - current.minPoints;
        const totalPointsForTier = next.minPoints - current.minPoints;
        progress = (pointsInTier / totalPointsForTier) * 100;
    }

    return { currentTier: current, nextTier: next, progressToNextTier: progress };
  }, [points, tiers, loading]);

  const handleRedeemClick = (reward: {id: string, name: string, pointCost: number}) => {
    if (points >= reward.pointCost) {
      setSelectedReward(reward);
    } else {
      toast({
        variant: 'destructive',
        title: t('not_enough_points_title'),
        description: t('not_enough_points_desc', { cost: reward.pointCost }),
      });
    }
  };
  
  const confirmRedemption = async () => {
    if (!selectedReward || !user) return;
    try {
        await redeemReward(user.uid, selectedReward.id, selectedReward.pointCost, selectedReward.name);
        toast({
            title: t('redeem_success_title'),
            description: t('redeem_success_desc'),
        });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not redeem reward.' });
    }
    
    setSelectedReward(null);
  };
  
  return (
    <>
      <AlertDialog open={!!selectedReward} onOpenChange={(isOpen) => !isOpen && setSelectedReward(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('redeem_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('redeem_confirm_desc', { rewardName: selectedReward?.name, rewardCost: selectedReward?.pointCost })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRedemption}>{t('confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="pb-20 md:pb-4">
        <div className="bg-background p-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
        </div>

        <div className="bg-card p-5 text-center md:rounded-b-2xl md:shadow-sm">
          <div className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex flex-col items-center justify-center text-white shadow-lg border-4 border-card">
            {loading ? <Skeleton className="h-10 w-20 bg-white/20"/> : <div className="text-3xl font-extrabold leading-none">{points.toLocaleString()}</div>}
            <div className="text-xs font-bold uppercase tracking-wider">{t('points_label')}</div>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-primary text-yellow-400 font-bold px-4 py-1.5 rounded-full mt-4">
            {currentTier ? <Icon name={currentTier.iconName as IconName} className="h-4 w-4" /> : <Skeleton className="h-4 w-4 rounded-full"/>}
            {loading ? <Skeleton className="h-4 w-16" /> : <span>{currentTier?.name}</span>}
          </div>
          <div className="max-w-xs mx-auto mt-4">
            {loading ? <Skeleton className="h-8 w-full"/> : (
              nextTier ? (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{currentTier?.name}</span>
                    <span>{t('next_level_progress', { points: nextTier.minPoints - points })}</span>
                  </div>
                  <Progress value={progressToNextTier} className="h-2 [&>div]:bg-yellow-400" />
                </>
              ) : (
                <div className="text-xs font-semibold text-green-600">{t('max_level')}</div>
              )
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">{t('points_rule')}</p>
        </div>

        <div className="px-4 mt-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase mb-3 px-1">{t('redeem_rewards_title')}</h3>
          <div className="space-y-3">
            {loading ? (
                Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl"/>)
            ) : rewards.map((reward) => {
              const isLocked = points < reward.pointCost;
              return (
                <div
                  key={reward.id}
                  onClick={() => !isLocked && handleRedeemClick(reward)}
                  className={cn(
                    "bg-card rounded-xl p-3 flex items-center gap-4 shadow-sm border transition-transform active:scale-[0.98]",
                    isLocked ? "opacity-60 filter grayscale-[50%] cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", reward.color)}>
                    <Icon name={reward.iconName as IconName} className="h-6 w-6" />
                  </div>
                  <div className="flex-grow">
                    <h6 className="font-bold text-sm text-foreground">{reward.name}</h6>
                    <p className="text-xs text-muted-foreground">{reward.description}</p>
                  </div>
                  <div className="text-right bg-muted/50 px-2 py-1 rounded-md shrink-0">
                    <div className="font-bold text-amber-600 text-sm">{reward.pointCost.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">{t('points_abbr')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-4 mt-6">
           <h3 className="text-sm font-bold text-muted-foreground uppercase mb-3 px-1">{t('recent_activity_title')}</h3>
           <div className="bg-card rounded-xl shadow-sm p-3 space-y-2">
                {loading ? <Skeleton className="h-14 w-full"/> : 
                activities.length === 0 ? <p className="text-sm text-center text-muted-foreground py-4">{t('no_activity')}</p> :
                activities.map(activity => (
                    <div key={activity.id} className="flex justify-between items-center pb-2 border-b last:border-0">
                        <div>
                            <p className="font-semibold text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">{format(activity.createdAt.toDate(), 'dd MMM, yyyy')}</p>
                        </div>
                        <p className={cn("font-bold", activity.points > 0 ? 'text-green-600' : 'text-red-600')}>
                          {activity.points > 0 ? '+' : ''}{activity.points.toLocaleString()} pts
                        </p>
                    </div>
                ))}
           </div>
        </div>
      </div>
    </>
  );
}
