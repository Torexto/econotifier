import { useQuery } from "@tanstack/react-query";
import {
   AlertCircle,
   Building2,
   CheckCircle2,
   Clock,
   Gauge,
   Info,
   LocateFixed,
   MapPin,
   RefreshCw,
   Search,
   Wind,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
   type AirQualityResponse,
   type AirQualityStation,
   getAirQuality,
   getStations,
} from "@/lib/api/air-quality";
import { FeedbackState } from "@/lib/ui/shared";
import { cn } from "@/lib/ui/utils";

type GeoState = {
   lat: number | null;
   lon: number | null;
   isLocating: boolean;
   error: string | null;
};

const POLLUTANT_INFO: Record<
   string,
   { name: string; standard?: number; desc: string }
> = {
   "PM2.5": {
      name: "Pył zawieszony PM2.5",
      standard: 15,
      desc: "Drobny pył aerozolowy wnikający bezpośrednio do krwioobiegu",
   },
   PM10: {
      name: "Pył zawieszony PM10",
      standard: 45,
      desc: "Pył zawieszony wnikający do górnych dróg oddechowych",
   },
   NO2: {
      name: "Dwutlenek azotu",
      standard: 25,
      desc: "Zanieczyszczenie głównie ze spalin pojazdów spalinowych",
   },
   O3: {
      name: "Ozon troposferyczny",
      standard: 100,
      desc: "Powstaje w słoneczne dni z reakcji fotochemicznych",
   },
   SO2: {
      name: "Dwutlenek siarki",
      standard: 40,
      desc: "Ze spalania paliw kopalnych z zawartością siarki",
   },
   CO: {
      name: "Tlenek węgla",
      standard: 4000,
      desc: "Czad z procesów niecałkowitego spalania",
   },
   C6H6: {
      name: "Benzen",
      standard: 5,
      desc: "Lotny węglowodór aromatyczny o działaniu mutagennym",
   },
};

function getAqiTheme(label: string | null | undefined): {
   bgBox: string;
   borderBox: string;
   textBadge: string;
   dotColor: string;
   description: string;
} {
   switch (label?.toLowerCase()) {
      case "bardzo dobry":
         return {
            bgBox: "bg-emerald-50/70 dark:bg-emerald-950/20",
            borderBox: "border-emerald-200 dark:border-emerald-900/40",
            textBadge: "text-emerald-700 dark:text-emerald-400",
            dotColor: "bg-emerald-500",
            description:
               "Jakość powietrza jest bardzo dobra. Zanieczyszczenie nie stanowi zagrożenia dla zdrowia. Warunki idealne do wszelkiej aktywności na świeżym powietrzu.",
         };
      case "dobry":
         return {
            bgBox: "bg-emerald-50/50 dark:bg-emerald-950/20",
            borderBox: "border-emerald-200 dark:border-emerald-900/40",
            textBadge: "text-emerald-600 dark:text-emerald-400",
            dotColor: "bg-emerald-500",
            description:
               "Jakość powietrza jest zadowalająca. Zanieczyszczenie powietrza nie stanowi istotnego zagrożenia dla zdrowia.",
         };
      case "umiarkowany":
         return {
            bgBox: "bg-amber-50/70 dark:bg-amber-950/20",
            borderBox: "border-amber-200 dark:border-amber-900/40",
            textBadge: "text-amber-700 dark:text-amber-400",
            dotColor: "bg-amber-500",
            description:
               "Jakość powietrza jest akceptowalna. Osoby szczególnie wrażliwe powinny rozważyć ograniczenie długotrwałego wysiłku na zewnątrz.",
         };
      case "dostateczny":
         return {
            bgBox: "bg-orange-50/70 dark:bg-orange-950/20",
            borderBox: "border-orange-200 dark:border-orange-900/40",
            textBadge: "text-orange-700 dark:text-orange-400",
            dotColor: "bg-orange-500",
            description:
               "Zanieczyszczenie powietrza może stanowić zagrożenie dla zdrowia w przypadku osób wrażliwych, starszych oraz dzieci.",
         };
      case "zły":
         return {
            bgBox: "bg-rose-50/70 dark:bg-rose-950/20",
            borderBox: "border-rose-200 dark:border-rose-900/40",
            textBadge: "text-rose-700 dark:text-rose-400",
            dotColor: "bg-rose-500",
            description:
               "Zła jakość powietrza. Osoby wrażliwe powinny unikać przebywania na zewnątrz. Pozostali powinni ograniczyć intensywny wysiłek.",
         };
      case "bardzo zły":
         return {
            bgBox: "bg-purple-50/70 dark:bg-purple-950/20",
            borderBox: "border-purple-200 dark:border-purple-900/40",
            textBadge: "text-purple-700 dark:text-purple-400",
            dotColor: "bg-purple-500",
            description:
               "Bardzo zła jakość powietrza. Wszelkie aktywności na zewnątrz są odradzane. Zalecane pozostanie w pomieszczeniach.",
         };
      default:
         return {
            bgBox: "bg-slate-50 dark:bg-slate-900/30",
            borderBox: "border-slate-200 dark:border-slate-800",
            textBadge: "text-slate-600 dark:text-slate-400",
            dotColor: "bg-slate-400",
            description:
               "Brak aktualnie skalkulowanego indeksu ogólnego dla tej stacji. Sprawdź poniższe pomiary z poszczególnych sensorów.",
         };
   }
}

