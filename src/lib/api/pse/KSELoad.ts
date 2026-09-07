import z from "zod";
import { fetchPSEData } from "./api";

export const kseLoadSchema = z.object({
  dtime: z.string(),
  dtime_utc: z.string(),
  period: z.string(),
  period_utc: z.string(),
  load_actual: z.number().nullable(),
  load_fcst: z.number().nullable(),
  publication_ts: z.string(),
  publication_ts_utc: z.string(),
  business_date: z.string(),
});

export type KseLoadRecord = z.infer<typeof kseLoadSchema>;

export async function getKSELoad(): Promise<KseLoadRecord[]> {
  return fetchPSEData("/kse-load", kseLoadSchema);
}
