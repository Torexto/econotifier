import { BarChart3, Leaf, Zap } from "lucide-react";
import { EnergyPrice, KseLoadChart, RenewableGeneration } from "@/lib/ui/pse";
import { Section, ViewShell } from "@/lib/ui/shared";

export function EnergyView() {
   return (
      <ViewShell>
         {/* Sub-section: Energy Price Window */}
         <Section
            icon={<Zap size={14} aria-hidden="true" />}
            eyebrow="Rynek bilansujący"
            title="Najlepszy moment na energię"
            description="Rekomendowane godziny niższego kosztu energii dla elastycznego zużycia (ładowanie EV, AGD, pompy ciepła)."
         >
            <EnergyPrice />
         </Section>

         {/* Sub-section: KSE Demand */}
         <Section
            icon={<BarChart3 size={14} aria-hidden="true" />}
            eyebrow="Krajowy system"
            title="Zapotrzebowanie KSE"
            description="Bieżące obciążenie i prognoza zapotrzebowania mocy w Polsce."
         >
            <KseLoadChart />
         </Section>

         {/* Sub-section: Renewable Generation & Fuel Mix (HIS-GEN-PAL) */}
         <Section
            icon={<Leaf size={14} aria-hidden="true" />}
            eyebrow="Odnawialne źródła energii"
            title="Generacja OZE i miks paliwowy"
            description="Bieżący udział energii słonecznej, wiatrowej, wodnej i biomasy w polskim systemie elektroenergetycznym (raport PSE HIS-GEN-PAL)."
         >
            <RenewableGeneration />
         </Section>
      </ViewShell>
   );
}
