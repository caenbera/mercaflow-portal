
"use client";

import { useState, useMemo } from 'react';
import { useOrganizations } from '@/hooks/use-organizations';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, Building2, Globe, Truck, ShoppingBag, 
  Store, MoreVertical, Pencil, Trash2, ShieldCheck, User,
  Info, MessageSquare, Mail, Link as LinkIcon, Lock, Unlock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationDialog } from '@/components/admin/organizations/organization-dialog';
import type { Organization, OrganizationType } from '@/types';
import { deleteOrganization } from '@/lib/firestore/organizations';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function OrganizationsManagementPage() {
  const { user } = useAuth();
  const locale = useLocale();
  const { organizations, loading } = useOrganizations();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedOrg(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta organización?")) {
      try {
        await deleteOrganization(id);
        toast({ title: "Edificio eliminado" });
      } catch (e) {
        toast({ variant: "destructive", title: "Error al eliminar" });
      }
    }
  };

  const sendInviteWhatsApp = (org: Organization) => {
    if (!org.ownerEmail) return;
    const registerLink = `${window.location.origin}/${locale}/signup?email=${encodeURIComponent(org.ownerEmail)}`;
    const message = `¡Hola! Tu espacio en MercaFlow ya está listo. Regístrate aquí para gestionar tu edificio "${org.name}": ${registerLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const sendInviteEmail = (org: Organization) => {
    if (!org.ownerEmail) return;
    const registerLink = `${window.location.origin}/${locale}/signup?email=${encodeURIComponent(org.ownerEmail)}`;
    const subject = `Invitación para gestionar ${org.name} en MercaFlow`;
    const body = `Hola,\n\nTu espacio administrativo para "${org.name}" ha sido creado. Por favor, completa tu registro en el siguiente enlace:\n\n${registerLink}\n\nSaludos,\nEquipo MercaFlow`;
    window.location.href = `mailto:${org.ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const getTypeIcon = (type: OrganizationType) => {
    switch (type) {
      case 'importer': return <Globe className="h-5 w-5 text-blue-600" />;
      case 'distributor': return <Truck className="h-5 w-5 text-purple-600" />;
      case 'wholesaler': return <ShoppingBag className="h-5 w-5 text-green-600" />;
      case 'retailer': return <Store className="h-5 w-5 text-orange-600" />;
    }
  };

  const groupedOrgs = useMemo(() => {
    return {
      importer: organizations.filter(o => o.type === 'importer'),
      distributor: organizations.filter(o => o.type === 'distributor'),
      wholesaler: organizations.filter(o => o.type === 'wholesaler'),
      retailer: organizations.filter(o => o.type === 'retailer'),
    };
  }, [organizations]);

  const renderOrgList = (orgs: Organization[]) => {
    if (orgs.length === 0) {
      return (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
          <h3 className="mt-4 font-bold text-slate-800">No hay registros en esta categoría</h3>
          <p className="text-sm text-muted-foreground">Crea un nuevo edificio para comenzar a poblar tu ecosistema.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {orgs.map((org) => {
          const isMyTestOrg = org.ownerId === user?.uid;
          const isClaimed = !!org.ownerEmail && org.ownerId !== user?.uid; // Simplificado: si el dueño ya no es el superadmin

          return (
            <Card key={org.id} className={cn("overflow-hidden hover:shadow-lg transition-all border-l-4 border-t border-r border-b", isMyTestOrg ? "border-l-yellow-400" : "border-l-primary")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl border">
                    {getTypeIcon(org.type)}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg font-bold truncate text-slate-800">{org.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="capitalize text-[10px] py-0 h-4 font-mono tracking-tighter">
                        {org.slug}
                      </Badge>
                      {isMyTestOrg && <Badge className="bg-yellow-400 text-yellow-900 text-[8px] h-4 font-bold px-1.5 shadow-sm">PRUEBA</Badge>}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(org)}><Pencil className="mr-2 h-4 w-4" /> Configurar Convenio</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(org.id)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm mt-4">
                  <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold"><Mail className="h-3 w-3" /> Dueño:</span>
                    <span className="font-medium truncate max-w-[150px] text-xs text-slate-700">{org.ownerEmail || "Sin asignar"}</span>
                  </div>
                  
                  {/* Convenios Visuales */}
                  <div className="flex gap-1.5 mt-3">
                    <Badge variant={org.adminAgreements?.catalog ? "default" : "outline"} className={cn("text-[8px] h-5 px-1.5 gap-1", !org.adminAgreements?.catalog && "opacity-40")}>
                      {org.adminAgreements?.catalog ? <Unlock className="h-2 w-2" /> : <Lock className="h-2 w-2" />} Catálogo
                    </Badge>
                    <Badge variant={org.adminAgreements?.operations ? "default" : "outline"} className={cn("text-[8px] h-5 px-1.5 gap-1", !org.adminAgreements?.operations && "opacity-40")}>
                      {org.adminAgreements?.operations ? <Unlock className="h-2 w-2" /> : <Lock className="h-2 w-2" />} Operación
                    </Badge>
                    <Badge variant={org.adminAgreements?.finance ? "default" : "outline"} className={cn("text-[8px] h-5 px-1.5 gap-1", !org.adminAgreements?.finance && "opacity-40")}>
                      {org.adminAgreements?.finance ? <Unlock className="h-2 w-2" /> : <Lock className="h-2 w-2" />} Finanzas
                    </Badge>
                  </div>
                </div>
                
                {org.ownerEmail && !isClaimed && !isMyTestOrg && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="h-9 border-green-200 text-green-700 hover:bg-green-50" onClick={() => sendInviteWhatsApp(org)}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
                    </Button>
                    <Button size="sm" variant="outline" className="h-9" onClick={() => sendInviteEmail(org)}>
                      <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
                    </Button>
                  </div>
                )}

                {isMyTestOrg ? (
                  <div className="mt-4 p-3 bg-yellow-50/50 rounded-xl border border-yellow-100 flex gap-2 items-start">
                    <Info className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-yellow-800 leading-relaxed font-medium">
                      Estructura de prueba. Tienes acceso total a todos los módulos internos desde el menú lateral.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-2 items-start">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                      Edificio de cliente. Solo puedes ver los módulos habilitados por los switches de convenio.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8 min-h-screen">
      <OrganizationDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        organization={selectedOrg} 
      />

      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-slate-900">Alcaldía de Edificios</h1>
          <p className="text-slate-500 text-sm mt-1">Crea edificios y reserva correos de clientes para invitarlos al ecosistema.</p>
        </div>
        <Button onClick={handleCreate} className="shadow-lg hover:shadow-xl transition-all h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-5 w-5" />
          Nuevo Edificio
        </Button>
      </div>

      <Tabs defaultValue="wholesaler" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-sidebar p-1.5 h-auto mb-8 rounded-2xl border border-sidebar-border shadow-inner">
          <TabsTrigger 
            value="importer" 
            className="group py-3 gap-3 rounded-xl text-sidebar-foreground/60 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Globe className="h-5 w-5" />
            <div className="flex flex-col items-start leading-none">
              <span className="font-bold text-sm">Importadores</span>
              <span className="text-[9px] opacity-60 font-medium uppercase tracking-tighter">Nivel 1</span>
            </div>
            <Badge variant="secondary" className="ml-auto h-6 px-2 min-w-[1.5rem] rounded-lg bg-white/10 text-sidebar-foreground font-bold border-none group-data-[state=active]:bg-primary group-data-[state=active]:text-white transition-colors">
              {groupedOrgs.importer.length}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="distributor" 
            className="group py-3 gap-3 rounded-xl text-sidebar-foreground/60 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Truck className="h-5 w-5" />
            <div className="flex flex-col items-start leading-none">
              <span className="font-bold text-sm">Distribuidores</span>
              <span className="text-[9px] opacity-60 font-medium uppercase tracking-tighter">Nivel 2</span>
            </div>
            <Badge variant="secondary" className="ml-auto h-6 px-2 min-w-[1.5rem] rounded-lg bg-white/10 text-sidebar-foreground font-bold border-none group-data-[state=active]:bg-primary group-data-[state=active]:text-white transition-colors">
              {groupedOrgs.distributor.length}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="wholesaler" 
            className="group py-3 gap-3 rounded-xl text-sidebar-foreground/60 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ShoppingBag className="h-5 w-5" />
            <div className="flex flex-col items-start leading-none">
              <span className="font-bold text-sm">Mayoristas</span>
              <span className="text-[9px] opacity-60 font-medium uppercase tracking-tighter">Nivel 3</span>
            </div>
            <Badge variant="secondary" className="ml-auto h-6 px-2 min-w-[1.5rem] rounded-lg bg-white/10 text-sidebar-foreground font-bold border-none group-data-[state=active]:bg-primary group-data-[state=active]:text-white transition-colors">
              {groupedOrgs.wholesaler.length}
            </Badge>
          </TabsTrigger>
          
          <TabsTrigger 
            value="retailer" 
            className="group py-3 gap-3 rounded-xl text-sidebar-foreground/60 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Store className="h-5 w-5" />
            <div className="flex flex-col items-start leading-none">
              <span className="font-bold text-sm">Minoristas</span>
              <span className="text-[9px] opacity-60 font-medium uppercase tracking-tighter">Nivel 4</span>
            </div>
            <Badge variant="secondary" className="ml-auto h-6 px-2 min-w-[1.5rem] rounded-lg bg-white/10 text-sidebar-foreground font-bold border-none group-data-[state=active]:bg-primary group-data-[state=active]:text-white transition-colors">
              {groupedOrgs.retailer.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="mt-2">
            <TabsContent value="importer">{renderOrgList(groupedOrgs.importer)}</TabsContent>
            <TabsContent value="distributor">{renderOrgList(groupedOrgs.distributor)}</TabsContent>
            <TabsContent value="wholesaler">{renderOrgList(groupedOrgs.wholesaler)}</TabsContent>
            <TabsContent value="retailer">{renderOrgList(groupedOrgs.retailer)}</TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  );
}
