import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Bolt, Moon, Sun, Wind, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router";
import { AirQualityView } from "@/views/AirQualityView";
import { EnergyView } from "@/views/EnergyView";

const queryClient = new QueryClient();

export function AppContent() {
   const [isDark, setIsDark] = useState(() => {
      const savedTheme = localStorage.getItem("econotifier-theme");
      return savedTheme
         ? savedTheme === "dark"
         : window.matchMedia("(prefers-color-scheme: dark)").matches;
   });

   useEffect(() => {
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      localStorage.setItem("econotifier-theme", isDark ? "dark" : "light");
      document
         .querySelector('meta[name="theme-color"]')
         ?.setAttribute("content", isDark ? "#111814" : "#f5f7f3");
   }, [isDark]);

   return (
      <div className="app-shell">
         <header className="site-header">
            <div className="nav-wrap">
               <NavLink className="brand" to="/">
                  <span className="brand-mark">
                     <Bolt size={18} aria-hidden="true" />
                  </span>
                  <span>
                     eco<span>notifier</span>
                  </span>
               </NavLink>

               {/* Segmented route navigation */}
               <nav
                  className="site-nav-segmented"
                  aria-label="Główna nawigacja"
               >
                  <NavLink
                     to="/"
                     end
                     className={({ isActive }) =>
                        isActive ? "nav-segment is-active" : "nav-segment"
                     }
                  >
                     <Zap size={15} aria-hidden="true" />
                     <span>Rynek energii</span>
                  </NavLink>
                  <NavLink
                     to="/air-quality"
                     className={({ isActive }) =>
                        isActive ? "nav-segment is-active" : "nav-segment"
                     }
                  >
                     <Wind size={15} aria-hidden="true" />
                     <span>Jakość powietrza</span>
                  </NavLink>
               </nav>

               <div className="nav-actions">
                  <button
                     aria-label={
                        isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"
                     }
                     className="theme-toggle"
                     onClick={() => setIsDark((current) => !current)}
                     type="button"
                  >
                     {isDark ? (
                        <Sun size={17} aria-hidden="true" />
                     ) : (
                        <Moon size={17} aria-hidden="true" />
                     )}
                     <span>{isDark ? "Jasny" : "Ciemny"}</span>
                  </button>
               </div>
            </div>
         </header>

         <main className="main-content">
            <Routes>
               <Route path="/" element={<EnergyView />} />
               <Route path="/energy" element={<Navigate to="/" replace />} />
               <Route path="/air-quality" element={<AirQualityView />} />
               <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
         </main>

         {/* Mobile bottom navigation */}
         <nav className="mobile-nav" aria-label="Szybka nawigacja">
            <NavLink
               to="/"
               end
               className={({ isActive }) =>
                  isActive ? "mobile-nav-item is-active" : "mobile-nav-item"
               }
            >
               <Zap size={18} aria-hidden="true" />
               <span>Energia</span>
            </NavLink>
            <NavLink
               to="/air-quality"
               className={({ isActive }) =>
                  isActive ? "mobile-nav-item is-active" : "mobile-nav-item"
               }
            >
               <Wind size={18} aria-hidden="true" />
               <span>Powietrze</span>
            </NavLink>
         </nav>

         <footer className="site-footer">
            <NavLink className="brand" to="/">
               <span className="brand-mark">
                  <Bolt size={15} aria-hidden="true" />
               </span>
               econotifier
            </NavLink>
            <p>
               Dane operacyjne: Polskie Sieci Elektroenergetyczne &amp; Główny
               Inspektorat Ochrony Środowiska.
            </p>
         </footer>
      </div>
   );
}

function App() {
   return (
      <QueryClientProvider client={queryClient}>
         <BrowserRouter>
            <AppContent />
         </BrowserRouter>
      </QueryClientProvider>
   );
}

export default App;
