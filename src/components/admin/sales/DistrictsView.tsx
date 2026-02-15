'use client';

import { DistrictCard } from './district-card';
import { SalesDashboard } from './SalesDashboard';
import { SmartCluster } from './SmartCluster';
import type { Prospect } from '@/types';
import { districts as districtConfigs } from '@/lib/district-config';

interface DistrictsViewProps {
  prospects: Prospect[];
  groupedProspects: Record<string, Prospect[]>;
  selectedProspects: string[];
  onBulkSelect: (prospectIds: string[], select: boolean) => void;
  onAcceptCluster: (prospectIds: string[]) => void;
}

export function DistrictsView({ prospects, groupedProspects, selectedProspects, onBulkSelect, onAcceptCluster }: DistrictsViewProps) {
  return (
    <div>
      <SalesDashboard />
      <SmartCluster prospects={prospects} onAcceptCluster={onAcceptCluster} />

      {Object.keys(districtConfigs).map(districtCode => {
        const prospectsInDistrict = groupedProspects[districtCode] || [];
        if (prospectsInDistrict.length === 0) return null;

        const city = prospectsInDistrict[0]?.city || '';
        const districtName = districtConfigs[districtCode].name;
        const fullDistrictName = city ? `${city} - ${districtName}` : districtName;

        return (
          <DistrictCard 
            key={districtCode}
            districtCode={districtCode}
            districtName={fullDistrictName}
            prospects={prospectsInDistrict}
            selectedProspects={selectedProspects}
            onBulkSelect={onBulkSelect}
          />
        )
      })}

      {groupedProspects['Uncategorized'] && groupedProspects['Uncategorized'].length > 0 && (
        <div className="p-4 mt-4 border rounded-lg bg-gray-100">
            <h3 className="font-bold">Prospectos sin Zona Asignada</h3>
            <p className="text-sm text-muted-foreground mb-2">Estos prospectos necesitan que se les asigne una zona en sus detalles para aparecer en el grid.</p>
            <ul className="list-disc pl-5 space-y-1">
                {groupedProspects['Uncategorized'].map(p => <li key={p.id} className="text-sm">{p.name}</li>)}
            </ul>
        </div>
      )}
    </div>
  );
}