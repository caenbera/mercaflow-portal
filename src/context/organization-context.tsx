
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  const { userProfile, role, loading: authLoading } = useAuth();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  // Selector de organización con persistencia básica en memoria
  const handleSetActiveOrgId = useCallback((id: string | null) => {
    setActiveOrgId(id);
  }, []);

  // Lógica de inicialización segura
  useEffect(() => {
    if (!orgsLoading && !authLoading) {
      // 1. Si ya tenemos un ID activo, asegurarnos de que el objeto esté sincronizado
      if (activeOrgId) {
        const found = organizations.find(o => o.id === activeOrgId);
        if (found) {
          setActiveOrg(found);
          return;
        }
      }

      // 2. Si es un usuario con organización fija (Cliente/Staff)
      if (userProfile?.organizationId) {
        const found = organizations.find(o => o.id === userProfile.organizationId);
        if (found) {
          setActiveOrgId(found.id);
          setActiveOrg(found);
          return;
        }
      }

      // 3. Para el Super Admin, si no ha seleccionado nada, no forzamos nada para evitar errores
      // pero si hay organizaciones, activamos la primera de prueba del usuario si existe
      if (role === 'superadmin' && !activeOrgId && organizations.length > 0) {
        const myTestOrg = organizations.find(o => o.ownerId === userProfile?.uid);
        if (myTestOrg) {
          setActiveOrgId(myTestOrg.id);
          setActiveOrg(myTestOrg);
        }
      }
    }
  }, [userProfile, orgsLoading, authLoading, organizations, activeOrgId, role]);

  // Sincronización final del objeto activo
  useEffect(() => {
    if (activeOrgId && organizations.length > 0) {
      const found = organizations.find(o => o.id === activeOrgId);
      if (found) setActiveOrg(found);
    } else if (!activeOrgId) {
      setActiveOrg(null);
    }
  }, [activeOrgId, organizations]);

  const value = {
    activeOrgId,
    activeOrg,
    setActiveOrgId: handleSetActiveOrgId,
    isLoading: orgsLoading || authLoading
  };

  return (
    <OrganizationContext.Provider value={value}>
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
