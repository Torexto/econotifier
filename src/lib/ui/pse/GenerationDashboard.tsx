import { useQuery } from "@tanstack/react-query";
import {
   ChevronDown,
   ChevronRight,
   ChevronsDownUp,
   ChevronsUpDown,
   Droplets,
   Factory,
   Flame,
   Leaf,
   Search,
   Sun,
   Wind,
   Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
   classifyPlant,
   type EnergyCategory,
   type EnergyClassification,
   type GenerationUnitRecord,
   getGENJW,
} from "@/lib/api/pse";
import { FeedbackState } from "@/lib/ui/shared";
import { cn } from "@/lib/ui/utils";

interface ParsedUnit {
   code: string;
   name: string;
   plant: string;
   type: string;
   powerMW: number;
   classification: EnergyClassification;
}

interface PlantGroup {
   name: string;
   totalPowerMW: number;
   activeUnitsCount: number;
   totalUnitsCount: number;
   primaryType: string;
   allTypes: string[];
   classification: EnergyClassification;
   units: ParsedUnit[];
}

const renderSourceIcon = (iconType: string, size = 14) => {
   switch (iconType) {
      case "wind":
         return <Wind size={size} aria-hidden="true" />;
      case "solar":
         return <Sun size={size} aria-hidden="true" />;
      case "hydro":
         return <Droplets size={size} aria-hidden="true" />;
      case "biomass":
         return <Leaf size={size} aria-hidden="true" />;
      case "gas":
         return <Flame size={size} aria-hidden="true" />;
      case "coal":
      case "lignite":
         return <Factory size={size} aria-hidden="true" />;
      default:
         return <Zap size={size} aria-hidden="true" />;
   }
};

