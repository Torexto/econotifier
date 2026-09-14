import { useQuery } from "@tanstack/react-query";
import {
   ChevronDown,
   ChevronRight,
   ChevronsDownUp,
   ChevronsUpDown,
   Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { type GenerationUnitRecord, getGENJW } from "@/lib/api/pse";

interface ParsedUnit {
   code: string;
   name: string;
   plant: string;
   type: string;
   powerMW: number;
}

interface PlantGroup {
   name: string;
   totalPowerMW: number;
   activeUnitsCount: number;
   totalUnitsCount: number;
   primaryType: string;
   allTypes: string[];
   units: ParsedUnit[];
}

const parseUnitInfo = (record: GenerationUnitRecord): ParsedUnit => ({
   code: record.resource_code,
   name: record.power_plant || record.resource_code,
   plant: (record.power_plant || record.resource_code).trim(),
   type: record.operating_mode || "Inne",
   powerMW: Math.max(0, record.value ?? 0),
});

export const GenerationDashboard: React.FC = () => {
   const {
      data: rawRecords,
      isLoading,
      error,
   } = useQuery<GenerationUnitRecord[]>({
      queryFn: () => getGENJW(),
      queryKey: ["gen-jw"],
      staleTime: 1000 * 60 * 15,
   });

   const [searchTerm, setSearchTerm] = useState("");
   const [filterActiveOnly, setFilterActiveOnly] = useState(false);
   const [expandedPlants, setExpandedPlants] = useState<Set<string>>(new Set());

   const units = useMemo(
      () => rawRecords?.map(parseUnitInfo) ?? [],
      [rawRecords],
   );

   // Group units by power plant
   const plants = useMemo(() => {
      const map = new Map<string, PlantGroup>();

      for (const unit of units) {
         const plantName = unit.plant || "Inne elektrownie";
         let group = map.get(plantName);
         if (!group) {
            group = {
               name: plantName,
               totalPowerMW: 0,
               activeUnitsCount: 0,
               totalUnitsCount: 0,
               primaryType: unit.type,
               allTypes: [],
               units: [],
            };
            map.set(plantName, group);
         }

         group.units.push(unit);
         group.totalPowerMW += unit.powerMW;
         group.totalUnitsCount += 1;
         if (unit.powerMW > 0) {
            group.activeUnitsCount += 1;
         }
         if (!group.allTypes.includes(unit.type) && unit.type !== "Inne") {
            group.allTypes.push(unit.type);
         }
      }

      for (const group of map.values()) {
         if (group.allTypes.length > 0) {
            group.primaryType = group.allTypes.join(", ");
         }
      }

      // Sort by total power descending
      return Array.from(map.values()).sort(
         (a, b) => b.totalPowerMW - a.totalPowerMW,
      );
   }, [units]);

   const filteredPlants = useMemo(() => {
      const term = searchTerm.toLowerCase().trim();
      return plants.filter((plant) => {
         const matchesSearch =
            !term ||
            plant.name.toLowerCase().includes(term) ||
            plant.primaryType.toLowerCase().includes(term) ||
            plant.units.some((u) => u.code.toLowerCase().includes(term));

         const matchesActive = !filterActiveOnly || plant.activeUnitsCount > 0;
         return matchesSearch && matchesActive;
      });
   }, [plants, searchTerm, filterActiveOnly]);

   const stats = useMemo(() => {
      const activeUnits = units.filter((unit) => unit.powerMW > 0).length;
      const activePlants = plants.filter((p) => p.activeUnitsCount > 0).length;
      return {
         totalPower: units.reduce((sum, unit) => sum + unit.powerMW, 0),
         activeUnits,
         totalUnits: units.length,
         activePlants,
         totalPlants: plants.length,
      };
   }, [units, plants]);

   const togglePlant = (name: string) => {
      setExpandedPlants((prev) => {
         const next = new Set(prev);
         if (next.has(name)) {
            next.delete(name);
         } else {
            next.add(name);
         }
         return next;
      });
   };

   const toggleAll = () => {
      if (expandedPlants.size > 0) {
         setExpandedPlants(new Set());
      } else {
         setExpandedPlants(new Set(filteredPlants.map((p) => p.name)));
      }
   };

   const maxPower = useMemo(
      () => Math.max(1, ...plants.map((p) => p.totalPowerMW)),
      [plants],
   );

   if (isLoading)
      return (
         <div className="price-loading">Pobieranie danych o generacji…</div>
      );
   if (error)
      return (
         <div className="data-feedback is-error">
            Nie udało się załadować danych generacji JW. Sprawdź połączenie z
            API PSE.
         </div>
      );

   return (
      <div className="generation-grouped-section">
         {/* Minimalist stats row */}
         <div className="stats-grid compact-stats">
            <article className="stat-card">
               <span>Łączna moc generacji</span>
               <p className="total-power">
                  {stats.totalPower.toLocaleString("pl-PL", {
                     maximumFractionDigits: 1,
                  })}{" "}
                  <small>MW</small>
               </p>
            </article>
            <article className="stat-card">
               <span>Pracujące elektrownie</span>
               <p>
                  {stats.activePlants} <small>/ {stats.totalPlants}</small>
               </p>
            </article>
            <article className="stat-card">
               <span>Pracujące bloki (JW)</span>
               <p>
                  {stats.activeUnits} <small>/ {stats.totalUnits}</small>
               </p>
            </article>
         </div>

         {/* Compact filters bar */}
         <div className="filter-card plant-filter-card">
            <label className="search-input plant-search">
               <Search size={15} aria-hidden="true" />
               <input
                  type="search"
                  placeholder="Szukaj elektrowni lub bloku…"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
               />
            </label>
            <div className="plant-filter-actions">
               <label className="active-filter">
                  <input
                     type="checkbox"
                     checked={filterActiveOnly}
                     onChange={(event) =>
                        setFilterActiveOnly(event.target.checked)
                     }
                  />
                  Tylko pracujące
               </label>
               <button
                  type="button"
                  className="plant-toggle-all-btn"
                  onClick={toggleAll}
               >
                  {expandedPlants.size > 0 ? (
                     <>
                        <ChevronsDownUp size={14} /> Zwiń wszystkie
                     </>
                  ) : (
                     <>
                        <ChevronsUpDown size={14} /> Rozwiń bloki
                     </>
                  )}
               </button>
            </div>
         </div>

         {/* Grouped Power Plants List */}
         <div className="plant-cards-list">
            {filteredPlants.length ? (
               filteredPlants.map((plant) => {
                  const isExpanded = expandedPlants.has(plant.name);
                  const isWorking = plant.activeUnitsCount > 0;
                  const powerPct = Math.min(
                     100,
                     Math.round((plant.totalPowerMW / maxPower) * 100),
                  );

                  return (
                     <div
                        key={plant.name}
                        className={`plant-item ${isWorking ? "is-active" : "is-idle"}`}
                     >
                        <button
                           type="button"
                           className="plant-summary-btn"
                           onClick={() => togglePlant(plant.name)}
                           aria-expanded={isExpanded}
                        >
                           <div className="plant-info-main">
                              <span className="plant-icon-wrap">
                                 {isExpanded ? (
                                    <ChevronDown size={16} />
                                 ) : (
                                    <ChevronRight size={16} />
                                 )}
                              </span>
                              <div className="plant-name-col">
                                 <div className="plant-title-row">
                                    <strong className="plant-name">
                                       {plant.name}
                                    </strong>
                                    {plant.primaryType && (
                                       <span className="plant-type-pill">
                                          {plant.primaryType}
                                       </span>
                                    )}
                                 </div>
                                 <span className="plant-units-summary">
                                    {plant.activeUnitsCount} /{" "}
                                    {plant.totalUnitsCount} pracujących bloków
                                 </span>
                              </div>
                           </div>

                           <div className="plant-power-col">
                              <div className="plant-power-num">
                                 <strong>
                                    {plant.totalPowerMW.toLocaleString(
                                       "pl-PL",
                                       {
                                          maximumFractionDigits: 1,
                                       },
                                    )}
                                 </strong>{" "}
                                 <small>MW</small>
                              </div>
                              <div className="plant-power-bar-wrap">
                                 <div
                                    className="plant-power-bar"
                                    style={{ width: `${powerPct}%` }}
                                 />
                              </div>
                           </div>
                        </button>

                        {/* Collapsible details for blocks */}
                        {isExpanded && (
                           <div className="plant-units-dropdown">
                              <table className="plant-units-table">
                                 <thead>
                                    <tr>
                                       <th>Blok</th>
                                       <th>Typ</th>
                                       <th className="text-right">Moc</th>
                                       <th className="text-center">Status</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {plant.units.map((unit) => {
                                       const isUnitActive = unit.powerMW > 0;
                                       return (
                                          <tr key={unit.code}>
                                             <td className="unit-code">
                                                {unit.code}
                                             </td>
                                             <td className="unit-type">
                                                {unit.type}
                                             </td>
                                             <td className="unit-mw text-right">
                                                <strong>
                                                   {unit.powerMW.toLocaleString(
                                                      "pl-PL",
                                                      {
                                                         maximumFractionDigits: 1,
                                                      },
                                                   )}
                                                </strong>{" "}
                                                MW
                                             </td>
                                             <td className="text-center">
                                                <span
                                                   className={`unit-badge ${
                                                      isUnitActive
                                                         ? "active"
                                                         : "idle"
                                                   }`}
                                                >
                                                   {isUnitActive
                                                      ? "Praca"
                                                      : "Postój"}
                                                </span>
                                             </td>
                                          </tr>
                                       );
                                    })}
                                 </tbody>
                              </table>
                           </div>
                        )}
                     </div>
                  );
               })
            ) : (
               <div className="data-feedback">
                  Brak elektrowni spełniających podane kryteria wyszukiwania.
               </div>
            )}
         </div>
      </div>
   );
};
