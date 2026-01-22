'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { manageTier } from '@/lib/firestore/rewards';
import type { RewardTier } from '@/types';
import { useTranslations } from 'next-intl';

const tierSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  minPoints: z.coerce.number().int().min(0, 'Points must be a non-negative number'),
  iconName: z.string().min(2, 'Icon name is required'),
});

type TierFormValues = z.infer<typeof tierSchema>;

interface TierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: RewardTier | null;
}

export function TierDialog({ open, onOpenChange, tier }: TierDialogProps) {
  const { toast } = useToast();
  const t = useTranslations('AdminRewardsPage');

  const form = useForm<TierFormValues>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      name: '',
      minPoints: 0,
      iconName: 'Shield',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset(
        tier || {
          name: '',
          minPoints: 0,
          iconName: 'Shield',
        }
      );
    }
  }, [tier, open, form]);

  const onSubmit = async (data: TierFormValues) => {
    try {
      await manageTier(tier?.id || null, data);
      toast({
        title: tier ? t('toast_tier_updated') : t('toast_tier_created'),
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving tier:', error);
      toast({
        variant: 'destructive',
        title: t('toast_tier_error'),
        description: t('toast_tier_error_desc'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tier ? t('dialog_edit_tier') : t('dialog_create_tier')}</DialogTitle>
          <DialogDescription>
            {t('dialog_tier_desc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog_tier_name_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('dialog_tier_name_placeholder')} {...field} />
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
                  <FormLabel>{t('dialog_tier_points_label')}</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder={t('dialog_tier_points_placeholder')} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('dialog_tier_points_help')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iconName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog_reward_icon_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('dialog_tier_icon_placeholder')} {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    {t('dialog_reward_icon_help')}{' '}
                    <a
                      href="https://lucide.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      lucide.dev
                    </a>
                    .
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('cancel_button')}
              </Button>
              <Button type="submit">{tier ? t('dialog_tier_update_button') : t('dialog_tier_create_button')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
