import { Wind } from "lucide-react";
import { AirQualityDashboard } from "@/lib/ui/air-quality";
import { Section, ViewShell } from "@/lib/ui/shared";

export function AirQualityView() {
   return (
      <ViewShell>
         <Section
            icon={<Wind size={14} aria-hidden="true" />}
            eyebrow="Środowisko i mikroklimat"
            title="Jakość powietrza"
            description="Odczyty ze stacji Państwowego Monitoringu Środowiska (GIOŚ) na podstawie Twojej lokalizacji GPS lub wybranego miasta."
         >
            <AirQualityDashboard />
         </Section>
      </ViewShell>
   );
}
