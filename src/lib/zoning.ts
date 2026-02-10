import { point, polygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { districts, type District } from '@/lib/district-config';

/**
 * Encuentra el distrito para un punto. 
 * Si no cae exacto en el polígono, busca en el área (grid) para evitar errores de precisión.
 */
function findDistrictForPoint(lat: number, lng: number): District | null {
    const pt = point([lng, lat]);
    
    // Intento 1: Por polígono (preciso)
    for (const districtCode in districts) {
        const district = districts[districtCode];
        const poly = polygon([district.boundaries]); 
        if (booleanPointInPolygon(pt, poly)) {
            return district;
        }
    }

    // Intento 2: Por coordenadas límite (fallback por si falla la precisión del mapa)
    for (const districtCode in districts) {
        const d = districts[districtCode];
        if (lat >= d.grid.minLat && lat <= d.grid.maxLat && 
            lng >= d.grid.minLng && lng <= d.grid.maxLng) {
            return d;
        }
    }
    return null;
}

/**
 * Calcula matemáticamente en qué celda de la cuadrícula 4x3 cae el prospecto.
 */
function calculateSubZone(lat: number, lng: number, district: District): string {
    const { minLat, maxLat, minLng, maxLng } = district.grid;
  
    // Normalizamos la posición (de 0 a 1)
    // Usamos 0.9999 para evitar que los prospectos en el borde exacto creen una fila/columna inexistente
    const latNorm = Math.max(0, Math.min(0.9999, (lat - minLat) / (maxLat - minLat)));
    const lngNorm = Math.max(0, Math.min(0.9999, (lng - minLng) / (maxLng - minLng)));
  
    // Mapeo a cuadrícula 4x3
    // Columnas (E-O): 0, 1, 2, 3
    const col = Math.floor(lngNorm * 4);
    
    // Filas (N-S): 0 es el Norte (maxLat), 2 es el Sur (minLat)
    const row = 2 - Math.floor(latNorm * 3);
  
    // Cálculo del número de celda (1 al 12)
    const cellNumber = (row * 4) + col + 1;
    const subZoneIndex = String(cellNumber).padStart(2, '0');
    
    return `${district.code}-${subZoneIndex}`;
}

export function getZoneFromCoordinates(lat: number, lng: number): string | null {
    if (!lat || !lng) return null;
    const district = findDistrictForPoint(lat, lng);
    if (district) {
        return calculateSubZone(lat, lng, district);
    }
    return null;
}