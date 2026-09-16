import { useQuery } from "@tanstack/react-query";
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
import { FeedbackState } from "@/lib/ui/shared";

export function KseLoadChart() {
   const { data, isLoading, isError, error } = useQuery<KseLoadRecord[]>({
      queryKey: ["kse-load"],
      queryFn: getKSELoad,
      staleTime: 1000 * 60 * 5,
      refetchInterval: 1000 * 60 * 15,
   });

   if (isLoading) {
      return (
         <FeedbackState
            type="loading"
            message="Pobieranie danych zapotrzebowania KSE z PSE…"
         />
      );
   }

   if (isError) {
      return (
         <FeedbackState
            type="error"
            message={`Błąd podczas ładowania danych KSE: ${(error as Error).message}`}
         />
      );
   }

   if (!data?.length) {
      return (
         <FeedbackState
            type="empty"
            message="Brak danych o zapotrzebowaniu KSE do wyświetlenia."
         />
      );
   }

   const formattedData = data.map((item) => ({
      time: item.period,
      timeLabel: item.period.split(" - ")[0],
      actual: item.load_actual,
      forecast: item.load_fcst,
   }));

   const recentRecords = data.slice(-5).reverse();

   return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
         {/* Chart Card */}
         <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-8 sm:p-6 dark:border-slate-800 dark:bg-[#1a241e]">
            <div className="mb-4">
               <h3 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base dark:text-white">
                  Rzeczywiste zapotrzebowanie mocy
               </h3>
               <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Porównanie bieżącego zużycia i prognozy PSE · Doba:{" "}
                  {data[0]?.business_date}
               </p>
            </div>

            <div className="h-70 w-full">
               <ResponsiveContainer height="100%" width="100%">
                  <LineChart
                     data={formattedData}
                     margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
                  >
                     <CartesianGrid
                        stroke="#b7c7ba"
                        strokeDasharray="3 5"
                        vertical={false}
                        opacity={0.3}
                     />
                     <XAxis
                        dataKey="timeLabel"
                        tick={{ fill: "#718076", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        interval={7}
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
                           borderRadius: 12,
                           border: "1px solid #dbe7da",
                           background: "rgba(255, 255, 255, 0.96)",
                           boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        }}
                        formatter={(value) => [
                           `${Number(value).toLocaleString("pl-PL")} MW`,
                        ]}
                        labelFormatter={(label) => `Okres od: ${label}`}
                     />
                     <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                     <Line
                        type="monotone"
                        dataKey="actual"
                        name="Rzeczywiste"
                        stroke="#16a34a"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                     />
                     <Line
                        type="monotone"
                        dataKey="forecast"
                        name="Prognoza"
                        stroke="#d97706"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                     />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </article>

         {/* Recent Readings Sidebar */}
         <aside className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs lg:col-span-4 dark:border-slate-800 dark:bg-[#1a241e]">
            <div className="border-b border-slate-100 p-4 sm:px-5 dark:border-slate-800/80">
               <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ostatnie odczyty KSE
               </h3>
            </div>

            <ul className="divide-y divide-slate-100 p-2 sm:px-3 dark:divide-slate-800/80">
               {recentRecords.map((record) => {
                  const diff =
                     record.load_actual != null && record.load_fcst != null
                        ? record.load_actual - record.load_fcst
                        : null;

                  return (
                     <li
                        key={record.dtime_utc}
                        className="flex items-center justify-between p-2.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-[#202e23]/40"
                     >
                        <div className="flex flex-col gap-0.5">
                           <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                              {record.period}
                           </span>
                           <span className="text-[11px] text-slate-400">
                              Prognoza:{" "}
                              {record.load_fcst?.toLocaleString("pl-PL") ?? "—"}{" "}
                              MW
                           </span>
                        </div>

                        <div className="flex flex-col items-end gap-0.5">
                           <strong className="text-sm font-bold text-slate-900 dark:text-white">
                              {record.load_actual?.toLocaleString("pl-PL") ??
                                 "—"}{" "}
                              <small className="text-[10px] font-normal text-slate-500">
                                 MW
                              </small>
                           </strong>
                           {diff != null && (
                              <span
                                 className={`text-[10.5px] font-semibold ${
                                    diff > 0
                                       ? "text-amber-600 dark:text-amber-400"
                                       : "text-emerald-600 dark:text-emerald-400"
                                 }`}
                              >
                                 {diff > 0 ? "+" : ""}
                                 {diff.toLocaleString("pl-PL")} MW
                              </span>
                           )}
                        </div>
                     </li>
                  );
               })}
            </ul>
         </aside>
      </div>
   );
}
