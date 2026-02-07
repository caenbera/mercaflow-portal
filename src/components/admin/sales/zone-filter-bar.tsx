// src/components/admin/sales/zone-filter-bar.tsx
'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  MapPin, Search, Crosshair, 
  Building2, Compass, Store, 
  MapPinned, Flag
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Prospect } from '@/types';
import { cn } from '@/lib/utils';

interface ZoneFilterBarProps {
  prospects: Prospect[];
  selectedZone: string;
  onZoneChange: (zone: string) => void;
  proximityRadius: number;
  onRadiusChange: (radius: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

interface ZoneConfig {
  code: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  filterFn: (prospect: Prospect) => boolean;
}

export function ZoneFilterBar({
  prospects,
  selectedZone,
  onZoneChange,
  proximityRadius,
  onRadiusChange,
  searchTerm,
  onSearchChange,
}: ZoneFilterBarProps) {
  const t = useTranslations('AdminSalesPage');

  // Configuración de zonas con filtros
  const zones: ZoneConfig[] = useMemo(() => [
    {
      code: 'all',
      label: 'Todos',
      icon: <Building2 className="h-4 w-4" />,
      color: 'bg-slate-500',
      filterFn: () => true,
    },
    {
      code: 'CHI-C',
      label: 'Centro',
      icon: <Compass className="h-4 w-4" />,
      color: 'bg-blue-500',
      filterFn: (p) => {
        const zone = p.zone?.toUpperCase() || '';
        return zone.startsWith('CHI-') && ['LP', 'WN', 'RP', 'NP'].some(d => zone.includes(d));
      },
    },
    {
      code: 'CHI-S',
      label: 'South Side',
      icon: <MapPinned className="h-4 w-4" />,
      color: 'bg-orange-500',
      filterFn: (p) => {
        const zone = p.zone?.toUpperCase() || '';
        return zone.startsWith('CHI-') && ['PIL', 'LV', 'BP', 'CK'].some(d => zone.includes(d));
      },
    },
    {
      code: 'CHI-W',
      label: 'West Side',
      icon: <Store className="h-4 w-4" />,
      color: 'bg-purple-500',
      filterFn: (p) => {
        const zone = p.zone?.toUpperCase() || '';
        return zone.startsWith('CHI-') && ['AP', 'IP', 'HP', 'AC'].some(d => zone.includes(d));
      },
    },
    {
      code: 'WI',
      label: 'Wisconsin',
      icon: <Flag className="h-4 w-4" />,
      color: 'bg-red-500',
      filterFn: (p) => (p.zone?.toUpperCase() || '').startsWith('WI-') || 
                       (p.state?.toUpperCase() === 'WI'),
    },
    {
      code: 'IN',
      label: 'Indiana',
      icon: <Flag className="h-4 w-4" />,
      color: 'bg-indigo-500',
      filterFn: (p) => (p.zone?.toUpperCase() || '').startsWith('IN-') || 
                       (p.state?.toUpperCase() === 'IN'),
    },
  ], []);

  // Contar prospectos por zona
  const zoneCounts = useMemo(() => {
    return zones.map(zone => ({
      ...zone,
      count: prospects.filter(zone.filterFn).length,
    }));
  }, [prospects, zones]);

  return (
    <div className="space-y-4">
      {/* Tarjetas de Zonas Horizontales */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {zoneCounts.map((zone) => (
          <button
            key={zone.code}
            onClick={() => onZoneChange(zone.code === selectedZone ? 'all' : zone.code)}
            className={cn(
              "flex-shrink-0 relative overflow-hidden rounded-xl p-3 min-w-[140px] transition-all duration-200",
              "border-2 hover:shadow-md",
              selectedZone === zone.code 
                ? `border-current shadow-lg scale-105 ${zone.color.replace('bg-', 'border-')} bg-white`
                : "border-gray-200 bg-white hover:border-gray-300"
            )}
          >
            {/* Barra de color superior */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-1",
              zone.color
            )} />
            
            <div className="flex items-start justify-between">
              <div className={cn(
                "p-2 rounded-lg",
                selectedZone === zone.code ? zone.color : "bg-gray-100",
                selectedZone === zone.code ? "text-white" : "text-gray-600"
              )}>
                {zone.icon}
              </div>
              <Badge 
                variant={selectedZone === zone.code ? "default" : "secondary"}
                className={cn(
                  "text-xs font-bold",
                  selectedZone === zone.code && zone.color
                )}
              >
                {zone.count}
              </Badge>
            </div>
            
            <div className="mt-2 text-left">
              <div className={cn(
                "font-bold text-sm",
                selectedZone === zone.code ? "text-gray-900" : "text-gray-700"
              )}>
                {zone.label}
              </div>
              {selectedZone === zone.code && (
                <div className="text-xs text-green-600 font-medium mt-0.5">
                  Activo
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Barra de búsqueda y geolocalización */}
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('search_address')}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>

      {/* Slider de proximidad - Diseño elegante */}
      <Card className="p-4 bg-gradient-to-r from-green-50/50 to-blue-50/50 border-green-100">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
          </div>
          
          <div className="flex-grow space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700">
                Radio de proximidad para agrupación
              </label>
              <Badge variant="outline" className="font-mono text-green-700 border-green-200 bg-white">
                {proximityRadius.toFixed(1)} km
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">0.5km</span>
              <Slider 
                value={[proximityRadius]} 
                min={0.5} 
                max={10} 
                step={0.5} 
                onValueChange={(v) => onRadiusChange(v[0])}
                className="flex-grow"
              />
              <span className="text-xs text-gray-500 font-medium">10km</span>
            </div>
            
            <p className="text-xs text-gray-500">
              Ajusta el radio para encontrar clusters de clientes cercanos. 
              <span className="text-green-600 font-medium ml-1">
                {proximityRadius < 2 ? 'Ideal para rutas a pie' : 
                 proximityRadius < 5 ? 'Perfecto para bicicleta' : 
                 'Recomendado para auto'}
              </span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}