
'use client';

import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRewardData } from '@/hooks/useRewardData';
import { manageReward, deleteReward } from '@/lib/firestore/rewards';
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
import type { Reward } from '@/types';
import * as LucideIcons from 'lucide-react';

type IconName = keyof typeof LucideIcons;

const Icon = ({ name, className }: { name: IconName; className?: string }) => {
  const LucideIcon = LucideIcons[name] as React.ElementType;
  if (!LucideIcon) {
    return <LucideIcons.Gift className={className} />;
  }
  return <LucideIcon className={className} />;
};

const rewardSchema = z.object({
  name: z.string().min(3, "Name is too short"),
  description: z.string().min(5, "Description is too short"),
  pointCost: z.coerce.number().min(1, "Point cost must be at least 1"),
  iconName: z.string().min(2, "Icon name is required"),
  color: z.string().min(1, "Color is required"),
});

type RewardFormValues = z.infer<typeof rewardSchema>;

const colorOptions = [
  { value: 'bg-green-100 text-green-600', name: 'Green' },
  { value: 'bg-blue-100 text-blue-600', name: 'Blue' },
  { value: 'bg-yellow-100 text-yellow-600', name: 'Yellow' },
  { value: 'bg-orange-100 text-orange-600', name: 'Orange' },
  { value: 'bg-red-100 text-red-600', name: 'Red' },
  { value: 'bg-purple-100 text-purple-600', name: 'Purple' },
];

function RewardDialog({
  open,
  onOpenChange,
  reward,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: Reward | null;
}) {
  const { toast } = useToast();
  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema),
    defaultValues: reward || {
      name: '',
      description: '',
      pointCost: 0,
      iconName: 'Gift',
      color: 'bg-gray-100 text-gray-600',
    },
  });

  React.useEffect(() => {
    form.reset(reward || {
      name: '',
      description: '',
      pointCost: 0,
      iconName: 'Gift',
      color: 'bg-gray-100 text-gray-600',
    });
  }, [reward, open, form]);

  const onSubmit = async (data: RewardFormValues) => {
    try {
      await manageReward(reward?.id || null, data);
      toast({ title: `Reward ${reward ? 'updated' : 'created'} successfully.` });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving reward.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reward ? 'Edit Reward' : 'Create New Reward'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the reward.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., $20 Credit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Applicable on your next invoice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pointCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Point Cost</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000" {...field} />
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
                    <Input placeholder="e.g., PiggyBank" {...field} />
                  </FormControl>
                   <p className="text-xs text-muted-foreground pt-1">
                      Find icons at lucide.dev and use the exact name.
                    </p>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map(option => (
                        <button key={option.value} type="button" onClick={() => field.onChange(option.value)} className={`w-10 h-10 rounded-full border-2 ${field.value === option.value ? 'border-primary' : 'border-transparent'}`}>
                            <div className={`w-full h-full rounded-full ${option.value}`}></div>
                        </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save Reward</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
