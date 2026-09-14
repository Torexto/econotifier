import type { AirQualityResponse, StationsResponse } from "./types";

export type AirQualityParams = {
   lat?: number | null;
   lon?: number | null;
   stationId?: number | null;
};

export async function getAirQuality(
   params: AirQualityParams = {},
): Promise<AirQualityResponse> {
   const url = new URL("/api/air-quality", window.location.origin);

   if (params.stationId != null) {
      url.searchParams.set("stationId", params.stationId.toString());
   } else if (params.lat != null && params.lon != null) {
      url.searchParams.set("lat", params.lat.toFixed(6));
      url.searchParams.set("lon", params.lon.toFixed(6));
   }

   const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
   });

   if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as {
         error?: string;
      } | null;
      throw new Error(
         errorBody?.error ??
            `Błąd pobierania jakości powietrza (${response.status})`,
      );
   }

   return response.json();
}

export async function getStations(): Promise<StationsResponse> {
   const url = new URL("/api/air-quality", window.location.origin);
   url.searchParams.set("stations", "true");

   const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
   });

   if (!response.ok) {
      throw new Error(
         `Błąd pobierania listy stacji pomiarowych (${response.status})`,
      );
   }

   return response.json();
}
