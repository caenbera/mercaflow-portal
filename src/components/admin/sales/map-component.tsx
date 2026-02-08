
'use client';

import { useMemo, useCallback } from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import type { Prospect } from '@/types';

// This is an interface for prospects that are guaranteed to have coordinates
interface ProspectWithCoords extends Prospect {
  lat: number;
  lng: number;
}

interface MapComponentProps {
  prospects: ProspectWithCoords[];
  selectedProspects: string[];
  onToggleSelection: (id: string) => void;
  onMarkerClick: (prospect: Prospect) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 41.8781, // Chicago center
  lng: -87.6298,
};

// Simplified map options
const mapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: false,
};

// Color mapping for prospect status
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', // amber-500
  contacted: '#3b82f6', // blue-500
  visited: '#22c55e', // green-500
  client: '#a855f7', // purple-500
  not_interested: '#6b7280', // gray-500
};

export function MapComponent({ prospects, selectedProspects, onMarkerClick }: MapComponentProps) {

  const getMarkerIcon = useCallback((prospect: Prospect, isSelected: boolean) => {
    const color = STATUS_COLORS[prospect.status] || '#6b7280'; // Default to gray
    const scale = isSelected ? 1.5 : 1;

    // A standard SVG path for a map pin
    const pinPath = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";

    return {
      path: pinPath,
      fillColor: color,
      fillOpacity: isSelected ? 1 : 0.8,
      strokeWeight: 1.5,
      strokeColor: '#ffffff',
      scale: scale,
      anchor: new google.maps.Point(12, 24),
    };
  }, []);


  const markers = useMemo(() => {
    return prospects.map(prospect => (
      <MarkerF
        key={prospect.id}
        position={{ lat: prospect.lat, lng: prospect.lng }}
        onClick={() => onMarkerClick(prospect)}
        icon={getMarkerIcon(prospect, selectedProspects.includes(prospect.id))}
        zIndex={selectedProspects.includes(prospect.id) ? 100 : 1}
      />
    ));
  }, [prospects, selectedProspects, onMarkerClick, getMarkerIcon]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={11}
      options={mapOptions}
    >
      {markers}
    </GoogleMap>
  );
}
