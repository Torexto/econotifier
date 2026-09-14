export type AirQualityStation = {
   id: number;
   stationCode: string;
   stationName: string;
   latitude: number;
   longitude: number;
   province: string | null;
   city: string | null;
   address: string | null;
   distanceKm?: number;
};

export type PollutantIndex = {
   value: number | null;
   label: string | null;
   calcDate: string | null;
   sourceDate: string | null;
};

export type AirQualityData = {
   overall: PollutantIndex;
   status: boolean;
   criticalPollutant: string | null;
   components: {
      pm10: PollutantIndex;
      pm25: PollutantIndex;
      no2: PollutantIndex;
      o3: PollutantIndex;
      so2: PollutantIndex;
   };
};

export type SensorReading = {
   id: number;
   code: string;
   name: string;
   value: number | null;
   date: string | null;
   unit: string;
};

export type AirQualityResponse = {
   station: AirQualityStation;
   aqi: AirQualityData | null;
   sensors: SensorReading[];
   nearbyStations: AirQualityStation[];
   source: "gios-api";
   cachedAt: number;
   cacheStatus: "HIT" | "MISS" | "BYPASS";
   isDefaultLocation?: boolean;
};

export type StationsResponse = {
   stations: AirQualityStation[];
   count: number;
};
