
"use client";

import { useState } from 'react';
import { useOrganizations } from '@/hooks/use-organizations';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, Building2, Globe, Truck, ShoppingBag, 
  Store, MoreVertical, Pencil, Trash2, ExternalLink 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationDialog } from '@/components/admin/organizations/organization-dialog';
import type { Organization, OrganizationType } from '@/types';
import { deleteOrganization } from '@/lib/firestore/organizations';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function OrganizationsManagementPage() {
  const t = useTranslations('AdminOrganizations');
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
    if (confirm("¿Estás seguro de eliminar esta organización? Todos los datos vinculados podrían quedar huérfanos.")) {
      try {
        await deleteOrganization(id);
        toast({ title: "Organización eliminada" });
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      <OrganizationDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        organization={selectedOrg} 
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">Gestión de Ecosistema</h1>
          <p className="text-muted-foreground">Administra los edificios (organizaciones) de tu metrópolis.</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Organización
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
        ) : organizations.length > 0 ? (
          organizations.map((org) => (
            <Card key={org.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    {getTypeIcon(org.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">{org.name}</CardTitle>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {org.type}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(org)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(org.id)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge className={cn(
                      org.status === 'active' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {org.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-xs">{org.id.substring(0, 8)}...</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-6 group" onClick={() => toast({ title: "Próximamente", description: "Fase 2: Selector de Contexto" })}>
                  Gestionar Edificio <ExternalLink className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="mt-4 font-bold">No hay organizaciones</h3>
            <p className="text-sm text-muted-foreground">Empieza creando el primer edificio de tu ecosistema.</p>
          </div>
        )}
      </div>
    </div>
  );
}
