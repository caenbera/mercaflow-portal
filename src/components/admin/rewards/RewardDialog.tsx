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
import { manageReward } from '@/lib/firestore/rewards';
import type { Reward } from '@/types';
import { allowedIcons, iconNames } from '@/lib/constants/icons';
import { useTranslations } from 'next-intl';

const rewardSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  pointCost: z.coerce.number().int().min(1, 'Point cost must be a positive integer'),
  iconName: z.enum(iconNames as [string, ...string[]], {
    required_error: 'Please select an icon',
  }),
  color: z.string().min(1, 'Color is required'),
});

type RewardFormValues = z.infer<typeof rewardSchema>;

const colorOptions = [
  { value: 'bg-green-100 text-green-600', name: 'Green' },
  { value: 'bg-blue-100 text-blue-600', name: 'Blue' },
  { value: 'bg-yellow-100 text-yellow-600', name: 'Yellow' },
  { value: 'bg-orange-100 text-orange-600', name: 'Orange' },
  { value: 'bg-red-100 text-red-600', name: 'Red' },
  { value: 'bg-purple-100 text-purple-600', name: 'Purple' },
] as const;

interface RewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: Reward | null;
}

export function RewardDialog({ open, onOpenChange, reward }: RewardDialogProps) {
  const { toast } = useToast();
  const t = useTranslations('AdminRewardsPage');

  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      name: '',
      description: '',
      pointCost: 100,
      iconName: 'Gift',
      color: 'bg-gray-100 text-gray-600',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset(
        reward || {
          name: '',
          description: '',
          pointCost: 100,
          iconName: 'Gift',
          color: 'bg-gray-100 text-gray-600',
        }
      );
    }
  }, [reward, open, form]);

  const onSubmit = async (data: RewardFormValues) => {
    try {
      await manageReward(reward?.id || null, data);
      toast({
        title: reward ? t('toast_reward_updated') : t('toast_reward_created'),
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving reward:', error);
      toast({
        variant: 'destructive',
        title: t('toast_reward_error'),
        description: t('toast_reward_error_desc'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{reward ? t('dialog_edit_reward') : t('dialog_create_reward')}</DialogTitle>
          <DialogDescription>
            {t('dialog_reward_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-1 pb-1 max-h-[50vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dialog_reward_name_label')}</FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={t('dialog_reward_name_placeholder')}
                        {...field}
                      />
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
                    <FormLabel>{t('dialog_reward_desc_label')}</FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={t('dialog_reward_desc_placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('dialog_reward_desc_help')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pointCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dialog_reward_cost_label')}</FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={t('dialog_reward_cost_placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('dialog_reward_cost_help')}
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
                    <FormLabel>{t('dialog_icon_label')}</FormLabel>
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {allowedIcons.map((iconOption) => {
                        const IconComponent = iconOption.component;
                        return (
                          <button
                            key={iconOption.name}
                            type="button"
                            onClick={() => field.onChange(iconOption.name)}
                            className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all ${
                              field.value === iconOption.name
                                ? 'border-primary bg-primary/10 scale-105'
                                : 'border-muted hover:bg-muted/30'
                            }`}
                            aria-label={t('dialog_reward_icon_select_aria', { iconName: iconOption.name })}
                          >
                            <IconComponent className="w-6 h-6" />
                            <span className="text-xs mt-1 text-muted-foreground">{iconOption.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dialog_reward_color_label')}</FormLabel>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {colorOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={`w-10 h-10 rounded-full border-2 transition-colors ${
                            field.value === option.value
                              ? 'border-primary scale-105'
                              : 'border-transparent hover:opacity-80'
                          }`}
                          aria-label={t('dialog_reward_color_select_aria', { colorName: option.name })}
                        >
                          <div className={`w-full h-full rounded-full ${option.value}`} />
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel_button')}
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            {reward ? t('dialog_reward_update_button') : t('dialog_reward_create_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
