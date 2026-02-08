/**
 * @fileoverview Central configuration for geographic districts.
 * This file defines the static properties of each sales district, including:
 * - Real-world area in square kilometers.
 * - Geographic boundaries defined as a polygon of [longitude, latitude] coordinates.
 * - A collection of named sub-zones within the district.
 * 
 * This data is considered the "source of truth" for calculating prospect density,
 * assigning prospects to districts, and rendering geographic visualizations.
 */

// Interface for a sub-zone (a cell in the 4x3 grid)
export interface SubZone {
  name: string; // e.g., "Blue Island Ave"
}

// Interface for a main district
export interface District {
  code: string;
  name: string; // e.g., "Pilsen / Lower West Side"
  areaKm2: number;
  boundaries: [number, number][]; // Polygon for the entire district [lng, lat]
  subZones: Record<string, SubZone>; // e.g., { "CHI-PIL-01": { name: "Blue Island Ave" } }
}

export const districts: Record<string, District> = {
  // ==================== CHICAGO DISTRICTS ====================
  
  "CHI-PIL": {
    code: "CHI-PIL",
    name: "Pilsen / Lower West Side",
    areaKm2: 2.1,
    boundaries: [
      [-87.6750, 41.8620], // NW - Western Ave
      [-87.6550, 41.8620], // NE - Dan Ryan Expressway
      [-87.6550, 41.8500], // SE - Cermak Rd
      [-87.6750, 41.8500], // SW - 26th St area
      [-87.6750, 41.8620]  // Close polygon
    ],
    subZones: {
      "CHI-PIL-01": { name: "Blue Island Ave" },
      "CHI-PIL-02": { name: "Cermak Rd East" },
      "CHI-PIL-03": { name: "18th & Ashland" },
      "CHI-PIL-04": { name: "Damen Ave Corridor" },
      "CHI-PIL-05": { name: "Heart of Pilsen" },
      "CHI-PIL-06": { name: "18th St Commercial" },
      "CHI-PIL-07": { name: "Western Ave Edge" },
      "CHI-PIL-08": { name: "Cullerton St Arts" },
      "CHI-PIL-09": { name: "Benito Juarez Park" },
      "CHI-PIL-10": { name: "Canalport Riverfront" },
      "CHI-PIL-11": { name: "Industrial South" },
      "CHI-PIL-12": { name: "East Residential" },
    }
  },
  
  "CHI-LV": {
    code: "CHI-LV",
    name: "Little Village / La Villita",
    areaKm2: 3.4,
    boundaries: [
      [-87.7150, 41.8500], // NW - Kedzie Ave north
      [-87.6950, 41.8500], // NE - Western Ave
      [-87.6950, 41.8380], // SE - 31st St
      [-87.7150, 41.8380], // SW - Cicero Ave
      [-87.7150, 41.8500]  // Close polygon
    ],
    subZones: {
      "CHI-LV-01": { name: "26th St (East)" },
      "CHI-LV-02": { name: "26th St (Central)" },
      "CHI-LV-03": { name: "26th St (West)" },
      "CHI-LV-04": { name: "Kedzie Ave Corridor" },
      "CHI-LV-05": { name: "Marshall Square" },
      "CHI-LV-06": { name: "California Ave" },
      "CHI-LV-07": { name: "North Residential" },
      "CHI-LV-08": { name: "South Residential" },
      "CHI-LV-09": { name: "Washtenaw Ave" },
      "CHI-LV-10": { name: "Industrial Park" },
      "CHI-LV-11": { name: "Rockwell St" },
      "CHI-LV-12": { name: "Piotrowski Park" },
    }
  },
  
  "CHI-AP": {
    code: "CHI-AP",
    name: "Albany Park",
    areaKm2: 2.8,
    boundaries: [
      [-87.7250, 41.9750], // NW - Pulaski Rd
      [-87.7050, 41.9750], // NE - Ridge Blvd
      [-87.7050, 41.9650], // SE - Montrose Ave
      [-87.7250, 41.9650], // SW - Irving Park Rd
      [-87.7250, 41.9750]  // Close polygon
    ],
    subZones: {
      "CHI-AP-01": { name: "Lawrence & Kedzie" },
      "CHI-AP-02": { name: "Lawrence & Kimball" },
      "CHI-AP-03": { name: "Montrose Ave East" },
      "CHI-AP-04": { name: "Pulaski Rd North" },
      "CHI-AP-05": { name: "Kimball Brown Line" },
      "CHI-AP-06": { name: "North Park University" },
      "CHI-AP-07": { name: "River Park" },
      "CHI-AP-08": { name: "Kedzie Residential" },
      "CHI-AP-09": { name: "Wilson Ave" },
      "CHI-AP-10": { name: "Central Park Ave" },
      "CHI-AP-11": { name: "Elston Ave" },
      "CHI-AP-12": { name: "Foster Ave West" },
    }
  },
  
  "CHI-PP": {
    code: "CHI-PP",
    name: "Portage Park",
    areaKm2: 2.7,
    boundaries: [
      [-87.7550, 41.9600], // NW
      [-87.7350, 41.9600], // NE
      [-87.7350, 41.9450], // SE
      [-87.7550, 41.9450], // SW
      [-87.7550, 41.9600]  // Close
    ],
    subZones: {
      "CHI-PP-01": { name: "Irving Park Rd" },
      "CHI-PP-02": { name: "Belmont Ave" },
      "CHI-PP-03": { name: "Addison St" },
      "CHI-PP-04": { name: "Montrose Ave" },
      "CHI-PP-05": { name: "Central Ave" },
      "CHI-PP-06": { name: "Austin Ave" },
      "CHI-PP-07": { name: "Milwaukee Ave" },
      "CHI-PP-08": { name: "Long Ave" },
      "CHI-PP-09": { name: "Portage Park" },
      "CHI-PP-10": { name: "Six Corners" },
      "CHI-PP-11": { name: "East Portage" },
      "CHI-PP-12": { name: "West Portage" },
    }
  },
  
  "CHI-DU": {
    code: "CHI-DU",
    name: "Dunning",
    areaKm2: 3.5,
    boundaries: [
      [-87.8200, 41.9600], // NW
      [-87.7800, 41.9600], // NE
      [-87.7800, 41.9400], // SE
      [-87.8200, 41.9400], // SW
      [-87.8200, 41.9600]  // Close
    ],
    subZones: {
      "CHI-DU-01": { name: "Belmont Ave West" },
      "CHI-DU-02": { name: "Irving Park Rd West" },
      "CHI-DU-03": { name: "Addison St West" },
      "CHI-DU-04": { name: "Montrose Ave West" },
      "CHI-DU-05": { name: "Harlem Ave" },
      "CHI-DU-06": { name: "Cumberland Ave" },
      "CHI-DU-07": { name: "Oak Park Ave" },
      "CHI-DU-08": { name: "Sayre Ave" },
      "CHI-DU-09": { name: "North Dunning" },
      "CHI-DU-10": { name: "South Dunning" },
      "CHI-DU-11": { name: "East Dunning" },
      "CHI-DU-12": { name: "West Dunning" },
    }
  },
  
  "CHI-RN": {
    code: "CHI-RN",
    name: "River North",
    areaKm2: 2.0,
    boundaries: [
      [-87.6400, 41.9000], // NW
      [-87.6200, 41.9000], // NE
      [-87.6200, 41.8850], // SE
      [-87.6400, 41.8850], // SW
      [-87.6400, 41.9000]  // Close
    ],
    subZones: {
      "CHI-RN-01": { name: "Clark St North" },
      "CHI-RN-02": { name: "Clark St South" },
      "CHI-RN-03": { name: "LaSalle St" },
      "CHI-RN-04": { name: "Wells St" },
      "CHI-RN-05": { name: "Franklin St" },
      "CHI-RN-06": { name: "Orleans St" },
      "CHI-RN-07": { name: "Merchandise Mart" },
      "CHI-RN-08": { name: "Kingsbury St" },
      "CHI-RN-09": { name: "Grand Ave" },
      "CHI-RN-10": { name: "Illinois St" },
      "CHI-RN-11": { name: "Hubbard St" },
      "CHI-RN-12": { name: "Chicago Ave" },
    }
  },
  
  "CHI-LG": {
    code: "CHI-LG",
    name: "Logan Square",
    areaKm2: 3.2,
    boundaries: [
      [-87.7200, 41.9350], // NW
      [-87.7000, 41.9350], // NE
      [-87.7000, 41.9200], // SE
      [-87.7200, 41.9200], // SW
      [-87.7200, 41.9350]  // Close
    ],
    subZones: {
      "CHI-LG-01": { name: "Logan Blvd" },
      "CHI-LG-02": { name: "Milwaukee Ave" },
      "CHI-LG-03": { name: "California Ave" },
      "CHI-LG-04": { name: "Western Ave" },
      "CHI-LG-05": { name: "Fullerton Ave" },
      "CHI-LG-06": { name: "Palmer Square" },
      "CHI-LG-07": { name: "Kedzie Blvd" },
      "CHI-LG-08": { name: "Diversey Ave" },
      "CHI-LG-09": { name: "Belmont Ave" },
      "CHI-LG-10": { name: "North Sacramento" },
      "CHI-LG-11": { name: "South Sacramento" },
      "CHI-LG-12": { name: "Logan Square Park" },
    }
  },
  
  "CHI-HP": {
    code: "CHI-HP",
    name: "Humboldt Park",
    areaKm2: 3.8,
    boundaries: [
      [-87.7200, 41.9150], // NW
      [-87.7000, 41.9150], // NE
      [-87.7000, 41.8950], // SE
      [-87.7200, 41.8950], // SW
      [-87.7200, 41.9150]  // Close
    ],
    subZones: {
      "CHI-HP-01": { name: "North Ave East" },
      "CHI-HP-02": { name: "North Ave West" },
      "CHI-HP-03": { name: "Division St" },
      "CHI-HP-04": { name: "Chicago Ave" },
      "CHI-HP-05": { name: "Grand Ave" },
      "CHI-HP-06": { name: "Humboldt Blvd" },
      "CHI-HP-07": { name: "Pulaski Rd" },
      "CHI-HP-08": { name: "Kedzie Ave" },
      "CHI-HP-09": { name: "California Ave" },
      "CHI-HP-10": { name: "Western Ave" },
      "CHI-HP-11": { name: "Humboldt Park" },
      "CHI-HP-12": { name: "East Village" },
    }
  },
  
  "CHI-UP": {
    code: "CHI-UP",
    name: "Uptown",
    areaKm2: 2.4,
    boundaries: [
      [-87.6650, 41.9750], // NW
      [-87.6450, 41.9750], // NE
      [-87.6450, 41.9600], // SE
      [-87.6650, 41.9600], // SW
      [-87.6650, 41.9750]  // Close
    ],
    subZones: {
      "CHI-UP-01": { name: "Broadway North" },
      "CHI-UP-02": { name: "Broadway South" },
      "CHI-UP-03": { name: "Wilson Ave" },
      "CHI-UP-04": { name: "Lawrence Ave" },
      "CHI-UP-05": { name: "Argyle St" },
      "CHI-UP-06": { name: "Berwyn Ave" },
      "CHI-UP-07": { name: "Sheridan Rd" },
      "CHI-UP-08": { name: "Kenmore Ave" },
      "CHI-UP-09": { name: "Racine Ave" },
      "CHI-UP-10": { name: "Winthrop Ave" },
      "CHI-UP-11": { name: "Lakefront" },
      "CHI-UP-12": { name: "Graceland Cemetery" },
    }
  },
  
  "CHI-WR": {
    code: "CHI-WR",
    name: "West Ridge",
    areaKm2: 3.0,
    boundaries: [
      [-87.7100, 42.0150], // NW
      [-87.6900, 42.0150], // NE
      [-87.6900, 42.0000], // SE
      [-87.7100, 42.0000], // SW
      [-87.7100, 42.0150]  // Close
    ],
    subZones: {
      "CHI-WR-01": { name: "Devon Ave East" },
      "CHI-WR-02": { name: "Devon Ave West" },
      "CHI-WR-03": { name: "Western Ave" },
      "CHI-WR-04": { name: "California Ave" },
      "CHI-WR-05": { name: "Touhy Ave" },
      "CHI-WR-06": { name: "Peterson Ave" },
      "CHI-WR-07": { name: "Northwestern" },
      "CHI-WR-08": { name: "Ridge Blvd" },
      "CHI-WR-09": { name: "Kedzie Ave" },
      "CHI-WR-10": { name: "Pulaski Rd" },
      "CHI-WR-11": { name: "Lincoln Ave" },
      "CHI-WR-12": { name: "Warren Park" },
    }
  },
  
  "CHI-CL": {
    code: "CHI-CL",
    name: "Chicago Lawn",
    areaKm2: 2.8,
    boundaries: [
      [-87.7000, 41.7750], // NW
      [-87.6800, 41.7750], // NE
      [-87.6800, 41.7600], // SE
      [-87.7000, 41.7600], // SW
      [-87.7000, 41.7750]  // Close
    ],
    subZones: {
      "CHI-CL-01": { name: "63rd St East" },
      "CHI-CL-02": { name: "63rd St West" },
      "CHI-CL-03": { name: "Kedzie Ave" },
      "CHI-CL-04": { name: "Western Ave" },
      "CHI-CL-05": { name: "California Ave" },
      "CHI-CL-06": { name: "Pulaski Rd" },
      "CHI-CL-07": { name: "Marquette Rd" },
      "CHI-CL-08": { name: "71st St" },
      "CHI-CL-09": { name: "Gage Park" },
      "CHI-CL-10": { name: "West Lawn" },
      "CHI-CL-11": { name: "Chicago Lawn Center" },
      "CHI-CL-12": { name: "Ashburn" },
    }
  },
  
  "CHI-CR": {
    code: "CHI-CR",
    name: "Cragin",
    areaKm2: 2.2,
    boundaries: [
      [-87.7500, 41.9350], // NW
      [-87.7300, 41.9350], // NE
      [-87.7300, 41.9200], // SE
      [-87.7500, 41.9200], // SW
      [-87.7500, 41.9350]  // Close
    ],
    subZones: {
      "CHI-CR-01": { name: "Belmont Ave West" },
      "CHI-CR-02": { name: "Fullerton Ave" },
      "CHI-CR-03": { name: "Diversey Ave" },
      "CHI-CR-04": { name: "Armitage Ave" },
      "CHI-CR-05": { name: "Pulaski Rd" },
      "CHI-CR-06": { name: "Central Ave" },
      "CHI-CR-07": { name: "Laramie Ave" },
      "CHI-CR-08": { name: "Austin Ave" },
      "CHI-CR-09": { name: "North Cragin" },
      "CHI-CR-10": { name: "South Cragin" },
      "CHI-CR-11": { name: "East Cragin" },
      "CHI-CR-12": { name: "West Cragin" },
    }
  },
  
  "CHI-BP": {
    code: "CHI-BP",
    name: "Brighton Park",
    areaKm2: 2.5,
    boundaries: [
      [-87.7050, 41.8250], // NW
      [-87.6850, 41.8250], // NE
      [-87.6850, 41.8150], // SE
      [-87.7050, 41.8150], // SW
      [-87.7050, 41.8250]  // Close
    ],
    subZones: {
      "CHI-BP-01": { name: "Archer Ave East" },
      "CHI-BP-02": { name: "Archer Ave West" },
      "CHI-BP-03": { name: "Kedzie Ave" },
      "CHI-BP-04": { name: "Pulaski Rd" },
      "CHI-BP-05": { name: "35th St" },
      "CHI-BP-06": { name: "47th St" },
      "CHI-BP-07": { name: "California Ave" },
      "CHI-BP-08": { name: "Western Ave" },
      "CHI-BP-09": { name: "Komensky Ave" },
      "CHI-BP-10": { name: "Central Park" },
      "CHI-BP-11": { name: "South Brighton" },
      "CHI-BP-12": { name: "North Brighton" },
    }
  },
  
  "CHI-IP": {
    code: "CHI-IP",
    name: "Irving Park",
    areaKm2: 2.3,
    boundaries: [
      [-87.7400, 41.9600], // NW
      [-87.7200, 41.9600], // NE
      [-87.7200, 41.9450], // SE
      [-87.7400, 41.9450], // SW
      [-87.7400, 41.9600]  // Close
    ],
    subZones: {
      "CHI-IP-01": { name: "Irving Park Rd East" },
      "CHI-IP-02": { name: "Irving Park Rd West" },
      "CHI-IP-03": { name: "Addison St" },
      "CHI-IP-04": { name: "Montrose Ave" },
      "CHI-IP-05": { name: "Pulaski Rd" },
      "CHI-IP-06": { name: "Kedzie Ave" },
      "CHI-IP-07": { name: "Kimball Ave" },
      "CHI-IP-08": { name: "California Ave" },
      "CHI-IP-09": { name: "Independence Park" },
      "CHI-IP-10": { name: "Horner Park" },
      "CHI-IP-11": { name: "North Irving" },
      "CHI-IP-12": { name: "South Irving" },
    }
  },
  
  "CHI-WK": {
    code: "CHI-WK",
    name: "Wicker Park",
    areaKm2: 1.8,
    boundaries: [
      [-87.6850, 41.9150], // NW
      [-87.6650, 41.9150], // NE
      [-87.6650, 41.9000], // SE
      [-87.6850, 41.9000], // SW
      [-87.6850, 41.9150]  // Close
    ],
    subZones: {
      "CHI-WK-01": { name: "Milwaukee Ave North" },
      "CHI-WK-02": { name: "Milwaukee Ave South" },
      "CHI-WK-03": { name: "Division St" },
      "CHI-WK-04": { name: "North Ave" },
      "CHI-WK-05": { name: "Damen Ave" },
      "CHI-WK-06": { name: "Ashland Ave" },
      "CHI-WK-07": { name: "Western Ave" },
      "CHI-WK-08": { name: "Wicker Park" },
      "CHI-WK-09": { name: "East Village" },
      "CHI-WK-10": { name: "Ukrainian Village" },
      "CHI-WK-11": { name: "Noble Square" },
      "CHI-WK-12": { name: "River West" },
    }
  },
  
  "CHI-LP": {
    code: "CHI-LP",
    name: "Loop",
    areaKm2: 2.5,
    boundaries: [
      [-87.6400, 41.8850], // NW
      [-87.6200, 41.8850], // NE
      [-87.6200, 41.8700], // SE
      [-87.6400, 41.8700], // SW
      [-87.6400, 41.8850]  // Close
    ],
    subZones: {
      "CHI-LP-01": { name: "Michigan Ave North" },
      "CHI-LP-02": { name: "Michigan Ave South" },
      "CHI-LP-03": { name: "State St" },
      "CHI-LP-04": { name: "Wabash Ave" },
      "CHI-LP-05": { name: "Dearborn St" },
      "CHI-LP-06": { name: "Federal Plaza" },
      "CHI-LP-07": { name: "Millennium Park" },
      "CHI-LP-08": { name: "Grant Park" },
      "CHI-LP-09": { name: "South Loop" },
      "CHI-LP-10": { name: "Printer's Row" },
      "CHI-LP-11": { name: "West Loop Gate" },
      "CHI-LP-12": { name: "New Eastside" },
    }
  },
  
  "CHI-RP": {
    code: "CHI-RP",
    name: "Rogers Park",
    areaKm2: 2.6,
    boundaries: [
      [-87.6800, 42.0200], // NW
      [-87.6550, 42.0200], // NE
      [-87.6550, 42.0000], // SE
      [-87.6800, 42.0000], // SW
      [-87.6800, 42.0200]  // Close
    ],
    subZones: {
      "CHI-RP-01": { name: "Clark St North" },
      "CHI-RP-02": { name: "Clark St South" },
      "CHI-RP-03": { name: "Sheridan Rd" },
      "CHI-RP-04": { name: "Morse Ave" },
      "CHI-RP-05": { name: "Loyola University" },
      "CHI-RP-06": { name: "Jarvis Ave" },
      "CHI-RP-07": { name: "Greenleaf Ave" },
      "CHI-RP-08": { name: "Juneway Terrace" },
      "CHI-RP-09": { name: "Lakefront" },
      "CHI-RP-10": { name: "West Ridge" },
      "CHI-RP-11": { name: "East Rogers Park" },
      "CHI-RP-12": { name: "West Rogers Park" },
    }
  },
  
  "CHI-SC": {
    code: "CHI-SC",
    name: "South Chicago",
    areaKm2: 3.2,
    boundaries: [
      [-87.5600, 41.7600], // NW
      [-87.5400, 41.7600], // NE
      [-87.5400, 41.7400], // SE
      [-87.5600, 41.7400], // SW
      [-87.5600, 41.7600]  // Close
    ],
    subZones: {
      "CHI-SC-01": { name: "Commercial Ave" },
      "CHI-SC-02": { name: "Exchange Ave" },
      "CHI-SC-03": { name: "Yates Ave" },
      "CHI-SC-04": { name: "Baltimore Ave" },
      "CHI-SC-05": { name: "Saginaw Ave" },
      "CHI-SC-06": { name: "83rd St" },
      "CHI-SC-07": { name: "87th St" },
      "CHI-SC-08": { name: "91st St" },
      "CHI-SC-09": { name: "95th St" },
      "CHI-SC-10": { name: "Lakefront" },
      "CHI-SC-11": { name: "East Side" },
      "CHI-SC-12": { name: "West Pullman" },
    }
  },
  
  "CHI-AU": {
    code: "CHI-AU",
    name: "Austin",
    areaKm2: 3.5,
    boundaries: [
      [-87.7800, 41.9000], // NW
      [-87.7400, 41.9000], // NE
      [-87.7400, 41.8700], // SE
      [-87.7800, 41.8700], // SW
      [-87.7800, 41.9000]  // Close
    ],
    subZones: {
      "CHI-AU-01": { name: "Madison St East" },
      "CHI-AU-02": { name: "Madison St West" },
      "CHI-AU-03": { name: "Chicago Ave" },
      "CHI-AU-04": { name: "Lake St" },
      "CHI-AU-05": { name: "Washington Blvd" },
      "CHI-AU-06": { name: "Jackson Blvd" },
      "CHI-AU-07": { name: "Cicero Ave" },
      "CHI-AU-08": { name: "Laramie Ave" },
      "CHI-AU-09": { name: "Central Ave" },
      "CHI-AU-10": { name: "Austin Blvd" },
      "CHI-AU-11": { name: "North Austin" },
      "CHI-AU-12": { name: "South Austin" },
    }
  },
  
  "CHI-HE": {
    code: "CHI-HE",
    name: "Hermosa",
    areaKm2: 2.0,
    boundaries: [
      [-87.7400, 41.9300], // NW
      [-87.7200, 41.9300], // NE
      [-87.7200, 41.9150], // SE
      [-87.7400, 41.9150], // SW
      [-87.7400, 41.9300]  // Close
    ],
    subZones: {
      "CHI-HE-01": { name: "Fullerton Ave West" },
      "CHI-HE-02": { name: "Belmont Ave" },
      "CHI-HE-03": { name: "Diversey Ave" },
      "CHI-HE-04": { name: "Palmer St" },
      "CHI-HE-05": { name: "Armitage Ave" },
      "CHI-HE-06": { name: "Bloomingdale Ave" },
      "CHI-HE-07": { name: "Kedzie Ave" },
      "CHI-HE-08": { name: "Kimball Ave" },
      "CHI-HE-09": { name: "Pulaski Rd" },
      "CHI-HE-10": { name: "Kostner Ave" },
      "CHI-HE-11": { name: "North Hermosa" },
      "CHI-HE-12": { name: "South Hermosa" },
    }
  },
  
  "CHI-AV": {
    code: "CHI-AV",
    name: "Avondale",
    areaKm2: 2.2,
    boundaries: [
      [-87.7200, 41.9500], // NW
      [-87.7000, 41.9500], // NE
      [-87.7000, 41.9350], // SE
      [-87.7200, 41.9350], // SW
      [-87.7200, 41.9500]  // Close
    ],
    subZones: {
      "CHI-AV-01": { name: "Diversey Ave West" },
      "CHI-AV-02": { name: "Belmont Ave" },
      "CHI-AV-03": { name: "Addison St" },
      "CHI-AV-04": { name: "Irving Park Rd" },
      "CHI-AV-05": { name: "Pulaski Rd" },
      "CHI-AV-06": { name: "Kedzie Ave" },
      "CHI-AV-07": { name: "California Ave" },
      "CHI-AV-08": { name: "Western Ave" },
      "CHI-AV-09": { name: "Milwaukee Ave" },
      "CHI-AV-10": { name: "Elston Ave" },
      "CHI-AV-11": { name: "Cicero Ave" },
      "CHI-AV-12": { name: "Central Park" },
    }
  },
  
  "CHI-NC": {
    code: "CHI-NC",
    name: "North Center",
    areaKm2: 1.9,
    boundaries: [
      [-87.6900, 41.9600], // NW
      [-87.6700, 41.9600], // NE
      [-87.6700, 41.9450], // SE
      [-87.6900, 41.9450], // SW
      [-87.6900, 41.9600]  // Close
    ],
    subZones: {
      "CHI-NC-01": { name: "Lincoln Ave North" },
      "CHI-NC-02": { name: "Lincoln Ave South" },
      "CHI-NC-03": { name: "Irving Park Rd" },
      "CHI-NC-04": { name: "Addison St" },
      "CHI-NC-05": { name: "Damen Ave" },
      "CHI-NC-06": { name: "Western Ave" },
      "CHI-NC-07": { name: "Ravenswood Ave" },
      "CHI-NC-08": { name: "Leavitt St" },
      "CHI-NC-09": { name: "Hamlin Ave" },
      "CHI-NC-10": { name: "Wolcott Ave" },
      "CHI-NC-11": { name: "North Center" },
      "CHI-NC-12": { name: "St. Benedict" },
    }
  },
  
  "CHI-JP": {
    code: "CHI-JP",
    name: "Jefferson Park",
    areaKm2: 2.3,
    boundaries: [
      [-87.7700, 41.9850], // NW
      [-87.7500, 41.9850], // NE
      [-87.7500, 41.9700], // SE
      [-87.7700, 41.9700], // SW
      [-87.7700, 41.9850]  // Close
    ],
    subZones: {
      "CHI-JP-01": { name: "Milwaukee Ave North" },
      "CHI-JP-02": { name: "Milwaukee Ave South" },
      "CHI-JP-03": { name: "Lawrence Ave" },
      "CHI-JP-04": { name: "Montrose Ave" },
      "CHI-JP-05": { name: "Foster Ave" },
      "CHI-JP-06": { name: "Elston Ave" },
      "CHI-JP-07": { name: "Cicero Ave" },
      "CHI-JP-08": { name: "Central Ave" },
      "CHI-JP-09": { name: "Long Ave" },
      "CHI-JP-10": { name: "Higgins Ave" },
      "CHI-JP-11": { name: "Talcott Ave" },
      "CHI-JP-12": { name: "Jefferson Park Transit" },
    }
  },
  
  "CHI-LVW": {
    code: "CHI-LVW",
    name: "Lakeview",
    areaKm2: 2.5,
    boundaries: [
      [-87.6600, 41.9500], // NW
      [-87.6400, 41.9500], // NE
      [-87.6400, 41.9350], // SE
      [-87.6600, 41.9350], // SW
      [-87.6600, 41.9500]  // Close
    ],
    subZones: {
      "CHI-LVW-01": { name: "Belmont Ave East" },
      "CHI-LVW-02": { name: "Belmont Ave West" },
      "CHI-LVW-03": { name: "Addison St" },
      "CHI-LVW-04": { name: "Wrigley Field" },
      "CHI-LVW-05": { name: "Halsted St" },
      "CHI-LVW-06": { name: "Broadway" },
      "CHI-LVW-07": { name: "Clark St" },
      "CHI-LVW-08": { name: "Sheffield Ave" },
      "CHI-LVW-09": { name: "Racine Ave" },
      "CHI-LVW-10": { name: "Southport Ave" },
      "CHI-LVW-11": { name: "Ashland Ave" },
      "CHI-LVW-12": { name: "Lincoln Ave" },
    }
  },
  
  "CHI-OT": {
    code: "CHI-OT",
    name: "Old Town",
    areaKm2: 1.5,
    boundaries: [
      [-87.6450, 41.9150], // NW
      [-87.6300, 41.9150], // NE
      [-87.6300, 41.9000], // SE
      [-87.6450, 41.9000], // SW
      [-87.6450, 41.9150]  // Close
    ],
    subZones: {
      "CHI-OT-01": { name: "Wells St North" },
      "CHI-OT-02": { name: "Wells St South" },
      "CHI-OT-03": { name: "North Ave" },
      "CHI-OT-04": { name: "Division St" },
      "CHI-OT-05": { name: "Old Town Triangle" },
      "CHI-OT-06": { name: "Wells Street" },
      "CHI-OT-07": { name: "Sedgwick St" },
      "CHI-OT-08": { name: "LaSalle St" },
      "CHI-OT-09": { name: "Orleans St" },
      "CHI-OT-10": { name: "Larrabee St" },
      "CHI-OT-11": { name: "Clybourn Ave" },
      "CHI-OT-12": { name: "Lincoln Park West" },
    }
  },
  
  "CHI-RV": {
    code: "CHI-RV",
    name: "Ravenswood",
    areaKm2: 2.1,
    boundaries: [
      [-87.6800, 41.9750], // NW
      [-87.6600, 41.9750], // NE
      [-87.6600, 41.9600], // SE
      [-87.6800, 41.9600], // SW
      [-87.6800, 41.9750]  // Close
    ],
    subZones: {
      "CHI-RV-01": { name: "Montrose Ave West" },
      "CHI-RV-02": { name: "Irving Park Rd" },
      "CHI-RV-03": { name: "Addison St" },
      "CHI-RV-04": { name: "Damen Ave" },
      "CHI-RV-05": { name: "Western Ave" },
      "CHI-RV-06": { name: "Lincoln Ave" },
      "CHI-RV-07": { name: "Ravenswood Ave" },
      "CHI-RV-08": { name: "Wolcott Ave" },
      "CHI-RV-09": { name: "Hermitage Ave" },
      "CHI-RV-10": { name: "Paulina St" },
      "CHI-RV-11": { name: "Ashland Ave" },
      "CHI-RV-12": { name: "Malt Row" },
    }
  },
  
  "CHI-CI": {
    code: "CHI-CI",
    name: "Cicero",
    areaKm2: 2.8,
    boundaries: [
      [-87.7500, 41.8500], // NW
      [-87.7300, 41.8500], // NE
      [-87.7300, 41.8300], // SE
      [-87.7500, 41.8300], // SW
      [-87.7500, 41.8500]  // Close
    ],
    subZones: {
      "CHI-CI-01": { name: "Cermak Rd East" },
      "CHI-CI-02": { name: "Cermak Rd West" },
      "CHI-CI-03": { name: "22nd St" },
      "CHI-CI-04": { name: "26th St" },
      "CHI-CI-05": { name: "Cicero Ave" },
      "CHI-CI-06": { name: "Laramie Ave" },
      "CHI-CI-07": { name: "Central Ave" },
      "CHI-CI-08": { name: "Austin Ave" },
      "CHI-CI-09": { name: "Ridgeland Ave" },
      "CHI-CI-10": { name: "Oak Park Ave" },
      "CHI-CI-11": { name: "Harlem Ave" },
      "CHI-CI-12": { name: "Berwyn Border" },
    }
  },
  
  "CHI-WC": {
    code: "CHI-WC",
    name: "West Chicago",
    areaKm2: 4.0,
    boundaries: [
      [-88.2200, 41.9000], // NW
      [-88.1800, 41.9000], // NE
      [-88.1800, 41.8700], // SE
      [-88.2200, 41.8700], // SW
      [-88.2200, 41.9000]  // Close
    ],
    subZones: {
      "CHI-WC-01": { name: "Main St East" },
      "CHI-WC-02": { name: "Main St West" },
      "CHI-WC-03": { name: "Washington St" },
      "CHI-WC-04": { name: "Geneva Rd" },
      "CHI-WC-05": { name: "North Ave" },
      "CHI-WC-06": { name: "Roosevelt Rd" },
      "CHI-WC-07": { name: "Industrial East" },
      "CHI-WC-08": { name: "Industrial West" },
      "CHI-WC-09": { name: "Residential North" },
      "CHI-WC-10": { name: "Residential South" },
      "CHI-WC-11": { name: "Downtown" },
      "CHI-WC-12": { name: "Outskirts" },
    }
  },
  
  "CHI-SL": {
    code: "CHI-SL",
    name: "South Lawndale",
    areaKm2: 2.9,
    boundaries: [
      [-87.7200, 41.8100], // NW
      [-87.7000, 41.8100], // NE
      [-87.7000, 41.7900], // SE
      [-87.7200, 41.7900], // SW
      [-87.7200, 41.8100]  // Close
    ],
    subZones: {
      "CHI-SL-01": { name: "26th St East" },
      "CHI-SL-02": { name: "26th St West" },
      "CHI-SL-03": { name: "Kedzie Ave" },
      "CHI-SL-04": { name: "California Ave" },
      "CHI-SL-05": { name: "Western Ave" },
      "CHI-SL-06": { name: "Pulaski Rd" },
      "CHI-SL-07": { name: "Kostner Ave" },
      "CHI-SL-08": { name: "Cicero Ave" },
      "CHI-SL-09": { name: "Douglas Park" },
      "CHI-SL-10": { name: "North Lawndale Border" },
      "CHI-SL-11": { name: "South Lawndale" },
      "CHI-SL-12": { name: "Central Lawndale" },
    }
  },
  
  "CHI-WL": {
    code: "CHI-WL",
    name: "West Loop",
    areaKm2: 2.2,
    boundaries: [
      [-87.6600, 41.8900], // NW
      [-87.6400, 41.8900], // NE
      [-87.6400, 41.8700], // SE
      [-87.6600, 41.8700], // SW
      [-87.6600, 41.8900]  // Close
    ],
    subZones: {
      "CHI-WL-01": { name: "Randolph St" },
      "CHI-WL-02": { name: "Lake St" },
      "CHI-WL-03": { name: "Fulton Market" },
      "CHI-WL-04": { name: "Jackson Blvd" },
      "CHI-WL-05": { name: "Van Buren St" },
      "CHI-WL-06": { name: "Madison St" },
      "CHI-WL-07": { name: "Monroe St" },
      "CHI-WL-08": { name: "Adams St" },
      "CHI-WL-09": { name: "Washington St" },
      "CHI-WL-10": { name: "Canal St" },
      "CHI-WL-11": { name: "Halsted St" },
      "CHI-WL-12": { name: "Ashland Ave" },
    }
  },
  
  "CHI-FM": {
    code: "CHI-FM",
    name: "Fulton Market",
    areaKm2: 1.5,
    boundaries: [
      [-87.6600, 41.8950], // NW
      [-87.6400, 41.8950], // NE
      [-87.6400, 41.8850], // SE
      [-87.6600, 41.8850], // SW
      [-87.6600, 41.8950]  // Close
    ],
    subZones: {
      "CHI-FM-01": { name: "Fulton St North" },
      "CHI-FM-02": { name: "Fulton St South" },
      "CHI-FM-03": { name: "Lake St" },
      "CHI-FM-04": { name: "Randolph St" },
      "CHI-FM-05": { name: "Washington St" },
      "CHI-FM-06": { name: "Madison St" },
      "CHI-FM-07": { name: "Monroe St" },
      "CHI-FM-08": { name: "Halsted St" },
      "CHI-FM-09": { name: "Desplaines St" },
      "CHI-FM-10": { name: "Green St" },
      "CHI-FM-11": { name: "Peoria St" },
      "CHI-FM-12": { name: "Morgan St" },
    }
  },
  
  "CHI-MP": {
    code: "CHI-MP",
    name: "Marquette Park",
    areaKm2: 2.3,
    boundaries: [
      [-87.6850, 41.7850], // NW
      [-87.6650, 41.7850], // NE
      [-87.6650, 41.7750], // SE
      [-87.6850, 41.7750], // SW
      [-87.6850, 41.7850]  // Close
    ],
    subZones: {
      "CHI-MP-01": { name: "Damen Ave" },
      "CHI-MP-02": { name: "Western Ave" },
      "CHI-MP-03": { name: "California Ave" },
      "CHI-MP-04": { name: "Kedzie Ave" },
      "CHI-MP-05": { name: "63rd St" },
      "CHI-MP-06": { name: "71st St" },
      "CHI-MP-07": { name: "Marquette Rd" },
      "CHI-MP-08": { name: "Central Park" },
      "CHI-MP-09": { name: "East Marquette" },
      "CHI-MP-10": { name: "West Marquette" },
      "CHI-MP-11": { name: "South Marquette" },
      "CHI-MP-12": { name: "North Marquette" },
    }
  },
  
  "CHI-BC": {
    code: "CHI-BC",
    name: "Belmont Cragin",
    areaKm2: 2.5,
    boundaries: [
      [-87.7700, 41.9400], // NW
      [-87.7500, 41.9400], // NE
      [-87.7500, 41.9200], // SE
      [-87.7700, 41.9200], // SW
      [-87.7700, 41.9400]  // Close
    ],
    subZones: {
      "CHI-BC-01": { name: "Belmont Ave West" },
      "CHI-BC-02": { name: "Fullerton Ave" },
      "CHI-BC-03": { name: "Diversey Ave" },
      "CHI-BC-04": { name: "Armitage Ave" },
      "CHI-BC-05": { name: "Grand Ave" },
      "CHI-BC-06": { name: "Cicero Ave" },
      "CHI-BC-07": { name: "Laramie Ave" },
      "CHI-BC-08": { name: "Central Ave" },
      "CHI-BC-09": { name: "Austin Ave" },
      "CHI-BC-10": { name: "Long Ave" },
      "CHI-BC-11": { name: "North Cragin" },
      "CHI-BC-12": { name: "South Cragin" },
    }
  },

  // ==================== WISCONSIN DISTRICTS ====================
  
  "WI-MKE": {
    code: "WI-MKE",
    name: "Milwaukee, Wisconsin",
    areaKm2: 5.1,
    boundaries: [
      [-87.9500, 43.0600], // NW
      [-87.8800, 43.0600], // NE
      [-87.8800, 43.0100], // SE
      [-87.9500, 43.0100], // SW
      [-87.9500, 43.0600]  // Close
    ],
    subZones: {
      "WI-MKE-01": { name: "Walker's Point" },
      "WI-MKE-02": { name: "Historic Third Ward" },
      "WI-MKE-03": { name: "Mitchell Street" },
      "WI-MKE-04": { name: "Clarke Square" },
      "WI-MKE-05": { name: "Lincoln Village" },
      "WI-MKE-06": { name: "Bay View South" },
      "WI-MKE-07": { name: "Downtown East" },
      "WI-MKE-08": { name: "Menomonee Valley" },
      "WI-MKE-09": { name: "Brady Street" },
      "WI-MKE-10": { name: "Riverwest" },
      "WI-MKE-11": { name: "East Side" },
      "WI-MKE-12": { name: "West Allis Border" },
    }
  },
  
  "WI-MS": {
    code: "WI-MS",
    name: "Madison, Wisconsin",
    areaKm2: 4.5,
    boundaries: [
      [-89.4200, 43.0900], // NW
      [-89.3800, 43.0900], // NE
      [-89.3800, 43.0500], // SE
      [-89.4200, 43.0500], // SW
      [-89.4200, 43.0900]  // Close
    ],
    subZones: {
      "WI-MS-01": { name: "State St" },
      "WI-MS-02": { name: "Capitol Square" },
      "WI-MS-03": { name: "UW Campus" },
      "WI-MS-04": { name: "Regent St" },
      "WI-MS-05": { name: "Wilmington St" },
      "WI-MS-06": { name: "Park St" },
      "WI-MS-07": { name: "Fish Hatchery Rd" },
      "WI-MS-08": { name: "South Park St" },
      "WI-MS-09": { name: "East Washington" },
      "WI-MS-10": { name: "Northport" },
      "WI-MS-11": { name: "West Madison" },
      "WI-MS-12": { name: "South Madison" },
    }
  },
  
  "WI-GB": {
    code: "WI-GB",
    name: "Green Bay, Wisconsin",
    areaKm2: 4.0,
    boundaries: [
      [-88.0500, 44.5300], // NW
      [-88.0000, 44.5300], // NE
      [-88.0000, 44.4900], // SE
      [-88.0500, 44.4900], // SW
      [-88.0500, 44.5300]  // Close
    ],
    subZones: {
      "WI-GB-01": { name: "Downtown Green Bay" },
      "WI-GB-02": { name: "Broadway District" },
      "WI-GB-03": { name: "Lambeau Field Area" },
      "WI-GB-04": { name: "West Side" },
      "WI-GB-05": { name: "East Side" },
      "WI-GB-06": { name: "South Side" },
      "WI-GB-07": { name: "North Side" },
      "WI-GB-08": { name: "Mason St" },
      "WI-GB-09": { name: "Main St" },
      "WI-GB-10": { name: "Military Ave" },
      "WI-GB-11": { name: "Velp Ave" },
      "WI-GB-12": { name: "University Ave" },
    }
  },

  // ==================== INDIANA DISTRICTS ====================
  
  "IN-IN": {
    code: "IN-IN",
    name: "Indianapolis, Indiana",
    areaKm2: 6.0,
    boundaries: [
      [-86.2000, 39.8000], // NW
      [-86.1000, 39.8000], // NE
      [-86.1000, 39.7000], // SE
      [-86.2000, 39.7000], // SW
      [-86.2000, 39.8000]  // Close
    ],
    subZones: {
      "IN-IN-01": { name: "Downtown Indy" },
      "IN-IN-02": { name: "Fountain Square" },
      "IN-IN-03": { name: "Broad Ripple" },
      "IN-IN-04": { name: "Mass Ave" },
      "IN-IN-05": { name: "South Side" },
      "IN-IN-06": { name: "West Side" },
      "IN-IN-07": { name: "East Side" },
      "IN-IN-08": { name: "North Side" },
      "IN-IN-09": { name: "Speedway" },
      "IN-IN-10": { name: "Beech Grove" },
      "IN-IN-11": { name: "Lawrence" },
      "IN-IN-12": { name: "Castleton" },
    }
  },
  
  "IN-FW": {
    code: "IN-FW",
    name: "Fort Wayne, Indiana",
    areaKm2: 4.5,
    boundaries: [
      [-85.1800, 41.1000], // NW
      [-85.1200, 41.1000], // NE
      [-85.1200, 41.0500], // SE
      [-85.1800, 41.0500], // SW
      [-85.1800, 41.1000]  // Close
    ],
    subZones: {
      "IN-FW-01": { name: "Downtown Fort Wayne" },
      "IN-FW-02": { name: "The Landing" },
      "IN-FW-03": { name: "West Central" },
      "IN-FW-04": { name: "South Side" },
      "IN-FW-05": { name: "North Side" },
      "IN-FW-06": { name: "East Side" },
      "IN-FW-07": { name: "Broadway" },
      "IN-FW-08": { name: "Calhoun St" },
      "IN-FW-09": { name: "Jefferson Blvd" },
      "IN-FW-10": { name: "Washington Blvd" },
      "IN-FW-11": { name: "Coliseum Blvd" },
      "IN-FW-12": { name: "Lima Rd" },
    }
  },
  
  "IN-SB": {
    code: "IN-SB",
    name: "South Bend, Indiana",
    areaKm2: 3.5,
    boundaries: [
      [-86.2800, 41.7000], // NW
      [-86.2200, 41.7000], // NE
      [-86.2200, 41.6500], // SE
      [-86.2800, 41.6500], // SW
      [-86.2800, 41.7000]  // Close
    ],
    subZones: {
      "IN-SB-01": { name: "Downtown South Bend" },
      "IN-SB-02": { name: "Notre Dame Area" },
      "IN-SB-03": { name: "East Side" },
      "IN-SB-04": { name: "West Side" },
      "IN-SB-05": { name: "South Side" },
      "IN-SB-06": { name: "North Side" },
      "IN-SB-07": { name: "Michigan St" },
      "IN-SB-08": { name: "Main St" },
      "IN-SB-09": { name: "Western Ave" },
      "IN-SB-10": { name: "Sample St" },
      "IN-SB-11": { name: "Edison Rd" },
      "IN-SB-12": { name: "Grape Rd" },
    }
  },
  
  "IN-HA": {
    code: "IN-HA",
    name: "Hammond, Indiana",
    areaKm2: 3.0,
    boundaries: [
      [-87.5200, 41.6500], // NW
      [-87.4800, 41.6500], // NE
      [-87.4800, 41.6000], // SE
      [-87.5200, 41.6000], // SW
      [-87.5200, 41.6500]  // Close
    ],
    subZones: {
      "IN-HA-01": { name: "Downtown Hammond" },
      "IN-HA-02": { name: "Hessville" },
      "IN-HA-03": { name: "Woodmar" },
      "IN-HA-04": { name: "South Hammond" },
      "IN-HA-05": { name: "North Hammond" },
      "IN-HA-06": { name: "East Side" },
      "IN-HA-07": { name: "Calumet Ave" },
      "IN-HA-08": { name: "Kennedy Ave" },
      "IN-HA-09": { name: "Indianapolis Blvd" },
      "IN-HA-10": { name: "Columbia Ave" },
      "IN-HA-11": { name: "State St" },
      "IN-HA-12": { name: "Hohman Ave" },
    }
  },
  
  "IN-LAF": {
    code: "IN-LAF",
    name: "Lafayette, Indiana",
    areaKm2: 4.5,
    boundaries: [
      [-86.9200, 40.4300], // NW
      [-86.8600, 40.4300], // NE
      [-86.8600, 40.3800], // SE
      [-86.9200, 40.3800], // SW
      [-86.9200, 40.4300]  // Close
    ],
    subZones: {
      "IN-LAF-01": { name: "Downtown Lafayette" },
      "IN-LAF-02": { name: "Purdue University" },
      "IN-LAF-03": { name: "Sagamore Pkwy" },
      "IN-LAF-04": { name: "SR 26 Corridor" },
      "IN-LAF-05": { name: "Creasy Ln" },
      "IN-LAF-06": { name: "South St" },
      "IN-LAF-07": { name: "N 9th St" },
      "IN-LAF-08": { name: "Veterans Memorial" },
      "IN-LAF-09": { name: "North Industrial" },
      "IN-LAF-10": { name: "East Residential" },
      "IN-LAF-11": { name: "South Residential" },
      "IN-LAF-12": { name: "West Residential" },
    }
  },

  // ==================== ILLINOIS SUBURBS ====================
  
  "IL-AU": {
    code: "IL-AU",
    name: "Aurora, Illinois",
    areaKm2: 4.0,
    boundaries: [
      [-88.3200, 41.7600], // NW
      [-88.2800, 41.7600], // NE
      [-88.2800, 41.7200], // SE
      [-88.3200, 41.7200], // SW
      [-88.3200, 41.7600]  // Close
    ],
    subZones: {
      "IL-AU-01": { name: "Downtown Aurora" },
      "IL-AU-02": { name: "Fox Valley Mall" },
      "IL-AU-03": { name: "East Side" },
      "IL-AU-04": { name: "West Side" },
      "IL-AU-05": { name: "North Aurora" },
      "IL-AU-06": { name: "South Aurora" },
      "IL-AU-07": { name: "Galena Blvd" },
      "IL-AU-08": { name: "New York St" },
      "IL-AU-09": { name: "Indian Trail" },
      "IL-AU-10": { name: "Montgomery Rd" },
      "IL-AU-11": { name: "Ogden Ave" },
      "IL-AU-12": { name: "Lake St" },
    }
  },
  
  "IL-JO": {
    code: "IL-JO",
    name: "Joliet, Illinois",
    areaKm2: 3.8,
    boundaries: [
      [-88.1200, 41.5400], // NW
      [-88.0800, 41.5400], // NE
      [-88.0800, 41.5000], // SE
      [-88.1200, 41.5000], // SW
      [-88.1200, 41.5400]  // Close
    ],
    subZones: {
      "IL-JO-01": { name: "Downtown Joliet" },
      "IL-JO-02": { name: "Louis Joliet Mall" },
      "IL-JO-03": { name: "East Side" },
      "IL-JO-04": { name: "West Side" },
      "IL-JO-05": { name: "North Joliet" },
      "IL-JO-06": { name: "South Joliet" },
      "IL-JO-07": { name: "Jefferson St" },
      "IL-JO-08": { name: "Plainfield Rd" },
      "IL-JO-09": { name: "Cass St" },
      "IL-JO-10": { name: "Ruby St" },
      "IL-JO-11": { name: "Cannonball Trail" },
      "IL-JO-12": { name: "Rockdale" },
    }
  },
  
  "IL-RF": {
    code: "IL-RF",
    name: "Rockford, Illinois",
    areaKm2: 4.2,
    boundaries: [
      [-89.1200, 42.2900], // NW
      [-89.0500, 42.2900], // NE
      [-89.0500, 42.2500], // SE
      [-89.1200, 42.2500], // SW
      [-89.1200, 42.2900]  // Close
    ],
    subZones: {
      "IL-RF-01": { name: "Downtown Rockford" },
      "IL-RF-02": { name: "CherryVale Mall" },
      "IL-RF-03": { name: "East State St" },
      "IL-RF-04": { name: "West State St" },
      "IL-RF-05": { name: "North Main St" },
      "IL-RF-06": { name: "South Main St" },
      "IL-RF-07": { name: "Broadway" },
      "IL-RF-08": { name: "Auburn St" },
      "IL-RF-09": { name: "Harrison Ave" },
      "IL-RF-10": { name: "Riverside Blvd" },
      "IL-RF-11": { name: "Spring Creek" },
      "IL-RF-12": { name: "Loves Park Border" },
    }
  },
  
  "IL-NI": {
    code: "IL-NI",
    name: "Niles, Illinois",
    areaKm2: 2.5,
    boundaries: [
      [-87.8200, 42.0300], // NW
      [-87.7800, 42.0300], // NE
      [-87.7800, 42.0000], // SE
      [-87.8200, 42.0000], // SW
      [-87.8200, 42.0300]  // Close
    ],
    subZones: {
      "IL-NI-01": { name: "Downtown Niles" },
      "IL-NI-02": { name: "Golf Mill Mall" },
      "IL-NI-03": { name: "Milwaukee Ave" },
      "IL-NI-04": { name: "Dempster St" },
      "IL-NI-05": { name: "Oakton St" },
      "IL-NI-06": { name: "Touhy Ave" },
      "IL-NI-07": { name: "Golf Rd" },
      "IL-NI-08": { name: "Main St" },
      "IL-NI-09": { name: "Caldwell Ave" },
      "IL-NI-10": { name: "Waukegan Rd" },
      "IL-NI-11": { name: "Harlem Ave" },
      "IL-NI-12": { name: "Glenview" },
        }
  },

  // ==================== ILLINOIS SUBURBS (CONTINUED) ====================
  
  "IL-WH": {
    code: "IL-WH",
    name: "Wheeling, Illinois",
    areaKm2: 3.2,
    boundaries: [
      [-87.9500, 42.1500], // NW
      [-87.9100, 42.1500], // NE
      [-87.9100, 42.1200], // SE
      [-87.9500, 42.1200], // SW
      [-87.9500, 42.1500]  // Close
    ],
    subZones: {
      "IL-WH-01": { name: "Downtown Wheeling" },
      "IL-WH-02": { name: "Milwaukee Ave North" },
      "IL-WH-03": { name: "Milwaukee Ave South" },
      "IL-WH-04": { name: "Dundee Rd" },
      "IL-WH-05": { name: "Palatine Rd" },
      "IL-WH-06": { name: "Lake Cook Rd" },
      "IL-WH-07": { name: "Wheeling High School" },
      "IL-WH-08": { name: "Industrial East" },
      "IL-WH-09": { name: "Residential West" },
      "IL-WH-10": { name: "Chevy Chase" },
      "IL-WH-11": { name: "Heritage Park" },
      "IL-WH-12": { name: "Wheeling Park District" },
    }
  },
  
  "IL-DP": {
    code: "IL-DP",
    name: "Des Plaines, Illinois",
    areaKm2: 3.0,
    boundaries: [
      [-87.9200, 42.0500], // NW
      [-87.8800, 42.0500], // NE
      [-87.8800, 42.0200], // SE
      [-87.9200, 42.0200], // SW
      [-87.9200, 42.0500]  // Close
    ],
    subZones: {
      "IL-DP-01": { name: "Downtown Des Plaines" },
      "IL-DP-02": { name: "Des Plaines Theater" },
      "IL-DP-03": { name: "Metra Station Area" },
      "IL-DP-04": { name: "Elmhurst Rd" },
      "IL-DP-05": { name: "Mannheim Rd" },
      "IL-DP-06": { name: "River Rd" },
      "IL-DP-07": { name: "Oakton St" },
      "IL-DP-08": { name: "Algonquin Rd" },
      "IL-DP-09": { name: "Lee St" },
      "IL-DP-10": { name: "Graceland Ave" },
      "IL-DP-11": { name: "West Des Plaines" },
      "IL-DP-12": { name: "South Des Plaines" },
    }
  },
  
  "IL-MY": {
    code: "IL-MY",
    name: "Maywood, Illinois",
    areaKm2: 2.8,
    boundaries: [
      [-87.8600, 41.8900], // NW
      [-87.8200, 41.8900], // NE
      [-87.8200, 41.8700], // SE
      [-87.8600, 41.8700], // SW
      [-87.8600, 41.8900]  // Close
    ],
    subZones: {
      "IL-MY-01": { name: "Downtown Maywood" },
      "IL-MY-02": { name: "Maywood Park" },
      "IL-MY-03": { name: "St. Charles Rd" },
      "IL-MY-04": { name: "Madison St" },
      "IL-MY-05": { name: "Washington Blvd" },
      "IL-MY-06": { name: "5th Ave" },
      "IL-MY-07": { name: "9th Ave" },
      "IL-MY-08": { name: "17th Ave" },
      "IL-MY-09": { name: "25th Ave" },
      "IL-MY-10": { name: "North Maywood" },
      "IL-MY-11": { name: "South Maywood" },
      "IL-MY-12": { name: "Proviso East" },
    }
  },
  
  "IL-SH": {
    code: "IL-SH",
    name: "South Holland, Illinois",
    areaKm2: 3.0,
    boundaries: [
      [-87.6200, 41.6100], // NW
      [-87.5800, 41.6100], // NE
      [-87.5800, 41.5900], // SE
      [-87.6200, 41.5900], // SW
      [-87.6200, 41.6100]  // Close
    ],
    subZones: {
      "IL-SH-01": { name: "Downtown South Holland" },
      "IL-SH-02": { name: "South Holland Commons" },
      "IL-SH-03": { name: "Ashland Ave" },
      "IL-SH-04": { name: "State St" },
      "IL-SH-05": { name: "Torrence Ave" },
      "IL-SH-06": { name: "Ellis Ave" },
      "IL-SH-07": { name: "Sibley Blvd" },
      "IL-SH-08": { name: "162nd St" },
      "IL-SH-09": { name: "South Park" },
      "IL-SH-10": { name: "Thornton Fractional" },
      "IL-SH-11": { name: "East South Holland" },
      "IL-SH-12": { name: "West South Holland" },
    }
  },
  
  "IL-MP": {
    code: "IL-MP",
    name: "Mount Prospect, Illinois",
    areaKm2: 3.0,
    boundaries: [
      [-87.9500, 42.0800], // NW
      [-87.9100, 42.0800], // NE
      [-87.9100, 42.0500], // SE
      [-87.9500, 42.0500], // SW
      [-87.9500, 42.0800]  // Close
    ],
    subZones: {
      "IL-MP-01": { name: "Downtown Mount Prospect" },
      "IL-MP-02": { name: "Randhurst Village" },
      "IL-MP-03": { name: "Busse Ave" },
      "IL-MP-04": { name: "Main St" },
      "IL-MP-05": { name: "Central Rd" },
      "IL-MP-06": { name: "Algonquin Rd" },
      "IL-MP-07": { name: "Elmhurst Rd" },
      "IL-MP-08": { name: "Prospect High School" },
      "IL-MP-09": { name: "North Mount Prospect" },
      "IL-MP-10": { name: "South Mount Prospect" },
      "IL-MP-11": { name: "East Mount Prospect" },
      "IL-MP-12": { name: "West Mount Prospect" },
    }
  },
  
  "IL-HE": {
    code: "IL-HE",
    name: "Hoffman Estates, Illinois",
    areaKm2: 4.0,
    boundaries: [
      [-88.1300, 42.0800], // NW
      [-88.0700, 42.0800], // NE
      [-88.0700, 42.0400], // SE
      [-88.1300, 42.0400], // SW
      [-88.1300, 42.0800]  // Close
    ],
    subZones: {
      "IL-HE-01": { name: "Downtown Hoffman Estates" },
      "IL-HE-02": { name: "Woodfield Mall Area" },
      "IL-HE-03": { name: "Higgins Rd" },
      "IL-HE-04": { name: "Schaumburg Rd" },
      "IL-HE-05": { name: "Barrington Rd" },
      "IL-HE-06": { name: "Roselle Rd" },
      "IL-HE-07": { name: "Golf Rd" },
      "IL-HE-08": { name: "Bode Rd" },
      "IL-HE-09": { name: "Hoffman Estates High School" },
      "IL-HE-10": { name: "North Hoffman" },
      "IL-HE-11": { name: "South Hoffman" },
      "IL-HE-12": { name: "West Hoffman" },
    }
  },
  
  "IL-IT": {
    code: "IL-IT",
    name: "Itasca, Illinois",
    areaKm2: 2.5,
    boundaries: [
      [-88.0500, 41.9900], // NW
      [-88.0000, 41.9900], // NE
      [-88.0000, 41.9600], // SE
      [-88.0500, 41.9600], // SW
      [-88.0500, 41.9900]  // Close
    ],
    subZones: {
      "IL-IT-01": { name: "Downtown Itasca" },
      "IL-IT-02": { name: "Itasca Station" },
      "IL-IT-03": { name: "Walnut St" },
      "IL-IT-04": { name: "Irving Park Rd" },
      "IL-IT-05": { name: "Rohlwing Rd" },
      "IL-IT-06": { name: "Addison Rd" },
      "IL-IT-07": { name: "Nordic Park" },
      "IL-IT-08": { name: "Industrial North" },
      "IL-IT-09": { name: "Residential South" },
      "IL-IT-10": { name: "West Itasca" },
      "IL-IT-11": { name: "East Itasca" },
      "IL-IT-12": { name: "Hamilton Lakes" },
    }
  },

  // ==================== CHICAGO DISTRICTS (ADDITIONAL) ====================
  
  "CHI-BRI": {
    code: "CHI-BRI",
    name: "Bridgeport",
    areaKm2: 2.2,
    boundaries: [
      [-87.6500, 41.8500], // NW
      [-87.6300, 41.8500], // NE
      [-87.6300, 41.8300], // SE
      [-87.6500, 41.8300], // SW
      [-87.6500, 41.8500]  // Close
    ],
    subZones: {
      "CHI-BRI-01": { name: "Halsted St North" },
      "CHI-BRI-02": { name: "Halsted St South" },
      "CHI-BRI-03": { name: "35th St" },
      "CHI-BRI-04": { name: "31st St" },
      "CHI-BRI-05": { name: "Archer Ave" },
      "CHI-BRI-06": { name: "Ashland Ave" },
      "CHI-BRI-07": { name: "Shields Ave" },
      "CHI-BRI-08": { name: "Wallace St" },
      "CHI-BRI-09": { name: "US Cellular Field" },
      "CHI-BRI-10": { name: "Chinatown Edge" },
      "CHI-BRI-11": { name: "West Bridgeport" },
      "CHI-BRI-12": { name: "East Bridgeport" },
    }
  },
  
  "CHI-WHP": {
    code: "CHI-WHP",
    name: "West Humboldt Park",
    areaKm2: 2.5,
    boundaries: [
      [-87.7400, 41.9000], // NW
      [-87.7200, 41.9000], // NE
      [-87.7200, 41.8800], // SE
      [-87.7400, 41.8800], // SW
      [-87.7400, 41.9000]  // Close
    ],
    subZones: {
      "CHI-WHP-01": { name: "Chicago Ave West" },
      "CHI-WHP-02": { name: "Division St West" },
      "CHI-WHP-03": { name: "Madison St" },
      "CHI-WHP-04": { name: "Washington Blvd" },
      "CHI-WHP-05": { name: "Pulaski Rd" },
      "CHI-WHP-06": { name: "Kostner Ave" },
      "CHI-WHP-07": { name: "Central Park Ave" },
      "CHI-WHP-08": { name: "Avers Ave" },
      "CHI-WHP-09": { name: "Karlov Ave" },
      "CHI-WHP-10": { name: "North West Humboldt" },
      "CHI-WHP-11": { name: "South West Humboldt" },
      "CHI-WHP-12": { name: "Humboldt Park West" },
    }
  },
};
 
  