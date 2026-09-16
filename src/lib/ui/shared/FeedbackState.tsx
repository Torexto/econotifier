import { AlertCircle, Loader2, type LucideIcon } from "lucide-react";
import type React from "react";
import { cn } from "@/lib/ui/utils";

interface FeedbackStateProps {
   type?: "loading" | "error" | "empty" | "info";
   icon?: LucideIcon;
   message: React.ReactNode;
   className?: string;
}

export function FeedbackState({
   type = "empty",
   icon: Icon,
   message,
   className,
}: FeedbackStateProps) {
   if (type === "loading") {
      return (
         <div
            className={cn(
               "flex min-h-[140px] items-center justify-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-6 text-sm text-slate-600 shadow-xs dark:border-slate-800 dark:bg-[#1a241e] dark:text-slate-300",
               className,
            )}
         >
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
            <span>{message}</span>
         </div>
      );
   }

   if (type === "error") {
      return (
         <div
            className={cn(
               "flex min-h-[140px] items-center justify-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-sm text-rose-700 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300",
               className,
            )}
         >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{message}</span>
         </div>
      );
   }

   return (
      <div
         className={cn(
            "flex min-h-[140px] items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white p-6 text-sm text-slate-500 shadow-xs dark:border-slate-800 dark:bg-[#1a241e] dark:text-slate-400",
            className,
         )}
      >
         {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" />}
         <span>{message}</span>
      </div>
   );
}
