import { Clock3, Leaf } from "lucide-react";
import { getRCEPLN, type RcePriceRecord } from "@/lib/api/pse";
import { useQuery } from "@tanstack/react-query";

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
   if (isLoading)
      return (
         <div className="price-loading">Ładowanie danych o cenach energii…</div>
      );
   if (error)
      return (
         <div className="data-feedback is-error">
            Nie udało się pobrać danych z serwera.
         </div>
      );
   return (
      <article className="price-card">
         <div className="price-info">
            <p className="eyebrow">
               <Leaf size={14} aria-hidden="true" /> Planowanie zużycia
            </p>
            <h3>Najtańsze 4 godziny</h3>
            <p className="price-description">
               Włącz ładowanie, pralkę lub inne elastyczne urządzenia w tym
               oknie, aby korzystać z niższej średniej ceny energii.
            </p>
         </div>
         <div className="price-value">
            {bestSlot ? (
               <div className="price-highlight">
                  <span className="price-label">
                     <Clock3 size={13} aria-hidden="true" /> Rekomendowane okno
                  </span>
                  <strong className="price-time">
                     {bestSlot.startTime} – {bestSlot.endTime}
                  </strong>
                  <span className="price-meta">
                     Średnia cena{" "}
                     <strong>{bestSlot.averagePrice} zł/kWh</strong>
                  </span>
               </div>
            ) : (
               <div className="data-feedback">
                  Brak wystarczających danych na dziś.
               </div>
            )}
         </div>
      </article>
   );
}
