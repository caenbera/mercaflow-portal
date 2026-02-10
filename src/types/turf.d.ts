// types/turf.d.ts
declare module '@turf/helpers' {
  export function point(coordinates: [number, number], properties?: any, options?: any): any;
  export function polygon(coordinates: number[][][], properties?: any, options?: any): any;
}

declare module '@turf/boolean-point-in-polygon' {
  function booleanPointInPolygon(point: any, polygon: any, options?: any): boolean;
  export default booleanPointInPolygon;
}
