// src/components/admin/support/SupportTicketForm.tsx
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useTranslations } from 'next-intl';
import { addSupportTicket } from '@/lib/firestore/tickets';
import { supportTicketSchema, type SupportTicketInput } from '@/lib/chemas/support.schema';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface SupportTicketFormProps {
  onSuccess?: () => void;
}

export function SupportTicketForm({ onSuccess }: SupportTicketFormProps) {
  const t = useTranslations('Support');
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<SupportTicketInput>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      issueType: '',
      details: '',
      orderId: '',
    },
  });

  const onSubmit = async ( data: SupportTicketInput) => {
    if (!user) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await addSupportTicket({
        userId: user.uid,
        userName: user.email || 'Usuario',
        issueType: data.issueType,
        details: data.details,
        orderId: data.orderId || undefined,
        status: 'new',
      });
      form.reset();
      onSuccess?.();
    } catch (err) {
      console.error('Error al crear ticket:', err);
      setSubmitError('No se pudo crear el ticket. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {submitError && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {submitError}
          </div>
        )}

        <FormField
          control={form.control}
          name="issueType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de problema</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Error en pedido, Problema de pago..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detalles</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el problema con detalle..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="orderId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID de orden (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: ORD-12345" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creando...
            </>
          ) : (
            'Crear ticket'
          )}
        </Button>
      </form>
    </Form>
  );
}
