'use client';

import { ProspectCard } from './prospect-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { Prospect } from '@/types';
import { useTranslations } from 'next-intl';


interface DistrictCardProps {
  districtCode: string;
  districtName: string;
  prospects: Prospect[];
  onEdit: (prospect: Prospect) => void;
  onCheckIn: (prospect: Prospect) => void;
  isSelectionMode: boolean;
  selectedProspects: string[];
  onSelectionChange: (prospectId: string, isSelected: boolean) => void;
  onSelectAll: (prospectIds: string[], select: boolean) => void;
}

export function DistrictCard({
  districtCode,
  districtName,
  prospects,
  onEdit,
  onCheckIn,
  isSelectionMode,
  selectedProspects,
  onSelectionChange,
  onSelectAll,
}: DistrictCardProps) {
  const t = useTranslations('AdminSalesPage');
  
  const allProspectIdsInDistrict = prospects.map(p => p.id);
  const areAllSelected = allProspectIdsInDistrict.length > 0 && allProspectIdsInDistrict.every(id => selectedProspects.includes(id));

  const handleSelectAll = () => {
    onSelectAll(allProspectIdsInDistrict, !areAllSelected);
  };
  
  return (
    <Card className="shadow-lg border-l-4 border-primary">
      <CardHeader className="flex flex-row items-center justify-between bg-primary/5 p-4">
        <div>
          <CardTitle className="text-lg">{districtName}</CardTitle>
          <CardDescription>{t('district_prospects', { count: prospects.length })}</CardDescription>
        </div>
        {isSelectionMode && (
          <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-primary/10">
            <Checkbox
              id={`select-all-${districtCode}`}
              checked={areAllSelected}
              onCheckedChange={handleSelectAll}
              className="h-5 w-5"
            />
            <label htmlFor={`select-all-${districtCode}`} className="text-sm font-medium cursor-pointer">{t('select_all')}</label>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {prospects.map(prospect => (
          <ProspectCard
            key={prospect.id}
            prospect={prospect}
            onEdit={onEdit}
            onCheckIn={onCheckIn}
            isSelectionMode={isSelectionMode}
            isSelected={selectedProspects.includes(prospect.id)}
            onSelectionChange={onSelectionChange}
          />
        ))}
      </CardContent>
    </Card>
  );
}
