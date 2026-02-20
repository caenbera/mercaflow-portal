
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addDriver, updateDriver } from '@/lib/firestore/drivers';
import { useToast } from '@/hooks/use-toast';
import type { DriverProfile, DriverType, UserProfile } from '@/types';
import { useOrganization } from '@/context/organization-context';
import { useUsers } from '@/hooks/use-users';
import { Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const createDriverSchema = (t: any) => z.object({
  userId: z.string().min(1, t('dialog_driver_error_user')),
  name: z.string().min(3, t('dialog_driver_error_name')),
  phone: z.string().min(7, t('dialog_driver_error_phone')),
  email: z.string().email(t('dialog_driver_error_email')),
  type: z.enum(['internal', 'external']),
  vehicleInfo: z.string().min(2, t('dialog_driver_error_vehicle')),
});

type FormValues = z.infer<ReturnType<typeof createDriverSchema>>;

interface DriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: DriverProfile | null;
}

export function DriverDialog({ open, onOpenChange, driver }: DriverDialogProps) {
  const t = useTranslations('Logistics');
  const { toast } = useToast();
  const { activeOrgId } = useOrganization();
  const { users, loading: usersLoading } = useUsers();
  const [isLoading, setIsLoading] = useState(false);

  const availableUsers = useMemo(() => {
    return users.filter(u => u.role === 'driver');
  }, [users]);

  const form = useForm<FormValues>({
    resolver: zodResolver(createDriverSchema(t)),
    defaultValues: {
      userId: '',
      name: '',
      phone: '',
      email: '',
      type: 'internal',
      vehicleInfo: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (driver) {
        form.reset({
          userId: driver.userId,
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          type: driver.type,
          vehicleInfo: driver.vehicleInfo,
        });
      } else {
        form.reset({
          userId: '',
          name: '',
          phone: '',
          email: '',
          type: 'internal',
          vehicleInfo: '',
        });
      }
    }
  }, [open, driver, form]);

  const handleUserSelect = (uid: string) => {
    const selectedUser = availableUsers.find(u => u.uid === uid);
    if (selectedUser) {
      form.setValue('name', selectedUser.contactPerson || selectedUser.businessName);
      form.setValue('email', selectedUser.email);
      if (selectedUser.phone) form.setValue('phone', selectedUser.phone);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!activeOrgId) return;
    setIsLoading(true);
    try {
      if (driver) {
        await updateDriver(driver.id, values);
        toast({ title: t('toast_driver_added') });
      } else {
        await addDriver({
          ...values,
          organizationId: activeOrgId,
          status: 'active',
        });
        toast({ title: t('toast_driver_added') });
      }
      onOpenChange(false);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            {driver ? t('dialog_driver_edit_title') : t('add_driver_button')}
          </DialogTitle>
          <DialogDescription>
            {t('dialog_driver_desc')}
          </DialogDescription>
        </DialogHeader>

        {availableUsers.length === 0 && !driver && !usersLoading && (
          <Alert variant="destructive" className="bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('dialog_driver_no_users_title')}</AlertTitle>
            <AlertDescription>
              {t('dialog_driver_no_users_desc')}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dialog_driver_select_user')}</FormLabel>
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val);
                      handleUserSelect(val);
                    }} 
                    value={field.value}
                    disabled={!!driver || usersLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={usersLoading ? t('dialog_driver_loading_users') : t('dialog_driver_placeholder_user')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUsers.map(u => (
                        <SelectItem key={u.uid} value={u.uid}>
                          {u.contactPerson || u.businessName} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-[10px]">
                    {t('dialog_driver_hint_user')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('driver_name_label')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('driver_type_label')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="internal">{t('type_internal')}</SelectItem>
                      <SelectItem value="external">{t('type_external')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('driver_phone_label')}</FormLabel>
                  <FormControl><Input {...field} type="tel" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('driver_email_label')}</FormLabel>
                  <FormControl><Input type="email" {...field} readOnly className="bg-muted/50" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>

            <FormField control={form.control} name="vehicleInfo" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('vehicle_label')}</FormLabel>
                <FormControl><Input placeholder={t('driver_vehicle_placeholder')} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('dialog_driver_cancel')}</Button>
              <Button type="submit" disabled={isLoading || (availableUsers.length === 0 && !driver)}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {driver ? t('dialog_driver_save') : t('dialog_driver_activate')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
