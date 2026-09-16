import type { EntsoeGenerationRecord } from "./HISGenPAL";

export type EnergyCategory = "all" | "renewable" | "non-renewable";

export type EnergySourceType =
   | "wind"
   | "solar"
   | "hydro"
   | "biomass"
   | "coal"
   | "lignite"
   | "gas"
   | "other";

export interface EnergyClassification {
   isRenewable: boolean;
   category: "renewable" | "non-renewable";
   categoryLabel: "Odnawialne (OZE)" | "Nieodnawialne";
   sourceType: EnergySourceType;
   sourceLabel: string;
   subtype: string;
   iconType:
      | "wind"
      | "solar"
      | "hydro"
      | "biomass"
      | "coal"
      | "lignite"
      | "gas"
      | "other";
   badgeVariant: "renewable" | "fossil" | "gas";
}

export interface EntsoeFuelMeta {
   alias: string;
   namePl: string;
   nameEn: string;
   shortName: string;
   isRenewable: boolean;
   category: "renewable" | "non-renewable";
   iconType:
      | "solar"
      | "wind"
      | "hydro"
      | "biomass"
      | "coal"
      | "lignite"
      | "gas"
      | "oil"
      | "other";
   color: string;
   groupKey:
      | "solar"
      | "wind"
      | "hydro"
      | "biomass"
      | "otherOze"
      | "hardCoal"
      | "brownCoal"
      | "gas"
      | "oil"
      | "otherFossil";
}

export const ENTSOE_FUEL_MAP: Record<string, EntsoeFuelMeta> = {
   B01: {
      alias: "B01",
      namePl: "Biomasa",
      nameEn: "Biomass",
      shortName: "Biomasa",
      isRenewable: true,
      category: "renewable",
      iconType: "biomass",
      color: "#10b981",
      groupKey: "biomass",
   },
   B02: {
      alias: "B02",
      namePl: "Węgiel brunatny",
      nameEn: "Fossil Brown coal/Lignite",
      shortName: "Węgiel brunatny",
      isRenewable: false,
      category: "non-renewable",
      iconType: "lignite",
      color: "#b45309",
      groupKey: "brownCoal",
   },
   B03: {
      alias: "B03",
      namePl: "Gaz z węgla / koksowniczy",
      nameEn: "Fossil Coal-derived gas",
      shortName: "Gaz koksowniczy",
      isRenewable: false,
      category: "non-renewable",
      iconType: "gas",
      color: "#64748b",
      groupKey: "gas",
   },
   B04: {
      alias: "B04",
      namePl: "Gaz ziemny",
      nameEn: "Fossil Gas",
      shortName: "Gaz ziemny",
      isRenewable: false,
      category: "non-renewable",
      iconType: "gas",
      color: "#0284c7",
      groupKey: "gas",
   },
   B05: {
      alias: "B05",
      namePl: "Węgiel kamienny",
      nameEn: "Fossil Hard coal",
      shortName: "Węgiel kamienny",
      isRenewable: false,
      category: "non-renewable",
      iconType: "coal",
      color: "#374151",
      groupKey: "hardCoal",
   },
   B06: {
      alias: "B06",
      namePl: "Ropa naftowa i olej",
      nameEn: "Fossil Oil",
      shortName: "Ropa / Olej",
      isRenewable: false,
      category: "non-renewable",
      iconType: "oil",
      color: "#71717a",
      groupKey: "oil",
   },
   B09: {
      alias: "B09",
      namePl: "Geotermia",
      nameEn: "Geothermal",
      shortName: "Geotermia",
      isRenewable: true,
      category: "renewable",
      iconType: "biomass",
      color: "#059669",
      groupKey: "otherOze",
   },
   B10: {
      alias: "B10",
      namePl: "Wodna szczytowo-pompowa",
      nameEn: "Hydro Pumped Storage",
      shortName: "Woda (ESP)",
      isRenewable: true,
      category: "renewable",
      iconType: "hydro",
      color: "#0ea5e9",
      groupKey: "hydro",
   },
   B11: {
      alias: "B11",
      namePl: "Wodna przepływowa",
      nameEn: "Hydro Run-of-river and poundage",
      shortName: "Woda przepływowa",
      isRenewable: true,
      category: "renewable",
      iconType: "hydro",
      color: "#06b6d4",
      groupKey: "hydro",
   },
   B12: {
      alias: "B12",
      namePl: "Wodna zbiornikowa",
      nameEn: "Hydro Water Reservoir",
      shortName: "Woda zbiornikowa",
      isRenewable: true,
      category: "renewable",
      iconType: "hydro",
      color: "#0891b2",
      groupKey: "hydro",
   },
   B15: {
      alias: "B15",
      namePl: "Inne źródła konwencjonalne",
      nameEn: "Other",
      shortName: "Inne konwencjonalne",
      isRenewable: false,
      category: "non-renewable",
      iconType: "other",
      color: "#9ca3af",
      groupKey: "otherFossil",
   },
   B16: {
      alias: "B16",
      namePl: "Fotowoltaika (PV)",
      nameEn: "Solar",
      shortName: "Fotowoltaika",
      isRenewable: true,
      category: "renewable",
      iconType: "solar",
      color: "#eab308",
      groupKey: "solar",
   },
   B18: {
      alias: "B18",
      namePl: "Wiatr na morzu (Offshore)",
      nameEn: "Wind Offshore",
      shortName: "Wiatr morski",
      isRenewable: true,
      category: "renewable",
      iconType: "wind",
      color: "#059669",
      groupKey: "wind",
   },
   B19: {
      alias: "B19",
      namePl: "Wiatr na lądzie (Onshore)",
      nameEn: "Wind Onshore",
      shortName: "Wiatr lądowy",
      isRenewable: true,
      category: "renewable",
      iconType: "wind",
      color: "#22c55e",
      groupKey: "wind",
   },
   B20: {
      alias: "B20",
      namePl: "Inne odnawialne",
      nameEn: "Other renewable",
      shortName: "Inne OZE",
      isRenewable: true,
      category: "renewable",
      iconType: "biomass",
      color: "#34d399",
      groupKey: "otherOze",
   },
};

