import { useQuery } from "@tanstack/react-query";
import { Clock3, Leaf } from "lucide-react";
import { getRCEPLN, type RcePriceRecord } from "@/lib/api/pse";
import { FeedbackState } from "@/lib/ui/shared";

function findCheapestWindow(records: RcePriceRecord[], slotCount = 4) {
   if (records.length < slotCount) return null;
   let cheapestIndex = 0;
   let lowestCost = Infinity;

   for (let index = 0; index <= records.length - slotCount; index++) {
      const prices = records
         .slice(index, index + slotCount)
         .map((record) => record.rce_pln);
      if (prices.some((price) => price == null)) continue;
      const total = prices.reduce<number>(
         (sum, price) => sum + (price ?? 0),
         0,
      );
      if (total < lowestCost) {
         lowestCost = total;
         cheapestIndex = index;
      }
   }

   if (!Number.isFinite(lowestCost)) return null;

   return {
      startTime: records[cheapestIndex].period.split(" - ")[0],
      endTime: records[cheapestIndex + slotCount - 1].period.split(" - ")[1],
      averagePrice: (lowestCost / slotCount / 1000).toFixed(2),
   };
}

export function EnergyPrice() {
   const {
      data: records,
      isLoading,
      error,
   } = useQuery<RcePriceRecord[]>({
      queryFn: () => getRCEPLN(),
      queryKey: ["rce-pln"],
      staleTime: 1000 * 60 * 15,
   });

   const bestSlot = records ? findCheapestWindow(records, 4) : null;

   if (isLoading) {
      return (
         <FeedbackState
            type="loading"
            message="Ładowanie rekomendacji cenowych rynku bilansującego (RCE-PLN)…"
         />
      );
   }

   if (error) {
      return (
         <FeedbackState
            type="error"
            message="Nie udało się pobrać aktualnych stawek cen energii z PSE."
         />
      );
   }

   return (
      <article className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs md:grid-cols-12 dark:border-slate-800 dark:bg-[#1a241e]">
         {/* Info Column */}
         <div className="flex flex-col justify-center p-6 md:col-span-7 md:border-r md:border-slate-100 md:p-8 dark:md:border-slate-800/80">
            <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
               <Leaf size={13} aria-hidden="true" />
               <span>Planowanie zużycia</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
               Godziny z najniższą ceną energii
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm dark:text-slate-400">
               Włącz ładowanie samochodu, pralkę, zmywarkę lub pompę ciepła w
               tym oknie, aby korzystać z najniższej średniej ceny energii na
               rynku bilansującym.
            </p>
         </div>

         {/* Recommendation Highlight Value */}
         <div className="flex items-center justify-center bg-slate-50/70 p-6 md:col-span-5 md:p-8 dark:bg-[#16201a]">
            {bestSlot ? (
               <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 text-center transition-all dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                     <Clock3 size={12} aria-hidden="true" />
                     <span>Rekomendowane okno</span>
                  </span>
                  <div className="my-2 font-mono text-2xl font-black tracking-tight text-emerald-900 sm:text-3xl dark:text-emerald-200">
                     {bestSlot.startTime} – {bestSlot.endTime}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                     Średnia cena:{" "}
                     <strong className="text-slate-900 dark:text-slate-200">
                        {bestSlot.averagePrice} zł/kWh
                     </strong>
                  </div>
               </div>
            ) : (
               <div className="text-xs text-slate-400 dark:text-slate-500">
                  Brak wystarczających danych na dziś.
               </div>
            )}
         </div>
      </article>
   );
}
