import z from "zod";
import { fetchPSEData } from "./api";

export const entsoeGenerationSchema = z.object({
  dtime: z.string(),
  dtime_utc: z.string(),
  period_utc: z.string(),
  period: z.string(),
  date: z.string(),
  alias_entsoe: z.string(),
  value: z.string().nullable(),
  publication_ts: z.string(),
  publication_ts_utc: z.string(),
  business_date: z.string(),
});

export type EntsoeGenerationRecord = z.infer<typeof entsoeGenerationSchema>;

export async function getHISGenPAL(): Promise<EntsoeGenerationRecord[]> {
  return fetchPSEData("/his-gen-pal", entsoeGenerationSchema);
}
