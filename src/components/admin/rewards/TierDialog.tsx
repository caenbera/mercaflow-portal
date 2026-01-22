'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { manageTier } from '@/lib/firestore/rewards';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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

export function TierDialog({
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
