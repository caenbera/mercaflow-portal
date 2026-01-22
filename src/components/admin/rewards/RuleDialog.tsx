'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { manageRule } from '@/lib/firestore/rewards';
import type { RewardRule, Product, ProductCategory } from '@/types';
import { cn } from '@/lib/utils';

const ruleTypes: RewardRule['ruleType'][] = [
  'pointsPerDollar', 'bonusForAmount', 'fixedPointsPerOrder', 'bonusForProduct',
  'multiplierPerDay', 'firstOrderBonus', 'anniversaryBonus', 'bonusForVariety',
  'bonusForCategory', 'consecutiveBonus'
];

const ruleSchema = z.object({
  name: z.string().min(3, "Rule name must be at least 3 characters."),
  ruleType: z.enum(ruleTypes, { required_error: "Please select a rule type." }),
  points: z.coerce.number().optional(),
  amount: z.coerce.number().optional(),
  perAmount: z.coerce.number().optional(),
  multiplier: z.coerce.number().optional(),
  productId: z.string().optional(),
  category: z.object({ es: z.string(), en: z.string() }).optional(),
  dayOfWeek: z.coerce.number().optional(),
  weeks: z.coerce.number().optional(),
  isActive: z.boolean(),
}).refine(data => {
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
}, {
    message: "Please fill in all required fields for the selected rule type.",
    path: ["name"], // General error path
});

type RuleFormValues = z.infer<typeof ruleSchema>;

interface RuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: RewardRule | null;
  products: Product[];
  categories: ProductCategory[];
}

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function RuleDialog({ open, onOpenChange, rule, products, categories }: RuleDialogProps) {
  const { toast } = useToast();
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { isActive: true },
  });
  const watchedRuleType = form.watch('ruleType');

  React.useEffect(() => {
    if (open) {
        form.reset(rule ? 
            { ...rule, dayOfWeek: rule.dayOfWeek ?? undefined } 
            : {
                name: '',
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
      toast({ title: `Rule ${rule ? 'updated' : 'created'} successfully.` });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving rule.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
          <DialogDescription>Define the conditions and outcomes for this point-earning rule.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Rule Name</FormLabel><FormControl><Input placeholder="e.g., Weekend Bonus" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="ruleType" render={({ field }) => (
              <FormItem><FormLabel>Rule Template</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a rule template..." /></SelectTrigger></FormControl><SelectContent>{ruleTypes.map(type => <SelectItem key={type} value={type}>{type.replace(/([A-Z])/g, ' $1').trim()}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            
            <div className={cn("space-y-4", watchedRuleType !== 'pointsPerDollar' && 'hidden')}>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Points</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="perAmount" render={({ field }) => (<FormItem><FormLabel>Per Amount ($)</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl></FormItem>)} />
              </div>
            </div>
            
            <div className={cn("space-y-4", watchedRuleType !== 'bonusForAmount' && 'hidden')}>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>If Order Over ($)</FormLabel><FormControl><Input type="number" placeholder="500" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="100" {...field} /></FormControl></FormItem>)} />
              </div>
            </div>

            <div className={cn("space-y-4", watchedRuleType !== 'fixedPointsPerOrder' && 'hidden')}>
              <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Points per Order</FormLabel><FormControl><Input type="number" placeholder="50" {...field} /></FormControl></FormItem>)} />
            </div>
            
            <div className={cn("space-y-4", watchedRuleType !== 'bonusForProduct' && 'hidden')}>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="productId" render={({ field }) => (<FormItem><FormLabel>Product</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a product..." /></SelectTrigger></FormControl><SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name.es}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="25" {...field} /></FormControl></FormItem>)} />
              </div>
            </div>

            <div className={cn("space-y-4", watchedRuleType !== 'multiplierPerDay' && 'hidden')}>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="multiplier" render={({ field }) => (<FormItem><FormLabel>Multiplier (e.g., 2)</FormLabel><FormControl><Input type="number" placeholder="2" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="dayOfWeek" render={({ field }) => (<FormItem><FormLabel>Day of Week</FormLabel><Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Select a day..." /></SelectTrigger></FormControl><SelectContent>{weekDays.map((day, i) => <SelectItem key={day} value={i.toString()}>{day}</SelectItem>)}</SelectContent></Select></FormItem>)} />
              </div>
            </div>

            <div className={cn("space-y-4", watchedRuleType !== 'firstOrderBonus' && 'hidden')}>
              <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="200" {...field} /></FormControl></FormItem>)} />
            </div>

            <div className={cn("space-y-4", watchedRuleType !== 'anniversaryBonus' && 'hidden')}>
              <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="500" {...field} /></FormControl></FormItem>)} />
            </div>

            <div className={cn("space-y-4", watchedRuleType !== 'bonusForVariety' && 'hidden')}>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>If more than X items</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="75" {...field} /></FormControl></FormItem>)} />
              </div>
            </div>
            
            <div className={cn("space-y-4", watchedRuleType !== 'bonusForCategory' && 'hidden')}>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Product Category</FormLabel><Select onValueChange={(v) => field.onChange(JSON.parse(v))} value={field.value ? JSON.stringify(field.value) : undefined}><FormControl><SelectTrigger><SelectValue placeholder="Select a category..." /></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c.es} value={JSON.stringify(c)}>{c.es}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="40" {...field} /></FormControl></FormItem>)} />
              </div>
            </div>
            
            <div className={cn("space-y-4", watchedRuleType !== 'consecutiveBonus' && 'hidden')}>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="weeks" render={({ field }) => (<FormItem><FormLabel>Consecutive Weeks</FormLabel><FormControl><Input type="number" placeholder="4" {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="250" {...field} /></FormControl></FormItem>)} />
              </div>
            </div>

            <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Active Rule</FormLabel><FormDescription>If turned off, this rule will not be evaluated.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
            )}/>
            
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save Rule</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
