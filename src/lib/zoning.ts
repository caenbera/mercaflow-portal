
import { point, polygon } from '@turf/turf';
import { booleanPointInPolygon } from '@turf/turf';
import { districts, type District } from '@/lib/district-config';

/**
 * Finds the district configuration for a given geographic point.
 * @param lat - Latitude of the point.
 * @param lng - Longitude of the point.
 * @returns The matching District object or null if no district contains the point.
 */
function findDistrictForPoint(lat: number, lng: number): District | null {
    const pt = point([lng, lat]); // turf.js uses [longitude, latitude]
    for (const districtCode in districts) {
        const district = districts[districtCode];
        // The first array in the polygon is the outer ring.
        const poly = polygon([district.boundaries]); 
        if (booleanPointInPolygon(pt, poly)) {
            return district;
        }
    }
    return null;
}

/**
 * Calculates the sub-zone code (e.g., 'CHI-PIL-05') for a point within a given district.
 * It does this by normalizing the point's coordinates within the district's bounding box
 * and mapping it to a 4x3 grid.
 * @param lat - Latitude of the point.
 * @param lng - Longitude of the point.
 * @param district - The district the point falls into.
 * @returns The calculated sub-zone code.
 */
function calculateSubZone(lat: number, lng: number, district: District): string {
    const boundaries = district.boundaries;
    const lats = boundaries.map(b => b[1]);
    const lngs = boundaries.map(b => b[0]);
  
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
  
    // Normalize position within the bounding box (0 to 1)
    const latNorm = maxLat !== minLat ? (lat - minLat) / (maxLat - minLat) : 0;
    const lngNorm = maxLng !== minLng ? (lng - minLng) / (maxLng - minLng) : 0;
  
    // Map normalized coordinates to a 4x3 grid
    const col = Math.min(Math.floor(lngNorm * 4), 3); // 4 columns (0-3)
    // Invert row calculation so 0 is the top row, matching visual grid layout
    const row = 2 - Math.min(Math.floor(latNorm * 3), 2); // 3 rows (0-2)
  
    // Calculate cell number (1-12)
    const cellNumber = row * 4 + col + 1;
    const subZoneIndex = String(cellNumber).padStart(2, '0');
    
    return `${district.code}-${subZoneIndex}`;
}

/**
 * Main utility function to determine the full zone code for a given set of coordinates.
 * @param lat - Latitude.
 * @param lng - Longitude.
 * @returns The full zone code (e.g., "CHI-PIL-05") or null if no matching district is found.
 */
export function getZoneFromCoordinates(lat: number, lng: number): string | null {
    const district = findDistrictForPoint(lat, lng);
    if (district) {
        return calculateSubZone(lat, lng, district);
    }
    return null;
}
