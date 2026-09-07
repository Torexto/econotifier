import { getRCEPLN, type RcePriceRecord } from "@/lib/api/pse";
import { useQuery } from "@tanstack/react-query";

function findCheapestWindow(records: RcePriceRecord[], slotCount = 4) {
  if (!records || records.length < slotCount) return null;

  let cheapestIndex = 0;
  let lowestCost = Infinity;

  for (let i = 0; i <= records.length - slotCount; i++) {
    let currentSum = 0;
    for (let j = 0; j < slotCount; j++) {
      const price = records[i + j].rce_pln;
      if (!price) {
        currentSum = Infinity;
        break;
      }
      currentSum += price;
    }
    if (currentSum < lowestCost) {
      lowestCost = currentSum;
      cheapestIndex = i;
    }
  }

  return {
    startTime: records[cheapestIndex].period.split(" - ")[0],
    endTime: records[cheapestIndex + slotCount - 1].period.split(" - ")[1],
    averagePrice: (lowestCost / slotCount / 1000).toFixed(2), // Converted from PLN/MWh to PLN/kWh
  };
}

export function EnergyPrice() {
  const {
    data: records,
    isLoading,
    error,
  } = useQuery({
    queryFn: () => {
      return getRCEPLN();
    },
    queryKey: ["rce-pln"],
    staleTime: 1000 * 60 * 15,
  });

  const bestSlot = records ? findCheapestWindow(records, 4) : null;

  if (isLoading) {
    return (
      <div className="p-6 text-zinc-400">Ładowanie danych o energii...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-400">
        Nie udało się pobrać danych z serwera.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 shadow-lg">
      <h2 className="text-lg font-semibold mb-2">Najlepszy czas na prąd</h2>
      {bestSlot ? (
        <div>
          <p className="text-zinc-400 text-sm mb-4">
            Najtańsze okno czasowe na dziś wyliczone na podstawie rynkowych cen
            z PSE:
          </p>
          <div className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
            <div>
              <span className="text-xs text-zinc-400 uppercase tracking-wider block">
                Godziny
              </span>
              <span className="text-xl font-bold text-emerald-400">
                {bestSlot.startTime} - {bestSlot.endTime}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-400 uppercase tracking-wider block">
                Średnia cena
              </span>
              <span className="text-xl font-bold">
                {bestSlot.averagePrice} zł/kWh
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-zinc-400">Brak wystarczających danych na dziś.</p>
      )}
    </div>
  );
}
