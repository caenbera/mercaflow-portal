'use client';

import { DistrictCard } from './DistrictCard';
import { SalesDashboard } from './SalesDashboard';
import { SmartCluster } from './SmartCluster';
import type { Prospect } from '@/types';
import type { District } from '@/lib/district-config';

interface DistrictsViewProps {
  prospects: Prospect[];
  groupedProspects: Record<string, Prospect[]>;
  districtConfigs: Record<string, District>;
  selectedSubZones: string[];
  onToggleSubZone: (subZoneCode: string) => void;
  onAcceptCluster: (prospectIds: string[]) => void;
}

export function DistrictsView({ prospects, groupedProspects, districtConfigs, selectedSubZones, onToggleSubZone, onAcceptCluster }: DistrictsViewProps) {
  return (
    <div>
      <SalesDashboard />
      <SmartCluster prospects={prospects} onAcceptCluster={onAcceptCluster} />

      {Object.keys(districtConfigs).map(districtCode => {
        const prospectsInDistrict = groupedProspects[districtCode] || [];
        if (prospectsInDistrict.length === 0) return null;

        return (
          <DistrictCard 
            key={districtCode}
            districtConfig={{...districtConfigs[districtCode], code: districtCode }}
            prospects={prospectsInDistrict}
            selectedSubZones={selectedSubZones}
            onToggleSubZone={onToggleSubZone}
          />
        )
      })}

      {groupedProspects['Uncategorized'] && (
        <div className="p-4 mt-4 border rounded-lg bg-gray-100">
            <h3 className="font-bold">Prospectos sin Zona Asignada</h3>
            <p className="text-sm text-muted-foreground">Estos prospectos necesitan que se les asigne una zona en sus detalles.</p>
            <ul>
                {groupedProspects['Uncategorized'].map(p => <li key={p.id} className="text-sm">{p.name}</li>)}
            </ul>
        </div>
      )}
    </div>
  );
}
