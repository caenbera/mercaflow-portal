"use client";

import { useEffect, type ReactNode } from 'react';
import { RoleGuard } from '@/components/auth/role-guard';
import { useOrganization } from '@/context/organization-context';
import { useRouter } from '@/navigation';
import { useToast } from '@/hooks/use-toast';

export default function SalesLayout({ children }: { children: ReactNode }) {
  const { activeOrg } = useOrganization();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // PROTECCIÓN DE ACCESO DIRECTO:
    // Si el convenio de ventas está en OFF para el edificio seleccionado,
    // expulsamos al usuario (incluso si es superadmin) al dashboard principal.
    if (activeOrg && activeOrg.adminAgreements && !activeOrg.adminAgreements.sales) {
      toast({
        variant: "destructive",
        title: "Módulo Bloqueado",
        description: "Este edificio no cuenta con el Convenio de Ventas activo.",
      });
      router.replace('/admin/dashboard');
    }
  }, [activeOrg, router, toast]);

  return (
    <RoleGuard allowedRoles={['salesperson', 'admin', 'superadmin']}>
      <div className="bg-slate-50/30 min-h-full">
        {children}
      </div>
    </RoleGuard>
  );
}