import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Loader2, AlertCircle } from "lucide-react";
import { getKSELoad, type KseLoadRecord } from "@/lib/api/pse";

export function KseLoadChart() {
  const { data, isLoading, isError, error } = useQuery<KseLoadRecord[]>({
    queryKey: ["kse-load"],
    queryFn: getKSELoad,
    refetchInterval: 1000 * 60 * 15, // Odświeżanie co 15 minut
  });

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border bg-card p-6 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Pobieranie danych KSE...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-destructive">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span>Błąd podczas ładowania danych: {(error as Error).message}</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border bg-card p-6 text-muted-foreground">
        Brak danych do wyświetlenia.
      </div>
    );
  }

  // Formatowanie danych pod wykres
  const formattedData = data.map((item) => ({
    time: item.period,
    actual: item.load_actual,
    forecast: item.load_fcst,
  }));

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto p-4">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Krajowy System Elektroenergetyczny (KSE)
          </h2>
          <p className="text-sm text-muted-foreground">
            Porównanie rzeczywistego zapotrzebowania z prognozą (MW) • Doba:{" "}
            {data[0]?.business_date}
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="time" />
              <YAxis domain={["auto", "auto"]} unit=" MW" />
              <Tooltip
                formatter={(value: number) => [`${value?.toLocaleString()} MW`]}
                labelFormatter={(label) => `Godzina/Okres: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                name="Rzeczywiste"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Prognoza"
                stroke="#9333ea"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela podsumowująca ostatnie odczyty */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-medium">Ostatnie wpisy</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Okres</th>
                <th className="px-4 py-3">Rzeczywiste (MW)</th>
                <th className="px-4 py-3">Prognoza (MW)</th>
                <th className="px-4 py-3">Różnica</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data
                .slice(-5)
                .reverse()
                .map((record) => {
                  const diff =
                    record.load_actual && record.load_fcst
                      ? record.load_actual - record.load_fcst
                      : null;

                  return (
                    <tr key={record.dtime_utc} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{record.period}</td>
                      <td className="px-4 py-3">
                        {record.load_actual?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {record.load_fcst?.toLocaleString() ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {diff !== null ? (
                          <span
                            className={
                              diff > 0 ? "text-amber-600" : "text-emerald-600"
                            }
                          >
                            {diff > 0
                              ? `+${diff.toLocaleString()}`
                              : diff.toLocaleString()}{" "}
                            MW
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
