import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import {
   CartesianGrid,
   Legend,
   Line,
   LineChart,
   ResponsiveContainer,
   Tooltip,
   XAxis,
   YAxis,
} from "recharts";
import { getKSELoad, type KseLoadRecord } from "@/lib/api/pse";

export function KseLoadChart() {
   const { data, isLoading, isError, error } = useQuery<KseLoadRecord[]>({
      queryKey: ["kse-load"],
      queryFn: getKSELoad,
      refetchInterval: 1000 * 60 * 15,
   });
   if (isLoading)
      return (
         <div className="price-loading">
            <Loader2 className="animate-spin" size={19} /> Pobieranie danych
            KSE…
         </div>
      );
   if (isError)
      return (
         <div className="data-feedback is-error">
            <AlertCircle size={19} /> Błąd podczas ładowania danych:{" "}
            {(error as Error).message}
         </div>
      );
   if (!data?.length)
      return <div className="data-feedback">Brak danych do wyświetlenia.</div>;

   const formattedData = data.map((item) => ({
      time: item.period,
      actual: item.load_actual,
      forecast: item.load_fcst,
   }));
   const recentRecords = data.slice(-5).reverse();
   return (
      <div className="kse-wrap">
         <article className="chart-card">
            <h3>Rzeczywiste zapotrzebowanie</h3>
            <p>
               Porównanie aktualnego zużycia i prognozy ·{" "}
               {data[0]?.business_date}
            </p>
            <div className="chart-area">
               <ResponsiveContainer height="100%" width="100%">
                  <LineChart
                     data={formattedData}
                     margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
                  >
                     <CartesianGrid
                        stroke="#b7c7ba"
                        strokeDasharray="3 5"
                        vertical={false}
                     />
                     <XAxis
                        dataKey="time"
                        tick={{ fill: "#718076", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                     />
                     <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "#718076", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) =>
                           `${Math.round(value / 1000)}k`
                        }
                     />
                     <Tooltip
                        contentStyle={{
                           borderRadius: 9,
                           border: "1px solid #dbe7da",
                           background: "#fcfdfb",
                        }}
                        formatter={(value) => [
                           `${Number(value).toLocaleString("pl-PL")} MW`,
                        ]}
                        labelFormatter={(label) => `Okres: ${label}`}
                     />
                     <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                     <Line
                        type="monotone"
                        dataKey="actual"
                        name="Rzeczywiste"
                        stroke="#2a9866"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                     />
                     <Line
                        type="monotone"
                        dataKey="forecast"
                        name="Prognoza"
                        stroke="#efae39"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                     />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </article>
         <aside className="recent-card">
            <h3>Ostatnie odczyty</h3>
            <ul className="recent-list">
               {recentRecords.map((record) => {
                  const diff =
                     record.load_actual != null && record.load_fcst != null
                        ? record.load_actual - record.load_fcst
                        : null;
                  return (
                     <li key={record.dtime_utc}>
                        <span className="recent-time">{record.period}</span>
                        <span className="recent-values">
                           <strong>
                              {record.load_actual?.toLocaleString("pl-PL") ??
                                 "—"}{" "}
                              MW
                           </strong>
                           <span>
                              Prognoza{" "}
                              {record.load_fcst?.toLocaleString("pl-PL") ?? "—"}{" "}
                              ·{" "}
                              {diff == null ? (
                                 "—"
                              ) : (
                                 <b
                                    className={
                                       diff > 0
                                          ? "load-diff-up"
                                          : "load-diff-down"
                                    }
                                 >
                                    {diff > 0 ? "+" : ""}
                                    {diff.toLocaleString("pl-PL")}
                                 </b>
                              )}
                           </span>
                        </span>
                     </li>
                  );
               })}
            </ul>
         </aside>
      </div>
   );
}
