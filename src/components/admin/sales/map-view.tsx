'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { Prospect } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, X, Loader2, Phone, BotMessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleMap, useJsApiLoader, Polygon, MarkerF } from '@react-google-maps/api';
import { districts } from '@/lib/district-config';

interface MapViewProps {
  prospects: Prospect[];
  selectedProspects: string[];
  onToggleSelection: (id: string) => void;
}

// This interface is for prospects that are guaranteed to have coordinates
interface ProspectWithCoords extends Prospect {
  lat: number;
  lng: number;
}

const STATUS_COLORS = {
  pending: '#f59e0b',
  contacted: '#3b82f6',
  visited: '#22c55e',
  client: '#a855f7',
  not_interested: '#6b7280',
};

const DISTRICT_CENTERS: Record<string, [number, number]> = {
  'CHI-PIL': [41.8559, -87.6659],
  'CHI-LV': [41.8445, -87.7059],
  'CHI-AP': [41.9683, -87.7289],
  'CHI-LP': [41.9296, -87.7078],
  'CHI-IP': [41.9539, -87.7359],
  'WI-MKE': [43.0389, -87.9065],
  'IN-IN': [39.7684, -86.1581],
};


export function MapView({ 
  prospects, 
  selectedProspects, 
  onToggleSelection,
}: MapViewProps) {
  const t = useTranslations('AdminSalesPage');
  const [selectedClient, setSelectedClient] = useState<ProspectWithCoords | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const mapOptions = useMemo(() => {
    if (!isLoaded) return {}; 
    return {
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
    };
  }, [isLoaded]);

  const containerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '600px'
  };

  const center = {
    lat: 41.8781, // Chicago center
    lng: -87.6298,
  };

  const prospectsWithCoords: ProspectWithCoords[] = useMemo(() => {
    const districtCoordsCount: Record<string, number> = {};
    
    return prospects.map((p) => {
      if (p.lat && p.lng) {
        return { ...p, lat: p.lat, lng: p.lng };
      }
      
      const districtCode = p.zone?.split('-').slice(0, 2).join('-') || 'CHI-PIL';
      const baseCoords = DISTRICT_CENTERS[districtCode] || [41.8781, -87.6298];
      
      const index = districtCoordsCount[districtCode] || 0;
      districtCoordsCount[districtCode] = index + 1;
      
      const angle = (index * 137.5) * (Math.PI / 180);
      const radius = 0.003 + (index % 5) * 0.001;
      const lat = baseCoords[0] + Math.cos(angle) * radius;
      const lng = baseCoords[1] + Math.sin(angle) * radius;
      
      return { ...p, lat, lng };
    });
  }, [prospects]);

  const handleMarkerClick = useCallback((prospect: ProspectWithCoords) => {
    setSelectedClient(prospect);
  }, []);
  
  const getMarkerIcon = useCallback((prospect: Prospect, isSelected: boolean) => {
    if (!isLoaded) return undefined;
    const color = STATUS_COLORS[prospect.status as keyof typeof STATUS_COLORS] || '#6b7280';
    const scale = isSelected ? 1.4 : 1;
    const pinPath = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5-2.5-1.12 2.5-2.5-2.5z";

    return {
      path: pinPath,
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: isSelected ? '#000000' : '#ffffff',
      scale: scale * 1.5,
      anchor: new google.maps.Point(12, 24),
    };
  }, [isLoaded]);

  const markers = useMemo(() => {
    if (!isLoaded) return [];
    return prospectsWithCoords.map(prospect => (
      <MarkerF
        key={prospect.id}
        position={{ lat: prospect.lat, lng: prospect.lng }}
        onClick={() => handleMarkerClick(prospect)}
        icon={getMarkerIcon(prospect, selectedProspects.includes(prospect.id))}
        zIndex={selectedProspects.includes(prospect.id) ? 100 : 1}
      />
    ));
  }, [prospectsWithCoords, selectedProspects, handleMarkerClick, getMarkerIcon, isLoaded]);

  const districtPolygons = useMemo(() => {
    return Object.values(districts).map((config) => {
      const paths = config.boundaries.map(coord => ({ lat: coord[1], lng: coord[0] }));
      return (
        <Polygon
          key={config.code}
          paths={paths}
          options={{
            strokeColor: '#2E7D32',
            strokeOpacity: 0.5,
            strokeWeight: 1,
            fillColor: '#4CAF50',
            fillOpacity: 0.05,
            clickable: false
          }}
        />
      );
    });
  }, []);

  const cleanPhoneNumber = (phone: string | undefined) => {
    return phone?.replace(/\D/g, '') || '';
  };

  if (!isLoaded) {
    return (
        <div className="flex h-full min-h-[500px] w-full items-center justify-center bg-gray-50 rounded-xl">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Cargando mapa...</p>
            </div>
        </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 240px)', minHeight: '600px' }} className="relative rounded-xl overflow-hidden border shadow-inner bg-slate-100">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={11}
        options={mapOptions}
      >
        {districtPolygons}
        {markers}
      </GoogleMap>
      
      {/* Overlay UI elements */}
       <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
        <div className="flex gap-2 pointer-events-auto flex-wrap">
          <Badge variant="secondary" className="bg-white/95 backdrop-blur shadow-md px-3 py-1.5 text-sm border font-bold">
            <MapPin className="h-3.5 w-3.5 mr-1.5 text-green-600" />
            {prospects.length} {t('tab_list')}
          </Badge>
          {selectedProspects.length > 0 && (
            <Badge className="bg-green-600 text-white shadow-md px-3 py-1.5 text-sm font-bold animate-in zoom-in-90">
              <Navigation className="h-3.5 w-3.5 mr-1.5" />
              {selectedProspects.length} {t('selected_prospects_label')}
            </Badge>
          )}
        </div>
      </div>

      {selectedClient && (
        <div className="absolute bottom-4 left-4 right-4 z-10 max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight">
                    {selectedClient.name}
                  </h3>
                  <Badge 
                    style={{ backgroundColor: STATUS_COLORS[selectedClient.status as keyof typeof STATUS_COLORS], color: 'white' }}
                    className="text-[10px] uppercase font-black px-1.5 h-5 border-none"
                  >
                    {t(`status_${selectedClient.status}` as any)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {selectedClient.address}
                </p>
              </div>
              <button 
                onClick={() => setSelectedClient(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex gap-1.5 mb-4 flex-wrap">
              <Badge variant="outline" className="font-mono text-[10px] text-green-700 bg-green-50 border-green-200 px-2 py-0.5">
                {selectedClient.zone || 'SIN-ZONA'}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-bold capitalize bg-slate-100 text-slate-600 px-2 h-5">
                {selectedClient.ethnic}
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-bold capitalize bg-slate-100 text-slate-600 px-2 h-5">
                {selectedClient.category}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button 
                asChild 
                variant="outline" 
                className="h-10 justify-start border-green-200 hover:bg-green-50 text-xs font-bold"
                disabled={!selectedClient.phone}
              >
                <a href={`tel:${cleanPhoneNumber(selectedClient.phone)}`}>
                  <Phone className="mr-2 h-3.5 w-3.5 text-green-600" />
                  {t('action_call_simple')}
                </a>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="h-10 justify-start border-green-200 hover:bg-green-50 text-xs font-bold"
                disabled={!selectedClient.phone}
              >
                <a href={`https://wa.me/1${cleanPhoneNumber(selectedClient.phone)}`} target="_blank">
                  <BotMessageSquare className="mr-2 h-3.5 w-3.5 text-green-600" />
                  WhatsApp
                </a>
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                className={cn(
                  "flex-1 h-11 font-black uppercase text-xs tracking-wider shadow-lg",
                  selectedProspects.includes(selectedClient.id)
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => onToggleSelection(selectedClient.id)}
              >
                {selectedProspects.includes(selectedClient.id) ? (
                  <>Quitar de ruta</>
                ) : (
                  <>Agregar a ruta</>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-11 px-4 border-slate-300"
                onClick={() => window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedClient.address)}`, 
                  '_blank'
                )}
              >
                <Navigation className="h-4 w-4 mr-1.5 text-blue-600" />
                Ir
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 hidden md:block border border-gray-200 w-48">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b pb-1">Estados de Prospectos</div>
        <div className="space-y-2.5">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2.5 text-xs">
              <div 
                className="w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-white shrink-0" 
                style={{ backgroundColor: color }}
              />
              <span className="capitalize text-slate-600 font-bold">
                {t(`status_${status}` as any)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="text-[9px] text-slate-400 mb-2 font-black uppercase tracking-widest">Densidad</div>
          <div className="flex gap-1.5">
            <div className="h-1.5 flex-1 rounded-full bg-red-500" title="Baja" />
            <div className="h-1.5 flex-1 rounded-full bg-orange-500" title="Media" />
            <div className="h-1.5 flex-1 rounded-full bg-green-500" title="Alta" />
          </div>
        </div>
      </div>
    </div>
  );
}