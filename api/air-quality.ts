import { Redis } from "@upstash/redis";

export type ServerStation = {
  id: number;
  stationCode: string;
  stationName: string;
  latitude: number;
  longitude: number;
  province: string | null;
  city: string | null;
  address: string | null;
  distanceKm?: number;
};

export type PollutantIndex = {
  value: number | null;
  label: string | null;
  calcDate: string | null;
  sourceDate: string | null;
};

export type AirQualityData = {
  overall: PollutantIndex;
  status: boolean;
  criticalPollutant: string | null;
  components: {
    pm10: PollutantIndex;
    pm25: PollutantIndex;
    no2: PollutantIndex;
    o3: PollutantIndex;
    so2: PollutantIndex;
  };
};

export type SensorReading = {
  id: number;
  code: string;
  name: string;
  value: number | null;
  date: string | null;
  unit: string;
};

export type AirQualityPayload = {
  station: ServerStation;
  aqi: AirQualityData | null;
  sensors: SensorReading[];
  nearbyStations: ServerStation[];
  source: "gios-api";
  cachedAt: number;
  cacheStatus: "HIT" | "MISS" | "BYPASS";
  isDefaultLocation?: boolean;
};

const GIOS_BASE = "https://api.gios.gov.pl/pjp-api/v1/rest";
const STATIONS_CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const AQ_CACHE_TTL_SECONDS = 15 * 60; // 15 minutes

// Upstash / Vercel KV Redis initialization
const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis =
  redisUrl && redisToken
    ? new Redis({ enableTelemetry: false, token: redisToken, url: redisUrl })
    : null;

// Process-local fallback cache
let memoryStationsCache: { stations: ServerStation[]; fetchedAt: number } | null =
  null;
let inFlightStations: Promise<ServerStation[]> | null = null;
const memoryAqCache = new Map<
  number,
  { aqi: AirQualityData | null; sensors: SensorReading[]; fetchedAt: number }
>();

function parseCoordinate(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const normalized = value.trim().replace(",", ".").replace(/[°º]/g, "").trim();
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function validCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function normalizeStation(raw: unknown): ServerStation | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  // If station is marked as closed, ignore it
  if (item["Data zamknięcia"] != null && item["Data zamknięcia"] !== "") {
    return null;
  }

  const id = Number(item["Identyfikator stacji"] ?? item.Nr);
  const latitude = parseCoordinate(item["WGS84 φ N"]);
  const longitude = parseCoordinate(item["WGS84 λ E"]);

  if (!Number.isFinite(id) || latitude === null || longitude === null)
    return null;
  if (!validCoordinates(latitude, longitude)) return null;

  return {
    id,
    stationCode: String(item["Kod stacji"] ?? ""),
    stationName: String(item["Nazwa stacji"] ?? `Stacja ${id}`),
    latitude,
    longitude,
    province: String(item["Województwo"] ?? "") || null,
    city: String(item["Nazwa miasta"] ?? item["Miejscowość"] ?? "") || null,
    address: String(item.Ulica ?? item.Adres ?? "") || null,
  };
}

