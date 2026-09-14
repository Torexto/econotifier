import z from "zod";

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

   const url = new URL(`/api/pse${endpoint}`, window.location.origin);
   url.searchParams.set("date", date);
   url.searchParams.set("limit", limit.toString());

   const response = await fetch(url.toString());

   if (!response.ok) {
      throw new Error(`Failed to fetch data from ${endpoint}`);
   }

   const rawValues = await response.json();

   const parsed = z.array(schema).safeParse(rawValues);

   if (!parsed.success) {
      console.error(`Validation failed for ${endpoint}:`, parsed.error);
      throw new Error(`Invalid data structure received from ${endpoint}`);
   }

   return parsed.data;
}
