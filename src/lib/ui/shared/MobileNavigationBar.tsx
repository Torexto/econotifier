import { Wind, Zap } from "lucide-react";
import { NavLink } from "react-router";
import { cn } from "@/lib/ui/utils";

export function MobileNavigationBar() {
   return (
      <nav
         className="fixed right-4 bottom-4 left-4 z-40 flex items-center justify-around rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-lg sm:hidden dark:border-emerald-900/30 dark:bg-[#1a241e]/95"
         aria-label="Szybka nawigacja"
      >
         <NavLink
            to="/"
            end
            className={({ isActive }) =>
               cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-bold transition-all",
                  isActive
                     ? "bg-emerald-50 text-emerald-800 dark:bg-[#25392b] dark:text-emerald-300"
                     : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
               )
            }
         >
            <Zap size={18} aria-hidden="true" />
            <span>Energia</span>
         </NavLink>
         <NavLink
            to="/air-quality"
            className={({ isActive }) =>
               cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-bold transition-all",
                  isActive
                     ? "bg-emerald-50 text-emerald-800 dark:bg-[#25392b] dark:text-emerald-300"
                     : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
               )
            }
         >
            <Wind size={18} aria-hidden="true" />
            <span>Powietrze</span>
         </NavLink>
      </nav>
   );
}
