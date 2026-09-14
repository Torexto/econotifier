import { Wind } from "lucide-react";
import { AirQualityDashboard } from "@/lib/ui/air-quality";

export function AirQualityView() {
   return (
      <div className="view-content air-quality-view">
         <section className="dashboard-section" id="air-quality">
            <div className="section-heading">
               <div>
                  <p className="eyebrow">
                     <Wind size={13} aria-hidden="true" /> Środowisko i
                     mikroklimat
                  </p>
                  <h2>Jakość powietrza</h2>
               </div>
               <p>
                  Odczyty ze stacji Państwowego Monitoringu Środowiska (GIOŚ) na
                  podstawie Twojej geolokalizacji GPS.
               </p>
            </div>
            <AirQualityDashboard />
         </section>
      </div>
   );
}
