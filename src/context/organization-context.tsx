
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

  // Inicialización del contexto
  useEffect(() => {
    if (!orgsLoading && userProfile) {
      // Por defecto, si el usuario tiene una organización, esa es la activa
      if (userProfile.organizationId && !activeOrgId) {
        setActiveOrgId(userProfile.organizationId);
      }
    }
  }, [userProfile, orgsLoading, activeOrgId]);

  // Actualizar el objeto de organización activa cuando cambia el ID
  useEffect(() => {
    if (activeOrgId && organizations.length > 0) {
      const org = organizations.find(o => o.id === activeOrgId) || null;
      setActiveOrg(org);
    } else {
      setActiveOrg(null);
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
