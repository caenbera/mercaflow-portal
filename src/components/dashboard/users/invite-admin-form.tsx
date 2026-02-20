
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserRole } from '@/types';
import { useTranslations } from 'next-intl';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.enum(['admin', 'picker', 'purchaser', 'salesperson', 'driver'], { required_error: 'Please select a role.'}),
});

interface InviteAdminFormProps {
  onInvite: (email: string, role: UserRole) => Promise<void>;
}

export function InviteAdminForm({ onInvite }: InviteAdminFormProps) {
  const t = useTranslations('AdminUsersPage');
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "admin",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await onInvite(values.email, values.role);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-end gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-grow w-full">
              <FormLabel>{t('invite_email_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('invite_email_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="w-full sm:w-auto">
              <FormLabel>{t('invite_role_label')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('invite_role_placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">{t('invite_role_admin')}</SelectItem>
                    <SelectItem value="picker">{t('invite_role_picker')}</SelectItem>
                    <SelectItem value="purchaser">{t('invite_role_purchaser')}</SelectItem>
                    <SelectItem value="salesperson">{t('invite_role_salesperson')}</SelectItem>
                    <SelectItem value="driver">{t('role_driver') || 'Transportista'}</SelectItem>
                  </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? t('invite_button_loading_text') : t('invite_button_text')}
        </Button>
      </form>
    </Form>
  );
}
