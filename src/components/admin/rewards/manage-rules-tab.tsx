'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
  const t = useTranslations('AdminRewardsPage');

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
      toast({ title: t('toast_rule_deleted') });
      setDeletingRule(null);
    } catch (error) {
      toast({ variant: 'destructive', title: t('toast_rule_delete_error') });
    }
  };

  const handleToggleActive = async (rule: RewardRule) => {
    try {
        await manageRule(rule.id, { isActive: !rule.isActive });
        toast({ title: t('toast_rule_status_updated') });
    } catch (error) {
        toast({ variant: 'destructive', title: t('toast_rule_status_error') });
    }
  }

  const generateRuleDescription = (rule: RewardRule) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    switch (rule.ruleType) {
        case 'pointsPerDollar': return t('rule_desc_pointsPerDollar', { points: rule.points, perAmount: rule.perAmount });
        case 'bonusForAmount': return t('rule_desc_bonusForAmount', { points: rule.points, amount: rule.amount });
        case 'fixedPointsPerOrder': return t('rule_desc_fixedPointsPerOrder', { points: rule.points });
        case 'bonusForProduct':
            const productName = products.find(p => p.id === rule.productId)?.name[locale as 'es'|'en'] || t('rule_desc_bonusForProduct_fallback');
            return t('rule_desc_bonusForProduct', { points: rule.points, productName });
        case 'multiplierPerDay':
            const dayName = dayNames[rule.dayOfWeek || 0];
            return t('rule_desc_multiplierPerDay', { multiplier: rule.multiplier, dayName });
        case 'firstOrderBonus': return t('rule_desc_firstOrderBonus', { points: rule.points });
        case 'anniversaryBonus': return t('rule_desc_anniversaryBonus', { points: rule.points });
        case 'bonusForVariety': return t('rule_desc_bonusForVariety', { points: rule.points, amount: rule.amount });
        case 'bonusForCategory': return t('rule_desc_bonusForCategory', { points: rule.points, categoryName: rule.category?.es });
        case 'consecutiveBonus': return t('rule_desc_consecutiveBonus', { points: rule.points, weeks: rule.weeks });
        default: return t('rule_desc_misconfigured');
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
            <AlertDialogTitle>{t('delete_reward_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('delete_rule_confirm_desc', { ruleName: deletingRule?.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel_button')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{t('delete_confirm_action')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('add_rule_button')}
          </Button>
        </div>
        {loading
          ? <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          : rules.length === 0
            ? <p className="text-center text-muted-foreground py-8">{t('no_rules_message')}</p>
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