export async function loadStations(): Promise<{
  stations: ServerStation[];
  cacheStatus: "HIT" | "MISS" | "BYPASS";
}> {
  const cacheKey = "gios:stations:v1";

  // Check Redis first
  if (redis) {
    try {
      const cached = await redis.get<ServerStation[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        memoryStationsCache = { stations: cached, fetchedAt: Date.now() };
        return { stations: cached, cacheStatus: "HIT" };
      }
    } catch (err) {
      console.error("Redis stations read error:", err);
    }
  }

  // Check in-memory cache
  if (
    memoryStationsCache &&
    Date.now() - memoryStationsCache.fetchedAt < STATIONS_CACHE_TTL_SECONDS * 1000
  ) {
    return {
      stations: memoryStationsCache.stations,
      cacheStatus: "HIT",
    };
  }

  if (inFlightStations) {
    const stations = await inFlightStations;
    return { stations, cacheStatus: redis ? "MISS" : "BYPASS" };
  }

  inFlightStations = (async () => {
    try {
      // Try active stations findAll first (288 active stations)
      let rawList: unknown[] = [];
      try {
        const response = await fetch(`${GIOS_BASE}/station/findAll?size=500`, {
          headers: { Accept: "application/ld+json, application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(15_000),
        });
        if (response.ok) {
          const payload = (await response.json()) as Record<string, unknown>;
          const list = payload["Lista stacji pomiarowych"];
          if (Array.isArray(list)) rawList = list;
        }
      } catch (err) {
        console.warn("GIOŚ findAll failed, falling back to metadata:", err);
      }

      // Fallback to metadata/stations if findAll yielded nothing
      if (rawList.length === 0) {
        const response = await fetch(
          `${GIOS_BASE}/metadata/stations?page=0&size=500&sort=Kod`,
          {
            headers: { Accept: "application/ld+json, application/json" },
            cache: "no-store",
            signal: AbortSignal.timeout(15_000),
          },
        );
        if (response.ok) {
          const payload = (await response.json()) as Record<string, unknown>;
          const list =
            payload["Lista metadanych stacji pomiarowych"] ??
            payload["Lista stacji pomiarowych"];
          if (Array.isArray(list)) rawList = list;
        }
      }

      const stations = rawList
        .map(normalizeStation)
        .filter((s): s is ServerStation => s !== null);

      if (stations.length === 0) {
        throw new Error("Nie udało się pobrać stacji pomiarowych z GIOŚ.");
      }

      const uniqueStations = Array.from(
        new Map(stations.map((s) => [s.id, s])).values(),
      );

      memoryStationsCache = {
        stations: uniqueStations,
        fetchedAt: Date.now(),
      };

      if (redis) {
        try {
          await redis.set(cacheKey, uniqueStations, {
            ex: STATIONS_CACHE_TTL_SECONDS,
          });
        } catch (err) {
          console.error("Redis stations write error:", err);
        }
      }

      return uniqueStations;
    } finally {
      inFlightStations = null;
    }
  })();

  const stations = await inFlightStations;
  return { stations, cacheStatus: redis ? "MISS" : "BYPASS" };
}

async function fetchStationAirQuality(
  stationId: number,
): Promise<{
  aqi: AirQualityData | null;
  sensors: SensorReading[];
  cacheStatus: "HIT" | "MISS" | "BYPASS";
}> {
  const cacheKey = `gios:station:${stationId}:aq`;

  // 1. Try Redis cache
  if (redis) {
    try {
      const cached = await redis.get<{
        aqi: AirQualityData | null;
        sensors: SensorReading[];
      }>(cacheKey);
      if (cached) {
        memoryAqCache.set(stationId, {
          aqi: cached.aqi,
          sensors: cached.sensors,
          fetchedAt: Date.now(),
        });
        return {
          aqi: cached.aqi,
          sensors: cached.sensors,
          cacheStatus: "HIT",
        };
      }
    } catch (err) {
      console.error("Redis station AQ read error:", err);
    }
  }

  // 2. Try Memory cache
  const memoryEntry = memoryAqCache.get(stationId);
  if (
    memoryEntry &&
    Date.now() - memoryEntry.fetchedAt < AQ_CACHE_TTL_SECONDS * 1000
  ) {
    return {
      aqi: memoryEntry.aqi,
      sensors: memoryEntry.sensors,
      cacheStatus: "HIT",
    };
  }

  // 3. Fetch from GIOŚ API
  let aqi: AirQualityData | null = null;
  const sensors: SensorReading[] = [];

  try {
    const aqiRes = await fetch(`${GIOS_BASE}/aqindex/getIndex/${stationId}`, {
      headers: { Accept: "application/ld+json, application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (aqiRes.ok) {
      const aqiPayload = (await aqiRes.json()) as Record<string, unknown>;
      const rawAq = (aqiPayload.AqIndex ?? aqiPayload) as Record<
        string,
        unknown
      >;

      if (rawAq) {
        aqi = {
          overall: {
            value:
              typeof rawAq["Wartość indeksu"] === "number"
                ? rawAq["Wartość indeksu"]
                : null,
            label:
              typeof rawAq["Nazwa kategorii indeksu"] === "string"
                ? rawAq["Nazwa kategorii indeksu"]
                : null,
            calcDate: (rawAq["Data wykonania obliczeń indeksu"] as string) ?? null,
            sourceDate:
              (rawAq[
                "Data danych źródłowych, z których policzono wartość indeksu dla wskaźnika st"
              ] as string) ?? null,
          },
          status: Boolean(
            rawAq["Status indeksu ogólnego dla stacji pomiarowej"] ?? true,
          ),
          criticalPollutant:
            (rawAq["Kod zanieczyszczenia krytycznego"] as string) ?? null,
          components: {
            pm10: {
              value:
                typeof rawAq["Wartość indeksu dla wskaźnika PM10"] === "number"
                  ? rawAq["Wartość indeksu dla wskaźnika PM10"]
                  : null,
              label:
                (rawAq[
                  "Nazwa kategorii indeksu dla wskażnika PM10"
                ] as string) ?? null,
              calcDate:
                (rawAq[
                  "Data wykonania obliczeń indeksu dla wskaźnika PM10"
                ] as string) ?? null,
              sourceDate:
                (rawAq[
                  "Data danych źródłowych, z których policzono wartość indeksu dla wskaźnika PM10"
                ] as string) ?? null,
            },
            pm25: {
              value:
                typeof rawAq["Wartość indeksu dla wskaźnika PM2.5"] === "number"
                  ? rawAq["Wartość indeksu dla wskaźnika PM2.5"]
                  : null,
              label:
                (rawAq[
                  "Nazwa kategorii indeksu dla wskażnika PM2.5"
                ] as string) ?? null,
              calcDate:
                (rawAq[
                  "Data wykonania obliczeń indeksu dla wskaźnika PM2.5"
                ] as string) ?? null,
              sourceDate:
                (rawAq[
                  "Data danych źródłowych, z których policzono wartość indeksu dla wskaźnika PM2.5"
                ] as string) ?? null,
            },
            no2: {
              value:
                typeof rawAq["Wartość indeksu dla wskaźnika NO2"] === "number"
                  ? rawAq["Wartość indeksu dla wskaźnika NO2"]
                  : null,
              label:
                (rawAq[
                  "Nazwa kategorii indeksu dla wskażnika NO2"
                ] as string) ?? null,
              calcDate:
                (rawAq[
                  "Data wykonania obliczeń indeksu dla wskaźnika NO2"
                ] as string) ?? null,
              sourceDate:
                (rawAq[
                  "Data danych źródłowych, z których policzono wartość indeksu dla wskaźnika NO2"
                ] as string) ?? null,
            },
            o3: {
              value:
                typeof rawAq["Wartość indeksu dla wskaźnika O3"] === "number"
                  ? rawAq["Wartość indeksu dla wskaźnika O3"]
                  : null,
              label:
                (rawAq[
                  "Nazwa kategorii indeksu dla wskażnika O3"
                ] as string) ?? null,
              calcDate:
                (rawAq[
                  "Data wykonania obliczeń indeksu dla wskaźnika O3"
                ] as string) ?? null,
              sourceDate:
                (rawAq[
                  "Data danych źródłowych, z których policzono wartość indeksu dla wskaźnika O3"
                ] as string) ?? null,
            },
            so2: {
              value:
                typeof rawAq["Wartość indeksu dla wskaźnika SO2"] === "number"
                  ? rawAq["Wartość indeksu dla wskaźnika SO2"]
                  : null,
              label:
                (rawAq[
                  "Nazwa kategorii indeksu dla wskażnika SO2"
                ] as string) ?? null,
              calcDate:
                (rawAq[
                  "Data wykonania obliczeń indeksu dla wskaźnika SO2"
                ] as string) ?? null,
              sourceDate:
                (rawAq[
                  "Data danych źródłowych, z których policzono wartość indeksu dla wskaźnika SO2"
                ] as string) ?? null,
            },
          },
        };
      }
    }
  } catch (err) {
    console.error(`GIOŚ AQI fetch error for station ${stationId}:`, err);
  }

  // Fetch sensors list and latest readings
  try {
    const sensorsRes = await fetch(
      `${GIOS_BASE}/station/sensors/${stationId}`,
      {
        headers: { Accept: "application/ld+json, application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (sensorsRes.ok) {
      const sensorsPayload = (await sensorsRes.json()) as Record<
        string,
        unknown
      >;
      const rawSensors = (sensorsPayload[
        "Lista stanowisk pomiarowych dla podanej stacji"
      ] ?? []) as Array<Record<string, unknown>>;

      // Fetch readings for main sensors in parallel (limit to top 8)
      const sensorTasks = rawSensors.slice(0, 8).map(async (rawSensor) => {
        const sensorId = Number(rawSensor["Identyfikator stanowiska"]);
        const code = String(
          rawSensor["Wskaźnik - kod"] ?? rawSensor["Wskaźnik - wzór"] ?? "",
        );
        const name = String(rawSensor["Wskaźnik"] ?? code);

        if (!sensorId) return null;

        let latestValue: number | null = null;
        let latestDate: string | null = null;

        try {
          const dataRes = await fetch(
            `${GIOS_BASE}/data/getData/${sensorId}`,
            {
              headers: { Accept: "application/ld+json, application/json" },
              cache: "no-store",
              signal: AbortSignal.timeout(6_000),
            },
          );

          if (dataRes.ok) {
            const dataPayload = (await dataRes.json()) as Record<string, unknown>;
            const rawMeasurements = (dataPayload[
              "Lista danych pomiarowych"
            ] ?? []) as Array<Record<string, unknown>>;

            // Find first measurement with non-null value
            const firstValid = rawMeasurements.find(
              (m) => m["Wartość"] != null,
            );
            if (firstValid) {
              latestValue =
                typeof firstValid["Wartość"] === "number"
                  ? Math.round(firstValid["Wartość"] * 10) / 10
                  : null;
              latestDate = (firstValid["Data"] as string) ?? null;
            }
          }
        } catch {
          // ignore single sensor fetch failure
        }

        return {
          id: sensorId,
          code,
          name,
          value: latestValue,
          date: latestDate,
          unit: "µg/m³",
        } satisfies SensorReading;
      });

      const settled = await Promise.allSettled(sensorTasks);
      for (const res of settled) {
        if (res.status === "fulfilled" && res.value !== null) {
          sensors.push(res.value);
        }
      }
    }
  } catch (err) {
    console.error(`GIOŚ sensors fetch error for station ${stationId}:`, err);
  }

  // Save to memory cache
  memoryAqCache.set(stationId, {
    aqi,
    sensors,
    fetchedAt: Date.now(),
  });

  // Save to Redis
  if (redis) {
    try {
      await redis.set(
        cacheKey,
        { aqi, sensors },
        { ex: AQ_CACHE_TTL_SECONDS },
      );
    } catch (err) {
      console.error("Redis station AQ write error:", err);
    }
  }

  return {
    aqi,
    sensors,
    cacheStatus: redis ? "MISS" : "BYPASS",
  };
}

export async function handleAirQualityRequest(
  url: URL,
): Promise<{ status: number; body: unknown; cacheStatus: "HIT" | "MISS" | "BYPASS" }> {
  const { stations, cacheStatus: stationsCacheStatus } = await loadStations();

  // If client only requested the list of stations
  if (url.searchParams.get("stations") === "true") {
    return {
      status: 200,
      body: { stations, count: stations.length },
      cacheStatus: stationsCacheStatus,
    };
  }

  // Check if explicit stationId requested
  const stationIdParam = url.searchParams.get("stationId");
  if (stationIdParam) {
    const stationId = Number(stationIdParam);
    const station = stations.find((s) => s.id === stationId);
    if (!station) {
      return {
        status: 404,
        body: { error: "Stacja o podanym ID nie została znaleziona." },
        cacheStatus: "BYPASS",
      };
    }

    const { aqi, sensors, cacheStatus } = await fetchStationAirQuality(station.id);
    return {
      status: 200,
      body: {
        station,
        aqi,
        sensors,
        nearbyStations: [],
        source: "gios-api",
        cachedAt: Date.now(),
        cacheStatus,
      } satisfies AirQualityPayload,
      cacheStatus,
    };
  }

  // Geolocation parameters
  const latParam = url.searchParams.get("lat") ?? url.searchParams.get("latitude");
  const lonParam = url.searchParams.get("lon") ?? url.searchParams.get("longitude");

  let userLat: number;
  let userLon: number;
  let isDefaultLocation = false;

  if (latParam && lonParam) {
    const parsedLat = Number(latParam);
    const parsedLon = Number(lonParam);
    if (validCoordinates(parsedLat, parsedLon)) {
      userLat = parsedLat;
      userLon = parsedLon;
    } else {
      return {
        status: 400,
        body: { error: "Nieprawidłowe współrzędne geograficzne (lat/lon)." },
        cacheStatus: "BYPASS",
      };
    }
  } else {
    // Default fallback: Warszawa (52.2297, 21.0122)
    userLat = 52.2297;
    userLon = 21.0122;
    isDefaultLocation = true;
  }

  // Calculate distance to all stations and sort
  const stationsWithDistance = stations
    .map((s) => ({
      ...s,
      distanceKm: calculateDistanceKm(userLat, userLon, s.latitude, s.longitude),
    }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  if (stationsWithDistance.length === 0) {
    return {
      status: 404,
      body: { error: "Brak stacji pomiarowych do wyświetlenia." },
      cacheStatus: "BYPASS",
    };
  }

  // Find nearest station, preferring one with active index or readings within a 25km radius
  let selectedStation = stationsWithDistance[0];
  let selectedAq = await fetchStationAirQuality(selectedStation.id);

  const hasActiveData = (aq: typeof selectedAq) =>
    Boolean(aq.aqi?.overall?.label) || aq.sensors.some((s) => s.value != null);

  if (!hasActiveData(selectedAq)) {
    // Check up to 4 other close stations
    for (let i = 1; i < Math.min(stationsWithDistance.length, 5); i++) {
      const candidate = stationsWithDistance[i];
      if ((candidate.distanceKm ?? 0) > 30) break;
      const candidateAq = await fetchStationAirQuality(candidate.id);
      if (hasActiveData(candidateAq)) {
        selectedStation = candidate;
        selectedAq = candidateAq;
        break;
      }
    }
  }

  // Remaining nearby stations for user to view or switch to
  const nearbyStations = stationsWithDistance
    .filter((s) => s.id !== selectedStation.id)
    .slice(0, 4);

  const payload: AirQualityPayload = {
    station: selectedStation,
    aqi: selectedAq.aqi,
    sensors: selectedAq.sensors,
    nearbyStations,
    source: "gios-api",
    cachedAt: Date.now(),
    cacheStatus: selectedAq.cacheStatus,
    isDefaultLocation,
  };

  return {
    status: 200,
    body: payload,
    cacheStatus: selectedAq.cacheStatus,
  };
}

// Standard Web Request handler (Vercel Functions / Edge)
export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const { status, body, cacheStatus } = await handleAirQualityRequest(url);
    return Response.json(body, {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": `public, max-age=0, s-maxage=${AQ_CACHE_TTL_SECONDS}, stale-while-revalidate=60`,
        "X-Cache": cacheStatus,
      },
    });
  } catch (error) {
    console.error("Air quality handler failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wystąpił błąd podczas pobierania danych z GIOŚ.",
      },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

// Node HTTP Server handler compatibility (Vercel Node / Express / Vite dev)
export default async function handler(request: any, response: any) {
  // If called in standard Web fetch context
  if (typeof Request !== "undefined" && request instanceof Request) {
    return GET(request);
  }

  // Node IncomingMessage / ServerResponse
  try {
    const host = request.headers?.host ?? "localhost";
    const protocol = request.headers?.["x-forwarded-proto"] ?? "http";
    const url = new URL(request.url ?? "/api/air-quality", `${protocol}://${host}`);

    const { status, body, cacheStatus } = await handleAirQualityRequest(url);

    response.statusCode = status;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader(
      "Cache-Control",
      `public, max-age=0, s-maxage=${AQ_CACHE_TTL_SECONDS}, stale-while-revalidate=60`,
    );
    response.setHeader("X-Cache", cacheStatus);
    response.end(JSON.stringify(body));
  } catch (error) {
    console.error("Air quality Node handler failed:", error);
    response.statusCode = 502;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Wystąpił błąd podczas pobierania danych z GIOŚ.",
      }),
    );
  }
}
