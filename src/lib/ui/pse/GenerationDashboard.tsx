import { getGENJW, type GenerationUnitRecord } from "@/lib/api/pse";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

interface ParsedUnit {
   code: string;
   name: string;
   type: string;
   powerMW: number;
}
const parseUnitInfo = (record: GenerationUnitRecord): ParsedUnit => ({
   code: record.resource_code,
   name: record.power_plant || record.resource_code,
   type: record.operating_mode || "Nieokreślony",
   powerMW: record.value ?? 0,
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
   const units = useMemo(
      () => rawRecords?.map(parseUnitInfo) ?? [],
      [rawRecords],
   );
   const filteredData = useMemo(
      () =>
         units.filter((unit) => {
            const term = searchTerm.toLowerCase();
            return (
               (unit.name.toLowerCase().includes(term) ||
                  unit.code.toLowerCase().includes(term) ||
                  unit.type.toLowerCase().includes(term)) &&
               (!filterActiveOnly || unit.powerMW > 0)
            );
         }),
      [units, searchTerm, filterActiveOnly],
   );
   const stats = useMemo(() => {
      const activeUnits = units.filter((unit) => unit.powerMW > 0).length;
      return {
         totalPower: units.reduce((sum, unit) => sum + unit.powerMW, 0),
         activeUnits,
         inactiveUnits: units.length - activeUnits,
      };
   }, [units]);

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
      <>
         <div className="generation-header">
            <div>
               <p className="eyebrow">Źródła wytwarzania</p>
               <h2 className="generation-title">Generacja jednostek</h2>
               <p>Aktualny stan krajowych jednostek wytwórczych.</p>
            </div>
         </div>
         <div className="stats-grid">
            <article className="stat-card">
               <span>Łączna moc</span>
               <p className="total-power">
                  {stats.totalPower.toLocaleString("pl-PL", {
                     maximumFractionDigits: 1,
                  })}{" "}
                  <small>MW</small>
               </p>
            </article>
            <article className="stat-card">
               <span>Jednostki pracujące</span>
               <p>
                  {stats.activeUnits} <small>/ {units.length}</small>
               </p>
            </article>
            <article className="stat-card">
               <span>Jednostki niepracujące</span>
               <p className="inactive-power">{stats.inactiveUnits}</p>
            </article>
         </div>
         <div className="filter-card">
            <label className="search-input">
               <Search size={16} aria-hidden="true" />
               <input
                  type="search"
                  placeholder="Szukaj kodu, nazwy lub typu…"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
               />
            </label>
            <label className="active-filter">
               <input
                  type="checkbox"
                  checked={filterActiveOnly}
                  onChange={(event) =>
                     setFilterActiveOnly(event.target.checked)
                  }
               />{" "}
               Tylko pracujące jednostki
            </label>
         </div>
         <article className="generation-card">
            <div className="data-table-wrap">
               <table className="data-table">
                  <thead>
                     <tr>
                        <th>Kod JW</th>
                        <th>Nazwa / opis</th>
                        <th>Typ / źródło</th>
                        <th className="text-right">Generacja</th>
                        <th className="text-center">Stan</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filteredData.length ? (
                        filteredData.map((unit) => {
                           const isActive = unit.powerMW > 0;
                           return (
                              <tr key={unit.code}>
                                 <td className="unit-code">{unit.code}</td>
                                 <td className="unit-name">{unit.name}</td>
                                 <td>{unit.type}</td>
                                 <td className="strong-cell text-right">
                                    {unit.powerMW.toLocaleString("pl-PL", {
                                       minimumFractionDigits: 1,
                                       maximumFractionDigits: 1,
                                    })}{" "}
                                    MW
                                 </td>
                                 <td className="text-center">
                                    <span
                                       className={
                                          isActive
                                             ? "unit-status active"
                                             : "unit-status inactive"
                                       }
                                    >
                                       {isActive ? "Praca" : "Postój"}
                                    </span>
                                 </td>
                              </tr>
                           );
                        })
                     ) : (
                        <tr>
                           <td className="empty-row" colSpan={5}>
                              Brak wyników spełniających kryteria.
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </article>
      </>
   );
};
