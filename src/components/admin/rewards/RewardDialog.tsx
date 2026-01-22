'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { manageReward } from '@/lib/firestore/rewards';
import type { Reward } from '@/types';

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

interface RewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: Reward | null;
}

export function RewardDialog({ open, onOpenChange, reward }: RewardDialogProps) {
  const { toast } = useToast();
  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      name: '',
      description: '',
      pointCost: 0,
      iconName: 'Gift',
      color: 'bg-gray-100 text-gray-600',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(reward || {
        name: '',
        description: '',
        pointCost: 0,
        iconName: 'Gift',
        color: 'bg-gray-100 text-gray-600',
      });
    }
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
