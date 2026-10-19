import { useEffect, useState } from "react";

export interface WeatherState {
  status: "loading" | "live" | "offline";
  tempC?: number;
  windKmh?: number;
  label?: string;
}

function weatherLabel(code: number) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  if (code >= 95) return "Thunder";
  return "Mixed";
}

export function useOttawaWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 8000);
    let cancelled = false;
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=45.4215&longitude=-75.6972&current=temperature_2m,weather_code,wind_speed_10m&timezone=America%2FToronto";

    fetch(url, { signal: ctrl.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
      })
      .then((data: { current?: { temperature_2m?: number; weather_code?: number; wind_speed_10m?: number } }) => {
        const current = data.current;
        if (!current || typeof current.temperature_2m !== "number" || typeof current.weather_code !== "number") {
          throw new Error("shape");
        }
        if (cancelled) return;
        setState({
          status: "live",
          tempC: current.temperature_2m,
          windKmh: typeof current.wind_speed_10m === "number" ? current.wind_speed_10m : undefined,
          label: weatherLabel(current.weather_code),
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "offline" });
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return state;
}