const parseUnitInfo = (record: GenerationUnitRecord): ParsedUnit => {
   const plantName = (record.power_plant || record.resource_code).trim();
   const classification = classifyPlant(plantName, record.resource_code);

   return {
      code: record.resource_code,
      name: record.power_plant || record.resource_code,
      plant: plantName,
      type: record.operating_mode || "Inne",
      powerMW: Math.max(0, record.value ?? 0),
      classification,
   };
};

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
   const [categoryFilter, setCategoryFilter] = useState<EnergyCategory>("all");
   const [sourceFilter, setSourceFilter] = useState<string>("all");
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
               classification: unit.classification,
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

   // Calculate summary statistics
   const stats = useMemo(() => {
      const totalPower = units.reduce((sum, unit) => sum + unit.powerMW, 0);
      const renewablePower = units
         .filter((u) => u.classification.isRenewable)
         .reduce((sum, unit) => sum + unit.powerMW, 0);
      const nonRenewablePower = Math.max(0, totalPower - renewablePower);

      const renewablePct =
         totalPower > 0 ? (renewablePower / totalPower) * 100 : 0;
      const nonRenewablePct =
         totalPower > 0 ? (nonRenewablePower / totalPower) * 100 : 0;

      const activeUnits = units.filter((unit) => unit.powerMW > 0).length;
      const activePlants = plants.filter((p) => p.activeUnitsCount > 0).length;

      const renewablePlants = plants.filter(
         (p) => p.classification.isRenewable,
      );
      const nonRenewablePlants = plants.filter(
         (p) => !p.classification.isRenewable,
      );

      const activeRenewablePlants = renewablePlants.filter(
         (p) => p.activeUnitsCount > 0,
      ).length;
      const activeNonRenewablePlants = nonRenewablePlants.filter(
         (p) => p.activeUnitsCount > 0,
      ).length;

      return {
         totalPower,
         renewablePower,
         nonRenewablePower,
         renewablePct,
         nonRenewablePct,
         activeUnits,
         totalUnits: units.length,
         activePlants,
         totalPlants: plants.length,
         renewablePlantsCount: renewablePlants.length,
         nonRenewablePlantsCount: nonRenewablePlants.length,
         activeRenewablePlants,
         activeNonRenewablePlants,
      };
   }, [units, plants]);

   // Available source types for the dropdown/pills
   const availableSources = useMemo(() => {
      const sourcesMap = new Map<
         string,
         { key: string; label: string; count: number }
      >();
      for (const plant of plants) {
         const { sourceType, sourceLabel } = plant.classification;
         const existing = sourcesMap.get(sourceType);
         if (existing) {
            existing.count += 1;
         } else {
            sourcesMap.set(sourceType, {
               key: sourceType,
               label: sourceLabel,
               count: 1,
            });
         }
      }
      return Array.from(sourcesMap.values());
   }, [plants]);

   const filteredPlants = useMemo(() => {
      const term = searchTerm.toLowerCase().trim();
      return plants.filter((plant) => {
         if (
            categoryFilter === "renewable" &&
            !plant.classification.isRenewable
         ) {
            return false;
         }
         if (
            categoryFilter === "non-renewable" &&
            plant.classification.isRenewable
         ) {
            return false;
         }

         if (
            sourceFilter !== "all" &&
            plant.classification.sourceType !== sourceFilter
         ) {
            return false;
         }

         if (filterActiveOnly && plant.activeUnitsCount === 0) {
            return false;
         }

         if (!term) return true;

         return (
            plant.name.toLowerCase().includes(term) ||
            plant.primaryType.toLowerCase().includes(term) ||
            plant.classification.sourceLabel.toLowerCase().includes(term) ||
            plant.classification.categoryLabel.toLowerCase().includes(term) ||
            plant.classification.subtype.toLowerCase().includes(term) ||
            plant.units.some((u) => u.code.toLowerCase().includes(term))
         );
      });
   }, [plants, searchTerm, filterActiveOnly, categoryFilter, sourceFilter]);

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

   if (isLoading) {
      return (
         <FeedbackState
            type="loading"
            message="Pobieranie danych o generacji bloków wytwórczych (GEN-JW)…"
         />
      );
   }

   if (error) {
      return (
         <FeedbackState
            type="error"
            message="Nie udało się załadować danych generacji JW. Sprawdź połączenie z API PSE."
         />
      );
   }

   return (
      <div className="flex flex-col gap-4">
         {/* Renewable vs Non-Renewable KPI Grid */}
         <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#1a241e]">
               <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                     Łączna moc w KSE
                  </span>
                  <p className="mt-2 text-2xl font-black tracking-tight text-emerald-800 sm:text-3xl dark:text-emerald-300">
                     {stats.totalPower.toLocaleString("pl-PL", {
                        maximumFractionDigits: 1,
                     })}{" "}
                     <small className="text-xs font-semibold text-slate-400">
                        MW
                     </small>
                  </p>
               </div>
               <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {stats.activePlants} / {stats.totalPlants} elektrowni w pracy
               </div>
            </article>

            <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#1a241e]">
               <div>
                  <div className="flex items-center justify-between gap-2">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Źródła odnawialne (OZE)
                     </span>
                     <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <Leaf size={10} aria-hidden="true" />
                        <span>{stats.renewablePct.toFixed(1)}%</span>
                     </span>
                  </div>
                  <p className="mt-2 text-2xl font-black tracking-tight text-emerald-600 sm:text-3xl dark:text-emerald-400">
                     {stats.renewablePower.toLocaleString("pl-PL", {
                        maximumFractionDigits: 1,
                     })}{" "}
                     <small className="text-xs font-semibold text-slate-400">
                        MW
                     </small>
                  </p>
               </div>
               <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {stats.activeRenewablePlants} / {stats.renewablePlantsCount}{" "}
                  pracujących OZE
               </div>
            </article>

            <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#1a241e]">
               <div>
                  <div className="flex items-center justify-between gap-2">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Źródła nieodnawialne
                     </span>
                     <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        <Factory size={10} aria-hidden="true" />
                        <span>{stats.nonRenewablePct.toFixed(1)}%</span>
                     </span>
                  </div>
                  <p className="mt-2 text-2xl font-black tracking-tight text-amber-600 sm:text-3xl dark:text-amber-400">
                     {stats.nonRenewablePower.toLocaleString("pl-PL", {
                        maximumFractionDigits: 1,
                     })}{" "}
                     <small className="text-xs font-semibold text-slate-400">
                        MW
                     </small>
                  </p>
               </div>
               <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {stats.activeNonRenewablePlants} /{" "}
                  {stats.nonRenewablePlantsCount} pracujących konwencjonalnych
               </div>
            </article>
         </div>

         {/* Visual Energy Mix Bar */}
         <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-[#1a241e]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
               <div className="inline-flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Struktura miksu wytwórczego w KSE</span>
               </div>
               <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                     <span className="h-2 w-2 rounded-xs bg-emerald-500" />
                     Odnawialne:{" "}
                     <strong className="text-slate-800 dark:text-slate-200">
                        {stats.renewablePct.toFixed(1)}%
                     </strong>{" "}
                     ({stats.renewablePower.toFixed(0)} MW)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                     <span className="h-2 w-2 rounded-xs bg-amber-500" />
                     Nieodnawialne:{" "}
                     <strong className="text-slate-800 dark:text-slate-200">
                        {stats.nonRenewablePct.toFixed(1)}%
                     </strong>{" "}
                     ({stats.nonRenewablePower.toFixed(0)} MW)
                  </span>
               </div>
            </div>

            <div
               className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#233227]"
               role="progressbar"
               aria-valuenow={stats.renewablePct}
               aria-valuemin={0}
               aria-valuemax={100}
            >
               <div
                  className="h-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${Math.max(stats.renewablePct, 0)}%` }}
                  title={`OZE: ${stats.renewablePct.toFixed(1)}%`}
               />
               <div
                  className="h-full bg-linear-to-r from-amber-400 to-amber-600 transition-all duration-300"
                  style={{ width: `${Math.max(stats.nonRenewablePct, 0)}%` }}
                  title={`Nieodnawialne: ${stats.nonRenewablePct.toFixed(1)}%`}
               />
            </div>
         </div>

         {/* Category Switcher Tabs */}
         <div className="flex items-center justify-start">
            <div
               className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-[#16201a]"
               role="tablist"
            >
               <button
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === "all"}
                  className={cn(
                     "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                     categoryFilter === "all"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-[#233227] dark:text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                  )}
                  onClick={() => {
                     setCategoryFilter("all");
                     setSourceFilter("all");
                  }}
               >
                  <Zap size={13} aria-hidden="true" />
                  <span>Wszystkie</span>
                  <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                     {plants.length}
                  </span>
               </button>

               <button
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === "renewable"}
                  className={cn(
                     "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                     categoryFilter === "renewable"
                        ? "bg-white text-emerald-800 shadow-xs dark:bg-[#233227] dark:text-emerald-300"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                  )}
                  onClick={() => {
                     setCategoryFilter("renewable");
                     setSourceFilter("all");
                  }}
               >
                  <Leaf size={13} aria-hidden="true" />
                  <span>Odnawialne (OZE)</span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                     {stats.renewablePlantsCount}
                  </span>
               </button>

               <button
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === "non-renewable"}
                  className={cn(
                     "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                     categoryFilter === "non-renewable"
                        ? "bg-white text-amber-800 shadow-xs dark:bg-[#233227] dark:text-amber-300"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                  )}
                  onClick={() => {
                     setCategoryFilter("non-renewable");
                     setSourceFilter("all");
                  }}
               >
                  <Factory size={13} aria-hidden="true" />
                  <span>Nieodnawialne</span>
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                     {stats.nonRenewablePlantsCount}
                  </span>
               </button>
            </div>
         </div>

         {/* Filters & Search Toolbar */}
         <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-[#1a241e]">
            <div className="relative w-full sm:max-w-xs">
               <Search
                  size={14}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
               />
               <input
                  type="search"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pr-3 pl-8.5 text-xs text-slate-800 outline-hidden transition-colors focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-100 dark:focus:border-emerald-500"
                  placeholder="Szukaj elektrowni, źródła lub bloku…"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
               />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
               {availableSources.length > 0 && (
                  <select
                     className="rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 font-medium text-slate-700 outline-hidden dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-300"
                     value={sourceFilter}
                     onChange={(e) => setSourceFilter(e.target.value)}
                     aria-label="Filtruj według typu źródła energii"
                  >
                     <option value="all">Wszystkie źródła</option>
                     {availableSources.map((s) => (
                        <option key={s.key} value={s.key}>
                           {s.label} ({s.count})
                        </option>
                     ))}
                  </select>
               )}

               <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-600 dark:text-slate-300">
                  <input
                     type="checkbox"
                     className="h-3.5 w-3.5 rounded-sm accent-emerald-600"
                     checked={filterActiveOnly}
                     onChange={(event) =>
                        setFilterActiveOnly(event.target.checked)
                     }
                  />
                  <span>Tylko pracujące</span>
               </label>

               <button
                  type="button"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                  onClick={toggleAll}
               >
                  {expandedPlants.size > 0 ? (
                     <>
                        <ChevronsDownUp size={13} />
                        <span>Zwiń bloki</span>
                     </>
                  ) : (
                     <>
                        <ChevronsUpDown size={13} />
                        <span>Rozwiń bloki</span>
                     </>
                  )}
               </button>
            </div>
         </div>

         {/* Grouped Power Plants List */}
         <div className="flex flex-col gap-2">
            {filteredPlants.length ? (
               filteredPlants.map((plant) => {
                  const isExpanded = expandedPlants.has(plant.name);
                  const isWorking = plant.activeUnitsCount > 0;
                  const isOze = plant.classification.isRenewable;
                  const powerPct = Math.min(
                     100,
                     Math.round((plant.totalPowerMW / maxPower) * 100),
                  );

                  return (
                     <div
                        key={plant.name}
                        className={cn(
                           "overflow-hidden rounded-2xl border transition-all",
                           isWorking
                              ? "border-slate-200/90 bg-white dark:border-slate-800 dark:bg-[#1a241e]"
                              : "border-slate-200/60 bg-white/70 opacity-75 dark:border-slate-800/60 dark:bg-[#1a241e]/70",
                        )}
                     >
                        <button
                           type="button"
                           className="flex w-full items-center justify-between gap-4 p-4 text-left cursor-pointer transition-colors hover:bg-slate-50/50 dark:hover:bg-[#202e23]/30"
                           onClick={() => togglePlant(plant.name)}
                           aria-expanded={isExpanded}
                        >
                           <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span
                                 className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                                    isOze
                                       ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                       : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
                                 )}
                                 title={plant.classification.sourceLabel}
                              >
                                 {renderSourceIcon(
                                    plant.classification.iconType,
                                    16,
                                 )}
                              </span>

                              <div className="flex flex-col gap-1 min-w-0">
                                 <div className="flex flex-wrap items-center gap-2">
                                    <strong className="text-sm font-bold text-slate-900 dark:text-white">
                                       {plant.name}
                                    </strong>

                                    {/* Renewable / Fossil Tag */}
                                    <span
                                       className={cn(
                                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase",
                                          isOze
                                             ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                             : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
                                       )}
                                    >
                                       {isOze ? (
                                          <>
                                             <Leaf
                                                size={10}
                                                aria-hidden="true"
                                             />
                                             <span>OZE</span>
                                          </>
                                       ) : (
                                          <>
                                             <Factory
                                                size={10}
                                                aria-hidden="true"
                                             />
                                             <span>Kopalne</span>
                                          </>
                                       )}
                                    </span>

                                    {/* Source Specific Pill */}
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                       {plant.classification.sourceLabel}
                                    </span>

                                    {plant.classification.subtype && (
                                       <span className="hidden sm:inline rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                                          {plant.classification.subtype}
                                       </span>
                                    )}
                                 </div>

                                 <span className="text-xs text-slate-400">
                                    {plant.activeUnitsCount} /{" "}
                                    {plant.totalUnitsCount} pracujących bloków
                                 </span>
                              </div>
                           </div>

                           <div className="flex shrink-0 items-center gap-4">
                              <div className="flex flex-col items-end gap-1 min-w-[110px]">
                                 <div className="text-sm font-bold text-slate-900 dark:text-white">
                                    {plant.totalPowerMW.toLocaleString(
                                       "pl-PL",
                                       {
                                          maximumFractionDigits: 1,
                                       },
                                    )}{" "}
                                    <small className="text-[10px] font-normal text-slate-400">
                                       MW
                                    </small>
                                 </div>
                                 <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#233227]">
                                    <div
                                       className={cn(
                                          "h-full rounded-full transition-all",
                                          isOze
                                             ? "bg-emerald-500"
                                             : plant.classification
                                                    .badgeVariant === "gas"
                                               ? "bg-sky-500"
                                               : "bg-amber-500",
                                       )}
                                       style={{ width: `${powerPct}%` }}
                                    />
                                 </div>
                              </div>

                              <span className="text-slate-400">
                                 {isExpanded ? (
                                    <ChevronDown size={16} />
                                 ) : (
                                    <ChevronRight size={16} />
                                 )}
                              </span>
                           </div>
                        </button>

                        {/* Collapsible details for blocks */}
                        {isExpanded && (
                           <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:px-6 dark:border-slate-800 dark:bg-[#16201a]/60">
                              <div className="overflow-x-auto">
                                 <table className="w-full text-left text-xs">
                                    <thead>
                                       <tr className="border-b border-slate-200/70 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                                          <th className="pb-2">Blok</th>
                                          <th className="pb-2">Źródło</th>
                                          <th className="pb-2">Typ / Tryb</th>
                                          <th className="pb-2 text-right">
                                             Moc
                                          </th>
                                          <th className="pb-2 text-center">
                                             Status
                                          </th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                       {plant.units.map((unit) => {
                                          const isUnitActive = unit.powerMW > 0;
                                          const isUnitOze =
                                             unit.classification.isRenewable;

                                          return (
                                             <tr
                                                key={unit.code}
                                                className="hover:bg-slate-100/40 dark:hover:bg-[#202e23]/30"
                                             >
                                                <td className="py-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                   {unit.code}
                                                </td>
                                                <td className="py-2.5">
                                                   <span
                                                      className={cn(
                                                         "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                                         isUnitOze
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                            : "bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                                                      )}
                                                   >
                                                      {renderSourceIcon(
                                                         unit.classification
                                                            .iconType,
                                                         11,
                                                      )}
                                                      <span>
                                                         {
                                                            unit.classification
                                                               .sourceLabel
                                                         }
                                                      </span>
                                                   </span>
                                                </td>
                                                <td className="py-2.5 text-slate-500 dark:text-slate-400">
                                                   {unit.type}
                                                </td>
                                                <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                   {unit.powerMW.toLocaleString(
                                                      "pl-PL",
                                                      {
                                                         maximumFractionDigits: 1,
                                                      },
                                                   )}{" "}
                                                   <span className="font-normal text-slate-400">
                                                      MW
                                                   </span>
                                                </td>
                                                <td className="py-2.5 text-center">
                                                   <span
                                                      className={cn(
                                                         "inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                                                         isUnitActive
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                                                            : "bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                                                      )}
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
                           </div>
                        )}
                     </div>
                  );
               })
            ) : (
               <FeedbackState
                  type="empty"
                  message="Brak elektrowni spełniających podane kryteria wyszukiwania."
               />
            )}
         </div>
      </div>
   );
};
