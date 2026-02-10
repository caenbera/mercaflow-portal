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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { manageRule } from '@/lib/firestore/rewards';
import type { RewardRule, Product, ProductCategory } from '@/types';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const ruleTypes = [
  'pointsPerDollar',
  'bonusForAmount',
  'fixedPointsPerOrder',
  'bonusForProduct',
  'multiplierPerDay',
  'firstOrderBonus',
  'anniversaryBonus',
  'bonusForVariety',
  'bonusForCategory',
  'consecutiveBonus',
] as const satisfies Readonly<RewardRule['ruleType'][]>;

const createRuleSchema = (t: Function) => z.object({
  name: z.object({
    es: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    en: z.string().min(3, 'Name must be at least 3 characters'),
  }),
  ruleType: z.enum(ruleTypes, { required_error: t('toast_rule_error') }),
  points: z.coerce.number().optional(),
  amount: z.coerce.number().optional(),
  perAmount: z.coerce.number().optional(),
  multiplier: z.coerce.number().optional(),
  productId: z.string().optional(),
  category: z.object({ es: z.string(), en: z.string() }).optional(),
  dayOfWeek: z.coerce.number().optional(),
  weeks: z.coerce.number().optional(),
  isActive: z.boolean(),
}).refine(
  (data) => {
    switch (data.ruleType) {
      case 'pointsPerDollar': return data.points != null && data.perAmount != null;
      case 'bonusForAmount': return data.points != null && data.amount != null;
      case 'fixedPointsPerOrder': return data.points != null;
      case 'bonusForProduct': return data.points != null && data.productId != null;
      case 'multiplierPerDay': return data.multiplier != null && data.dayOfWeek != null;
      case 'firstOrderBonus': return data.points != null;
      case 'anniversaryBonus': return data.points != null;
      case 'bonusForVariety': return data.points != null && data.amount != null;
      case 'bonusForCategory': return data.points != null && data.category != null;
      case 'consecutiveBonus': return data.points != null && data.weeks != null;
      default: return false;
    }
  },
  {
    message: 'Please fill in all required fields for the selected rule type.',
    path: ['name'],
  }
);

type RuleFormValues = z.infer<ReturnType<typeof createRuleSchema>>; // ← Corregido aquí

interface RuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: RewardRule | null;
  products: Product[];
  categories: ProductCategory[];
}

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type RuleFieldConfig = {
  name: keyof RuleFormValues;
  label: string;
  type?: 'number' | 'select' | 'category' | 'day';
};

const useRuleFieldConfig = () => {
    const t = useTranslations('AdminRewardsPage');
    
    return {
      pointsPerDollar: [
        { name: 'points' as const, label: t('rule_field_points'), type: 'number' as const },
        { name: 'perAmount' as const, label: t('rule_field_per_amount'), type: 'number' as const },
      ],
      bonusForAmount: [
        { name: 'amount' as const, label: t('rule_field_if_over'), type: 'number' as const },
        { name: 'points' as const, label: t('rule_field_bonus_points'), type: 'number' as const },
      ],
      fixedPointsPerOrder: [{ name: 'points' as const, label: t('rule_field_points_per_order'), type: 'number' as const }],
      bonusForProduct: [
        { name: 'productId' as const, label: t('rule_field_product'), type: 'select' as const },
        { name: 'points' as const, label: t('rule_field_bonus_points'), type: 'number' as const },
      ],
      multiplierPerDay: [
        { name: 'multiplier' as const, label: t('rule_field_multiplier'), type: 'number' as const },
        { name: 'dayOfWeek' as const, label: t('rule_field_day_of_week'), type: 'day' as const },
      ],
      firstOrderBonus: [{ name: 'points' as const, label: t('rule_field_bonus_points'), type: 'number' as const }],
      anniversaryBonus: [{ name: 'points' as const, label: t('rule_field_bonus_points'), type: 'number' as const }],
      bonusForVariety: [
        { name: 'amount' as const, label: t('rule_field_if_more_than_items'), type: 'number' as const },
        { name: 'points' as const, label: t('rule_field_bonus_points'), type: 'number' as const },
      ],
      bonusForCategory: [
        { name: 'category' as const, label: t('rule_field_category'), type: 'category' as const },
        { name: 'points' as const, label: t('rule_field_bonus_points'), type: 'number' as const },
      ],
      consecutiveBonus: [
        { name: 'weeks' as const, label: t('rule_field_consecutive_weeks'), type: 'number' as const },
        { name: 'points' as const, label: t('rule_field_bonus_points'), type: 'number' as const },
      ],
    };
};

