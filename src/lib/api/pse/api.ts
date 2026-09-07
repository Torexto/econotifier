import z from "zod";

export const PSE_API_URL = "https://api.raporty.pse.pl/api";

export interface FetchOptions {
  date?: string;
  limit?: number;
}

export async function fetchPSEData<T extends z.ZodType>(
  endpoint: string,
  schema: T,
  options: FetchOptions = {},
): Promise<z.infer<T>[]> {
  const date = options.date || new Date().toISOString().split("T")[0];
  const limit = options.limit ?? 100;

  const url = new URL(PSE_API_URL + endpoint);
  url.searchParams.set("$filter", `business_date eq '${date}'`);
  url.searchParams.set("$orderby", "dtime_utc asc");
  url.searchParams.set("$first", limit.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${endpoint}`);
  }

  const json = await response.json();
  const rawValues = json.value || [];

  const parsed = z.array(schema).safeParse(rawValues);

  if (!parsed.success) {
    console.error(`Validation failed for ${endpoint}:`, parsed.error);
    throw new Error(`Invalid data structure received from ${endpoint}`);
  }

  console.log(parsed.data);

  return parsed.data;
}
