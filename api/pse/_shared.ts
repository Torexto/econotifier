import type { IncomingMessage, ServerResponse } from "node:http";
import { Redis } from "@upstash/redis";

const PSE_API_URL = "https://api.raporty.pse.pl/api";
export const PSE_CACHE_TTL_SECONDS = 60 * 5; // 5 minutes
export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 500;

export const SUPPORTED_PSE_DATASETS = [
  "rce-pln",
  "kse-load",
  "gen-jw",
  "his-gen-pal",
  "energy-prices",
] as const;

export type PseDataset = (typeof SUPPORTED_PSE_DATASETS)[number];

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

function createJsonResponse(
  data: unknown,
  cacheStatus: "HIT" | "MISS" | "BYPASS",
  status = 200,
): Response {
  return Response.json(data, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=0, s-maxage=${PSE_CACHE_TTL_SECONDS}, stale-while-revalidate=60`,
      "X-Cache": cacheStatus,
    },
  });
}

export function getTodayPolishDate(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Warsaw",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function validDate(value: string | null): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : getTodayPolishDate();
}

export function validLimit(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, MAX_LIMIT)
    : DEFAULT_LIMIT;
}

export async function fetchPseDataset(
  dataset: PseDataset,
  date: string,
  limit: number,
): Promise<{ data: unknown[]; cacheStatus: "HIT" | "MISS" | "BYPASS" }> {
  const cacheKey = `pse:${dataset}:${date}:${limit}`;

  // 1. Check Redis cache
  if (redis) {
    try {
      const cached = await redis.get<unknown[]>(cacheKey);
      if (cached && Array.isArray(cached)) {
        memoryCache.set(cacheKey, { data: cached, fetchedAt: Date.now() });
        return { data: cached, cacheStatus: "HIT" };
      }
    } catch (error) {
      console.error(`Redis read failed for ${cacheKey}:`, error);
    }
  }

  // 2. Check in-memory fallback cache
  const local = memoryCache.get(cacheKey);
  if (local && Date.now() - local.fetchedAt < PSE_CACHE_TTL_SECONDS * 1000) {
    return { data: local.data, cacheStatus: "HIT" };
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

        const payload = (await response.json()) as
          | { value?: unknown[] }
          | unknown[];
        const records = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.value)
            ? payload.value
            : [];

        // Save to memory cache
        memoryCache.set(cacheKey, { data: records, fetchedAt: Date.now() });

        // Save to Redis cache
        if (redis) {
          try {
            await redis.set(cacheKey, records, { ex: PSE_CACHE_TTL_SECONDS });
          } catch (error) {
            console.error(`Redis write failed for ${cacheKey}:`, error);
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
    return { data: records, cacheStatus: redis ? "MISS" : "BYPASS" };
  } catch (error) {
    console.error(`PSE upstream fetch failed for ${dataset}:`, error);

    // If fetch failed but we have stale cache, return it as fallback
    if (local?.data) {
      return { data: local.data, cacheStatus: "HIT" };
    }

    throw error;
  }
}

export function createPseHandler(dataset: PseDataset) {
  const GET = async (request: Request): Promise<Response> => {
    try {
      const requestUrl = new URL(request.url);
      const date = validDate(requestUrl.searchParams.get("date"));
      const limit = validLimit(requestUrl.searchParams.get("limit"));

      const { data, cacheStatus } = await fetchPseDataset(dataset, date, limit);
      return createJsonResponse(data, cacheStatus);
    } catch (error) {
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
  };

  const handler = async (
    request: Request | IncomingMessage,
    response?: ServerResponse,
  ): Promise<Response | void> => {
    if (typeof Request !== "undefined" && request instanceof Request) {
      return GET(request);
    }

    if (!response) {
      throw new Error("Missing ServerResponse in Node HTTP context");
    }

    const nodeReq = request as IncomingMessage;
    try {
      const host = nodeReq.headers?.host ?? "localhost";
      const protocol =
        (nodeReq.headers?.["x-forwarded-proto"] as string) ?? "http";
      const url = new URL(
        nodeReq.url ?? `/api/pse/${dataset}`,
        `${protocol}://${host}`,
      );

      const date = validDate(url.searchParams.get("date"));
      const limit = validLimit(url.searchParams.get("limit"));

      const { data, cacheStatus } = await fetchPseDataset(dataset, date, limit);

      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.setHeader(
        "Cache-Control",
        `public, max-age=0, s-maxage=${PSE_CACHE_TTL_SECONDS}, stale-while-revalidate=60`,
      );
      response.setHeader("X-Cache", cacheStatus);
      response.end(JSON.stringify(data));
    } catch (err) {
      console.error(`PSE Node handler error for ${dataset}:`, err);
      response.statusCode = 502;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(
        JSON.stringify({
          error:
            err instanceof Error
              ? err.message
              : `Błąd serwera PSE (${dataset})`,
        }),
      );
    }
  };

  return { GET, default: handler };
}
