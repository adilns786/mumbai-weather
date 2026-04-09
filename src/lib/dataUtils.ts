

// ─── src/lib/dataUtils.ts ───────────────────────────────────
import type { WeatherRow } from "@/components/FileUploadContext";

export function enrich(rows: WeatherRow[]): WeatherRow[] {
  return rows.map((r) => {
    const dt = new Date(String(r.datetime));
    const sr = new Date(String(r.sunrise));
    const ss = new Date(String(r.sunset));
    return {
      ...r,
      month:       dt.getMonth() + 1,
      day:         dt.getDate(),
      dayofweek:   dt.getDay(),
      dayofyear:   Math.ceil((dt.getTime() - new Date(dt.getFullYear(), 0, 1).getTime()) / 86400000),
      daylength_hr:isNaN(sr.getTime()) ? 13 : (ss.getTime() - sr.getTime()) / 3600000,
      will_rain:   Number(r.precipprob) >= 50 ? 1 : 0,
    };
  });
}

export function num(rows: WeatherRow[], col: string): number[] {
  return rows.map((r) => Number(r[col])).filter((v) => !isNaN(v));
}

export function monthlySum(rows: WeatherRow[], col: string) {
  const acc: Record<number, number> = {};
  rows.forEach((r) => {
    const m = Number(r.month);
    acc[m] = (acc[m] ?? 0) + Number(r[col] ?? 0);
  });
  const names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return Object.entries(acc).map(([m, v]) => ({ month: names[Number(m)], value: +v.toFixed(2) }));
}

export function rollingAvg(rows: WeatherRow[], col: string, w = 7) {
  const vals = rows.map((r) => ({ date: String(r.datetime).slice(0, 10), v: Number(r[col]) }));
  return vals.map((p, i) => {
    const slice = vals.slice(Math.max(0, i - w + 1), i + 1);
    return { date: p.date, value: +(slice.reduce((s, x) => s + x.v, 0) / slice.length).toFixed(2) };
  });
}

export function scatter(rows: WeatherRow[], x: string, y: string) {
  return rows.map((r) => ({ x: Number(r[x]), y: Number(r[y]), rain: Number(r.will_rain) }))
             .filter((p) => !isNaN(p.x) && !isNaN(p.y));
}
