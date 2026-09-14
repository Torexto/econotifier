import { BarChart3, Bolt, Zap } from "lucide-react";
import { EnergyPrice, GenerationDashboard, KseLoadChart } from "@/lib/ui/pse";

export function EnergyView() {
   return (
      <div className="view-content energy-view">
         {/* Sub-section: Energy Price Window */}
         <section className="dashboard-section price-section" id="prices">
            <div className="section-heading">
               <div>
                  <p className="eyebrow">
                     <Zap size={13} aria-hidden="true" /> Rynek bilansujący
                  </p>
                  <h2>Najlepszy moment na energię</h2>
               </div>
               <p>
                  Rekomendowane godziny niższego kosztu energii dla elastycznego
                  zużycia.
               </p>
            </div>
            <EnergyPrice />
         </section>

         {/* Sub-section: KSE Demand */}
         <section className="dashboard-section" id="demand">
            <div className="section-heading compact-heading">
               <div>
                  <p className="eyebrow">
                     <BarChart3 size={13} aria-hidden="true" /> Krajowy system
                  </p>
                  <h2>Zapotrzebowanie KSE</h2>
               </div>
               <p>
                  Bieżące obciążenie i prognoza zapotrzebowania mocy w Polsce.
               </p>
            </div>
            <KseLoadChart />
         </section>

         {/* Sub-section: Generation by Power Plant */}
         <section className="dashboard-section" id="generation">
            <div className="section-heading compact-heading">
               <div>
                  <p className="eyebrow">
                     <Bolt size={13} aria-hidden="true" /> Wytwarzanie mocy
                  </p>
                  <h2>Generacja elektrowni</h2>
               </div>
               <p>
                  Praca krajowych elektrowni i elektrociepłowni według
                  jednostek.
               </p>
            </div>
            <GenerationDashboard />
         </section>
      </div>
   );
}
