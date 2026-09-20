import { Moon, Sun, Wind, Zap } from "lucide-react";
import { NavLink } from "react-router";
import { useTheme } from "@/lib/hooks/useTheme";
import { cn } from "@/lib/ui/utils";

export function NavigationBar() {
   const { isDark, toggleTheme } = useTheme();

   return (
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-emerald-900/20 dark:bg-[#131a16]/90">
         <div className="mx-auto flex min-h-14.5 max-w-295 items-center justify-between gap-4 px-4 sm:px-6">
            {/* Brand */}
            <NavLink
               className="group inline-flex items-center gap-2.5 text-base font-extrabold tracking-tight text-slate-900 transition-opacity hover:opacity-90 dark:text-white"
               to="/"
            >
               <img src="/pwa-icon-192.png" alt="Logo" className="h-7 w-7" />
               <span>
                  eco
                  <span className="text-emerald-700 dark:text-emerald-400">
                     notifier
                  </span>
               </span>
            </NavLink>

            {/* Desktop Segmented Navigation */}
            <nav
               className="hidden items-center gap-1 rounded-xl bg-slate-100/90 p-1 sm:inline-flex dark:bg-[#1a241e]"
               aria-label="Główna nawigacja"
            >
               <NavLink
                  to="/energy"
                  end
                  className={({ isActive }) =>
                     cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
                        isActive
                           ? "bg-white text-emerald-800 shadow-xs dark:bg-[#25392b] dark:text-emerald-300"
                           : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                     )
                  }
               >
                  <Zap size={14} aria-hidden="true" />
                  <span>Rynek energii</span>
               </NavLink>
               <NavLink
                  to="/air-quality"
                  className={({ isActive }) =>
                     cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
                        isActive
                           ? "bg-white text-emerald-800 shadow-xs dark:bg-[#25392b] dark:text-emerald-300"
                           : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                     )
                  }
               >
                  <Wind size={14} aria-hidden="true" />
                  <span>Jakość powietrza</span>
               </NavLink>
            </nav>

            {/* Actions: Theme Toggle */}
            <div className="flex items-center gap-2">
               <button
                  aria-label={
                     isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-[#1a241e] dark:text-slate-300 dark:hover:bg-[#223126]"
                  onClick={toggleTheme}
                  type="button"
               >
                  {isDark ? (
                     <Sun
                        size={15}
                        className="text-amber-400"
                        aria-hidden="true"
                     />
                  ) : (
                     <Moon
                        size={15}
                        className="text-slate-500"
                        aria-hidden="true"
                     />
                  )}
                  <span className="hidden sm:inline">
                     {isDark ? "Jasny" : "Ciemny"}
                  </span>
               </button>
            </div>
         </div>
      </header>
   );
}
