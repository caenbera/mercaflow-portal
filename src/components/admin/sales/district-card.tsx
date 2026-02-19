
'use client';

import { useMemo } from 'react';
import type { Prospect } from '@/types';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Grid3X3, Check } from 'lucide-react';
import { districts } from '@/lib/district-config';

interface GridCell {
  code: string;
  name: string;
  status: 'high-density' | 'medium-density' | 'low-density' | 'empty';
  count: number;
  prospects: Prospect[];
}

interface DistrictCardProps {
  districtCode: string;
  districtName: string;
  prospects: Prospect[];
  selectedProspects: string[];
  onBulkSelect: (prospectIds: string[], select: boolean) => void;
  proximityRadius?: number;
}

export function DistrictCard({
  districtCode,
  districtName,
  prospects,
  selectedProspects,
  onBulkSelect,
}: DistrictCardProps) {
  const t = useTranslations('AdminSalesPage');

  const totalProspects = prospects.length;
  
  const areaKm = useMemo(() => {
    return districts[districtCode]?.areaKm2 || 2.5;
  }, [districtCode]);

  const density = totalProspects / areaKm;
  const potentialValue = totalProspects * 1500; 

  const getDensityClass = (density: number): string => {
    if (density > 5) return 'high-density';
    if (density > 2) return 'medium-density';
    if (density > 0) return 'low-density';
    return 'empty';
  };

  const miniMapGridCells = useMemo<GridCell[]>(() => { 
    const districtConfig = districts[districtCode];
    if (!districtConfig) return [];

    const allSubZoneCodes = Object.keys(districtConfig.subZones).sort((a, b) => {
        const numA = parseInt(a.split('-').pop() || '0', 10);
        const numB = parseInt(b.split('-').pop() || '0', 10);
        return numA - numB;
    });

    const prospectsBySubZone = prospects.reduce((acc, prospect) => {
      const subZoneCode = prospect.zone || 'Uncategorized';
      if (!acc[subZoneCode]) {
        acc[subZoneCode] = [];
      }
      acc[subZoneCode].push(prospect);
      return acc;
    }, {} as Record<string, Prospect[]>);

    return allSubZoneCodes.map(subZoneCode => {
      const subZoneProspects = prospectsBySubZone[subZoneCode] || [];
      const totalCount = subZoneProspects.length;
      const subZoneDensity = totalCount / (areaKm / 12);
      
      return {
        code: subZoneCode.split('-').pop() || '??',
        name: districtConfig.subZones[subZoneCode].name,
        status: totalCount > 0 ? getDensityClass(subZoneDensity) as any : 'empty',
        count: totalCount,
        prospects: subZoneProspects
      };
    });
  }, [districtCode, prospects, areaKm]);


  const handleSubZoneClick = (cellProspects: Prospect[]) => {
    const prospectIds = cellProspects.map(p => p.id);
    if(prospectIds.length === 0) return;
    const areAllSelected = prospectIds.every(id => selectedProspects.includes(id));
    onBulkSelect(prospectIds, !areAllSelected);
  };
  
  const getDistrictHeaderStyle = (code: string) => {
    if (code.includes('PIL')) return { background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)' };
    if (code.includes('LV')) return { background: 'linear-gradient(135deg, #FF9800 0%, #E65100 100%)' };
    if (code.includes('AP')) return { background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)' };
    return { background: 'linear-gradient(135deg, #616161 0%, #212121 100%)' };
  };

  return (
    <div className="district-card">
        <div className="district-header" style={getDistrictHeaderStyle(districtCode)}>
            <div className="district-code">{districtCode}</div>
            <div className="district-name">{districtName}</div>
            <div className="district-stats">
                <div className="district-stat">
                    <div className="district-stat-value">{totalProspects}</div>
                    <div className="district-stat-label">Prospectos</div>
                </div>
                <div className="district-stat">
                    <div className="district-stat-value">{density.toFixed(1)}</div>
                    <div className="district-stat-label">{t('district_pros_km_label')}</div>
                </div>
                <div className="district-stat">
                    <div className="district-stat-value">${(potentialValue / 1000).toFixed(0)}k</div>
                    <div className="district-stat-label">{t('district_potential_label')}</div>
                </div>
            </div>
        </div>

        <div className="mini-map-container">
            <div className="mini-map-header">
                <div className="mini-map-title">
                    <Grid3X3 size={16} /> {t('district_grid_title')}
                </div>
                <div className="density-legend">
                    <span className="flex items-center gap-1"><span className="legend-dot" style={{background: '#2E7D32'}}></span>{t('density_high')}</span>
                    <span className="flex items-center gap-1"><span className="legend-dot" style={{background: '#FF9800'}}></span>{t('density_medium')}</span>
                    <span className="flex items-center gap-1"><span className="legend-dot" style={{background: '#E53935'}}></span>{t('density_low')}</span>
                </div>
            </div>
            
            <div className="mini-map-grid">
                {miniMapGridCells.map((cell, index) => {
                    const isSelected = cell ? cell.prospects.length > 0 && cell.prospects.every(p => selectedProspects.includes(p.id)) : false; 
                    return (
                        <div 
                            key={index}
                            className={cn('grid-cell', cell?.status, isSelected && 'selected')}
                            onClick={() => cell && handleSubZoneClick(cell.prospects)}
                        >
                            {cell && cell.status !== 'empty' && <div className="cell-check"><Check size={10} strokeWidth={3}/></div>}
                            <div className="cell-code">{cell?.code || String(index + 1).padStart(2, '0')}</div>
                            {cell && cell.status !== 'empty' && <div className="cell-count">{cell.count}</div>}
                            <div className="cell-label leading-tight">{cell?.name || `Sub-zona ${String(index + 1).padStart(2, '0')}`}</div>
                        </div>
                    )
                })}
            </div>
        </div>
        
    </div>
  );
}
