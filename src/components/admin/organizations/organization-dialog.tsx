
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { createOrganization, updateOrganization } from '@/lib/firestore/organizations';
import { addAdminInvite } from '@/lib/firestore/users';
import { useToast } from '@/hooks/use-toast';
import type { Organization, OrganizationType, OrganizationStatus } from '@/types';
import { useAuth } from '@/context/auth-context';
import { ShieldAlert, Info, UserCheck, Lock, Globe } from 'lucide-react';

const orgSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  type: z.enum(['importer', 'distributor', 'wholesaler', 'retailer']),
  status: z.enum(['active', 'suspended', 'pending']),
  slug: z.string().min(3, "El slug debe ser único."),
  ownerEmail: z.string().email("Correo de dueño inválido.").optional().or(z.literal('')),
  adminAgreements: z.object({
    catalog: z.boolean().default(false),
    operations: z.boolean().default(false),
    finance: z.boolean().default(false),
  }),
  storeConfig: z.object({
    enabled: z.boolean().default(false),
  }).optional(),
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
      ownerEmail: '',
      adminAgreements: {
        catalog: false,
        operations: false,
        finance: false,
      },
      storeConfig: {
        enabled: false,
      }
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
          ownerEmail: organization.ownerEmail || '',
          adminAgreements: organization.adminAgreements || {
            catalog: false,
            operations: false,
            finance: false,
          },
          storeConfig: {
            enabled: organization.storeConfig?.enabled || false,
          }
        });
      } else {
        form.reset({
          name: '',
          type: 'wholesaler',
          status: 'active',
          slug: '',
          ownerEmail: '',
          adminAgreements: {
            catalog: false,
            operations: false,
            finance: false,
          },
          storeConfig: {
            enabled: false,
          }
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
        if (values.ownerEmail && values.ownerEmail !== organization.ownerEmail) {
          await addAdminInvite(values.ownerEmail, 'client', organization.id);
        }
        toast({ title: "Edificio actualizado" });
      } else {
        const newOrgId = await createOrganization({
          ...values,
          ownerId: user.uid,
        });
        if (values.ownerEmail) {
          await addAdminInvite(values.ownerEmail, 'client', newOrgId);
        }
        toast({ title: "Edificio creado e invitación reservada" });
      }
      onOpenChange(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsLoading(false);
    }
  };

  const isTestOrg = organization?.ownerId === user?.uid;
  const watchedType = form.watch('type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{organization ? 'Configuración del Edificio' : 'Crear Nuevo Edificio'}</DialogTitle>
          <DialogDescription>
            Configura la identidad del edificio y define tus niveles de acceso administrativo.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" /> Datos Básicos
              </h3>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

            {watchedType === 'retailer' && (
              <div className="space-y-4 p-4 bg-green-50/50 rounded-xl border border-green-100">
                <h3 className="text-sm font-bold uppercase text-green-700 flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Servicio de Tienda Online
                </h3>
                <FormField control={form.control} name="storeConfig.enabled" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border bg-background p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs">Habilitar Web Pública B2C</オリン>
                      <FormDescription className="text-[10px]">Permite al cliente tener su propia landing page y tienda.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
              </div>
            )}

            <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <h3 className="text-sm font-bold uppercase text-blue-700 flex items-center gap-2">
                <UserCheck className="h-4 w-4" /> Propietario del Edificio
              </h3>
              <FormField control={form.control} name="ownerEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico del Cliente</FormLabel>
                  <FormControl><Input type="email" placeholder="cliente@empresa.com" {...field} /></FormControl>
                  <FormDescription className="text-[10px]">
                    Este correo se usará como "Llave" única para el registro del cliente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>

            <div className="space-y-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase text-orange-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Convenios de Acceso (Privacidad)
                </h3>
                {isTestOrg && <Badge className="bg-orange-200 text-orange-800 text-[8px]">OMITIDO EN PRUEBAS</Badge>}
              </div>
              <p className="text-[10px] text-orange-800 mb-2">
                Define a qué módulos tendrás acceso como Super Administrador. Estos switches controlan la visibilidad de los datos del cliente.
              </p>
              
              <div className="space-y-3">
                <FormField control={form.control} name="adminAgreements.catalog" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border bg-background p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs">Convenio de Catálogo</FormLabel>
                      <FormDescription className="text-[10px]">Ver/Editar productos y precios.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
                <FormField control={form.control} name="adminAgreements.operations" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border bg-background p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs">Convenio Operativo</FormLabel>
                      <FormDescription className="text-[10px]">Gestionar pedidos, picking y compras.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
                <FormField control={form.control} name="adminAgreements.finance" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border bg-background p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs">Convenio Financiero</FormLabel>
                      <FormDescription className="text-[10px]">Acceso a facturas y reportes de rentabilidad.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}/>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Confirmar Cambios'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
