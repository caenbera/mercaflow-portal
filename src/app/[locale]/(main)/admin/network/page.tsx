
"use client";

import { useState, useMemo } from 'react';
import { useOrganization } from '@/context/organization-context';
import { useOrganizations } from '@/hooks/use-organizations';
import { useConnections } from '@/hooks/use-connections';
import { 
  sendConnectionRequest, 
  updateConnectionStatus, 
  deleteConnection 
} from '@/lib/firestore/connections';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Users, Link as LinkIcon, Link2Off, 
  Check, X, Loader2, Globe, Truck, ShoppingBag, Store 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SupplyNetworkPage() {
  const { activeOrg, activeOrgId } = useOrganization();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const { connections, loading: connLoading } = useConnections(activeOrgId);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const loading = orgsLoading || connLoading;

  const filteredOrgs = useMemo(() => {
    if (!searchTerm) return [];
    return organizations.filter(org => 
      org.id !== activeOrgId && 
      (org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       org.slug.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [organizations, searchTerm, activeOrgId]);

  const getConnectionForOrg = (targetOrgId: string) => {
    return connections.find(c => c.fromOrgId === targetOrgId || c.toOrgId === targetOrgId);
  };

  const handleConnect = async (targetOrgId: string) => {
    if (!activeOrgId) return;
    setIsSubmitting(targetOrgId);
    try {
      await sendConnectionRequest(activeOrgId, targetOrgId);
      toast({ title: "Solicitud enviada", description: "La invitación está pendiente de aprobación." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo enviar la solicitud." });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleUpdateStatus = async (connId: string, status: 'accepted' | 'rejected') => {
    setIsSubmitting(connId);
    try {
      await updateConnectionStatus(connId, status);
      toast({ title: status === 'accepted' ? "Conexión aceptada" : "Solicitud rechazada" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Ocurrió un problema." });
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleDisconnect = async (connId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este vínculo? Se perderá el flujo automático de datos.")) return;
    setIsSubmitting(connId);
    try {
      await deleteConnection(connId);
      toast({ title: "Vínculo eliminado" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar." });
    } finally {
      setIsSubmitting(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'importer': return <Globe className="h-4 w-4" />;
      case 'distributor': return <Truck className="h-4 w-4" />;
      case 'wholesaler': return <ShoppingBag className="h-4 w-4" />;
      case 'retailer': return <Store className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (!activeOrg) return <div className="p-8 text-center text-muted-foreground">Selecciona un edificio para gestionar su red.</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
          <LinkIcon className="text-primary" />
          Red de Suministro: {activeOrg.name}
        </h1>
        <p className="text-muted-foreground">Conecta con otros edificios para automatizar catálogos y pedidos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BUSCADOR DE EDIFICIOS */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Buscar Socios</CardTitle>
              <CardDescription>Encuentra otros edificios en MercaFlow para vincularte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Nombre o slug..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                {filteredOrgs.map(org => {
                  const conn = getConnectionForOrg(org.id);
                  return (
                    <div key={org.id} className="p-3 border rounded-lg flex items-center justify-between bg-card">
                      <div>
                        <div className="text-sm font-bold">{org.name}</div>
                        <Badge variant="outline" className="text-[10px] uppercase gap-1 mt-1">
                          {getTypeIcon(org.type)} {org.type}
                        </Badge>
                      </div>
                      {conn ? (
                        <Badge variant={conn.status === 'accepted' ? 'default' : 'secondary'} className="capitalize">
                          {conn.status}
                        </Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 rounded-full p-0"
                          onClick={() => handleConnect(org.id)}
                          disabled={!!isSubmitting}
                        >
                          {isSubmitting === org.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  );
                })}
                {searchTerm && filteredOrgs.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">No se encontraron edificios.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GESTIÓN DE CONEXIONES */}
        <div className="lg:col-span-2 space-y-6">
          {/* Solicitudes Pendientes */}
          {connections.some(c => c.status === 'pending' && c.toOrgId === activeOrgId) && (
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader>
                <CardTitle className="text-sm text-orange-800">Solicitudes de Conexión Recibidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {connections.filter(c => c.status === 'pending' && c.toOrgId === activeOrgId).map(conn => {
                  const requester = organizations.find(o => o.id === conn.fromOrgId);
                  return (
                    <div key={conn.id} className="p-4 bg-card border border-orange-200 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{requester?.name}</p>
                          <p className="text-xs text-muted-foreground">Quiere ser tu cliente</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateStatus(conn.id, 'accepted')}
                          disabled={!!isSubmitting}
                        >
                          <Check className="h-4 w-4 mr-1" /> Aceptar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleUpdateStatus(conn.id, 'rejected')}
                          disabled={!!isSubmitting}
                        >
                          <X className="h-4 w-4 mr-1" /> Rechazar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Red Actual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mi Red de Suministro</CardTitle>
              <CardDescription>Empresas vinculadas activamente a {activeOrg.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
              ) : connections.some(c => c.status === 'accepted') ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connections.filter(c => c.status === 'accepted').map(conn => {
                    const otherOrgId = conn.fromOrgId === activeOrgId ? conn.toOrgId : conn.fromOrgId;
                    const org = organizations.find(o => o.id === otherOrgId);
                    const isMySupplier = conn.toOrgId === activeOrgId;

                    return (
                      <div key={conn.id} className="p-4 border rounded-xl bg-card hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", isMySupplier ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600")}>
                              {org && getTypeIcon(org.type)}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{org?.name}</p>
                              <Badge variant="secondary" className="text-[9px] h-4">
                                {isMySupplier ? "Proveedor" : "Cliente"}
                              </Badge>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDisconnect(conn.id)}
                            disabled={!!isSubmitting}
                          >
                            <Link2Off className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-2 border-t">
                          <LinkIcon className="h-2.5 w-2.5" />
                          Flujo de datos activo
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <LinkIcon className="mx-auto h-8 w-8 text-muted-foreground opacity-20 mb-3" />
                  <p className="text-sm text-muted-foreground">Tu red está vacía. Empieza buscando socios comerciales.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
