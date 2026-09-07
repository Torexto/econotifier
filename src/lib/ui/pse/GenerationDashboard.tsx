import { getGENJW, type GenerationUnitRecord } from "@/lib/api/pse";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

const parseUnitInfo = (record: GenerationUnitRecord): ParsedUnit => {
  return {
    code: record.resource_code,
    name: record.power_plant || record.resource_code,
    type: record.operating_mode || "Nieokreślony",
    powerMW: record.value ?? 0,
  };
};

interface ParsedUnit {
  code: string;
  name: string;
  type: string;
  powerMW: number;
}

export const GenerationDashboard: React.FC = () => {
  const {
    data: rawRecords,
    isLoading,
    error,
  } = useQuery({
    queryFn: () => {
      return getGENJW();
    },
    queryKey: ["gen-jw"],
    staleTime: 1000 * 60 * 15,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  const units = useMemo<ParsedUnit[]>(() => {
    if (!rawRecords) return [];
    return rawRecords.map(parseUnitInfo);
  }, [rawRecords]);

  // Filtrowanie po frazie i stanie pracy
  const filteredData = useMemo(() => {
    return units.filter((unit) => {
      const matchesSearch =
        unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterActiveOnly ? unit.powerMW > 0 : true;

      return matchesSearch && matchesStatus;
    });
  }, [units, searchTerm, filterActiveOnly]);

  // Szybkie statystyki
  const stats = useMemo(() => {
    const totalPower = units.reduce((acc, u) => acc + u.powerMW, 0);
    const activeUnits = units.filter((u) => u.powerMW > 0).length;
    const inactiveUnits = units.length - activeUnits;

    return { totalPower, activeUnits, inactiveUnits };
  }, [units]);

  // Standby / Loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100 text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">
            Pobieranie danych o generacji...
          </p>
        </div>
      </div>
    );
  }

  // Obsługa błędu
  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 max-w-xl mx-auto my-8">
        <h3 className="font-semibold text-lg mb-1">Błąd pobierania danych</h3>
        <p className="text-sm">
          Nie udało się załadować danych generacji JW. Upewnij się, że endpoint
          API działa poprawnie.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-50 min-h-screen text-slate-800">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Generacja Mocy Jednostek Wytwórczych
        </h1>
        <p className="text-sm text-slate-500">
          Aktualny stan generacji energii w czasie rzeczywistym
        </p>
      </header>

      {/* Kafelki ze statystykami */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Łączna moc
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {stats.totalPower.toLocaleString("pl-PL", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{" "}
            MW
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Jednostki pracujące
          </span>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {stats.activeUnits}{" "}
            <span className="text-sm font-normal text-slate-500">
              / {units.length}
            </span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Jednostki niepracujące
          </span>
          <p className="text-2xl font-bold text-rose-500 mt-1">
            {stats.inactiveUnits}
          </p>
        </div>
      </div>

      {/* Pasek wyszukiwania i filtrów */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Szukaj po kodzie, nazwie lub typie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 self-start sm:self-auto">
          <input
            type="checkbox"
            checked={filterActiveOnly}
            onChange={(e) => setFilterActiveOnly(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
          />
          Pokaż tylko pracujące jednostki (&gt; 0 MW)
        </label>
      </div>

      {/* Tabela danych */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Kod JW</th>
                <th className="py-3 px-4">Nazwa / Opis</th>
                <th className="py-3 px-4">Typ / Źródło</th>
                <th className="py-3 px-4 text-right">Generacja (MW)</th>
                <th className="py-3 px-4 text-center">Stan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map((unit) => {
                  const isActive = unit.powerMW > 0;
                  return (
                    <tr
                      key={unit.code}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-500">
                        {unit.code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {unit.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{unit.type}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {unit.powerMW.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isActive ? "Praca" : "Postój"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Brak wyników spełniających kryteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
