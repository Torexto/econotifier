const PSE_API_URL = "https://api.raporty.pse.pl/api";

const PSE_API_ENERGY_PRICES = `/energy-prices`;
const PSE_API_RCE_PLN = `/rce-pln`;
const PSE_API_KSE_LOAD = `/kse-load`;
const PSE_API_HIS_GEN_PAL = `/his-gen-pal`;
const PSE_API_GEN_JW = `/gen-jw`;

async function fetchData(endpoint: string) {
  const today = new Date().toISOString().split("T")[0];
  const PSE_API_PARAMS = `?$filter=business_date eq '${today}'&$orderby=dtime_utc asc`;
  const res = await fetch(PSE_API_URL + endpoint + PSE_API_PARAMS);

  if (!res.ok) {
    throw new Error(`Failed to fetch data from ${endpoint}`);
  }

  const data = await res.json();
  return data.value || [];
}

export async function getEnergyPrices() {
  return fetchData(PSE_API_ENERGY_PRICES);
}

export async function getRCEPLN() {
  return fetchData(PSE_API_RCE_PLN);
}

export async function getKSELoad() {
  return fetchData(PSE_API_KSE_LOAD);
}

export async function getHISGenPAL() {
  return fetchData(PSE_API_HIS_GEN_PAL);
}

export async function getGENJW() {
  return fetchData(PSE_API_GEN_JW);
}
