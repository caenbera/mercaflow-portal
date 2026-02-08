'use client';
import { Wand, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmartClusterProps {
    onAcceptCluster: (subZoneCodes: string[]) => void;
}

export function SmartCluster({ onAcceptCluster }: SmartClusterProps) {
  // Hardcoded for prototype demonstration
  const clusterSubZones = ['CHI-PIL-02', 'CHI-PIL-05', 'CHI-PIL-06'];

  return (
    <div className="smart-cluster">
      <div className="cluster-header">
        <div className="cluster-title">
          <Wand size={16} />
          Ruta Inteligente Sugerida
        </div>
        <div className="cluster-badge">85% Eficiente</div>
      </div>
      <div className="cluster-stats">
        <div className="cluster-stat">
          <div className="cluster-stat-value">3</div>
          <div className="cluster-stat-label">Sub-zonas</div>
        </div>
        <div className="cluster-stat">
          <div className="cluster-stat-value">12</div>
          <div className="cluster-stat-label">Prospectos</div>
        </div>
        <div className="cluster-stat">
          <div className="cluster-stat-value">2.4</div>
          <div className="cluster-stat-label">Km</div>
        </div>
      </div>
      <Button className="w-full" onClick={() => onAcceptCluster(clusterSubZones)}>
        <Check size={16} /> Aceptar Sugerencia
      </Button>
    </div>
  );
}
