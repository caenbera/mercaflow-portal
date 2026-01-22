'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useRewardData } from '@/hooks/useRewardData';
import { useProducts } from '@/hooks/use-products';
import { deleteRule, manageRule } from '@/lib/firestore/rewards';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { RewardRule } from '@/types';
import { RuleDialog } from './RuleDialog';

export function ManageRulesTab() {
  const { rules, loading: rulesLoading } = useRewardData();
  const { products, loading: productsLoading } = useProducts();
  const { toast } = useToast();
  const locale = useLocale();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RewardRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<RewardRule | null>(null);
  
  const loading = rulesLoading || productsLoading;
  
  const productCategories = useMemo(() => {
    const uniqueCategories = new Map<string, { es: string; en: string }>();
    products.forEach(p => {
        if (p.category?.es) {
            uniqueCategories.set(p.category.es, p.category);
        }
    });
    return Array.from(uniqueCategories.values());
  }, [products]);

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
      <RuleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        rule={editingRule}
        products={products}
        categories={productCategories}
      />
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
