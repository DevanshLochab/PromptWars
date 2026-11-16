import { HourlyAir } from '@/lib/schemas';
import demoSnapshot from '@/data/demo_snapshot.json';

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const inMemoryCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = inMemoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    inMemoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  inMemoryCache.set(key, { data, timestamp: Date.now() });
}

function checkDemoMode(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('saans_demo_mode_active');
    if (stored !== null) return stored === 'true';
  }
  return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Search places by name using Open-Meteo Geocoding API
 */
export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  const cacheKey = `geo_${query.trim().toLowerCase()}`;
  const cached = getCached<GeocodingResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=10&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const json = await res.json();
    const results: GeocodingResult[] = (json.results || []).map((r: { id: number; name: string; latitude: number; longitude: number; country?: string; admin1?: string; timezone?: string }) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country,
      admin1: r.admin1,
      timezone: r.timezone,
    }));

    setCache(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error in searchPlaces:', error);
    return [];
  }
}

/**
 * Fetch Air Quality forecast (hourly PM2.5, PM10, NO2, CO, Ozone, US AQI)
 */
export async function getAirQuality(
  lat: number,
  lon: number,
  forceLive = false
): Promise<HourlyAir[] | null> {
  const isDemo = !forceLive && checkDemoMode();

  if (isDemo) {
    // Return hardcoded 24-hr Delhi severe smog snapshot from demo_snapshot.json
    return demoSnapshot.hourly as HourlyAir[];
  }

  const cacheKey = `aq_${lat.toFixed(4)}_${lon.toFixed(4)}`;
  const cached = getCached<HourlyAir[]>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch Air Quality API and Weather API in parallel
    const [aqRes, weatherRes] = await Promise.all([
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10,nitrogen_dioxide,carbon_monoxide,ozone,us_aqi&timezone=auto&forecast_days=5`
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,boundary_layer_height&timezone=auto`
      ),
    ]);

    if (!aqRes.ok) {
      console.warn('Air quality API failed with status:', aqRes.status);
      return null;
    }

    const aqData = await aqRes.json();
    const weatherData = weatherRes.ok ? await weatherRes.json() : null;

    const times: string[] = aqData.hourly?.time || [];
    const pm25List: number[] = aqData.hourly?.pm2_5 || [];
    const pm10List: number[] = aqData.hourly?.pm10 || [];
    const no2List: number[] = aqData.hourly?.nitrogen_dioxide || [];
    const coList: number[] = aqData.hourly?.carbon_monoxide || [];
    const o3List: number[] = aqData.hourly?.ozone || [];
    const aqiList: number[] = aqData.hourly?.us_aqi || [];

    const tempList: number[] = weatherData?.hourly?.temperature_2m || [];
    const rhList: number[] = weatherData?.hourly?.relative_humidity_2m || [];
    const windList: number[] = weatherData?.hourly?.wind_speed_10m || [];

    const result: HourlyAir[] = times.map((t, idx) => ({
      time: t,
      pm25: pm25List[idx] ?? 0,
      pm10: pm10List[idx] ?? 0,
      no2: no2List[idx] ?? 0,
      co: coList[idx] ?? 0,
      o3: o3List[idx] ?? 0,
      usAqi: aqiList[idx] ?? 0,
      tempC: tempList[idx] ?? 20,
      rh: rhList[idx] ?? 50,
      windMs: windList[idx] ?? 1.5,
    }));

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching Open-Meteo air quality data:', error);
    return null;
  }
}

/**
 * Fetch Weather forecast
 */
export async function getWeather(lat: number, lon: number): Promise<Record<string, unknown> | null> {
  const cacheKey = `weather_${lat.toFixed(4)}_${lon.toFixed(4)}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,boundary_layer_height&timezone=auto`
    );
    if (!res.ok) return null;
    const json = await res.json();
    setCache(cacheKey, json);
    return json;
  } catch (error) {
    console.error('Error fetching Open-Meteo weather data:', error);
    return null;
  }
}
