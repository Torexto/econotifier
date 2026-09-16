import { BarChart3, Bolt, Leaf, Zap } from "lucide-react";
import {
   EnergyPrice,
   GenerationDashboard,
   KseLoadChart,
   RenewableGeneration,
} from "@/lib/ui/pse";
import { SectionHeading } from "@/lib/ui/shared";

export function EnergyView() {
   return (
      <div className="flex flex-col gap-10 sm:gap-12">
         {/* Sub-section: Renewable Generation & Fuel Mix (HIS-GEN-PAL) */}
         <section className="scroll-mt-20" id="renewable">
            <SectionHeading
               icon={<Leaf size={14} aria-hidden="true" />}
               eyebrow="Odnawialne źródła energii"
               title="Generacja OZE i miks paliwowy"
               description="Bieżący udział energii słonecznej, wiatrowej, wodnej i biomasy w polskim systemie elektroenergetycznym (raport PSE HIS-GEN-PAL)."
            />
            <RenewableGeneration />
         </section>

         {/* Sub-section: Energy Price Window */}
         <section className="scroll-mt-20" id="prices">
            <SectionHeading
               icon={<Zap size={14} aria-hidden="true" />}
               eyebrow="Rynek bilansujący"
               title="Najlepszy moment na energię"
               description="Rekomendowane godziny niższego kosztu energii dla elastycznego zużycia (ładowanie EV, AGD, pompy ciepła)."
            />
            <EnergyPrice />
         </section>

         {/* Sub-section: KSE Demand */}
         <section className="scroll-mt-20" id="demand">
            <SectionHeading
               icon={<BarChart3 size={14} aria-hidden="true" />}
               eyebrow="Krajowy system"
               title="Zapotrzebowanie KSE"
               description="Bieżące obciążenie i prognoza zapotrzebowania mocy w Polsce."
            />
            <KseLoadChart />
         </section>

         {/* Sub-section: Generation by Power Plant */}
         <section className="scroll-mt-20" id="generation">
            <SectionHeading
               icon={<Bolt size={14} aria-hidden="true" />}
               eyebrow="Wytwarzanie mocy"
               title="Generacja elektrowni"
               description="Praca krajowych elektrowni i elektrociepłowni według bloków wytwórczych (JWCD/nJWCD)."
            />
            <GenerationDashboard />
         </section>
      </div>
   );
}
