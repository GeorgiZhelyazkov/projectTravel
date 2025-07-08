const fs = require('fs');
const path = require('path');
const directions = require('../assets/data/directions.json');
const routes = require('../assets/data/routes.json');
const stops = require('../assets/data/stops.json');

interface Stop {
  code: number;
  names: { bg: string };
  coords: [number, number];
}
interface Route { route_ref: string; type: string; }
interface Direction { code: number; stops: number[]; }

// Calculate distance between two coordinates (in meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Normalize stop name for comparison
function normalizeStopName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^а-яa-z0-9]/g, '')
    .replace(/\s+/g, '')
    .replace(/ii+/g, '2')
    .replace(/метростанция/g, '')
    .replace(/спирка/g, '')
    .trim();
}

// Check if two stop names are similar
function areStopsSimilar(name1: string, name2: string): boolean {
  const norm1 = normalizeStopName(name1);
  const norm2 = normalizeStopName(name2);
  
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  const words1 = new Set(norm1.split(/\s+/).filter((w: string) => w.length >= 4));
  const words2 = norm2.split(/\s+/).filter((w: string) => w.length >= 4);
  return words2.some((word: string) => words1.has(word));
}

// Average speeds in km/h for different transport types
const TRANSPORT_SPEEDS = { metro: 40, tram: 25, trolley: 25, bus: 30, walking: 4.5 } as const;
type TransportType = keyof typeof TRANSPORT_SPEEDS;

// Get transport type for a line
function getTransportType(line: number): TransportType {
  const route = (routes as Route[]).find((r: Route) => r.route_ref === line.toString());
  return (route?.type || 'bus') as TransportType;
}

// Calculate time between two stops
function calculateTime(stop1: number, stop2: number, transportType: TransportType): number {
  const s1 = (stops as Stop[]).find((s: Stop) => s.code === stop1);
  const s2 = (stops as Stop[]).find((s: Stop) => s.code === stop2);
  if (!s1?.coords || !s2?.coords) return Infinity;
  
  const distance = calculateDistance(s1.coords[0], s1.coords[1], s2.coords[0], s2.coords[1]) / 1000; // Convert to km
  const speed = TRANSPORT_SPEEDS[transportType];
  let time = (distance / speed) * 60; // Convert to minutes
  
  if (transportType === 'walking') {
    time += 2; // Add 2 minutes buffer for walking
  }
  
  return time;
}

// Generate enhanced adjacency list
function generateEnhancedAdjacency() {
  const enhancedAdjacency: Record<number, Array<{
    neighbor: number;
    line: number;
    distance: number;
    time: number;
    transportType: TransportType;
  }>> = {};

  (directions as Direction[]).forEach((dir: Direction) => {
    dir.stops.forEach((code: number, i: number) => {
      if (!enhancedAdjacency[code]) enhancedAdjacency[code] = [];
      const next = dir.stops[i + 1];
      if (next != null) {
        const transportType = getTransportType(dir.code);
        const s1 = (stops as Stop[]).find((s: Stop) => s.code === code)!;
        const s2 = (stops as Stop[]).find((s: Stop) => s.code === next)!;
        const distance = calculateDistance(s1.coords[0], s1.coords[1], s2.coords[0], s2.coords[1]);
        const time = calculateTime(code, next, transportType);

        enhancedAdjacency[code].push({
          neighbor: next,
          line: dir.code,
          distance,
          time,
          transportType
        });

        // Add reverse direction
        if (!enhancedAdjacency[next]) enhancedAdjacency[next] = [];
        enhancedAdjacency[next].push({
          neighbor: code,
          line: dir.code,
          distance,
          time,
          transportType
        });
      }
    });
  });

  return enhancedAdjacency;
}

// Generate nearby stops data
function generateNearbyStops() {
  const nearbyStops: Record<number, Array<{
    stop: number;
    distance: number;
    isSimilar: boolean;
  }>> = {};

  (stops as Stop[]).forEach((stop: Stop) => {
    const nearby = (stops as Stop[])
      .filter((s: Stop) => s.code !== stop.code)
      .map((s: Stop) => ({
        stop: s.code,
        distance: calculateDistance(
          stop.coords[0],
          stop.coords[1],
          s.coords[0],
          s.coords[1]
        ),
        isSimilar: areStopsSimilar(stop.names.bg, s.names.bg)
      }))
      .filter((n: { stop: number; distance: number; isSimilar: boolean }) => n.distance <= 400)
      .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance)
      .slice(0, 5);

    nearbyStops[stop.code] = nearby;
  });

  return nearbyStops;
}

// Generate and save precomputed data
function generatePrecomputedData() {
  console.log('Generating precomputed data...');
  
  const enhancedAdjacency = generateEnhancedAdjacency();
  const nearbyStops = generateNearbyStops();

  const precomputedData = {
    enhancedAdjacency,
    nearbyStops,
    generatedAt: new Date().toISOString()
  };

  const outputDir = path.join(__dirname, '../assets/data/precomputed');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, 'precomputed.json'),
    JSON.stringify(precomputedData, null, 2)
  );

  console.log('Precomputed data generated successfully!');
}

generatePrecomputedData(); 