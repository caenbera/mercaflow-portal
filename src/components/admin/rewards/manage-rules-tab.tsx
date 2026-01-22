'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRewardData } from '@/hooks/useRewardData';
import { useProducts } from '@/hooks/use-products';
import { manageRule, deleteRule } from '@/lib/firestore/rewards';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { RewardRule, RewardRuleType, Product, ProductCategory } from '@/types';
import { useLocale } from 'next-intl';

const ruleTypes: RewardRuleType[] = [
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

function RuleDialog({ open, onOpenChange, rule, products }: { open: boolean, onOpenChange: (open: boolean) => void, rule: RewardRule | null, products: Product[] }) {
  const { toast } = useToast();
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { isActive: true },
  });
  const watchedRuleType = form.watch('ruleType');

  const productCategories = useMemo(() => {
    const uniqueCategories = new Map<string, { es: string; en: string }>();
    products.forEach(p => {
        if (p.category?.es) {
            uniqueCategories.set(p.category.es, p.category);
        }
    });
    return Array.from(uniqueCategories.values());
  }, [products]);

  React.useEffect(() => {
    if (rule) {
      form.reset({ ...rule, dayOfWeek: rule.dayOfWeek ?? undefined });
    } else {
      form.reset({
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
      });
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

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

            {watchedRuleType === 'pointsPerDollar' && <div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Points</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="perAmount" render={({ field }) => (<FormItem><FormLabel>Per Amount ($)</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl></FormItem>)} /></div>}
            {watchedRuleType === 'bonusForAmount' && <div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>If Order Over ($)</FormLabel><FormControl><Input type="number" placeholder="500" {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="100" {...field} /></FormControl></FormItem>)} /></div>}
            {watchedRuleType === 'fixedPointsPerOrder' && <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Points per Order</FormLabel><FormControl><Input type="number" placeholder="50" {...field} /></FormControl></FormItem>)} />}
            
            {watchedRuleType === 'bonusForProduct' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="productId" render={({ field }) => (<FormItem><FormLabel>Product</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a product..." /></SelectTrigger></FormControl><SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name.es}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="25" {...field} /></FormControl></FormItem>)} />
              </div>
            )}

            {watchedRuleType === 'multiplierPerDay' && <div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="multiplier" render={({ field }) => (<FormItem><FormLabel>Multiplier (e.g., 2)</FormLabel><FormControl><Input type="number" placeholder="2" {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="dayOfWeek" render={({ field }) => (<FormItem><FormLabel>Day of Week</FormLabel><Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Select a day..." /></SelectTrigger></FormControl><SelectContent>{weekDays.map((day, i) => <SelectItem key={day} value={i.toString()}>{day}</SelectItem>)}</SelectContent></Select></FormItem>)} /></div>}
            {watchedRuleType === 'firstOrderBonus' && <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="200" {...field} /></FormControl></FormItem>)} />}
            {watchedRuleType === 'anniversaryBonus' && <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="500" {...field} /></FormControl></FormItem>)} />}
            {watchedRuleType === 'bonusForVariety' && <div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>If more than X items</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="75" {...field} /></FormControl></FormItem>)} /></div>}
            
            {watchedRuleType === 'bonusForCategory' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Product Category</FormLabel><Select onValueChange={(v) => field.onChange(JSON.parse(v))}><FormControl><SelectTrigger><SelectValue placeholder="Select a category..." /></SelectTrigger></FormControl><SelectContent>{productCategories.map(c => <SelectItem key={c.es} value={JSON.stringify(c)}>{c.es}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                <FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="40" {...field} /></FormControl></FormItem>)} />
              </div>
            )}
            
            {watchedRuleType === 'consecutiveBonus' && <div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="weeks" render={({ field }) => (<FormItem><FormLabel>Consecutive Weeks</FormLabel><FormControl><Input type="number" placeholder="4" {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="points" render={({ field }) => (<FormItem><FormLabel>Bonus Points</FormLabel><FormControl><Input type="number" placeholder="250" {...field} /></FormControl></FormItem>)} /></div>}

            <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Active Rule</FormLabel><FormDescription>If turned off, this rule will not be evaluated.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
            )}
            
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

export function ManageRulesTab() {
  const { rules, loading: rulesLoading } = useRewardData();
  const { products, loading: productsLoading } = useProducts();
  const { toast } = useToast();
  const locale = useLocale();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RewardRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<RewardRule | null>(null);

  const loading = rulesLoading || productsLoading;

  const handleEdit = (rule: RewardRule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    try {
      await deleteRule(deletingRule.id);
      toast({ title: 'Rule deleted' });
      setDeletingRule(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting rule' });
    }
  };

  const handleToggleActive = async (rule: RewardRule) => {
    try {
        await manageRule(rule.id, { isActive: !rule.isActive });
        toast({ title: 'Rule status updated.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error updating rule status.' });
    }
  }

  const generateRuleDescription = (rule: RewardRule) => {
    switch (rule.ruleType) {
        case 'pointsPerDollar': return `Award ${rule.points} point(s) for every $${rule.perAmount} spent.`;
        case 'bonusForAmount': return `Award a bonus of ${rule.points} points if order total is over $${rule.amount}.`;
        case 'fixedPointsPerOrder': return `Award ${rule.points} points for every completed order.`;
        case 'bonusForProduct':
            const productName = products.find(p => p.id === rule.productId)?.name[locale as 'es'|'en'] || 'a specific product';
            return `Award ${rule.points} bonus points if order includes ${productName}.`;
        case 'multiplierPerDay':
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][rule.dayOfWeek || 0];
            return `Multiply all earned points by x${rule.multiplier} on ${dayName}s.`;
        case 'firstOrderBonus': return `Award a one-time bonus of ${rule.points} points for a client's first order.`;
        case 'anniversaryBonus': return `Award ${rule.points} points on the client's signup anniversary month.`;
        case 'bonusForVariety': return `Award ${rule.points} bonus points if order contains more than ${rule.amount} different items.`;
        case 'bonusForCategory': return `Award ${rule.points} bonus points if order includes items from the '${rule.category?.es}' category.`;
        case 'consecutiveBonus': return `Award ${rule.points} bonus points if client orders for ${rule.weeks} consecutive weeks.`;
        default: return 'A misconfigured rule.';
    }
  }

  return (
    <>
      <RuleDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} rule={editingRule} products={products} />
      <AlertDialog open={!!deletingRule} onOpenChange={(open) => !open && setDeletingRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the rule "{deletingRule?.name}".</AlertDialogDescription>
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
            Add Rule
          </Button>
        </div>
        {loading
          ? <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          : rules.length === 0
            ? <p className="text-center text-muted-foreground py-8">No rules created yet. Click "Add Rule" to start.</p>
            : (
              <div className="space-y-3">
                {rules.map(rule => (
                  <Card key={rule.id} className="p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Switch checked={rule.isActive} onCheckedChange={() => handleToggleActive(rule)} aria-label="Toggle rule status" />
                            <div>
                                <h4 className="font-bold text-sm">{rule.name}</h4>
                                <p className="text-xs text-muted-foreground">{generateRuleDescription(rule)}</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(rule)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingRule(rule)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
        }
      </CardContent>
    </>
  );
}
