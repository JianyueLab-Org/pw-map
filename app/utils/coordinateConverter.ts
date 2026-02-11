/**
 * Convert GCJ-02 (China encrypted coordinates) to WGS-84 (international standard)
 * GCJ-02 is used by Chinese maps like Amap (Gaode), Tencent, etc.
 * WGS-84 is used by Google Maps, OpenStreetMap, and international systems
 */

// Constants for the conversion algorithm
const PI = Math.PI;
const AXIS = 6378245.0;
const EE = 0.00669342162296594323;

function transformLat(x: number, y: number): number {
  let ret =
    -100.0 +
    2.0 * x +
    3.0 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x));
  ret +=
    ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) /
    3.0;
  ret +=
    ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  ret +=
    ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) *
      2.0) /
    3.0;
  return ret;
}

function transformLon(x: number, y: number): number {
  let ret =
    300.0 +
    x +
    2.0 * y +
    0.1 * x * x +
    0.1 * x * y +
    0.1 * Math.sqrt(Math.abs(x));
  ret +=
    ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) /
    3.0;
  ret +=
    ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  ret +=
    ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) *
      2.0) /
    3.0;
  return ret;
}

/**
 * Check if coordinates are in China (rough bounding box)
 */
function isInChina(lat: number, lon: number): boolean {
  return lon >= 72.004 && lon <= 137.8347 && lat >= 0.8293 && lat <= 55.8271;
}

/**
 * Convert GCJ-02 to WGS-84
 * @param lat - Latitude in GCJ-02
 * @param lon - Longitude in GCJ-02
 * @returns [lat, lon] in WGS-84
 */
export function gcj02ToWgs84(lat: number, lon: number): [number, number] {
  if (!isInChina(lat, lon)) {
    return [lat, lon];
  }

  let dLat = transformLat(lon - 105.0, lat - 35.0);
  let dLon = transformLon(lon - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((AXIS * (1 - EE)) / (magic * sqrtMagic)) * PI);
  dLon = (dLon * 180.0) / ((AXIS / sqrtMagic) * Math.cos(radLat) * PI);
  const mgLat = lat + dLat;
  const mgLon = lon + dLon;

  return [lat * 2 - mgLat, lon * 2 - mgLon];
}

/**
 * Convert coordinates based on country code
 * @param lat - Latitude
 * @param lon - Longitude
 * @param country - Country code (e.g., "CN", "US", etc.)
 * @returns [lat, lon] converted if necessary
 */
export function convertCoordinatesByCountry(
  lat: number,
  lon: number,
  country?: string,
): [number, number] {
  if (country?.toUpperCase() === "CN") {
    return gcj02ToWgs84(lat, lon);
  }
  return [lat, lon];
}
