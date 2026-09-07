import z from "zod";
import { fetchPSEData } from "./api";

export const rcePriceSchema = z.object({
  dtime: z.string(),
  period: z.string(),
  period_utc: z.string(),
  dtime_utc: z.string(),
  rce_pln: z.number().nullable(),
  business_date: z.string(),
  publication_ts: z.string(),
  publication_ts_utc: z.string(),
});

export type RcePriceRecord = z.infer<typeof rcePriceSchema>;

export async function getRCEPLN(date?: string): Promise<RcePriceRecord[]> {
  return fetchPSEData("/rce-pln", rcePriceSchema, { date });
}
