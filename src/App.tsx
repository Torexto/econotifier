import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Footer, MobileNavigationBar, NavigationBar } from "@/lib/ui/shared";
import { AirQualityView, EnergyView } from "@/views";

const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         staleTime: 1000 * 60 * 5,
         gcTime: 1000 * 60 * 30,
         refetchOnWindowFocus: false,
         retry: 2,
      },
   },
});

export default function App() {
   return (
      <QueryClientProvider client={queryClient}>
         <BrowserRouter>
            <AppContent />
         </BrowserRouter>
      </QueryClientProvider>
   );
}

export function AppContent() {
   return (
      <div className="flex min-h-screen flex-col bg-[#f6f8f7] text-slate-800 antialiased selection:bg-emerald-500/20 selection:text-emerald-900 dark:bg-[#131a16] dark:text-slate-100 dark:selection:bg-emerald-500/30 dark:selection:text-emerald-200">
         <NavigationBar />

         <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <Routes>
               <Route path="/" element={<Navigate to="/energy" replace />} />
               <Route path="/energy" element={<EnergyView />} />
               <Route path="/air-quality" element={<AirQualityView />} />
               <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
         </main>

         <MobileNavigationBar />
         <Footer />
      </div>
   );
}
