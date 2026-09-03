export const PSE_API_URL = "https://api.raporty.pse.pl/api";

export const PSE_API_ENERGY_PRICES = `${PSE_API_URL}/energy-prices`;

export async function getEnergyPrices() {
   const today = new Date().toISOString().split("T")[0];
   const res = await fetch(
      PSE_API_ENERGY_PRICES +
         `?$filter=business_date eq '${today}'&$orderby=dtime_utc asc`,
   );
   const data = await res.json();
   console.log(data);
   return data;
}
