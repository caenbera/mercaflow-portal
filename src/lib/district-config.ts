/**
 * @fileoverview Central configuration for geographic districts.
 * TOTAL COVERAGE VERSION: 54 Districts with grid-logic for auto-assignment.
 */

export interface SubZone {
  name: string;
}

export interface District {
  code: string;
  name: string;
  areaKm2: number;
  boundaries: [number, number][]; 
  grid: { minLat: number; maxLat: number; minLng: number; maxLng: number; }; 
  subZones: Record<string, SubZone>;
}

const genSZ = (prefix: string, streets: string[]): Record<string, SubZone> => {
  const sz: Record<string, SubZone> = {};
  for (let i = 1; i <= 12; i++) {
    const id = `${prefix}-${i.toString().padStart(2, '0')}`;
    sz[id] = { name: `${streets[(i - 1) % streets.length]} (${i})` };
  }
  return sz;
};

export const districts: Record<string, District> = {
  // ==================== CHICAGO CORE (1-10) ====================
  "CHI-LP": {
    code: "CHI-LP", name: "Loop / Downtown", areaKm2: 2.5,
    boundaries: [[-87.66, 41.89], [-87.60, 41.89], [-87.60, 41.86], [-87.66, 41.86], [-87.66, 41.89]],
    grid: { minLat: 41.86, maxLat: 41.89, minLng: -87.66, maxLng: -87.60 },
    subZones: genSZ("CHI-LP", ["State St", "Michigan Ave", "Wacker Dr", "Congress Pkwy"])
  },
  "CHI-RN": {
    code: "CHI-RN", name: "River North", areaKm2: 2.0,
    boundaries: [[-87.66, 41.92], [-87.60, 41.92], [-87.60, 41.89], [-87.66, 41.89], [-87.66, 41.92]],
    grid: { minLat: 41.89, maxLat: 41.92, minLng: -87.66, maxLng: -87.60 },
    subZones: genSZ("CHI-RN", ["Clark St", "Wells St", "Ohio St", "Chicago Ave"])
  },
  "CHI-WL": {
    code: "CHI-WL", name: "West Loop", areaKm2: 2.2,
    boundaries: [[-87.69, 41.89], [-87.66, 41.89], [-87.66, 41.86], [-87.69, 41.86], [-87.69, 41.89]],
    grid: { minLat: 41.86, maxLat: 41.89, minLng: -87.69, maxLng: -87.66 },
    subZones: genSZ("CHI-WL", ["Randolph St", "Fulton Market", "Madison St", "Halsted St"])
  },
  "CHI-FM": {
    code: "CHI-FM", name: "Fulton Market District", areaKm2: 1.5,
    boundaries: [[-87.68, 41.90], [-87.64, 41.90], [-87.64, 41.89], [-87.68, 41.89], [-87.68, 41.90]],
    grid: { minLat: 41.89, maxLat: 41.90, minLng: -87.68, maxLng: -87.64 },
    subZones: genSZ("CHI-FM", ["Fulton St", "Green St", "Morgan St", "Lake St"])
  },
  "CHI-OT": {
    code: "CHI-OT", name: "Old Town", areaKm2: 1.5,
    boundaries: [[-87.66, 41.93], [-87.62, 41.93], [-87.62, 41.91], [-87.66, 41.91], [-87.66, 41.93]],
    grid: { minLat: 41.91, maxLat: 41.93, minLng: -87.66, maxLng: -87.62 },
    subZones: genSZ("CHI-OT", ["Wells St", "North Ave", "Sedgwick St", "Division St"])
  },
  "CHI-PIL": {
    code: "CHI-PIL", name: "Pilsen", areaKm2: 2.1,
    boundaries: [[-87.69, 41.86], [-87.63, 41.86], [-87.63, 41.83], [-87.69, 41.83], [-87.69, 41.86]],
    grid: { minLat: 41.83, maxLat: 41.86, minLng: -87.69, maxLng: -87.63 },
    subZones: genSZ("CHI-PIL", ["18th St", "Blue Island Ave", "Cermak Rd", "Ashland Ave"])
  },
  "CHI-LV": {
    code: "CHI-LV", name: "Little Village", areaKm2: 3.4,
    boundaries: [[-87.76, 41.86], [-87.69, 41.86], [-87.69, 41.83], [-87.76, 41.83], [-87.76, 41.86]],
    grid: { minLat: 41.83, maxLat: 41.86, minLng: -87.76, maxLng: -87.69 },
    subZones: genSZ("CHI-LV", ["26th St", "Kedzie Ave", "Pulaski Rd", "California Ave"])
  },
  "CHI-SL": {
    code: "CHI-SL", name: "South Lawndale", areaKm2: 2.9,
    boundaries: [[-87.76, 41.83], [-87.69, 41.83], [-87.69, 41.79], [-87.76, 41.79], [-87.76, 41.83]],
    grid: { minLat: 41.79, maxLat: 41.83, minLng: -87.76, maxLng: -87.69 },
    subZones: genSZ("CHI-SL", ["31st St", "Kostner Ave", "Central Park Ave", "Kedzie Ave"])
  },
  "CHI-BP": {
    code: "CHI-BP", name: "Brighton Park", areaKm2: 2.5,
    boundaries: [[-87.72, 41.83], [-87.67, 41.83], [-87.67, 41.80], [-87.72, 41.80], [-87.72, 41.83]],
    grid: { minLat: 41.80, maxLat: 41.83, minLng: -87.72, maxLng: -87.67 },
    subZones: genSZ("CHI-BP", ["Archer Ave", "47th St", "Western Ave", "Kedzie Ave"])
  },
  "CHI-BRI": {
    code: "CHI-BRI", name: "Bridgeport", areaKm2: 2.2,
    boundaries: [[-87.67, 41.85], [-87.62, 41.85], [-87.62, 41.82], [-87.67, 41.82], [-87.67, 41.85]],
    grid: { minLat: 41.82, maxLat: 41.85, minLng: -87.67, maxLng: -87.62 },
    subZones: genSZ("CHI-BRI", ["Halsted St", "31st St", "35th St", "Wallace St"])
  },

  // ==================== NORTH CHICAGO (11-20) ====================
  "CHI-WK": {
    code: "CHI-WK", name: "Wicker Park", areaKm2: 1.8,
    boundaries: [[-87.70, 41.92], [-87.66, 41.92], [-87.66, 41.89], [-87.70, 41.89], [-87.70, 41.92]],
    grid: { minLat: 41.89, maxLat: 41.92, minLng: -87.70, maxLng: -87.66 },
    subZones: genSZ("CHI-WK", ["Milwaukee Ave", "North Ave", "Division St", "Damen Ave"])
  },
  "CHI-LG": {
    code: "CHI-LG", name: "Logan Square", areaKm2: 3.2,
    boundaries: [[-87.73, 41.94], [-87.69, 41.94], [-87.69, 41.91], [-87.73, 41.91], [-87.73, 41.94]],
    grid: { minLat: 41.91, maxLat: 41.94, minLng: -87.73, maxLng: -87.69 },
    subZones: genSZ("CHI-LG", ["Logan Blvd", "Milwaukee Ave", "Fullerton Ave", "California Ave"])
  },
  "CHI-HP": {
    code: "CHI-HP", name: "Humboldt Park", areaKm2: 3.8,
    boundaries: [[-87.74, 41.91], [-87.69, 41.91], [-87.69, 41.87], [-87.74, 41.87], [-87.74, 41.91]],
    grid: { minLat: 41.87, maxLat: 41.91, minLng: -87.74, maxLng: -87.69 },
    subZones: genSZ("CHI-HP", ["North Ave", "Division St", "Chicago Ave", "Kedzie Ave"])
  },
  "CHI-WHP": {
    code: "CHI-WHP", name: "West Humboldt Park", areaKm2: 2.5,
    boundaries: [[-87.77, 41.91], [-87.73, 41.91], [-87.73, 41.88], [-87.77, 41.88], [-87.77, 41.91]],
    grid: { minLat: 41.88, maxLat: 41.91, minLng: -87.77, maxLng: -87.73 },
    subZones: genSZ("CHI-WHP", ["Pulaski Rd", "Chicago Ave", "Division St", "Kostner Ave"])
  },
  "CHI-AV": {
    code: "CHI-AV", name: "Avondale", areaKm2: 2.2,
    boundaries: [[-87.73, 41.95], [-87.69, 41.95], [-87.69, 41.93], [-87.73, 41.93], [-87.73, 41.95]],
    grid: { minLat: 41.93, maxLat: 41.95, minLng: -87.73, maxLng: -87.69 },
    subZones: genSZ("CHI-AV", ["Belmont Ave", "Elston Ave", "Milwaukee Ave", "Pulaski Rd"])
  },
  "CHI-IP": {
    code: "CHI-IP", name: "Irving Park", areaKm2: 2.3,
    boundaries: [[-87.75, 41.97], [-87.70, 41.97], [-87.70, 41.94], [-87.75, 41.94], [-87.75, 41.97]],
    grid: { minLat: 41.94, maxLat: 41.97, minLng: -87.75, maxLng: -87.70 },
    subZones: genSZ("CHI-IP", ["Irving Park Rd", "Addison St", "Pulaski Rd", "Kedzie Ave"])
  },
  "CHI-AP": {
    code: "CHI-AP", name: "Albany Park", areaKm2: 2.8,
    boundaries: [[-87.74, 41.99], [-87.69, 41.99], [-87.69, 41.96], [-87.74, 41.96], [-87.74, 41.99]],
    grid: { minLat: 41.96, maxLat: 41.99, minLng: -87.74, maxLng: -87.69 },
    subZones: genSZ("CHI-AP", ["Lawrence Ave", "Kedzie Ave", "Montrose Ave", "Kimball Ave"])
  },
  "CHI-RV": {
    code: "CHI-RV", name: "Ravenswood", areaKm2: 2.1,
    boundaries: [[-87.70, 41.98], [-87.66, 41.98], [-87.66, 41.95], [-87.70, 41.95], [-87.70, 41.98]],
    grid: { minLat: 41.95, maxLat: 41.98, minLng: -87.70, maxLng: -87.66 },
    subZones: genSZ("CHI-RV", ["Montrose Ave", "Damen Ave", "Lawrence Ave", "Ravenswood Ave"])
  },
  "CHI-NC": {
    code: "CHI-NC", name: "North Center", areaKm2: 1.9,
    boundaries: [[-87.70, 41.96], [-87.66, 41.96], [-87.66, 41.94], [-87.70, 41.94], [-87.70, 41.96]],
    grid: { minLat: 41.94, maxLat: 41.96, minLng: -87.70, maxLng: -87.66 },
    subZones: genSZ("CHI-NC", ["Lincoln Ave", "Irving Park Rd", "Western Ave", "Addison St"])
  },
  "CHI-LVW": {
    code: "CHI-LVW", name: "Lakeview", areaKm2: 2.5,
    boundaries: [[-87.67, 41.96], [-87.63, 41.96], [-87.63, 41.93], [-87.67, 41.93], [-87.67, 41.96]],
    grid: { minLat: 41.93, maxLat: 41.96, minLng: -87.67, maxLng: -87.63 },
    subZones: genSZ("CHI-LVW", ["Belmont Ave", "Clark St", "Halsted St", "Addison St"])
  },

  // ==================== FAR NORTH CHICAGO (21-26) ====================
  "CHI-UP": {
    code: "CHI-UP", name: "Uptown", areaKm2: 2.4,
    boundaries: [[-87.67, 41.98], [-87.63, 41.98], [-87.63, 41.95], [-87.67, 41.95], [-87.67, 41.98]],
    grid: { minLat: 41.95, maxLat: 41.98, minLng: -87.67, maxLng: -87.63 },
    subZones: genSZ("CHI-UP", ["Broadway", "Wilson Ave", "Lawrence Ave", "Sheridan Rd"])
  },
  "CHI-RP": {
    code: "CHI-RP", name: "Rogers Park", areaKm2: 2.6,
    boundaries: [[-87.69, 42.02], [-87.65, 42.02], [-87.65, 41.99], [-87.69, 41.99], [-87.69, 42.02]],
    grid: { minLat: 41.99, maxLat: 42.02, minLng: -87.69, maxLng: -87.65 },
    subZones: genSZ("CHI-RP", ["Sheridan Rd", "Morse Ave", "Loyola", "Clark St"])
  },
  "CHI-WR": {
    code: "CHI-WR", name: "West Ridge", areaKm2: 3.0,
    boundaries: [[-87.72, 42.02], [-87.68, 42.02], [-87.68, 41.99], [-87.72, 41.99], [-87.72, 42.02]],
    grid: { minLat: 41.99, maxLat: 42.02, minLng: -87.72, maxLng: -87.68 },
    subZones: genSZ("CHI-WR", ["Devon Ave", "Western Ave", "Touhy Ave", "California Ave"])
  },
  "CHI-JP": {
    code: "CHI-JP", name: "Jefferson Park", areaKm2: 2.3,
    boundaries: [[-87.79, 41.99], [-87.74, 41.99], [-87.74, 41.96], [-87.79, 41.96], [-87.79, 41.99]],
    grid: { minLat: 41.96, maxLat: 41.99, minLng: -87.79, maxLng: -87.74 },
    subZones: genSZ("CHI-JP", ["Milwaukee Ave", "Lawrence Ave", "Foster Ave", "Central Ave"])
  },
  "CHI-PP": {
    code: "CHI-PP", name: "Portage Park", areaKm2: 2.7,
    boundaries: [[-87.78, 41.97], [-87.73, 41.97], [-87.73, 41.94], [-87.78, 41.94], [-87.78, 41.97]],
    grid: { minLat: 41.94, maxLat: 41.97, minLng: -87.78, maxLng: -87.73 },
    subZones: genSZ("CHI-PP", ["Irving Park Rd", "Central Ave", "Milwaukee Ave", "Belmont Ave"])
  },
  "CHI-DU": {
    code: "CHI-DU", name: "Dunning", areaKm2: 3.5,
    boundaries: [[-87.83, 41.96], [-87.78, 41.96], [-87.78, 41.93], [-87.83, 41.93], [-87.83, 41.96]],
    grid: { minLat: 41.93, maxLat: 41.96, minLng: -87.83, maxLng: -87.78 },
    subZones: genSZ("CHI-DU", ["Belmont Ave", "Irving Park Rd", "Harlem Ave", "Narragansett Ave"])
  },

  // ==================== WEST & SOUTH CHICAGO (27-35) ====================
  "CHI-AU": {
    code: "CHI-AU", name: "Austin", areaKm2: 3.5,
    boundaries: [[-87.78, 41.91], [-87.73, 41.91], [-87.73, 41.87], [-87.78, 41.87], [-87.78, 41.91]],
    grid: { minLat: 41.87, maxLat: 41.91, minLng: -87.78, maxLng: -87.73 },
    subZones: genSZ("CHI-AU", ["Madison St", "Chicago Ave", "Cicero Ave", "Austin Blvd"])
  },
  "CHI-HE": {
    code: "CHI-HE", name: "Hermosa", areaKm2: 2.0,
    boundaries: [[-87.75, 41.93], [-87.72, 41.93], [-87.72, 41.91], [-87.75, 41.91], [-87.75, 41.93]],
    grid: { minLat: 41.91, maxLat: 41.93, minLng: -87.75, maxLng: -87.72 },
    subZones: genSZ("CHI-HE", ["Fullerton Ave", "Armitage Ave", "Pulaski Rd", "Kostner Ave"])
  },
  "CHI-CR": {
    code: "CHI-CR", name: "Cragin", areaKm2: 2.2,
    boundaries: [[-87.77, 41.94], [-87.73, 41.94], [-87.73, 41.91], [-87.77, 41.91], [-87.77, 41.94]],
    grid: { minLat: 41.91, maxLat: 41.94, minLng: -87.77, maxLng: -87.73 },
    subZones: genSZ("CHI-CR", ["Grand Ave", "Fullerton Ave", "Central Ave", "Laramie Ave"])
  },
  "CHI-BC": {
    code: "CHI-BC", name: "Belmont Cragin", areaKm2: 2.5,
    boundaries: [[-87.80, 41.94], [-87.75, 41.94], [-87.75, 41.91], [-87.80, 41.91], [-87.80, 41.94]],
    grid: { minLat: 41.91, maxLat: 41.94, minLng: -87.80, maxLng: -87.75 },
    subZones: genSZ("CHI-BC", ["Belmont Ave", "Diversey Ave", "Central Ave", "Austin Ave"])
  },
  "CHI-CI": {
    code: "CHI-CI", name: "Cicero", areaKm2: 2.8,
    boundaries: [[-87.77, 41.87], [-87.73, 41.87], [-87.73, 41.82], [-87.77, 41.82], [-87.77, 41.87]],
    grid: { minLat: 41.82, maxLat: 41.87, minLng: -87.77, maxLng: -87.73 },
    subZones: genSZ("CHI-CI", ["Cermak Rd", "26th St", "Cicero Ave", "Laramie Ave"])
  },
  "CHI-CL": {
    code: "CHI-CL", name: "Chicago Lawn", areaKm2: 2.8,
    boundaries: [[-87.72, 41.79], [-87.67, 41.79], [-87.67, 41.75], [-87.72, 41.75], [-87.72, 41.79]],
    grid: { minLat: 41.75, maxLat: 41.79, minLng: -87.72, maxLng: -87.67 },
    subZones: genSZ("CHI-CL", ["63rd St", "Marquette Rd", "Kedzie Ave", "Western Ave"])
  },
  "CHI-MP": {
    code: "CHI-MP", name: "Marquette Park", areaKm2: 2.3,
    boundaries: [[-87.70, 41.79], [-87.66, 41.79], [-87.66, 41.76], [-87.70, 41.76], [-87.70, 41.79]],
    grid: { minLat: 41.76, maxLat: 41.79, minLng: -87.70, maxLng: -87.66 },
    subZones: genSZ("CHI-MP", ["Marquette Rd", "71st St", "Western Ave", "California Ave"])
  },
  "CHI-SC": {
    code: "CHI-SC", name: "South Chicago", areaKm2: 3.2,
    boundaries: [[-87.58, 41.76], [-87.53, 41.76], [-87.53, 41.73], [-87.58, 41.73], [-87.58, 41.76]],
    grid: { minLat: 41.73, maxLat: 41.76, minLng: -87.58, maxLng: -87.53 },
    subZones: genSZ("CHI-SC", ["Commercial Ave", "87th St", "91st St", "South Shore Dr"])
  },
  "CHI-WC": {
    code: "CHI-WC", name: "West Chicago", areaKm2: 4.0,
    boundaries: [[-88.23, 41.91], [-88.17, 41.91], [-88.17, 41.86], [-88.23, 41.86], [-88.23, 41.91]],
    grid: { minLat: 41.86, maxLat: 41.91, minLng: -88.23, maxLng: -88.17 },
    subZones: genSZ("CHI-WC", ["Main St", "Washington St", "North Ave", "Roosevelt Rd"])
  },

  // ==================== ILLINOIS SUBURBS (36-46) ====================
  "IL-AU": {
    code: "IL-AU", name: "Aurora", areaKm2: 4.0,
    boundaries: [[-88.35, 41.78], [-88.27, 41.78], [-88.27, 41.71], [-88.35, 41.71], [-88.35, 41.78]],
    grid: { minLat: 41.71, maxLat: 41.78, minLng: -88.35, maxLng: -88.27 },
    subZones: genSZ("IL-AU", ["Downtown", "Lake St", "Galena Blvd", "New York St"])
  },
  "IL-JO": {
    code: "IL-JO", name: "Joliet", areaKm2: 3.8,
    boundaries: [[-88.15, 41.56], [-88.07, 41.56], [-88.07, 41.49], [-88.15, 41.49], [-88.15, 41.56]],
    grid: { minLat: 41.49, maxLat: 41.56, minLng: -88.15, maxLng: -88.07 },
    subZones: genSZ("IL-JO", ["Jefferson St", "Cass St", "Larkin Ave", "Plainfield Rd"])
  },
  "IL-RF": {
    code: "IL-RF", name: "Rockford", areaKm2: 4.2,
    boundaries: [[-89.15, 42.31], [-89.04, 42.31], [-89.04, 42.24], [-89.15, 42.24], [-89.15, 42.31]],
    grid: { minLat: 42.24, maxLat: 42.31, minLng: -89.15, maxLng: -89.04 },
    subZones: genSZ("IL-RF", ["State St", "Main St", "Broadway", "Alpine Rd"])
  },
  "IL-NI": {
    code: "IL-NI", name: "Niles", areaKm2: 2.5,
    boundaries: [[-87.84, 42.04], [-87.77, 42.04], [-87.77, 42.00], [-87.84, 42.00], [-87.84, 42.04]],
    grid: { minLat: 42.00, maxLat: 42.04, minLng: -87.84, maxLng: -87.77 },
    subZones: genSZ("IL-NI", ["Milwaukee Ave", "Golf Rd", "Touhy Ave", "Oakton St"])
  },
  "IL-WH": {
    code: "IL-WH", name: "Wheeling", areaKm2: 3.2,
    boundaries: [[-87.97, 42.16], [-87.90, 42.16], [-87.90, 42.11], [-87.97, 42.11], [-87.97, 42.16]],
    grid: { minLat: 42.11, maxLat: 42.16, minLng: -87.97, maxLng: -87.90 },
    subZones: genSZ("IL-WH", ["Dundee Rd", "Milwaukee Ave", "Palatine Rd", "Lake Cook Rd"])
  },
  "IL-DP": {
    code: "IL-DP", name: "Des Plaines", areaKm2: 3.0,
    boundaries: [[-87.94, 42.06], [-87.87, 42.06], [-87.87, 42.01], [-87.94, 42.01], [-87.94, 42.06]],
    grid: { minLat: 42.01, maxLat: 42.06, minLng: -87.94, maxLng: -87.87 },
    subZones: genSZ("IL-DP", ["Miner St", "Lee St", "Oakton St", "River Rd"])
  },
  "IL-MY": {
    code: "IL-MY", name: "Maywood", areaKm2: 2.8,
    boundaries: [[-87.88, 41.90], [-87.81, 41.90], [-87.81, 41.86], [-87.88, 41.86], [-87.88, 41.90]],
    grid: { minLat: 41.86, maxLat: 41.90, minLng: -87.88, maxLng: -87.81 },
    subZones: genSZ("IL-MY", ["Madison St", "Washington Blvd", "5th Ave", "19th Ave"])
  },
  "IL-SH": {
    code: "IL-SH", name: "South Holland", areaKm2: 3.0,
    boundaries: [[-87.64, 41.62], [-87.57, 41.62], [-87.57, 41.58], [-87.64, 41.58], [-87.64, 41.62]],
    grid: { minLat: 41.58, maxLat: 41.62, minLng: -87.64, maxLng: -87.57 },
    subZones: genSZ("IL-SH", ["162nd St", "Sibley Blvd", "Vincennes Ave", "Torrence Ave"])
  },
  "IL-MP": {
    code: "IL-MP", name: "Mount Prospect", areaKm2: 3.0,
    boundaries: [[-87.97, 42.09], [-87.90, 42.09], [-87.90, 42.04], [-87.97, 42.04], [-87.97, 42.09]],
    grid: { minLat: 42.04, maxLat: 42.09, minLng: -87.97, maxLng: -87.90 },
    subZones: genSZ("IL-MP", ["Central Rd", "Northwest Hwy", "Busse Rd", "Algonquin Rd"])
  },
  "IL-HE": {
    code: "IL-HE", name: "Hoffman Estates", areaKm2: 4.0,
    boundaries: [[-88.15, 42.10], [-88.06, 42.10], [-88.06, 42.03], [-88.15, 42.03], [-88.15, 42.10]],
    grid: { minLat: 42.03, maxLat: 42.10, minLng: -88.15, maxLng: -88.06 },
    subZones: genSZ("IL-HE", ["Golf Rd", "Higgins Rd", "Barrington Rd", "Roselle Rd"])
  },
  "IL-IT": {
    code: "IL-IT", name: "Itasca", areaKm2: 2.5,
    boundaries: [[-88.07, 42.00], [-87.99, 42.00], [-87.99, 41.95], [-88.07, 41.95], [-88.07, 42.00]],
    grid: { minLat: 41.95, maxLat: 42.00, minLng: -88.07, maxLng: -87.99 },
    subZones: genSZ("IL-IT", ["Irving Park Rd", "Thorndale Ave", "Arlington Hts Rd", "Prospect Ave"])
  },

  // ==================== INDIANA (47-51) ====================
  "IN-IN": {
    code: "IN-IN", name: "Indianapolis", areaKm2: 6.0,
    boundaries: [[-86.25, 39.85], [-86.05, 39.85], [-86.05, 39.65], [-86.25, 39.65], [-86.25, 39.85]],
    grid: { minLat: 39.65, maxLat: 39.85, minLng: -86.25, maxLng: -86.05 },
    subZones: genSZ("IN-IN", ["Washington St", "Meridian St", "Capitol Ave", "Market St"])
  },
  "IN-FW": {
    code: "IN-FW", name: "Fort Wayne", areaKm2: 4.5,
    boundaries: [[-85.20, 41.12], [-85.10, 41.12], [-85.10, 41.03], [-85.20, 41.03], [-85.20, 41.12]],
    grid: { minLat: 41.03, maxLat: 41.12, minLng: -85.20, maxLng: -85.10 },
    subZones: genSZ("IN-FW", ["Main St", "Calhoun St", "Lafayette St", "Clinton St"])
  },
  "IN-SB": {
    code: "IN-SB", name: "South Bend", areaKm2: 3.5,
    boundaries: [[-86.30, 41.72], [-86.20, 41.72], [-86.20, 41.63], [-86.30, 41.63], [-86.30, 41.72]],
    grid: { minLat: 41.63, maxLat: 41.72, minLng: -86.30, maxLng: -86.20 },
    subZones: genSZ("IN-SB", ["Michigan St", "Main St", "Western Ave", "Sample St"])
  },
  "IN-HA": {
    code: "IN-HA", name: "Hammond", areaKm2: 3.0,
    boundaries: [[-87.54, 41.67], [-87.46, 41.67], [-87.46, 41.58], [-87.54, 41.58], [-87.54, 41.67]],
    grid: { minLat: 41.58, maxLat: 41.67, minLng: -87.54, maxLng: -87.46 },
    subZones: genSZ("IN-HA", ["Calumet Ave", "Indianapolis Blvd", "Hohman Ave", "State St"])
  },
  "IN-LAF": {
    code: "IN-LAF", name: "Lafayette", areaKm2: 4.5,
    boundaries: [[-86.94, 40.45], [-86.84, 40.45], [-86.84, 40.36], [-86.94, 40.36], [-86.94, 40.45]],
    grid: { minLat: 40.36, maxLat: 40.45, minLng: -86.94, maxLng: -86.84 },
    subZones: genSZ("IN-LAF", ["Main St", "Columbia St", "South St", "9th St"])
  },

  // ==================== WISCONSIN (52-54) ====================
  "WI-MKE": {
    code: "WI-MKE", name: "Milwaukee", areaKm2: 5.1,
    boundaries: [[-87.97, 43.08], [-87.86, 43.08], [-87.86, 42.99], [-87.97, 42.99], [-87.97, 43.08]],
    grid: { minLat: 42.99, maxLat: 43.08, minLng: -87.97, maxLng: -87.86 },
    subZones: genSZ("WI-MKE", ["Water St", "Wisconsin Ave", "Mitchell St", "Walker St"])
  },
  "WI-MS": {
    code: "WI-MS", name: "Madison", areaKm2: 4.5,
    boundaries: [[-89.45, 43.12], [-89.35, 43.12], [-89.35, 43.03], [-89.45, 43.03], [-89.45, 43.12]],
    grid: { minLat: 43.03, maxLat: 43.12, minLng: -89.45, maxLng: -89.35 },
    subZones: genSZ("WI-MS", ["State St", "East Wash", "Park St", "University Ave"])
  },
  "WI-GB": {
    code: "WI-GB", name: "Green Bay", areaKm2: 4.0,
    boundaries: [[-88.07, 44.55], [-87.98, 44.55], [-87.98, 44.47], [-88.07, 44.47], [-88.07, 44.55]],
    grid: { minLat: 44.47, maxLat: 44.55, minLng: -88.07, maxLng: -87.98 },
    subZones: genSZ("WI-GB", ["Main St", "Mason St", "Broadway", "Oneida St"])
  }
};