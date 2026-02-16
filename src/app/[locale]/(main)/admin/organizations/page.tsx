
"use client";

import { useState, useMemo } from 'react';
import { useOrganizations } from '@/hooks/use-organizations';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, Building2, Globe, Truck, ShoppingBag, 
  Store, MoreVertical, Pencil, Trash2, ShieldCheck, User,
  Info
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
          <h3 className="mt-4 font-bold">No hay registros en esta categoría</h3>
          <p className="text-sm text-muted-foreground">Crea un nuevo edificio para comenzar a poblar tu ecosistema.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {orgs.map((org) => {
          const isTest = org.ownerId === user?.uid;
          return (
            <Card key={org.id} className={cn("overflow-hidden hover:shadow-lg transition-shadow border-l-4", isTest ? "border-l-yellow-400" : "border-l-primary")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    {getTypeIcon(org.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-bold">{org.name}</CardTitle>
                      {isTest && <Badge className="bg-yellow-400 text-yellow-900 text-[8px] h-4">ESTRUCTURA DE PRUEBA</Badge>}
                    </div>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {org.slug}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(org)}><Pencil className="mr-2 h-4 w-4" /> Configurar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(org.id)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5"><User className="h-3 w-3" /> Dueño:</span>
                    <span className="font-medium truncate max-w-[150px]">{isTest ? "Tú (Super Admin)" : org.ownerId.substring(0, 8) + "..."}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Estado:</span>
                    <Badge className={cn(
                      "text-[10px] h-5",
                      org.status === 'active' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {org.status}
                    </Badge>
                  </div>
                </div>
                
                {isTest ? (
                  <div className="mt-4 p-2.5 bg-yellow-50/50 rounded-xl border border-yellow-100 flex gap-2 items-start">
                    <Info className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-yellow-800 leading-relaxed">
                      Edificio de prueba personal. Tienes acceso total a sus módulos internos desde el menú lateral.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-2 items-start">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-blue-800 leading-relaxed">
                      Edificio privado del cliente. Los datos internos (ventas, stock, precios) están protegidos.
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
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
      <OrganizationDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        organization={selectedOrg} 
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">Gestión de Clientes (Edificios)</h1>
          <p className="text-muted-foreground">Administra el ecosistema y supervisa el estado de cada actor.</p>
        </div>
        <Button onClick={handleCreate} className="shadow-lg hover:shadow-xl transition-all">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Edificio
        </Button>
      </div>

      <Tabs defaultValue="wholesaler" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted/50 p-1 h-auto mb-8">
          <TabsTrigger value="importer" className="py-2.5 gap-2">
            <Globe className="h-4 w-4" />
            <span>Importadores</span>
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 min-w-[1.25rem]">{groupedOrgs.importer.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="distributor" className="py-2.5 gap-2">
            <Truck className="h-4 w-4" />
            <span>Distribuidores</span>
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 min-w-[1.25rem]">{groupedOrgs.distributor.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="wholesaler" className="py-2.5 gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Mayoristas</span>
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 min-w-[1.25rem]">{groupedOrgs.wholesaler.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="retailer" className="py-2.5 gap-2">
            <Store className="h-4 w-4" />
            <span>Minoristas</span>
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 min-w-[1.25rem]">{groupedOrgs.retailer.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        ) : (
          <>
            <TabsContent value="importer">{renderOrgList(groupedOrgs.importer)}</TabsContent>
            <TabsContent value="distributor">{renderOrgList(groupedOrgs.distributor)}</TabsContent>
            <TabsContent value="wholesaler">{renderOrgList(groupedOrgs.wholesaler)}</TabsContent>
            <TabsContent value="retailer">{renderOrgList(groupedOrgs.retailer)}</TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
