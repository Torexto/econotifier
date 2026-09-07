import z from "zod";
import { fetchPSEData } from "./api";

const energyPricesSchema = z.object({
  dtime: z.string(),
  period: z.string(),
  balance: z.number().nullable(),
  sk_cost: z.number().nullable(),
  cen_cost: z.number().nullable(),
  cor_cost: z.number().nullable(),
  csdac_pln: z.number().nullable(),
  dtime_utc: z.string(),
  period_utc: z.string(),
  ceb_pp_cost: z.number().nullable(),
  ceb_sr_cost: z.number().nullable(),
  balance_power: z.number().nullable(),
  business_date: z.string(),
  sk_cost_power: z.number().nullable(),
  publication_ts: z.string(),
  publication_ts_utc: z.string(),
});

export type EnergyPriceRecord = z.infer<typeof energyPricesSchema>;

export async function getEnergyPrices(
  date?: string,
): Promise<EnergyPriceRecord[]> {
  return fetchPSEData("/energy-prices", energyPricesSchema, { date });
}
