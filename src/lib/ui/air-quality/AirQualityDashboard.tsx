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
      desc: "Drobny pył przenikający do krwioobiegu",
   },
   PM10: {
      name: "Pył zawieszony PM10",
      standard: 45,
      desc: "Pył zawieszony wnikający do układu oddechowego",
   },
   NO2: {
      name: "Dwutlenek azotu",
      standard: 25,
      desc: "Głównie ze spalin pojazdów silnikowych",
   },
   O3: {
      name: "Ozon troposferyczny",
      standard: 100,
      desc: "Drażni drogi oddechowe, powstaje w słoneczne dni",
   },
   SO2: {
      name: "Dwutlenek siarki",
      standard: 40,
      desc: "Ze spalania paliw kopalnych (węgiel, olej)",
   },
   CO: {
      name: "Tlenek węgla",
      standard: 4000,
      desc: "Czad ze spalania niecałkowitego",
   },
   C6H6: {
      name: "Benzen",
      standard: 5,
      desc: "Lotny związek organiczny",
   },
};

function getAqiTheme(label: string | null | undefined): {
   colorClass: string;
   bgBadge: string;
   textBadge: string;
   dotColor: string;
   description: string;
} {
   switch (label?.toLowerCase()) {
      case "bardzo dobry":
         return {
            colorClass: "aqi-very-good",
            bgBadge: "rgba(16, 185, 129, 0.12)",
            textBadge: "#10b981",
            dotColor: "#10b981",
            description:
               "Jakość powietrza jest bardzo dobra. Zanieczyszczenie nie stanowi zagrożenia dla zdrowia. Warunki idealne do aktywności na świeżym powietrzu.",
         };
      case "dobry":
         return {
            colorClass: "aqi-good",
            bgBadge: "rgba(34, 197, 94, 0.12)",
            textBadge: "#22c55e",
            dotColor: "#22c55e",
            description:
               "Jakość powietrza jest zadowalająca. Zanieczyszczenie powietrza nie stanowi zagrożenia dla zdrowia ludzi.",
         };
      case "umiarkowany":
         return {
            colorClass: "aqi-moderate",
            bgBadge: "rgba(234, 179, 8, 0.12)",
            textBadge: "#eab308",
            dotColor: "#eab308",
            description:
               "Jakość powietrza jest akceptowalna. Osoby szczególnie wrażliwe powinny rozważyć ograniczenie długiego wysiłku fizycznego na zewnątrz.",
         };
      case "dostateczny":
         return {
            colorClass: "aqi-sufficient",
            bgBadge: "rgba(249, 115, 22, 0.12)",
            textBadge: "#f97316",
            dotColor: "#f97316",
            description:
               "Zanieczyszczenie powietrza może stanowić zagrożenie dla zdrowia w przypadku osób wrażliwych, starszych oraz dzieci.",
         };
      case "zły":
         return {
            colorClass: "aqi-bad",
            bgBadge: "rgba(239, 68, 68, 0.12)",
            textBadge: "#ef4444",
            dotColor: "#ef4444",
            description:
               "Zła jakość powietrza. Osoby wrażliwe powinny unikać przebywania na otwartym powietrzu. Pozostali powinni ograniczyć intensywny wysiłek.",
         };
      case "bardzo zły":
         return {
            colorClass: "aqi-very-bad",
            bgBadge: "rgba(168, 85, 247, 0.12)",
            textBadge: "#a855f7",
            dotColor: "#a855f7",
            description:
               "Bardzo zła jakość powietrza. Wszelkie aktywności na zewnątrz są odradzane. Zalecane pozostanie w pomieszczeniach.",
         };
      default:
         return {
            colorClass: "aqi-unknown",
            bgBadge: "rgba(156, 163, 175, 0.12)",
            textBadge: "#9ca3af",
            dotColor: "#9ca3af",
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

   // Fetch list of all stations for search/selection
   const { data: stationsData } = useQuery({
      queryKey: ["air-quality-stations"],
      queryFn: () => getStations(),
      staleTime: 1000 * 60 * 60, // 1 hour
   });

   // Fetch air quality data for current coordinates or selected station
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
         staleTime: 1000 * 60 * 10, // 10 minutes
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
      setSelectedStationId(null); // Reset manual selection when using GPS

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
                  "Odmowa dostępu do lokalizacji. Wybierz miasto z listy poniżej.";
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
      <div className="air-quality-container">
         {/* Geolocation bar / Controls */}
         <div className="aq-header-bar">
            <div className="aq-header-meta">
               <button
                  type="button"
                  className={`button ${geoState.lat ? "button-primary" : "button-secondary"} aq-gps-btn`}
                  onClick={requestGeolocation}
                  disabled={geoState.isLocating}
               >
                  <LocateFixed
                     size={16}
                     className={geoState.isLocating ? "animate-spin" : ""}
                  />
                  {geoState.isLocating
                     ? "Ustalanie pozycji…"
                     : geoState.lat
                       ? "Odśwież lokalizację GPS"
                       : "Wykryj moją lokalizację"}
               </button>

               {data?.isDefaultLocation &&
                  !geoState.lat &&
                  !selectedStationId && (
                     <span className="aq-default-badge">
                        <Info size={13} /> Pokazuję domyślnie Warszawę (brak
                        GPS)
                     </span>
                  )}

               {geoState.error && (
                  <span className="aq-error-badge">
                     <AlertCircle size={13} /> {geoState.error}
                  </span>
               )}
            </div>

            {/* Station search dropdown */}
            <div className="aq-search-wrap">
               <div className="search-input aq-search-input">
                  <Search size={15} />
                  <input
                     type="text"
                     placeholder="Wyszukaj miasto lub stację…"
                     value={searchQuery}
                     onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsSearchOpen(true);
                     }}
                     onFocus={() => setIsSearchOpen(true)}
                  />
               </div>

               {isSearchOpen && filteredStations.length > 0 && (
                  <div className="aq-search-dropdown">
                     {filteredStations.map((station) => (
                        <button
                           key={station.id}
                           type="button"
                           className="aq-search-item"
                           onClick={() => handleSelectStation(station)}
                        >
                           <MapPin size={14} className="aq-search-icon" />
                           <div>
                              <strong className="aq-search-name">
                                 {station.stationName}
                              </strong>
                              <span className="aq-search-sub">
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
            <div className="price-loading">
               <RefreshCw size={18} className="animate-spin" /> Pobieranie
               danych o jakości powietrza z GIOŚ…
            </div>
         )}

         {error && (
            <div className="data-feedback is-error">
               <AlertCircle size={18} />
               {error instanceof Error
                  ? error.message
                  : "Nie udało się pobrać danych z serwera GIOŚ."}
            </div>
         )}

         {data && (
            <div className="aq-dashboard-grid">
               {/* Main Air Quality Score Card */}
               <article className="aq-card aq-main-card">
                  <div className="aq-main-header">
                     <div className="aq-station-info">
                        <span className="aq-badge">
                           <MapPin size={12} />
                           {data.station.distanceKm != null
                              ? `${data.station.distanceKm} km od wybranej lokalizacji`
                              : "Wybrana stacja"}
                        </span>
                        <h3 className="aq-station-title">
                           {data.station.stationName}
                        </h3>
                        <p className="aq-station-address">
                           {data.station.address || data.station.city}
                           {data.station.province
                              ? ` • woj. ${data.station.province}`
                              : ""}
                        </p>
                     </div>

                     <div className="aq-refresh-status">
                        <button
                           type="button"
                           className="aq-icon-btn"
                           title="Odśwież dane"
                           onClick={() => refetch()}
                        >
                           <RefreshCw
                              size={14}
                              className={isFetching ? "animate-spin" : ""}
                           />
                        </button>
                     </div>
                  </div>

                  <div className="aq-index-display">
                     <div
                        className="aq-level-box"
                        style={{
                           backgroundColor: aqiTheme.bgBadge,
                           borderColor: aqiTheme.dotColor,
                        }}
                     >
                        <span className="aq-level-label">
                           <Wind size={13} aria-hidden="true" /> Polski Indeks
                           Jakości Powietrza
                        </span>
                        <div className="aq-level-heading">
                           <span
                              className="aq-level-dot"
                              style={{ backgroundColor: aqiTheme.dotColor }}
                           />
                           <strong
                              className="aq-level-name"
                              style={{ color: aqiTheme.textBadge }}
                           >
                              {data.aqi?.overall?.label || "Brak indeksu"}
                           </strong>
                        </div>
                        <p className="aq-level-desc">{aqiTheme.description}</p>
                     </div>

                     {data.aqi?.criticalPollutant && (
                        <div className="aq-critical-note">
                           <Info size={13} />
                           Główny czynnik zanieczyszczenia:{" "}
                           <strong>{data.aqi.criticalPollutant}</strong>
                        </div>
                     )}
                  </div>

                  {/* Alternative nearby stations */}
                  {data.nearbyStations?.length > 0 && (
                     <div className="aq-nearby-box">
                        <span className="aq-nearby-title">
                           Inne stacje w pobliżu:
                        </span>
                        <div className="aq-nearby-list">
                           {data.nearbyStations.map((nearStation) => (
                              <button
                                 key={nearStation.id}
                                 type="button"
                                 className="aq-nearby-tag"
                                 onClick={() =>
                                    setSelectedStationId(nearStation.id)
                                 }
                              >
                                 <Building2 size={12} />
                                 <span>{nearStation.stationName}</span>
                                 <strong>({nearStation.distanceKm} km)</strong>
                              </button>
                           ))}
                        </div>
                     </div>
                  )}
               </article>

               {/* Pollutant Sensors Cards */}
               <div className="aq-sensors-section">
                  <div className="aq-sensors-header">
                     <h4>
                        <Gauge size={16} /> Pomiary stężeń zanieczyszczeń
                     </h4>
                     <span className="aq-sensors-sub">
                        Wskazania stacji w czasie rzeczywistym
                     </span>
                  </div>

                  {data.sensors.length === 0 ? (
                     <div className="data-feedback">
                        Brak aktualnych odczytów ze stanowisk pomiarowych na tej
                        stacji.
                     </div>
                  ) : (
                     <div className="aq-pollutants-grid">
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
                                 className="aq-pollutant-card"
                              >
                                 <div className="aq-p-top">
                                    <div>
                                       <strong className="aq-p-code">
                                          {sensor.code}
                                       </strong>
                                       <p className="aq-p-name">{meta.name}</p>
                                    </div>
                                    {subIndex?.label && (
                                       <span
                                          className="aq-p-subindex"
                                          style={{
                                             backgroundColor: subTheme.bgBadge,
                                             color: subTheme.textBadge,
                                          }}
                                       >
                                          {subIndex.label}
                                       </span>
                                    )}
                                 </div>

                                 <div className="aq-p-val-row">
                                    {sensor.value != null ? (
                                       <>
                                          <span className="aq-p-val">
                                             {sensor.value}
                                          </span>
                                          <span className="aq-p-unit">
                                             {sensor.unit}
                                          </span>
                                       </>
                                    ) : (
                                       <span className="aq-p-nodata">
                                          Brak danych
                                       </span>
                                    )}
                                 </div>

                                 {meta.standard && sensor.value != null && (
                                    <div className="aq-p-bar-wrap">
                                       <div
                                          className="aq-p-bar-fill"
                                          style={{
                                             width: `${Math.min(100, (sensor.value / meta.standard) * 100)}%`,
                                             backgroundColor: subTheme.dotColor,
                                          }}
                                       />
                                       <span className="aq-p-norm">
                                          {Math.round(
                                             (sensor.value / meta.standard) *
                                                100,
                                          )}
                                          % normy dobowej ({meta.standard}{" "}
                                          {sensor.unit})
                                       </span>
                                    </div>
                                 )}

                                 <p className="aq-p-desc">{meta.desc}</p>

                                 {sensor.date && (
                                    <div className="aq-p-time">
                                       <Clock size={11} />
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

         {/* Footer Info / Cache Status */}
         {data && (
            <div className="aq-footer-info">
               <div className="aq-footer-source">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span>
                     Dane oficjalne: Państwowy Monitoring Środowiska (GIOŚ)
                  </span>
               </div>
               <div className="aq-footer-cache">
                  <span>
                     Cache Redis: <strong>{data.cacheStatus}</strong>
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