export function parseEntsoeValue(
   val: string | number | null | undefined,
): number {
   if (val == null) return 0;
   if (typeof val === "number")
      return Number.isFinite(val) && val > 0 ? val : 0;
   const parsed = parseFloat(String(val).replace(",", "."));
   return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export interface FuelIntervalAggregate {
   period: string;
   timeLabel: string;
   dtime: string;
   dtime_utc: string;
   date: string;
   ozeTotal: number;
   fossilTotal: number;
   total: number;
   ozeSharePct: number;
   solar: number;
   wind: number;
   hydro: number;
   biomass: number;
   otherOze: number;
   hardCoal: number;
   brownCoal: number;
   gas: number;
   oil: number;
   otherFossil: number;
}

export interface FuelBreakdownItem {
   alias: string;
   name: string;
   isRenewable: boolean;
   color: string;
   iconType: string;
   currentMW: number;
   sharePct: number;
   peakMW: number;
}

export interface FuelMixSummary {
   date: string;
   timeline: FuelIntervalAggregate[];
   currentInterval: FuelIntervalAggregate | null;
   currentOzeMW: number;
   currentFossilMW: number;
   currentTotalMW: number;
   currentOzeSharePct: number;
   peakOzeMW: number;
   peakOzeTime: string;
   peakOzeSharePct: number;
   peakOzeShareTime: string;
   peakSolarMW: number;
   peakSolarTime: string;
   peakWindMW: number;
   peakWindTime: string;
   totalOzeEnergyMWh: number;
   totalEnergyMWh: number;
   dailyAverageOzeSharePct: number;
   fuelsBreakdown: FuelBreakdownItem[];
}

export function processHisGenPal(
   records: EntsoeGenerationRecord[],
): FuelMixSummary {
   if (!records || records.length === 0) {
      return {
         date: new Date().toISOString().slice(0, 10),
         timeline: [],
         currentInterval: null,
         currentOzeMW: 0,
         currentFossilMW: 0,
         currentTotalMW: 0,
         currentOzeSharePct: 0,
         peakOzeMW: 0,
         peakOzeTime: "—",
         peakOzeSharePct: 0,
         peakOzeShareTime: "—",
         peakSolarMW: 0,
         peakSolarTime: "—",
         peakWindMW: 0,
         peakWindTime: "—",
         totalOzeEnergyMWh: 0,
         totalEnergyMWh: 0,
         dailyAverageOzeSharePct: 0,
         fuelsBreakdown: [],
      };
   }

   const date = records[0].business_date || records[0].date;
   const intervalsMap = new Map<string, FuelIntervalAggregate>();
   const peakByAlias = new Map<string, number>();
   const latestByAlias = new Map<string, number>();

   for (const record of records) {
      const key = record.period;
      let interval = intervalsMap.get(key);
      if (!interval) {
         interval = {
            period: record.period,
            timeLabel: record.period.split(" - ")[0],
            dtime: record.dtime,
            dtime_utc: record.dtime_utc,
            date: record.business_date || record.date,
            ozeTotal: 0,
            fossilTotal: 0,
            total: 0,
            ozeSharePct: 0,
            solar: 0,
            wind: 0,
            hydro: 0,
            biomass: 0,
            otherOze: 0,
            hardCoal: 0,
            brownCoal: 0,
            gas: 0,
            oil: 0,
            otherFossil: 0,
         };
         intervalsMap.set(key, interval);
      }

      const val = parseEntsoeValue(record.value);
      const meta = ENTSOE_FUEL_MAP[record.alias_entsoe];

      if (meta) {
         if (meta.isRenewable) {
            interval.ozeTotal += val;
         } else {
            interval.fossilTotal += val;
         }
         interval.total += val;

         if (record.alias_entsoe === "B16") interval.solar += val;
         else if (
            record.alias_entsoe === "B18" ||
            record.alias_entsoe === "B19"
         )
            interval.wind += val;
         else if (
            record.alias_entsoe === "B10" ||
            record.alias_entsoe === "B11" ||
            record.alias_entsoe === "B12"
         )
            interval.hydro += val;
         else if (record.alias_entsoe === "B01") interval.biomass += val;
         else if (
            record.alias_entsoe === "B20" ||
            record.alias_entsoe === "B09"
         )
            interval.otherOze += val;
         else if (record.alias_entsoe === "B05") interval.hardCoal += val;
         else if (record.alias_entsoe === "B02") interval.brownCoal += val;
         else if (
            record.alias_entsoe === "B03" ||
            record.alias_entsoe === "B04"
         )
            interval.gas += val;
         else if (record.alias_entsoe === "B06") interval.oil += val;
         else interval.otherFossil += val;
      }

      // Track max peak and latest
      const currentPeak = peakByAlias.get(record.alias_entsoe) ?? 0;
      if (val > currentPeak) {
         peakByAlias.set(record.alias_entsoe, val);
      }
      latestByAlias.set(record.alias_entsoe, val);
   }

   const timeline = Array.from(intervalsMap.values()).map((item) => ({
      ...item,
      ozeSharePct: item.total > 0 ? (item.ozeTotal / item.total) * 100 : 0,
   }));

   // Calculate peaks
   let peakOzeMW = 0;
   let peakOzeTime = "—";
   let peakOzeSharePct = 0;
   let peakOzeShareTime = "—";
   let peakSolarMW = 0;
   let peakSolarTime = "—";
   let peakWindMW = 0;
   let peakWindTime = "—";
   let totalOzeEnergyMWh = 0;
   let totalEnergyMWh = 0;

   for (const item of timeline) {
      if (item.ozeTotal > peakOzeMW) {
         peakOzeMW = item.ozeTotal;
         peakOzeTime = item.timeLabel;
      }
      if (item.ozeSharePct > peakOzeSharePct) {
         peakOzeSharePct = item.ozeSharePct;
         peakOzeShareTime = item.timeLabel;
      }
      if (item.solar > peakSolarMW) {
         peakSolarMW = item.solar;
         peakSolarTime = item.timeLabel;
      }
      if (item.wind > peakWindMW) {
         peakWindMW = item.wind;
         peakWindTime = item.timeLabel;
      }

      // 15-minute interval power in MW converted to MWh (/ 4)
      totalOzeEnergyMWh += item.ozeTotal / 4;
      totalEnergyMWh += item.total / 4;
   }

   const currentInterval =
      timeline.length > 0 ? timeline[timeline.length - 1] : null;
   const currentOzeMW = currentInterval ? currentInterval.ozeTotal : 0;
   const currentFossilMW = currentInterval ? currentInterval.fossilTotal : 0;
   const currentTotalMW = currentInterval ? currentInterval.total : 0;
   const currentOzeSharePct = currentInterval ? currentInterval.ozeSharePct : 0;
   const dailyAverageOzeSharePct =
      totalEnergyMWh > 0 ? (totalOzeEnergyMWh / totalEnergyMWh) * 100 : 0;

   // Build breakdown items for each fuel type found
   const fuelsBreakdown: FuelBreakdownItem[] = Object.values(ENTSOE_FUEL_MAP)
      .map((meta) => {
         const currentMW = latestByAlias.get(meta.alias) ?? 0;
         const peakMW = peakByAlias.get(meta.alias) ?? 0;
         const sharePct =
            currentTotalMW > 0 ? (currentMW / currentTotalMW) * 100 : 0;

         return {
            alias: meta.alias,
            name: meta.shortName,
            isRenewable: meta.isRenewable,
            color: meta.color,
            iconType: meta.iconType,
            currentMW,
            sharePct,
            peakMW,
         };
      })
      .filter((item) => item.peakMW > 0 || item.currentMW > 0)
      .sort((a, b) => b.currentMW - a.currentMW);

   return {
      date,
      timeline,
      currentInterval,
      currentOzeMW,
      currentFossilMW,
      currentTotalMW,
      currentOzeSharePct,
      peakOzeMW,
      peakOzeTime,
      peakOzeSharePct,
      peakOzeShareTime,
      peakSolarMW,
      peakSolarTime,
      peakWindMW,
      peakWindTime,
      totalOzeEnergyMWh,
      totalEnergyMWh,
      dailyAverageOzeSharePct,
      fuelsBreakdown,
   };
}

export function classifyPlant(
   plantName: string,
   resourceCode = "",
): EnergyClassification {
   const text = `${plantName} ${resourceCode}`.toLowerCase().trim();

   // 1. Dedicated Biomass
   if (
      text.includes("połaniec b2") ||
      text.includes("zielony blok") ||
      text.includes("biomas") ||
      text.includes("biomass")
   ) {
      return {
         isRenewable: true,
         category: "renewable",
         categoryLabel: "Odnawialne (OZE)",
         sourceType: "biomass",
         sourceLabel: "Biomasa",
         subtype: "Blok biomasowy",
         iconType: "biomass",
         badgeVariant: "renewable",
      };
   }

   // 2. Wind Farms (FW)
   if (
      text.startsWith("mfw ") ||
      text.startsWith("fw ") ||
      text.startsWith("fw_") ||
      text.includes(" fw ") ||
      text.includes("wiatr") ||
      text.includes("wind") ||
      text.includes("potęgowo") ||
      text.includes("margonin") ||
      text.includes("dębsk") ||
      text.includes("banie") ||
      text.includes("jasna") ||
      text.includes("biały bór")
   ) {
      return {
         isRenewable: true,
         category: "renewable",
         categoryLabel: "Odnawialne (OZE)",
         sourceType: "wind",
         sourceLabel: "Wiatr",
         subtype: "Farma wiatrowa",
         iconType: "wind",
         badgeVariant: "renewable",
      };
   }

   // 3. Solar / Photovoltaics (PV)
   if (
      text.startsWith("pv ") ||
      text.startsWith("pv_") ||
      text.includes(" pv ") ||
      text.includes("fotowolta") ||
      text.includes("solar") ||
      text.includes("zwartowo") ||
      text.includes("jeziórko") ||
      text.includes("miłkowice")
   ) {
      return {
         isRenewable: true,
         category: "renewable",
         categoryLabel: "Odnawialne (OZE)",
         sourceType: "solar",
         sourceLabel: "Fotowoltaika",
         subtype: "Farma fotowoltaiczna",
         iconType: "solar",
         badgeVariant: "renewable",
      };
   }

   // 4. Hydro & Pumped-Storage (ESP / EW)
   if (
      text.startsWith("esp ") ||
      text.includes("esp ") ||
      text.includes("porąbka") ||
      text.includes("żarnowiec") ||
      text.includes("żydowo") ||
      text.includes("solina") ||
      text.includes("dychów") ||
      text.includes("wodna") ||
      text.includes("hydro") ||
      text.includes("czorsztyn") ||
      text.includes("niedzica") ||
      text.includes("rożnów") ||
      text.includes("włocławek ew")
   ) {
      const isPumped =
         text.includes("esp") ||
         text.includes("porąbka") ||
         text.includes("żarnowiec") ||
         text.includes("żydowo") ||
         text.includes("solina");

      return {
         isRenewable: true,
         category: "renewable",
         categoryLabel: "Odnawialne (OZE)",
         sourceType: "hydro",
         sourceLabel: isPumped ? "Szczytowo-pompowa" : "Woda",
         subtype: isPumped ? "Szczytowo-pompowa" : "Elektrownia wodna",
         iconType: "hydro",
         badgeVariant: "renewable",
      };
   }

   // 5. Gas (CCGT / BGP / Gas EC)
   if (
      text.includes("bgp") ||
      text.includes("gryfino") ||
      text.includes("płock") ||
      text.includes("włocławek") ||
      text.includes("stalowa wola") ||
      text.includes("nowa sarzyna") ||
      text.includes("gorzów") ||
      text.includes("żerań 2") ||
      text.includes("czechnica") ||
      text.includes("gaz") ||
      text.includes("gas")
   ) {
      return {
         isRenewable: false,
         category: "non-renewable",
         categoryLabel: "Nieodnawialne",
         sourceType: "gas",
         sourceLabel: "Gaz ziemny",
         subtype: "Blok gazowo-parowy",
         iconType: "gas",
         badgeVariant: "gas",
      };
   }

   // 6. Lignite (Węgiel brunatny)
   if (
      text.includes("bełchatów") ||
      text.includes("turów") ||
      text.includes("pątnów")
   ) {
      return {
         isRenewable: false,
         category: "non-renewable",
         categoryLabel: "Nieodnawialne",
         sourceType: "lignite",
         sourceLabel: "Węgiel brunatny",
         subtype: "Elektrownia cieplna",
         iconType: "lignite",
         badgeVariant: "fossil",
      };
   }

   // 7. Hard Coal & Coal Combined Heat and Power (Węgiel kamienny / Elektrociepłownie)
   if (
      text.startsWith("ec ") ||
      text.includes("ec ") ||
      text.includes("kozienice") ||
      text.includes("opole") ||
      text.includes("jaworzno") ||
      text.includes("połaniec") ||
      text.includes("rybnik") ||
      text.includes("dolna odra") ||
      text.includes("łagisza") ||
      text.includes("łaziska") ||
      text.includes("siersza") ||
      text.includes("skawina") ||
      text.includes("ostrołęka") ||
      text.includes("chorzów") ||
      text.includes("katowice") ||
      text.includes("kraków") ||
      text.includes("wrocław") ||
      text.includes("karolin") ||
      text.includes("siekierki") ||
      text.includes("łódź") ||
      text.includes("rzeszów") ||
      text.includes("wrotków") ||
      text.includes("zielona góra") ||
      text.includes("węgiel") ||
      text.includes("coal")
   ) {
      const isEC =
         text.startsWith("ec ") ||
         text.includes("ec ") ||
         text.includes("kraków") ||
         text.includes("wrocław") ||
         text.includes("karolin") ||
         text.includes("siekierki") ||
         text.includes("łódź") ||
         text.includes("rzeszów") ||
         text.includes("wrotków") ||
         text.includes("zielona góra") ||
         text.includes("katowice") ||
         text.includes("chorzów");

      return {
         isRenewable: false,
         category: "non-renewable",
         categoryLabel: "Nieodnawialne",
         sourceType: "coal",
         sourceLabel: "Węgiel kamienny",
         subtype: isEC ? "Elektrociepłownia" : "Elektrownia cieplna",
         iconType: "coal",
         badgeVariant: "fossil",
      };
   }

   // Fallback
   return {
      isRenewable: false,
      category: "non-renewable",
      categoryLabel: "Nieodnawialne",
      sourceType: "other",
      sourceLabel: "Konwencjonalne",
      subtype: "Inne źródło",
      iconType: "other",
      badgeVariant: "fossil",
   };
}
