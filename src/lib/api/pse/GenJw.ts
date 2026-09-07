import z from "zod";
import { fetchPSEData } from "./api";

export const generationUnitSchema = z.object({
  dtime_utc: z.string(),
  dtime: z.string(),
  resource_code: z.string(),
  power_plant: z.string(),
  operating_mode: z.string(),
  operating_mode_eng: z.string(),
  period: z.string(),
  period_utc: z.string(),
  value: z.number().nullable(),
  business_date: z.string(),
  publication_ts_utc: z.string(),
  publication_ts: z.string(),
});

export type GenerationUnitRecord = z.infer<typeof generationUnitSchema>;

export async function getGENJW(): Promise<any> {
  return fetchPSEData("/gen-jw", generationUnitSchema);
}
