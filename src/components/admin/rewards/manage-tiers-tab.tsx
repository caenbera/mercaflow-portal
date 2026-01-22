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
import { TierDialog } from './TierDialog'; // Import the new dialog component

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
      toast({ title: 'Tier deleted' });
      setTierToDelete(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting tier' });
    }
  };

  return (
    <React.Fragment>
      <TierDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} tier={tierToEdit} />
      <AlertDialog open={!!tierToDelete} onOpenChange={(open) => !open && setTierToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the tier "{tierToDelete?.name}".</AlertDialogDescription>
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
            Create Tier
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
                       <p className="text-sm text-muted-foreground">Requires {tier.minPoints.toLocaleString()} points</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(tier)}>
                          <Edit className="mr-2 h-3 w-3" /> Edit
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive" onClick={() => setTierToDelete(tier)}>
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
