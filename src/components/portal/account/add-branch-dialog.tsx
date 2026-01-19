"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { addBranch, updateBranch } from '@/lib/firestore/branches';
import { useAuth } from '@/context/auth-context';
import type { Branch } from '@/types';

const formSchema = z.object({
  alias: z.string().min(2, { message: "Alias must be at least 2 characters." }),
  address: z.string().min(5, { message: "Address is required." }),
  city: z.string().min(2, { message: "City is required." }),
  manager: z.string().min(2, { message: "Manager name is required." }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: Branch | null;
}

export function AddBranchDialog({ open, onOpenChange, branch }: AddBranchDialogProps) {
  const t = useTranslations('ClientAccountPage');
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: branch ? {
      alias: branch.alias,
      address: branch.address,
      city: branch.city,
      manager: branch.manager,
    } : {
      alias: '',
      address: '',
      city: '',
      manager: '',
    },
  });

   useEffect(() => {
    form.reset(branch ? {
      alias: branch.alias,
      address: branch.address,
      city: branch.city,
      manager: branch.manager,
    } : {
      alias: '',
      address: '',
      city: '',
      manager: '',
    });
  }, [branch, form, open]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setIsLoading(true);

    try {
      if (branch) {
        // Update logic
        await updateBranch(user.uid, branch.id, values);
        toast({ title: "Success", description: "Branch updated successfully." });
      } else {
        // Add logic
        await addBranch(user.uid, values);
        toast({ title: t('branch_add_success') });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: t('branch_add_error') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{branch ? t('edit_branch_modal_title') : t('add_branch_modal_title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="alias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('branch_name_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('branch_name_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('address_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('address_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('city_label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('city_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('manager_label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('manager_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                    {t('cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : t('save_branch_button')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
