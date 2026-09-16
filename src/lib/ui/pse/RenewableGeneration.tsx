import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Calendar,
  Clock,
  Droplets,
  Factory,
  Flame,
  Info,
  Leaf,
  RefreshCw,
  Sun,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type EntsoeGenerationRecord,
  getHISGenPAL,
  processHisGenPal,
} from "@/lib/api/pse";
import { FeedbackState } from "@/lib/ui/shared";
import { cn } from "@/lib/ui/utils";

type ChartViewMode = "oze_stacked" | "full_mix" | "oze_percent";

const renderFuelIcon = (iconType: string, size = 14) => {
  switch (iconType) {
    case "solar":
      return <Sun size={size} aria-hidden="true" />;
    case "wind":
      return <Wind size={size} aria-hidden="true" />;
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

function getPolishDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Warsaw",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function RenewableGeneration() {
  const todayStr = useMemo(() => getPolishDateString(0), []);
  const yesterdayStr = useMemo(() => getPolishDateString(-1), []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [chartMode, setChartMode] = useState<ChartViewMode>("oze_stacked");

  const isToday = selectedDate === todayStr;

  const {
    data: rawRecords,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<EntsoeGenerationRecord[]>({
    queryKey: ["his-gen-pal", selectedDate],
    queryFn: () => getHISGenPAL(selectedDate),
    staleTime: 1000 * 60 * 5,
    refetchInterval: isToday ? 1000 * 60 * 5 : false,
  });

  const summary = useMemo(
    () => processHisGenPal(rawRecords ?? []),
    [rawRecords],
  );

  if (isLoading) {
    return (
      <FeedbackState
        type="loading"
        message="Pobieranie danych o generacji OZE z PSE (raport HIS-GEN-PAL)…"
      />
    );
  }

  if (isError) {
    return (
      <FeedbackState
        type="error"
        message={`Błąd podczas ładowania danych generacji paliwowej: ${(error as Error).message}`}
      />
    );
  }

  if (!rawRecords || rawRecords.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-[#1a241e]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                selectedDate === todayStr
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-300",
              )}
              onClick={() => setSelectedDate(todayStr)}
            >
              Dzisiaj
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                selectedDate === yesterdayStr
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-300",
              )}
              onClick={() => setSelectedDate(yesterdayStr)}
            >
              Wczoraj
            </button>
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-300">
              <Calendar size={13} aria-hidden="true" />
              <input
                type="date"
                className="cursor-pointer bg-transparent text-xs text-slate-800 outline-hidden dark:text-slate-100"
                value={selectedDate}
                max={todayStr}
                onChange={(e) =>
                  e.target.value && setSelectedDate(e.target.value)
                }
              />
            </label>
          </div>
        </div>
        <FeedbackState
          type="empty"
          message={`Brak danych o generacji OZE dla dnia ${selectedDate}. Wybierz inną datę.`}
        />
      </div>
    );
  }

  const {
    timeline,
    currentInterval,
    currentOzeMW,
    currentTotalMW,
    currentOzeSharePct,
    peakOzeMW,
    peakOzeTime,
    peakOzeSharePct,
    peakOzeShareTime,
    peakSolarMW,
    peakSolarTime,
    peakWindMW,
    peakWindTime,
    totalOzeEnergyMWh,
    dailyAverageOzeSharePct,
    fuelsBreakdown,
  } = summary;

  const latestSolar = currentInterval?.solar ?? 0;
  const latestWind = currentInterval?.wind ?? 0;
  const latestHydro = currentInterval?.hydro ?? 0;
  const latestBiomass = currentInterval?.biomass ?? 0;
  const latestOtherOze = currentInterval?.otherOze ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: Date Selector & Live Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-[#1a241e]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
              selectedDate === todayStr
                ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-300",
            )}
            onClick={() => setSelectedDate(todayStr)}
          >
            Dzisiaj
          </button>
          <button
            type="button"
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
              selectedDate === yesterdayStr
                ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-300",
            )}
            onClick={() => setSelectedDate(yesterdayStr)}
          >
            Wczoraj
          </button>
          <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-300">
            <Calendar size={13} aria-hidden="true" />
            <input
              type="date"
              className="cursor-pointer bg-transparent text-xs text-slate-800 outline-hidden dark:text-slate-100"
              value={selectedDate}
              max={todayStr}
              onChange={(e) =>
                e.target.value && setSelectedDate(e.target.value)
              }
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          {currentInterval && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Clock size={12} aria-hidden="true" /> Odczyt:{" "}
              <strong className="font-mono text-slate-800 dark:text-slate-200">
                {currentInterval.period}
              </strong>
            </span>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-[#1a241e] dark:text-slate-300 dark:hover:bg-[#223126]"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Odśwież dane z PSE"
          >
            <RefreshCw
              size={12}
              className={isFetching ? "animate-spin text-emerald-600" : ""}
            />
            <span>Odśwież</span>
          </button>
        </div>
      </div>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Main OZE Share */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#1a241e]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Udział OZE w KSE
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                  currentOzeSharePct >= 50
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
                )}
              >
                <Leaf size={10} aria-hidden="true" />
                <span>
                  {currentOzeSharePct >= 50 ? "Wysoki" : "Standardowy"}
                </span>
              </span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight text-emerald-600 sm:text-3xl dark:text-emerald-400">
              {currentOzeSharePct.toFixed(1)}%
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#233227]">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{
                  width: `${Math.min(currentOzeSharePct, 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-200">
              {currentOzeMW.toLocaleString("pl-PL", {
                maximumFractionDigits: 0,
              })}{" "}
              MW
            </strong>{" "}
            z{" "}
            {currentTotalMW.toLocaleString("pl-PL", {
              maximumFractionDigits: 0,
            })}{" "}
            MW generacji
          </div>
        </article>

        {/* Card 2: Solar PV */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#1a241e]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Fotowoltaika (PV)
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                <Sun size={13} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight text-amber-600 sm:text-3xl dark:text-amber-400">
              {latestSolar.toLocaleString("pl-PL", {
                maximumFractionDigits: 0,
              })}{" "}
              <small className="text-xs font-semibold text-slate-400">MW</small>
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            Szczyt doby:{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {peakSolarMW.toLocaleString("pl-PL", {
                maximumFractionDigits: 0,
              })}{" "}
              MW
            </strong>{" "}
            ({peakSolarTime})
          </div>
        </article>

        {/* Card 3: Wind Power */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#1a241e]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Farmy wiatrowe
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Wind size={13} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight text-emerald-600 sm:text-3xl dark:text-emerald-400">
              {latestWind.toLocaleString("pl-PL", {
                maximumFractionDigits: 0,
              })}{" "}
              <small className="text-xs font-semibold text-slate-400">MW</small>
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            Szczyt doby:{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {peakWindMW.toLocaleString("pl-PL", {
                maximumFractionDigits: 0,
              })}{" "}
              MW
            </strong>{" "}
            ({peakWindTime})
          </div>
        </article>

        {/* Card 4: Hydro & Biomass & Other */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#1a241e]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Woda i biomasa
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400">
                <Droplets size={13} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-black tracking-tight text-cyan-600 sm:text-3xl dark:text-cyan-400">
              {(latestHydro + latestBiomass + latestOtherOze).toLocaleString(
                "pl-PL",
                {
                  maximumFractionDigits: 0,
                },
              )}{" "}
              <small className="text-xs font-semibold text-slate-400">MW</small>
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            Woda: {latestHydro.toFixed(0)} MW · Biomasa:{" "}
            {latestBiomass.toFixed(0)} MW
          </div>
        </article>
      </div>

      {/* Highlight Summary Strip */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-emerald-900/10 bg-emerald-50/50 p-3.5 sm:grid-cols-3 dark:border-emerald-500/10 dark:bg-[#16221b]">
        <div className="flex items-center gap-3">
          <TrendingUp
            size={16}
            className="text-emerald-600 shrink-0 dark:text-emerald-400"
          />
          <div className="flex flex-col text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Rekord mocy OZE doby
            </span>
            <strong className="text-slate-900 dark:text-slate-100">
              {peakOzeMW.toLocaleString("pl-PL", {
                maximumFractionDigits: 0,
              })}{" "}
              MW{" "}
              <small className="font-normal text-slate-500">
                ({peakOzeSharePct.toFixed(1)}% o {peakOzeTime})
              </small>
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Activity
            size={16}
            className="text-emerald-600 shrink-0 dark:text-emerald-400"
          />
          <div className="flex flex-col text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Średni dobowy udział OZE
            </span>
            <strong className="text-slate-900 dark:text-slate-100">
              {dailyAverageOzeSharePct.toFixed(1)}%{" "}
              <small className="font-normal text-slate-500">
                (
                {(totalOzeEnergyMWh / 1000).toLocaleString("pl-PL", {
                  maximumFractionDigits: 1,
                })}{" "}
                GWh)
              </small>
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Info
            size={16}
            className="text-emerald-600 shrink-0 dark:text-emerald-400"
          />
          <div className="flex flex-col text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Maksymalny udział zielonej energii
            </span>
            <strong className="text-slate-900 dark:text-slate-100">
              {peakOzeSharePct.toFixed(1)}%{" "}
              <small className="font-normal text-slate-500">
                (godz. {peakOzeShareTime})
              </small>
            </strong>
          </div>
        </div>
      </div>

      {/* Chart Section with View Mode Switcher */}
      <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-[#1a241e]">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base dark:text-white">
              Przebieg dobowy generacji OZE w Polsce
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Rzeczywiste odczyty z 15-minutowych okresów bilansowania PSE ·{" "}
              {selectedDate}
            </p>
          </div>

          {/* View Mode Tabs */}
          <div
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-[#16201a]"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={chartMode === "oze_stacked"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                chartMode === "oze_stacked"
                  ? "bg-white text-emerald-800 shadow-xs dark:bg-[#25392b] dark:text-emerald-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
              )}
              onClick={() => setChartMode("oze_stacked")}
            >
              <Leaf size={12} />
              <span>Źródła OZE</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={chartMode === "full_mix"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                chartMode === "full_mix"
                  ? "bg-white text-emerald-800 shadow-xs dark:bg-[#25392b] dark:text-emerald-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
              )}
              onClick={() => setChartMode("full_mix")}
            >
              <Zap size={12} />
              <span>Pełny miks</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={chartMode === "oze_percent"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                chartMode === "oze_percent"
                  ? "bg-white text-emerald-800 shadow-xs dark:bg-[#25392b] dark:text-emerald-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
              )}
              onClick={() => setChartMode("oze_percent")}
            >
              <TrendingUp size={12} />
              <span>Udział OZE (%)</span>
            </button>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === "oze_stacked" ? (
              <AreaChart
                data={timeline}
                margin={{ top: 12, right: 12, bottom: 0, left: -10 }}
              >
                <defs>
                  <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="gradWind" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="gradHydro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.15} />
                  </linearGradient>
                  <linearGradient id="gradBiomass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
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
                  tick={{ fill: "#718076", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #dbe7da",
                    background: "rgba(255, 255, 255, 0.96)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} MW`,
                    name,
                  ]}
                  labelFormatter={(label) => `Okres od: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area
                  type="monotone"
                  dataKey="solar"
                  name="Fotowoltaika (PV)"
                  stackId="1"
                  stroke="#ca8a04"
                  fill="url(#gradSolar)"
                />
                <Area
                  type="monotone"
                  dataKey="wind"
                  name="Wiatr"
                  stackId="1"
                  stroke="#16a34a"
                  fill="url(#gradWind)"
                />
                <Area
                  type="monotone"
                  dataKey="biomass"
                  name="Biomasa"
                  stackId="1"
                  stroke="#059669"
                  fill="url(#gradBiomass)"
                />
                <Area
                  type="monotone"
                  dataKey="hydro"
                  name="Woda"
                  stackId="1"
                  stroke="#0891b2"
                  fill="url(#gradHydro)"
                />
              </AreaChart>
            ) : chartMode === "full_mix" ? (
              <AreaChart
                data={timeline}
                margin={{ top: 12, right: 12, bottom: 0, left: -10 }}
              >
                <defs>
                  <linearGradient id="gradOzeTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="gradGas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="gradHardCoal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4b5563" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#4b5563" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient
                    id="gradBrownCoal"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#b45309" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#b45309" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
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
                  tick={{ fill: "#718076", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #dbe7da",
                    background: "rgba(255, 255, 255, 0.96)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} MW`,
                    name,
                  ]}
                  labelFormatter={(label) => `Okres od: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area
                  type="monotone"
                  dataKey="ozeTotal"
                  name="OZE (Słońce, Wiatr, Woda, Biomasa)"
                  stackId="1"
                  stroke="#16a34a"
                  fill="url(#gradOzeTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="gas"
                  name="Gaz ziemny"
                  stackId="1"
                  stroke="#0284c7"
                  fill="url(#gradGas)"
                />
                <Area
                  type="monotone"
                  dataKey="hardCoal"
                  name="Węgiel kamienny"
                  stackId="1"
                  stroke="#374151"
                  fill="url(#gradHardCoal)"
                />
                <Area
                  type="monotone"
                  dataKey="brownCoal"
                  name="Węgiel brunatny"
                  stackId="1"
                  stroke="#92400e"
                  fill="url(#gradBrownCoal)"
                />
              </AreaChart>
            ) : (
              <LineChart
                data={timeline}
                margin={{ top: 12, right: 12, bottom: 0, left: -10 }}
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
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fill: "#718076", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #dbe7da",
                    background: "rgba(255, 255, 255, 0.96)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                  formatter={(value) => [
                    `${Number(value).toFixed(1)}%`,
                    "Udział OZE",
                  ]}
                  labelFormatter={(label) => `Okres od: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey="ozeSharePct"
                  name="Udział OZE w generacji (%)"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </article>

      {/* Detailed Fuel Breakdown Grid */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-[#1a241e]">
        <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Leaf
              size={15}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <span>Szczegółowy podział paliwowy (Raport PSE HIS-GEN-PAL)</span>
          </div>
          <span className="text-xs text-slate-400">
            Aktualne moce i szczyt doby dla każdego źródła ENTSO-E
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {fuelsBreakdown.map((fuel) => (
            <div
              key={fuel.alias}
              className={cn(
                "flex flex-col justify-between rounded-xl border p-3.5 transition-colors",
                fuel.isRenewable
                  ? "border-emerald-200/80 bg-emerald-50/30 hover:border-emerald-300 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:hover:border-emerald-700/50"
                  : "border-slate-200/80 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-[#16201a] dark:hover:border-slate-700",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: fuel.color }}
                  />
                  <span className="text-slate-400 dark:text-slate-500">
                    {renderFuelIcon(fuel.iconType, 13)}
                  </span>
                  <strong className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                    {fuel.name}
                  </strong>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {fuel.alias}
                  </span>
                </div>

                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                    fuel.isRenewable
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                  )}
                >
                  {fuel.isRenewable ? "OZE" : "Kopalne"}
                </span>
              </div>

              <div className="my-2.5 flex items-baseline justify-between">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Moc bieżąca
                  </span>
                  <strong className="text-base font-bold text-slate-900 dark:text-white">
                    {fuel.currentMW.toLocaleString("pl-PL", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    <small className="text-[10px] font-normal text-slate-400">
                      MW
                    </small>
                  </strong>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Udział
                  </span>
                  <strong
                    className={cn(
                      "text-sm font-bold",
                      fuel.isRenewable
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-600 dark:text-slate-400",
                    )}
                  >
                    {fuel.sharePct.toFixed(1)}%
                  </strong>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800/80 dark:text-slate-400 flex items-center justify-between">
                <span>Szczyt doby:</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {fuel.peakMW.toLocaleString("pl-PL", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  MW
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
