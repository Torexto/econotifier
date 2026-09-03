import {
   QueryClient,
   QueryClientProvider,
   useQuery,
} from "@tanstack/react-query";
import { getEnergyPrices } from "./lib/pse";

const queryClient = new QueryClient();

function App() {
   return (
      <QueryClientProvider client={queryClient}>
         <Test />
      </QueryClientProvider>
   );
}

function Test() {
   const { data, isLoading, error } = useQuery({
      queryFn: getEnergyPrices,
      queryKey: ["energy-prices"],
   });

   return <></>;
}

export default App;
