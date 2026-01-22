'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRewardData } from '@/hooks/useRewardData';
import { deleteReward } from '@/lib/firestore/rewards';
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
import type { Reward } from '@/types';
import * as LucideIcons from 'lucide-react';
import { RewardDialog } from './RewardDialog'; // Import the new dialog component

type IconName = keyof typeof LucideIcons;

const Icon = ({ name, className }: { name: IconName; className?: string }) => {
  const LucideIcon = LucideIcons[name] as React.ElementType;
  if (!LucideIcon) {
    return <LucideIcons.Gift className={className} />;
  }
  return <LucideIcon className={className} />;
};

export function ManageRewardsTab() {
  const { rewards, loading } = useRewardData();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rewardToEdit, setRewardToEdit] = useState<Reward | null>(null);
  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);

  const handleEdit = (reward: Reward) => {
    setRewardToEdit(reward);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setRewardToEdit(null);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!rewardToDelete) return;
    try {
      await deleteReward(rewardToDelete.id);
      toast({ title: 'Reward deleted' });
      setRewardToDelete(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting reward' });
    }
  };

  return (
    <React.Fragment>
      <RewardDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} reward={rewardToEdit} />
      <AlertDialog open={!!rewardToDelete} onOpenChange={(open) => !open && setRewardToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the reward "{rewardToDelete?.name}".</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Reward
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
            : rewards.map((reward) => (
                <Card key={reward.id} className="p-4 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${reward.color}`}>
                        <Icon name={reward.iconName as IconName} className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                         <div className="font-bold text-amber-600 text-lg">{reward.pointCost.toLocaleString()}</div>
                         <div className="text-xs text-muted-foreground font-semibold">PTS</div>
                      </div>
                    </div>
                    <h3 className="font-bold mt-3">{reward.name}</h3>
                    <p className="text-sm text-muted-foreground">{reward.description}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(reward)}>
                          <Edit className="mr-2 h-3 w-3" /> Edit
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive" onClick={() => setRewardToDelete(reward)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                </Card>
              ))}
        </div>
      </CardContent>
    </React.Fragment>
  );
}
