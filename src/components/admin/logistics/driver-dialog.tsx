
"use client";

import { useState, useEffect } from 'react';
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
import type { DriverProfile, DriverType } from '@/types';
import { useOrganization } from '@/context/organization-context';
import { Loader2, Truck, UserCheck } from 'lucide-react';

const driverSchema = z.object({
  name: z.string().min(3, "Name is too short"),
  phone: z.string().min(7, "Phone is required"),
  email: z.string().email("Invalid email"),
  type: z.enum(['internal', 'external']),
  vehicleInfo: z.string().min(2, "Vehicle info is required"),
});

type FormValues = z.infer<typeof driverSchema>;

interface DriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: DriverProfile | null;
}

export function DriverDialog({ open, onOpenChange, driver }: DriverDialogProps) {
  const t = useTranslations('Logistics');
  const { toast } = useToast();
  const { activeOrgId } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
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
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          type: driver.type,
          vehicleInfo: driver.vehicleInfo,
        });
      } else {
        form.reset({
          name: '',
          phone: '',
          email: '',
          type: 'internal',
          vehicleInfo: '',
        });
      }
    }
  }, [open, driver, form]);

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
          userId: 'PENDING', // In a real app, you'd create a user or link an existing one
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
            {driver ? t('add_driver_button') : t('add_driver_button')}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('driver_name_label')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('driver_phone_label')}</FormLabel>
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
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('driver_email_label')}</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="vehicleInfo" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('vehicle_label')}</FormLabel>
                <FormControl><Input placeholder={t('driver_vehicle_placeholder')} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('add_driver_button')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
