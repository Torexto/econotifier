import type React from "react";

interface SectionHeadingProps {
   icon: React.ReactNode;
   eyebrow: string;
   title: string;
   description: string;
   actions?: React.ReactNode;
}

export function SectionHeading({
   icon,
   eyebrow,
   title,
   description,
   actions,
}: SectionHeadingProps) {
   return (
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-6">
         <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
               {icon}
               <span>{eyebrow}</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
               {title}
            </h2>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400">
               {description}
            </p>
         </div>
         {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
   );
}
