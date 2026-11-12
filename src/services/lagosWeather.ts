/**
 * Real-Time Lagos, Nigeria Weather & Time Service for NIERO.EXE
 * Fetches live weather conditions from Open-Meteo for Lagos (Latitude 6.5244, Longitude 3.3792)
 * and formats live West Africa Time (WAT, GMT+1).
 * Strictly controls the 3D world atmosphere (NO random cycling).
 */

import { WeatherState } from '../game/weather';

export interface LagosHourlyForecast {
  timeLabel: string;
  hour: number;
  temperatureC: number;
  conditionText: string;
  icon: string;
  isRain: boolean;
}

export interface LagosWeatherReport {
  temperatureC: number;
  temperatureF: number;
  weatherCode: number;
  conditionText: string;
  weatherState: WeatherState;
  icon: string;
  humidity: number;
  windSpeedKmH: number;
  isDay: boolean;
  lagosTime: string;
  lagosDate: string;
  forecast: LagosHourlyForecast[];
  lastUpdated: Date;
}

export function mapWeatherCodeToState(code: number): {
  weatherState: WeatherState;
  conditionText: string;
  icon: string;
} {
  switch (code) {
    case 0:
      return { weatherState: 'sunny', conditionText: 'Clear Skies', icon: '☀️' };
    case 1:
      return { weatherState: 'sunny', conditionText: 'Mainly Clear', icon: '🌤️' };
    case 2:
      return { weatherState: 'overcast', conditionText: 'Partly Cloudy', icon: '⛅' };
    case 3:
      return { weatherState: 'overcast', conditionText: 'Overcast Skies', icon: '☁️' };
    case 45:
    case 48:
      return { weatherState: 'overcast', conditionText: 'Misty / Foggy', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { weatherState: 'rainy', conditionText: 'Light Drizzle', icon: '🌦️' };
    case 61:
    case 63:
    case 65:
      return { weatherState: 'rainy', conditionText: 'Tropical Rain', icon: '🌧️' };
    case 80:
    case 81:
    case 82:
      return { weatherState: 'rainy', conditionText: 'Rain Showers', icon: '🌧️' };
    case 95:
    case 96:
    case 99:
      return { weatherState: 'rainy', conditionText: 'Thunderstorm', icon: '⛈️' };
    default:
      return { weatherState: 'sunny', conditionText: 'Clear Sun', icon: '☀️' };
  }
}

export function getLagosTime(): { lagosTime: string; lagosDate: string } {
  const now = new Date();
  try {
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Lagos',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    return {
      lagosTime: `${timeFormatter.format(now)} WAT`,
      lagosDate: dateFormatter.format(now),
    };
  } catch {
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      lagosTime: `${timeStr} WAT`,
      lagosDate: now.toDateString(),
    };
  }
}

export async function fetchLagosLiveWeather(): Promise<LagosWeatherReport> {
  const timeInfo = getLagosTime();
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=6.5244&longitude=3.3792&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&hourly=weather_code,temperature_2m&timezone=Africa%2FLagos'
    );
    if (!res.ok) {
      throw new Error(`Weather fetch failed: ${res.status}`);
    }
    const data = await res.json();
    const current = data.current;
    const tempC = Math.round((current.temperature_2m ?? 28) * 10) / 10;
    const tempF = Math.round((tempC * 9) / 5 + 32);
    const code = current.weather_code ?? 3;
    const { weatherState, conditionText, icon } = mapWeatherCodeToState(code);

    // Extract next key hourly snapshots (Morning, Afternoon, Evening, Night)
    const forecast: LagosHourlyForecast[] = [];
    if (data.hourly && Array.isArray(data.hourly.time)) {
      const times: string[] = data.hourly.time;
      const codes: number[] = data.hourly.weather_code || [];
      const temps: number[] = data.hourly.temperature_2m || [];

      // Find indices for 09:00, 14:00, 18:00, 22:00
      const targetHours = [9, 14, 18, 22];
      targetHours.forEach(th => {
        const idx = times.findIndex(t => t.includes(`T${th < 10 ? '0' + th : th}:00`));
        if (idx !== -1) {
          const c = codes[idx] ?? 2;
          const { conditionText: cText, icon: cIcon, weatherState: ws } = mapWeatherCodeToState(c);
          forecast.push({
            hour: th,
            timeLabel: th === 9 ? '09:00 (Morn)' : th === 14 ? '14:00 (Aft)' : th === 18 ? '18:00 (Eve)' : '22:00 (Night)',
            temperatureC: Math.round((temps[idx] ?? 28) * 10) / 10,
            conditionText: cText,
            icon: cIcon,
            isRain: ws === 'rainy',
          });
        }
      });
    }

    return {
      temperatureC: tempC,
      temperatureF: tempF,
      weatherCode: code,
      conditionText,
      weatherState,
      icon,
      humidity: Math.round(current.relative_humidity_2m ?? 75),
      windSpeedKmH: Math.round((current.wind_speed_10m ?? 5) * 10) / 10,
      isDay: current.is_day === 1,
      lagosTime: timeInfo.lagosTime,
      lagosDate: timeInfo.lagosDate,
      forecast,
      lastUpdated: new Date(),
    };
  } catch {
    // Graceful fallback with realistic Lagos daytime weather
    return {
      temperatureC: 29.0,
      temperatureF: 84,
      weatherCode: 3,
      conditionText: 'Warm Overcast',
      weatherState: 'overcast',
      icon: '☁️',
      humidity: 74,
      windSpeedKmH: 6.2,
      isDay: true,
      lagosTime: timeInfo.lagosTime,
      lagosDate: timeInfo.lagosDate,
      forecast: [
        { hour: 9, timeLabel: '09:00 (Morn)', temperatureC: 27.5, conditionText: 'Partly Cloudy', icon: '⛅', isRain: false },
        { hour: 14, timeLabel: '14:00 (Aft)', temperatureC: 31.0, conditionText: 'Warm Sun', icon: '☀️', isRain: false },
        { hour: 18, timeLabel: '18:00 (Eve)', temperatureC: 28.0, conditionText: 'Light Showers', icon: '🌧️', isRain: true },
        { hour: 22, timeLabel: '22:00 (Night)', temperatureC: 26.5, conditionText: 'Overcast Night', icon: '☁️', isRain: false },
      ],
      lastUpdated: new Date(),
    };
  }
}