function renderField(
  form: ReturnType<typeof useForm<RuleFormValues>>,
  fieldDef: RuleFieldConfig, // ← Tipado agregado aquí
  props: { products: Product[]; categories: ProductCategory[], t: Function }
) {
  const { products, categories, t } = props;
  const { control } = form;

  switch (fieldDef.type) {
    case 'select':
      return (
        <FormField
          control={control}
          name={fieldDef.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{fieldDef.label}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('rule_field_product_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name.es}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      );
    case 'category':
      return (
        <FormField
          control={control}
          name={fieldDef.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{fieldDef.label}</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(JSON.parse(v))}
                value={field.value ? JSON.stringify(field.value) : undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('rule_field_category_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.es} value={JSON.stringify(c)}>
                      {c.es}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      );
    case 'day':
      return (
        <FormField
          control={control}
          name={fieldDef.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{fieldDef.label}</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(parseInt(v))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('rule_field_day_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {weekDays.map((day, i) => (
                    <SelectItem key={day} value={i.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      );
    default:
      return (
        <FormField
          control={control}
          name={fieldDef.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{fieldDef.label}</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} value={field.value?.toString() ?? ''} /> {/* ← Corregido aquí */}
              </FormControl>
            </FormItem>
          )}
        />
      );
  }
}

export function RuleDialog({
  open,
  onOpenChange,
  rule,
  products,
  categories,
}: RuleDialogProps) {
  const { toast } = useToast();
  const t = useTranslations('AdminRewardsPage');
  const ruleFieldConfig = useRuleFieldConfig();
  
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(createRuleSchema(t)),
    defaultValues: { name: { es: '', en: '' }, isActive: true },
  });

  const watchedRuleType = form.watch('ruleType');

  React.useEffect(() => {
    if (open) {
      form.reset(
        rule
          ? { ...rule, dayOfWeek: rule.dayOfWeek ?? undefined }
          : {
              name: { es: '', en: '' },
              ruleType: undefined,
              points: undefined,
              amount: undefined,
              perAmount: undefined,
              multiplier: undefined,
              productId: undefined,
              category: undefined,
              dayOfWeek: undefined,
              weeks: undefined,
              isActive: true,
            }
      );
    }
  }, [rule, open, form]);

  const onSubmit = async (data: RuleFormValues) => {
    try {
      await manageRule(rule?.id || null, data);
      toast({ title: rule ? t('toast_rule_updated') : t('toast_rule_created') });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: t('toast_rule_error') });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? t('dialog_edit_rule') : t('dialog_create_rule')}</DialogTitle>
          <DialogDescription>
            {t('dialog_rule_desc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name.es"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dialog_rule_name_label_es')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('dialog_rule_name_placeholder_es')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="name.en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dialog_rule_name_label_en')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('dialog_rule_name_placeholder_en')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ruleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog_rule_template_label')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('dialog_rule_template_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ruleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/([A-Z])/g, ' $1').trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

{watchedRuleType && ruleFieldConfig[watchedRuleType] && (
              <div className="space-y-4">
                {ruleFieldConfig[watchedRuleType].length === 1 ? (
                  renderField(form, ruleFieldConfig[watchedRuleType][0], { products, categories, t })
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {ruleFieldConfig[watchedRuleType].map((fieldDef) => (
                       <React.Fragment key={fieldDef.name}>
                        {renderField(form, fieldDef, { products, categories, t })}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{t('dialog_rule_active_label')}</FormLabel>
                    <FormDescription>{t('dialog_rule_active_desc')}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('cancel_button')}
              </Button>
              <Button type="submit">{t('dialog_rule_save_button')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}