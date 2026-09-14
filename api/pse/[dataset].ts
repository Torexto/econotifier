import { Redis } from "@upstash/redis";

const PSE_API_URL = "https://api.raporty.pse.pl/api";
const CACHE_TTL_SECONDS = 60 * 5;
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

function json(data: unknown, cacheStatus: "HIT" | "MISS" | "BYPASS") {
  return Response.json(data, {
    headers: {
      "Cache-Control": `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=60`,
      "X-Cache": cacheStatus,
    },
  });
}

function validDate(value: string | null) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : new Date().toISOString().slice(0, 10);
}

function validLimit(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, MAX_LIMIT)
    : DEFAULT_LIMIT;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const dataset = requestUrl.pathname.split("/").at(-1);

  if (!dataset || !datasets.has(dataset)) {
    return Response.json({ error: "Unknown PSE dataset" }, { status: 404 });
  }

  const date = validDate(requestUrl.searchParams.get("date"));
  const limit = validLimit(requestUrl.searchParams.get("limit"));
  const cacheKey = `pse:${dataset}:${date}:${limit}`;

  if (redis) {
    try {
      const cached = await redis.get<unknown[]>(cacheKey);
      if (cached) return json(cached, "HIT");
    } catch (error) {
      console.error("Redis read failed", error);
    }
  }

  const upstreamUrl = new URL(`${PSE_API_URL}/${dataset}`);
  upstreamUrl.searchParams.set("$filter", `business_date eq '${date}'`);
  upstreamUrl.searchParams.set("$orderby", "dtime_utc asc");
  upstreamUrl.searchParams.set("$first", limit.toString());

  try {
    const response = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return Response.json(
        { error: "PSE upstream request failed" },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as { value?: unknown[] };
    const records = payload.value ?? [];

    if (redis) {
      try {
        await redis.set(cacheKey, records, { ex: CACHE_TTL_SECONDS });
      } catch (error) {
        console.error("Redis write failed", error);
      }
    }

    return json(records, redis ? "MISS" : "BYPASS");
  } catch (error) {
    console.error("PSE upstream request failed", error);
    return Response.json(
      { error: "PSE upstream request failed" },
      { status: 502 },
    );
  }
}
