import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
   Activity,
   BarChart3,
   Bolt,
   Menu,
   Moon,
   Sun,
   X,
   Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EnergyPrice, GenerationDashboard, KseLoadChart } from "@/lib/ui/pse";

const queryClient = new QueryClient();
const navigation = [
   { href: "#overview", label: "Przegląd", icon: Activity },
   { href: "#prices", label: "Ceny energii", icon: Zap },
   { href: "#demand", label: "Zapotrzebowanie", icon: BarChart3 },
   { href: "#generation", label: "Generacja", icon: Bolt },
];

function App() {
   const [isDark, setIsDark] = useState(() => {
      const savedTheme = localStorage.getItem("econotifier-theme");
      return savedTheme
         ? savedTheme === "dark"
         : window.matchMedia("(prefers-color-scheme: dark)").matches;
   });
   const [isMenuOpen, setIsMenuOpen] = useState(false);

   useEffect(() => {
      document.documentElement.classList.toggle("dark", isDark);
      localStorage.setItem("econotifier-theme", isDark ? "dark" : "light");
   }, [isDark]);

   const closeMenu = () => setIsMenuOpen(false);

   return (
      <QueryClientProvider client={queryClient}>
         <div className="app-shell">
            <header className="site-header">
               <div className="nav-wrap">
                  <a className="brand" href="#overview">
                     <span className="brand-mark">
                        <Bolt size={18} aria-hidden="true" />
                     </span>
                     <span>
                        eco<span>notifier</span>
                     </span>
                  </a>
                  <nav
                     className={isMenuOpen ? "site-nav is-open" : "site-nav"}
                     aria-label="Główna nawigacja"
                  >
                     {navigation.map(({ href, label, icon: Icon }) => (
                        <a href={href} key={href} onClick={closeMenu}>
                           <Icon size={16} aria-hidden="true" />
                           {label}
                        </a>
                     ))}
                  </nav>
                  <div className="nav-actions">
                     <button
                        aria-label={
                           isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"
                        }
                        className="theme-toggle"
                        onClick={() =>
                           setIsDark((currentTheme) => !currentTheme)
                        }
                        type="button"
                     >
                        {isDark ? (
                           <Sun size={18} aria-hidden="true" />
                        ) : (
                           <Moon size={18} aria-hidden="true" />
                        )}
                        <span>{isDark ? "Jasny" : "Ciemny"}</span>
                     </button>
                     <button
                        aria-expanded={isMenuOpen}
                        aria-label={isMenuOpen ? "Zamknij menu" : "Otwórz menu"}
                        className="menu-toggle"
                        onClick={() => setIsMenuOpen((open) => !open)}
                        type="button"
                     >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                     </button>
                  </div>
               </div>
            </header>
            <main>
               <section className="hero" id="overview">
                  <div className="hero-copy">
                     <p className="eyebrow">
                        <span className="live-dot" /> Monitor energii w Polsce
                     </p>
                     <h1>
                        Energia pod <em>kontrolą.</em>
                     </h1>
                     <p className="hero-description">
                        Sprawdzaj ceny, zapotrzebowanie i pracę krajowych
                        jednostek wytwórczych w jednym miejscu.
                     </p>
                     <div className="hero-links">
                        <a className="button button-primary" href="#prices">
                           Sprawdź ceny <span aria-hidden="true">→</span>
                        </a>
                        <a className="button button-secondary" href="#demand">
                           Zobacz system
                        </a>
                     </div>
                  </div>
                  <div className="hero-orb" aria-hidden="true">
                     <div className="orb-core">
                        <Bolt size={36} fill="currentColor" />
                     </div>
                     <span className="orbit orbit-one" />
                     <span className="orbit orbit-two" />
                     <span className="orb-label label-top">PSE data</span>
                     <span className="orb-label label-bottom">na żywo</span>
                  </div>
               </section>
               <section className="dashboard-section price-section" id="prices">
                  <div className="section-heading">
                     <div>
                        <p className="eyebrow">Optymalizuj zużycie</p>
                        <h2>Najlepszy moment na energię</h2>
                     </div>
                     <p>
                        Rynek bilansujący pomaga wybrać tańsze godziny dla
                        urządzeń, które mogą poczekać.
                     </p>
                  </div>
                  <EnergyPrice />
               </section>
               <section className="dashboard-section" id="demand">
                  <div className="section-heading compact-heading">
                     <div>
                        <p className="eyebrow">Stan systemu</p>
                        <h2>Zapotrzebowanie KSE</h2>
                     </div>
                  </div>
                  <KseLoadChart />
               </section>
               <section className="dashboard-section" id="generation">
                  <GenerationDashboard />
               </section>
            </main>
            <footer className="site-footer">
               <a className="brand" href="#overview">
                  <span className="brand-mark">
                     <Bolt size={16} aria-hidden="true" />
                  </span>
                  econotifier
               </a>
               <p>Dane operacyjne: Polskie Sieci Elektroenergetyczne.</p>
            </footer>
         </div>
      </QueryClientProvider>
   );
}

export default App;
