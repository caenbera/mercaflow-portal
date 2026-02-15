
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { useOrganizations } from '@/hooks/use-organizations';
import type { Organization } from '@/types';

interface OrganizationContextType {
  activeOrgId: string | null;
  activeOrg: Organization | null;
  setActiveOrgId: (id: string | null) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { userProfile, role } = useAuth();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  // Inicialización inteligente del contexto
  useEffect(() => {
    if (!orgsLoading && organizations.length > 0) {
      // 1. Si el usuario ya tiene un ID activo en estado, buscarlo
      if (activeOrgId) {
        const found = organizations.find(o => o.id === activeOrgId);
        if (found) {
          setActiveOrg(found);
          return;
        }
      }

      // 2. Si no, intentar con la organización del perfil del usuario
      if (userProfile?.organizationId) {
        const found = organizations.find(o => o.id === userProfile.organizationId);
        if (found) {
          setActiveOrgId(found.id);
          setActiveOrg(found);
          return;
        }
      }

      // 3. Como último recurso para el Super Admin, activar la primera de la lista
      if (role === 'superadmin' && !activeOrgId) {
        setActiveOrgId(organizations[0].id);
        setActiveOrg(organizations[0]);
      }
    }
  }, [userProfile, orgsLoading, organizations, activeOrgId, role]);

  // Sincronizar el objeto cuando cambia el ID
  useEffect(() => {
    if (activeOrgId && organizations.length > 0) {
      const org = organizations.find(o => o.id === activeOrgId) || null;
      setActiveOrg(org);
    }
  }, [activeOrgId, organizations]);

  return (
    <OrganizationContext.Provider value={{ activeOrgId, activeOrg, setActiveOrgId, isLoading: orgsLoading }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
