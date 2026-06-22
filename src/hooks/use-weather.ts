/**
 * Hook: Weather data via browser geolocation + Open-Meteo (free, no API key).
 *
 * Requests the user's location, reverse-geocodes the city name,
 * and fetches current temperature + weather code. Refreshes every 30 minutes.
 * Silently degrades if geolocation is denied or unavailable.
 */

import { useEffect, useState } from "react";

/** WMO weather code → emoji mapping. */
const WEATHER_EMOJI: Record<number, string> = {
  0: "☀️", 1: "🌤", 2: "⛅", 3: "☁️",
  45: "🌫", 48: "🌫",
  51: "🌦", 53: "🌦", 55: "🌦",
  61: "🌧", 63: "🌧", 65: "🌧",
  71: "🌨", 73: "🌨", 75: "🌨",
  80: "🌦", 81: "🌧", 82: "🌧",
  95: "⛈", 96: "⛈", 99: "⛈",
};

export interface WeatherData {
  temp: number | null;
  emoji: string;
  city: string | null;
}

export function useWeather(): WeatherData {
  const [weather, setWeather] = useState<WeatherData>({ temp: null, emoji: "", city: null });

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        // Reverse geocode city name (Nominatim — free, rate-limited)
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=zh`,
        );
        let city: string | null = null;
        if (geoRes.ok) {
          const geo = await geoRes.json();
          city = geo?.address?.city || geo?.address?.town || geo?.address?.county || geo?.address?.state || null;
        }

        // Current weather (Open-Meteo — free, no key)
        const meteoRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`,
        );
        if (meteoRes.ok) {
          const data = await meteoRes.json();
          const code = data?.current?.weather_code as number | undefined;
          setWeather({
            temp: Math.round(data?.current?.temperature_2m ?? 0),
            emoji: code != null ? (WEATHER_EMOJI[code] ?? "🌡") : "",
            city,
          });
        }
      } catch {
        // Non-critical — silently ignore
      }
    };

    // Initial fetch
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => {},
    );

    // Refresh every 30 minutes
    const timer = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => {},
      );
    }, 1_800_000);

    return () => clearInterval(timer);
  }, []);

  return weather;
}
