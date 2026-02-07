'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Prospect } from '@/types';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { MapPin, Grid3X3, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  proximityRadius = 2,
}: DistrictCardProps) {
  const t = useTranslations('AdminSalesPage');

  const subZones = useMemo(() => {
    return prospects.reduce((acc, prospect) => {
      const subZoneCode = prospect.zone || 'Uncategorized';
      if (!acc[subZoneCode]) {
        const subZoneName = subZoneCode.includes('-') 
          ? `Sub-zona ${subZoneCode.split('-').pop()}` 
          : 'General';
        acc[subZoneCode] = { code: subZoneCode, name: subZoneName, prospects: [] };
      }
      acc[subZoneCode].prospects.push(prospect);
      return acc;
    }, {} as Record<string, { code: string; name: string; prospects: Prospect[] }>);
  }, [prospects]);

  const totalProspects = prospects.length;
  
  // Calcular área aproximada basada en densidad
  const areaKm = useMemo(() => {
    const density = totalProspects / 10; // aproximación
    return Math.max(0.5, Math.min(10, density)).toFixed(1);
  }, [totalProspects]);

  // Generar grid de 12 celdas con colores según densidad y selección
  const miniMapGridCells = useMemo(() => {
    const cells = Array(12).fill(null);
    const subZoneEntries = Object.values(subZones).slice(0, 12);
    
    subZoneEntries.forEach((sz, index) => {
      const prospectIds = sz.prospects.map(p => p.id);
      const selectedCount = prospectIds.filter(id => selectedProspects.includes(id)).length;
      const totalCount = sz.prospects.length;
      const density = totalCount / (areaKm as unknown as number);
      
      // Determinar color según densidad y selección
      let status: 'empty' | 'low' | 'medium' | 'high' | 'selected' | 'partial' = 'empty';
      
      if (selectedCount === totalCount && totalCount > 0) {
        status = 'selected';
      } else if (selectedCount > 0) {
        status = 'partial';
      } else if (totalCount > 0) {
        if (density > 5) status = 'high';
        else if (density > 2) status = 'medium';
        else status = 'low';
      }
      
      cells[index] = {
        code: sz.code.split('-').pop() || '??',
        status,
        count: totalCount,
        selectedCount,
      };
    });
    return cells;
  }, [subZones, selectedProspects, areaKm]);

  // Calcular cluster inteligente sugerido
  const smartCluster = useMemo(() => {
    // Encontrar la sub-zona con más prospectos
    const bestSubZone = Object.values(subZones).sort((a, b) => 
      b.prospects.length - a.prospects.length
    )[0];
    
    if (!bestSubZone || bestSubZone.prospects.length < 3) return null;
    
    const count = bestSubZone.prospects.length;
    const estimatedDistance = (count * 0.3).toFixed(1);
    const efficiency = Math.min(95, 60 + (count * 5));
    
    return {
      subZone: bestSubZone,
      count,
      estimatedDistance,
      efficiency,
    };
  }, [subZones]);

  const handleSubZoneClick = (subZoneProspects: Prospect[]) => {
    const prospectIds = subZoneProspects.map(p => p.id);
    const areAllSelected = prospectIds.length > 0 && 
      prospectIds.every(id => selectedProspects.includes(id));
    onBulkSelect(prospectIds, !areAllSelected);
  };

  // Color del header según distrito
  const getDistrictColor = () => {
    if (districtCode.includes('PIL')) return 'from-green-600 to-green-700';
    if (districtCode.includes('LV')) return 'from-blue-600 to-blue-700';
    if (districtCode.includes('AP')) return 'from-orange-500 to-orange-600';
    if (districtCode.includes('WI')) return 'from-red-500 to-red-600';
    if (districtCode.includes('IN')) return 'from-indigo-500 to-indigo-600';
    return 'from-gray-600 to-gray-700';
  };

  return (
    <Card className="overflow-hidden shadow-lg border-0">
      {/* Header con gradiente */}
      <CardHeader className={cn(
        "p-4 text-white bg-gradient-to-r",
        getDistrictColor()
      )}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-5 w-5 opacity-80" />
              <CardTitle className="font-mono text-2xl font-bold tracking-wider">
                {districtCode}
              </CardTitle>
            </div>
            <CardDescription className="text-white/90 font-medium text-base">
              {districtName}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{totalProspects}</div>
            <div className="text-xs opacity-80 uppercase tracking-wide">
              {t('district_prospects', { count: totalProspects })}
            </div>
            <div className="text-xs opacity-70 mt-1">
              ~{areaKm} km²
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Mini Map Grid */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Grid3X3 className="h-4 w-4" />
              Distribución de Sub-zonas
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-600"></span>
                Alta
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-300"></span>
                Media
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 grid-rows-3 gap-2 h-32">
            {miniMapGridCells.map((cell, index) => (
              <div 
                key={index} 
                className={cn(
                  "rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer hover:scale-105",
                  !cell && "bg-gray-200 text-gray-400",
                  cell?.status === 'high' && "bg-green-600 text-white shadow-md",
                  cell?.status === 'medium' && "bg-green-400 text-white",
                  cell?.status === 'low' && "bg-green-200 text-green-800",
                  cell?.status === 'selected' && "bg-orange-500 text-white shadow-lg animate-pulse",
                  cell?.status === 'partial' && "bg-amber-400 text-white border-2 border-orange-500",
                  cell && cell.status === 'empty' && "bg-gray-100 text-gray-300"
                )}
                onClick={() => {
                  const subZone = Object.values(subZones)[index];
                  if (subZone) handleSubZoneClick(subZone.prospects);
                }}
              >
                {cell && (
                  <>
                    <span className="text-lg">{cell.code}</span>
                    <span className={cn(
                      "text-[10px] font-normal",
                      ['selected', 'high', 'medium'].includes(cell.status) ? "text-white/80" : "text-current"
                    )}>
                      {cell.status === 'partial' 
                        ? `${cell.selectedCount}/${cell.count}`
                        : cell.count
                      }
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Smart Cluster Suggestion */}
        {smartCluster && smartCluster.count >= 3 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <span className="font-bold text-gray-800">Cluster Inteligente Sugerido</span>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                {smartCluster.efficiency}% eficiente
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <span className="font-semibold text-orange-600">
                {smartCluster.count} clientes
              </span>
              {' '}en {smartCluster.subZone.name} • ~{smartCluster.estimatedDistance}km total
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                  style={{ width: `${smartCluster.efficiency}%` }}
                />
              </div>
            </div>

            <Button 
              size="sm" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => handleSubZoneClick(smartCluster.subZone.prospects)}
            >
              Seleccionar {smartCluster.count} clientes de {smartCluster.subZone.code}
            </Button>
          </div>
        )}

        {/* Sub-zones Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(subZones).map(([code, { name, prospects: subZoneProspects }]) => {
            const prospectIds = subZoneProspects.map(p => p.id);
            const selectedCount = prospectIds.filter(id => selectedProspects.includes(id)).length;
            const totalCount = prospectIds.length;
            const isFullySelected = selectedCount === totalCount && totalCount > 0;
            const isPartiallySelected = selectedCount > 0 && !isFullySelected;

            return (
              <button 
                key={code}
                onClick={() => handleSubZoneClick(subZoneProspects)}
                className={cn(
                  "p-3 rounded-xl text-left transition-all border-2 relative overflow-hidden group",
                  isFullySelected 
                    ? 'bg-green-50 border-green-500 shadow-sm' 
                    : isPartiallySelected
                      ? 'bg-amber-50 border-amber-400'
                      : 'bg-gray-50 border-transparent hover:border-green-200 hover:bg-green-50/50'
                )}
              >
                {/* Indicador de selección */}
                {(isFullySelected || isPartiallySelected) && (
                  <div className={cn(
                    "absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white",
                    isFullySelected ? "bg-green-500" : "bg-amber-400"
                  )} />
                )}
                
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-green-700">
                    {code}
                  </span>
                  <Badge 
                    variant={isFullySelected ? "default" : "secondary"}
                    className={cn(
                      "text-xs px-2 py-0.5",
                      isFullySelected && "bg-green-600"
                    )}
                  >
                    {totalCount}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 truncate group-hover:text-gray-900">
                  {name}
                </div>
                
                {isPartiallySelected && (
                  <div className="text-[10px] text-amber-600 mt-1 font-medium">
                    {selectedCount} de {totalCount} seleccionados
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}