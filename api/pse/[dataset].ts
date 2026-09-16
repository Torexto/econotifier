import { Redis } from "@upstash/redis";

const PSE_API_URL = "https://api.raporty.pse.pl/api";
const CACHE_TTL_SECONDS = 60 * 5; // 5 minutes
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

const datasets = new Set([
  "rce-pln",
  "kse-load",
  "gen-jw",
  "his-gen-pal",
  "energy-prices",
]);

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis =
  redisUrl && redisToken
    ? new Redis({ enableTelemetry: false, token: redisToken, url: redisUrl })
    : null;

// Multi-tier in-memory fallback cache & in-flight request deduplication
const memoryCache = new Map<string, { data: unknown[]; fetchedAt: number }>();
const inFlightRequests = new Map<string, Promise<unknown[]>>();

function json(data: unknown, cacheStatus: "HIT" | "MISS" | "BYPASS") {
  return Response.json(data, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=60`,
      "X-Cache": cacheStatus,
    },
  });
}

function getTodayPolishDate(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Warsaw",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function validDate(value: string | null): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : getTodayPolishDate();
}

function validLimit(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, MAX_LIMIT)
    : DEFAULT_LIMIT;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const dataset = requestUrl.pathname.split("/").filter(Boolean).at(-1);

  if (!dataset || !datasets.has(dataset)) {
    return Response.json({ error: "Unknown PSE dataset" }, { status: 404 });
  }

  const date = validDate(requestUrl.searchParams.get("date"));
  const limit = validLimit(requestUrl.searchParams.get("limit"));
  const cacheKey = `pse:${dataset}:${date}:${limit}`;

  // 1. Check Redis cache
  if (redis) {
    try {
      const cached = await redis.get<unknown[]>(cacheKey);
      if (cached && Array.isArray(cached)) {
        memoryCache.set(cacheKey, { data: cached, fetchedAt: Date.now() });
        return json(cached, "HIT");
      }
    } catch (error) {
      console.error("Redis read failed:", error);
    }
  }

  // 2. Check in-memory fallback cache
  const local = memoryCache.get(cacheKey);
  if (local && Date.now() - local.fetchedAt < CACHE_TTL_SECONDS * 1000) {
    return json(local.data, "HIT");
  }

  // 3. Deduplicate in-flight requests for identical dataset+date+limit
  let fetchPromise = inFlightRequests.get(cacheKey);
  if (!fetchPromise) {
    fetchPromise = (async () => {
      try {
        const upstreamUrl = new URL(`${PSE_API_URL}/${dataset}`);
        upstreamUrl.searchParams.set("$filter", `business_date eq '${date}'`);
        upstreamUrl.searchParams.set("$orderby", "dtime_utc asc");
        upstreamUrl.searchParams.set("$first", limit.toString());

        const response = await fetch(upstreamUrl, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(12_000),
        });

        if (!response.ok) {
          throw new Error(
            `PSE upstream request failed with status ${response.status}`,
          );
        }

        const payload = (await response.json()) as { value?: unknown[] };
        const records = Array.isArray(payload.value) ? payload.value : [];

        // Save to memory cache
        memoryCache.set(cacheKey, { data: records, fetchedAt: Date.now() });

        // Save to Redis cache
        if (redis) {
          try {
            await redis.set(cacheKey, records, { ex: CACHE_TTL_SECONDS });
          } catch (error) {
            console.error("Redis write failed:", error);
          }
        }

        return records;
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();

    inFlightRequests.set(cacheKey, fetchPromise);
  }

  try {
    const records = await fetchPromise;
    return json(records, redis ? "MISS" : "BYPASS");
  } catch (error) {
    console.error("PSE upstream fetch failed:", error);

    // If fetch failed but we have stale cache, return it as fallback
    if (local?.data) {
      return json(local.data, "HIT");
    }

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "PSE upstream request failed",
      },
      { status: 502 },
    );
  }
}

// Node HTTP Server compatibility handler (Vercel Node / Vite dev server)
export default async function handler(request: any, response: any) {
  if (typeof Request !== "undefined" && request instanceof Request) {
    return GET(request);
  }

  try {
    const host = request.headers?.host ?? "localhost";
    const protocol = request.headers?.["x-forwarded-proto"] ?? "http";
    const url = new URL(request.url ?? "/api/pse", `${protocol}://${host}`);

    const webReq = new Request(url.toString(), {
      method: request.method ?? "GET",
      headers: request.headers,
    });

    const webRes = await GET(webReq);
    response.statusCode = webRes.status;

    webRes.headers.forEach((value, key) => {
      response.setHeader(key, value);
    });

    const body = await webRes.text();
    response.end(body);
  } catch (err) {
    console.error("PSE Node handler error:", err);
    response.statusCode = 502;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ error: "Błąd serwera PSE" }));
  }
}
