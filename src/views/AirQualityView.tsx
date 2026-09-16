import { Wind } from "lucide-react";
import { AirQualityDashboard } from "@/lib/ui/air-quality";
import { SectionHeading } from "@/lib/ui/shared";

export function AirQualityView() {
   return (
      <div className="flex flex-col gap-10">
         <section className="scroll-mt-20" id="air-quality">
            <SectionHeading
               icon={<Wind size={14} aria-hidden="true" />}
               eyebrow="Środowisko i mikroklimat"
               title="Jakość powietrza"
               description="Odczyty ze stacji Państwowego Monitoringu Środowiska (GIOŚ) na podstawie Twojej lokalizacji GPS lub wybranego miasta."
            />
            <AirQualityDashboard />
         </section>
      </div>
   );
}