export function AirQualityDashboard() {
   const [geoState, setGeoState] = useState<GeoState>({
      lat: null,
      lon: null,
      isLocating: false,
      error: null,
   });
   const [selectedStationId, setSelectedStationId] = useState<number | null>(
      null,
   );
   const [searchQuery, setSearchQuery] = useState("");
   const [isSearchOpen, setIsSearchOpen] = useState(false);

   // Fetch list of all stations for search
   const { data: stationsData } = useQuery({
      queryKey: ["air-quality-stations"],
      queryFn: () => getStations(),
      staleTime: 1000 * 60 * 60,
   });

   // Fetch air quality data
   const { data, isLoading, isFetching, error, refetch } =
      useQuery<AirQualityResponse>({
         queryKey: [
            "air-quality",
            {
               lat: geoState.lat,
               lon: geoState.lon,
               stationId: selectedStationId,
            },
         ],
         queryFn: () =>
            getAirQuality({
               lat: geoState.lat,
               lon: geoState.lon,
               stationId: selectedStationId,
            }),
         staleTime: 1000 * 60 * 10,
      });

   const requestGeolocation = () => {
      if (!navigator.geolocation) {
         setGeoState((prev) => ({
            ...prev,
            error: "Twoja przeglądarka nie obsługuje geolokalizacji.",
         }));
         return;
      }

      setGeoState((prev) => ({ ...prev, isLocating: true, error: null }));
      setSelectedStationId(null);

      navigator.geolocation.getCurrentPosition(
         (position) => {
            setGeoState({
               lat: position.coords.latitude,
               lon: position.coords.longitude,
               isLocating: false,
               error: null,
            });
         },
         (geoError) => {
            let msg = "Nie udało się ustalić Twojej lokalizacji.";
            if (geoError.code === geoError.PERMISSION_DENIED) {
               msg =
                  "Odmowa dostępu do lokalizacji GPS. Wybierz miasto z listy wyszukiwarki.";
            } else if (geoError.code === geoError.TIMEOUT) {
               msg = "Upłynął limit czasu pobierania lokalizacji GPS.";
            }
            setGeoState((prev) => ({
               ...prev,
               isLocating: false,
               error: msg,
            }));
         },
         { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
   };

   const filteredStations = useMemo(() => {
      if (!stationsData?.stations || !searchQuery.trim()) return [];
      const q = searchQuery.toLowerCase().trim();
      return stationsData.stations
         .filter(
            (s) =>
               s.stationName.toLowerCase().includes(q) ||
               s.city?.toLowerCase().includes(q) ||
               s.province?.toLowerCase().includes(q),
         )
         .slice(0, 8);
   }, [stationsData, searchQuery]);

   const handleSelectStation = (station: AirQualityStation) => {
      setSelectedStationId(station.id);
      setIsSearchOpen(false);
      setSearchQuery("");
   };

   const aqiTheme = getAqiTheme(data?.aqi?.overall?.label);

   return (
      <div className="flex flex-col gap-4">
         {/* Geolocation bar / Controls */}
         <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-[#1a241e]">
            <div className="flex flex-wrap items-center gap-2.5">
               <button
                  type="button"
                  className={cn(
                     "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-xs transition-all",
                     geoState.lat
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-300 dark:hover:bg-[#202e23]",
                  )}
                  onClick={requestGeolocation}
                  disabled={geoState.isLocating}
               >
                  <LocateFixed
                     size={14}
                     className={
                        geoState.isLocating
                           ? "animate-spin text-emerald-500"
                           : ""
                     }
                  />
                  <span>
                     {geoState.isLocating
                        ? "Ustalanie pozycji…"
                        : geoState.lat
                          ? "Odśwież lokalizację GPS"
                          : "Wykryj moją lokalizację GPS"}
                  </span>
               </button>

               {data?.isDefaultLocation &&
                  !geoState.lat &&
                  !selectedStationId && (
                     <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <Info size={13} />
                        <span>Pokazuję domyślnie Warszawę (brak GPS)</span>
                     </span>
                  )}

               {geoState.error && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                     <AlertCircle size={13} />
                     <span>{geoState.error}</span>
                  </span>
               )}
            </div>

            {/* Station search dropdown */}
            <div className="relative w-full sm:max-w-xs">
               <div className="relative">
                  <Search
                     size={14}
                     className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                  />
                  <input
                     type="text"
                     className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pr-3 pl-8.5 text-xs text-slate-800 outline-hidden transition-colors focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-100 dark:focus:border-emerald-500"
                     placeholder="Wyszukaj miasto lub stację GIOŚ…"
                     value={searchQuery}
                     onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsSearchOpen(true);
                     }}
                     onFocus={() => setIsSearchOpen(true)}
                  />
               </div>

               {isSearchOpen && filteredStations.length > 0 && (
                  <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-40 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-[#19241d]">
                     {filteredStations.map((station) => (
                        <button
                           key={station.id}
                           type="button"
                           className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-[#202e23]"
                           onClick={() => handleSelectStation(station)}
                        >
                           <MapPin
                              size={14}
                              className="shrink-0 text-emerald-600 dark:text-emerald-400"
                           />
                           <div>
                              <strong className="block text-slate-800 dark:text-slate-100">
                                 {station.stationName}
                              </strong>
                              <span className="text-[11px] text-slate-400">
                                 {station.city}
                                 {station.province
                                    ? ` • ${station.province}`
                                    : ""}
                              </span>
                           </div>
                        </button>
                     ))}
                  </div>
               )}
            </div>
         </div>

         {isLoading && (
            <FeedbackState
               type="loading"
               message="Pobieranie danych jakości powietrza z oficjalnego API GIOŚ…"
            />
         )}

         {error && (
            <FeedbackState
               type="error"
               message={
                  error instanceof Error
                     ? error.message
                     : "Nie udało się pobrać danych ze stacji GIOŚ."
               }
            />
         )}

         {data && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
               {/* Main Air Quality Score Card */}
               <article className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-5 sm:p-6 dark:border-slate-800 dark:bg-[#1a241e]">
                  <div>
                     {/* Header: Station info & Refresh */}
                     <div className="flex items-start justify-between gap-3">
                        <div>
                           <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <MapPin size={10} />
                              <span>
                                 {data.station.distanceKm != null
                                    ? `${data.station.distanceKm} km od Twojej lokalizacji`
                                    : "Wybrana stacja pomiarowa"}
                              </span>
                           </span>
                           <h3 className="mt-2 text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                              {data.station.stationName}
                           </h3>
                           <p className="text-xs text-slate-400">
                              {data.station.address || data.station.city}
                              {data.station.province
                                 ? ` • woj. ${data.station.province}`
                                 : ""}
                           </p>
                        </div>

                        <button
                           type="button"
                           className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-300"
                           title="Odśwież dane"
                           onClick={() => refetch()}
                        >
                           <RefreshCw
                              size={13}
                              className={
                                 isFetching
                                    ? "animate-spin text-emerald-600"
                                    : ""
                              }
                           />
                        </button>
                     </div>

                     {/* Index Banner Box */}
                     <div
                        className={cn(
                           "mt-5 rounded-xl border p-4.5",
                           aqiTheme.bgBox,
                           aqiTheme.borderBox,
                        )}
                     >
                        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                           <Wind size={12} aria-hidden="true" />
                           <span>Polski Indeks Jakości Powietrza</span>
                        </span>

                        <div className="my-2 flex items-center gap-2.5">
                           <span
                              className={cn(
                                 "h-3 w-3 shrink-0 rounded-full",
                                 aqiTheme.dotColor,
                              )}
                           />
                           <strong
                              className={cn(
                                 "text-2xl font-black tracking-tight",
                                 aqiTheme.textBadge,
                              )}
                           >
                              {data.aqi?.overall?.label || "Brak indeksu"}
                           </strong>
                        </div>

                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                           {aqiTheme.description}
                        </p>
                     </div>

                     {data.aqi?.criticalPollutant && (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                           <Info size={13} className="shrink-0" />
                           <span>
                              Główny czynnik zanieczyszczenia:{" "}
                              <strong>{data.aqi.criticalPollutant}</strong>
                           </span>
                        </div>
                     )}
                  </div>

                  {/* Nearby Stations */}
                  {data.nearbyStations?.length > 0 && (
                     <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                           Inne stacje w pobliżu:
                        </span>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                           {data.nearbyStations.map((nearStation) => (
                              <button
                                 key={nearStation.id}
                                 type="button"
                                 className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-xs text-slate-700 transition-colors hover:border-emerald-500/50 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-[#16201a] dark:text-slate-300"
                                 onClick={() =>
                                    setSelectedStationId(nearStation.id)
                                 }
                              >
                                 <Building2
                                    size={12}
                                    className="text-slate-400"
                                 />
                                 <span>{nearStation.stationName}</span>
                                 <strong className="text-emerald-700 dark:text-emerald-400">
                                    ({nearStation.distanceKm} km)
                                 </strong>
                              </button>
                           ))}
                        </div>
                     </div>
                  )}
               </article>

               {/* Pollutant Sensors Cards */}
               <div className="flex flex-col gap-3 lg:col-span-7">
                  <div className="flex items-center justify-between">
                     <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <Gauge
                           size={15}
                           className="text-emerald-600 dark:text-emerald-400"
                        />
                        <span>Pomiary stężeń zanieczyszczeń</span>
                     </div>
                     <span className="text-xs text-slate-400">
                        Wskazania sensorów w czasie rzeczywistym
                     </span>
                  </div>

                  {data.sensors.length === 0 ? (
                     <FeedbackState
                        type="empty"
                        message="Brak aktualnych odczytów ze stanowisk pomiarowych na tej stacji."
                     />
                  ) : (
                     <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {data.sensors.map((sensor) => {
                           const meta = POLLUTANT_INFO[sensor.code] || {
                              name: sensor.name,
                              desc: sensor.name,
                           };
                           const subIndex =
                              sensor.code.toLowerCase() === "pm10"
                                 ? data.aqi?.components.pm10
                                 : sensor.code.toLowerCase() === "pm2.5"
                                   ? data.aqi?.components.pm25
                                   : sensor.code.toLowerCase() === "no2"
                                     ? data.aqi?.components.no2
                                     : sensor.code.toLowerCase() === "o3"
                                       ? data.aqi?.components.o3
                                       : sensor.code.toLowerCase() === "so2"
                                         ? data.aqi?.components.so2
                                         : null;

                           const subTheme = getAqiTheme(subIndex?.label);

                           return (
                              <div
                                 key={sensor.id}
                                 className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-[#1a241e] dark:hover:border-slate-700"
                              >
                                 <div>
                                    <div className="flex items-center justify-between gap-2">
                                       <div>
                                          <strong className="text-sm font-bold text-slate-900 dark:text-white">
                                             {sensor.code}
                                          </strong>
                                          <p className="text-[11px] text-slate-400">
                                             {meta.name}
                                          </p>
                                       </div>

                                       {subIndex?.label && (
                                          <span
                                             className={cn(
                                                "rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase",
                                                subTheme.bgBox,
                                                subTheme.textBadge,
                                             )}
                                          >
                                             {subIndex.label}
                                          </span>
                                       )}
                                    </div>

                                    <div className="my-2.5 flex items-baseline gap-1.5">
                                       {sensor.value != null ? (
                                          <>
                                             <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                                {sensor.value}
                                             </span>
                                             <span className="text-xs text-slate-400">
                                                {sensor.unit}
                                             </span>
                                          </>
                                       ) : (
                                          <span className="text-xs text-slate-400">
                                             Brak danych
                                          </span>
                                       )}
                                    </div>

                                    {meta.standard && sensor.value != null && (
                                       <div className="mb-2">
                                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#233227]">
                                             <div
                                                className={cn(
                                                   "h-full rounded-full transition-all",
                                                   subTheme.dotColor,
                                                )}
                                                style={{
                                                   width: `${Math.min(100, (sensor.value / meta.standard) * 100)}%`,
                                                }}
                                             />
                                          </div>
                                          <span className="mt-1 block text-[10px] text-slate-400">
                                             {Math.round(
                                                (sensor.value / meta.standard) *
                                                   100,
                                             )}
                                             % normy dobowej ({meta.standard}{" "}
                                             {sensor.unit})
                                          </span>
                                       </div>
                                    )}

                                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                       {meta.desc}
                                    </p>
                                 </div>

                                 {sensor.date && (
                                    <div className="mt-3 inline-flex items-center gap-1 text-[10px] text-slate-400">
                                       <Clock size={10} />
                                       <span>
                                          Pomiar: {sensor.date.slice(11, 16)}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Footer Metadata */}
         {data && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800/80 dark:bg-[#16201a]/60 dark:text-slate-400">
               <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span>
                     Dane oficjalne: Państwowy Monitoring Środowiska (GIOŚ)
                  </span>
               </div>
               <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span>
                     Cache: <strong>{data.cacheStatus}</strong>
                  </span>
                  <span>•</span>
                  <span>
                     Pobrano:{" "}
                     <strong>
                        {new Date(data.cachedAt).toLocaleTimeString("pl-PL", {
                           hour: "2-digit",
                           minute: "2-digit",
                        })}
                     </strong>
                  </span>
               </div>
            </div>
         )}
      </div>
   );
}
