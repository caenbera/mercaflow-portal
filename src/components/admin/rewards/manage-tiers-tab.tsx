
'use client';

import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRewardData } from '@/hooks/useRewardData';
import { manageTier, deleteTier } from '@/lib/firestore/rewards';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { RewardTier } from '@/types';
import * as LucideIcons from 'lucide-react';

type IconName = keyof typeof LucideIcons;

const Icon = ({ name, className }: { name: IconName; className?: string }) => {
  const LucideIcon = LucideIcons[name] as React.ElementType;
  if (!LucideIcon) {
    return <LucideIcons.Shield className={className} />;
  }
  return <LucideIcon className={className} />;
};

const tierSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  minPoints: z.coerce.number().min(0, "Points must be a positive number"),
  iconName: z.string().min(2, "Icon name is required"),
});

type TierFormValues = z.infer<typeof tierSchema>;

function TierDialog({
  open,
  onOpenChange,
  tier,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: RewardTier | null;
}) {
  const { toast } = useToast();
  const form = useForm<TierFormValues>({
    resolver: zodResolver(tierSchema),
    defaultValues: tier || {
      name: '',
      minPoints: 0,
      iconName: 'Shield',
    },
  });

  React.useEffect(() => {
    form.reset(tier || {
      name: '',
      minPoints: 0,
      iconName: 'Shield',
    });
  }, [tier, open, form]);

  const onSubmit = async (data: TierFormValues) => {
    try {
      await manageTier(tier?.id || null, data);
      toast({ title: `Tier ${tier ? 'updated' : 'created'} successfully.` });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving tier.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tier ? 'Edit Tier' : 'Create New Tier'}</DialogTitle>
          <DialogDescription>
            Define a customer loyalty level.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bronze, Silver, Gold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Points to Achieve</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="iconName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Shield, Award, Crown" {...field} />
                  </FormControl>
                   <p className="text-xs text-muted-foreground pt-1">
                      Find icons at lucide.dev and use the exact name.
                    </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save Tier</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
