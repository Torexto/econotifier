import { Bolt } from "lucide-react";
import { NavLink } from "react-router";

export function Footer() {
   return (
      <footer className="mt-auto border-t border-slate-200/80 bg-white/40 py-6 text-xs text-slate-500 dark:border-slate-800/80 dark:bg-transparent dark:text-slate-400">
         <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
            <NavLink
               className="inline-flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200"
               to="/"
            >
               <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-700 text-[10px] text-white dark:bg-emerald-500 dark:text-slate-950">
                  <Bolt size={12} aria-hidden="true" />
               </span>
               econotifier
            </NavLink>
            <p className="text-center sm:text-right text-[11px] text-slate-400 dark:text-slate-500">
               Dane operacyjne: Polskie Sieci Elektroenergetyczne (PSE) &amp;
               Główny Inspektorat Ochrony Środowiska (GIOŚ).
            </p>
         </div>
      </footer>
   );
}
