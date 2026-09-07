import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EnergyPrice, GenerationDashboard, KseLoadChart } from "@/lib/ui/pse";
import { BrowserRouter, Route, Routes } from "react-router";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <EnergyPrice />
                <GenerationDashboard />
                <KseLoadChart />
              </>
            }
          ></Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
