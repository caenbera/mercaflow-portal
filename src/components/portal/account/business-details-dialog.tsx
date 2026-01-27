"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firestore/users';
import { useAuth } from '@/context/auth-context';
import type { UserProfile } from '@/types';

const formSchema = z.object({
  businessName: z.string().min(2, { message: "Business name must be at least 2 characters." }),
  contactPerson: z.string().min(2, { message: "Contact person is required." }),
  phone: z.string().min(7, { message: "A valid phone number is required." }),
  address: z.string().min(10, { message: "A valid address is required." }),
});

type FormValues = z.infer<typeof formSchema>;

interface BusinessDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BusinessDetailsDialog({ open, onOpenChange }: BusinessDetailsDialogProps) {
  const t = useTranslations('ClientAccountPage');
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: '',
      contactPerson: '',
      phone: '',
      address: '',
    },
  });

   useEffect(() => {
    if (userProfile) {
        form.reset({
            businessName: userProfile.businessName || '',
            contactPerson: userProfile.contactPerson || '',
            phone: userProfile.phone || '',
            address: userProfile.address || '',
        });
    }
  }, [userProfile, form, open]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setIsLoading(true);

    try {
      await updateUserProfile(user.uid, values);
      toast({ title: "Success", description: "Your business details have been updated." });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: "Could not update your details." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('edit_business_details_title')}</DialogTitle>
           <DialogDescription>
            {t('edit_business_details_desc')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('business_name_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('business_name_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('main_contact_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('manager_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phone_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
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
            
             <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                    {t('cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : t('save_changes_button')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
