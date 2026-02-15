
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { createOrganization, updateOrganization } from '@/lib/firestore/organizations';
import { useToast } from '@/hooks/use-toast';
import type { Organization, OrganizationType, OrganizationStatus } from '@/types';
import { useAuth } from '@/context/auth-context';

const orgSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  type: z.enum(['importer', 'distributor', 'wholesaler', 'retailer']),
  status: z.enum(['active', 'suspended', 'pending']),
  slug: z.string().min(3, "El slug debe ser único."),
  contactEmail: z.string().email("Correo inválido.").optional(),
});

type FormValues = z.infer<typeof orgSchema>;

interface OrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
}

export function OrganizationDialog({ open, onOpenChange, organization }: OrganizationDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: '',
      type: 'wholesaler',
      status: 'active',
      slug: '',
      contactEmail: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (organization) {
        form.reset({
          name: organization.name,
          type: organization.type,
          status: organization.status,
          slug: organization.slug,
          contactEmail: organization.contactEmail || '',
        });
      } else {
        form.reset({
          name: '',
          type: 'wholesaler',
          status: 'active',
          slug: '',
          contactEmail: '',
        });
      }
    }
  }, [open, organization, form]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (organization) {
        await updateOrganization(organization.id, values);
        toast({ title: "Organización actualizada" });
      } else {
        await createOrganization({
          ...values,
          ownerId: user.uid,
        });
        toast({ title: "Organización creada con éxito" });
      }
      onOpenChange(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{organization ? 'Editar Edificio' : 'Crear Nuevo Edificio'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Empresa</FormLabel>
                <FormControl><Input placeholder="Ej: Fresh Hub Chicago" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Nodo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="importer">Importador</SelectItem>
                      <SelectItem value="distributor">Distribuidor</SelectItem>
                      <SelectItem value="wholesaler">Mayorista</SelectItem>
                      <SelectItem value="retailer">Minorista / Super</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="suspended">Suspendido</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
            <FormField control={form.control} name="slug" render={({ field }) => (
              <FormItem>
                <FormLabel>Slug (ID de URL)</FormLabel>
                <FormControl><Input placeholder="ej: fresh-hub-chi" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="contactEmail" render={({ field }) => (
              <FormItem>
                <FormLabel>Email de Contacto</FormLabel>
                <FormControl><Input type="email" placeholder="admin@empresa.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Confirmar'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
