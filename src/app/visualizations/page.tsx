"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpload } from "@/components/FileUploadContext";
import { monthlySum, rollingAvg, scatter, num } from "@/lib/dataUtils";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { BarChart2 } from "lucide-react";

// ── Chart registry ───────────────────────────────────────────
type ChartDef = { id: string; label: string; category: string };

const CHARTS: ChartDef[] = [
  { id: "temp_range",       label: "Temperature range (min/max/feels-like)", category: "Temperature" },
  { id: "temp_rolling",     label: "7-day rolling avg temperature",           category: "Temperature" },
  { id: "monthly_precip",   label: "Monthly total precipitation",             category: "Rain" },
  { id: "precip_prob_dist", label: "Precipitation probability distribution",  category: "Rain" },
  { id: "humidity_scatter", label: "Humidity vs precipitation (scatter)",     category: "Rain" },
  { id: "solar_uv",         label: "Solar radiation vs UV index (scatter)",   category: "Solar" },
  { id: "monthly_solar",    label: "Monthly avg solar radiation",             category: "Solar" },
  { id: "wind_cloud",       label: "Wind speed vs cloud cover",               category: "Wind" },
  { id: "monthly_wind",     label: "Monthly avg wind speed",                  category: "Wind" },
  { id: "hum_cloud_line",   label: "Humidity & cloud cover over time",        category: "Humidity" },
  { id: "pressure_temp",    label: "Sea level pressure vs temperature",       category: "Pressure" },
  { id: "radar_monthly",    label: "Monthly climate radar",                   category: "Multi" },
];

const CATEGORIES = ["All", ...Array.from(new Set(CHARTS.map((c) => c.category)))];
const TOP_IDS = ["temp_range","monthly_precip","humidity_scatter","solar_uv","hum_cloud_line","radar_monthly"];

export default function VisualizationsPage() {
  const { csvData, isReady } = useUpload();
  const [selected, setSelected] = useState<string[]>(TOP_IDS);
  const [cat, setCat] = useState("All");

  if (!isReady) return (
    <div className="flex flex-col items-center justify-center h-72 text-gray-400 gap-3">
      <BarChart2 size={40} className="opacity-30" />
      <p className="text-lg">Upload data to view visualizations.</p>
    </div>
  );

  const visible = CHARTS.filter((c) => cat === "All" || c.category === cat);

  function toggleChart(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-800 mr-2">Visualizations</h1>
        <button
          onClick={() => setSelected(TOP_IDS)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:opacity-90 transition"
        >
          ★ Top 6 charts
        </button>
        <button
          onClick={() => setSelected(CHARTS.map((c) => c.id))}
          className="border border-gray-200 text-gray-600 rounded-lg px-4 py-1.5 text-sm hover:bg-gray-50 transition"
        >
          Show all
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition
              ${cat === c ? "bg-blue-500 text-white border-blue-500" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Chart toggles */}
      <div className="flex flex-wrap gap-2">
        {visible.map((c) => (
          <motion.button key={c.id} whileTap={{ scale: 0.95 }} onClick={() => toggleChart(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
              ${selected.includes(c.id)
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            {selected.includes(c.id) ? "✓ " : ""}{c.label}
          </motion.button>
        ))}
      </div>

      {/* Charts grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {CHARTS.filter((c) => selected.includes(c.id)).map((c) => (
            <motion.div key={c.id} layout
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-600 mb-4">{c.label}</h2>
              <ChartRenderer id={c.id} data={csvData} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Individual chart renderers ───────────────────────────────
function ChartRenderer({ id, data }: { id: string; data: ReturnType<typeof useUpload>["csvData"] }) {
  const h = 220;

  if (id === "temp_range") {
    const d = data.slice(0, 150).map((r) => ({
      date: String(r.datetime).slice(5, 10),
      max: Number(r.tempmax), min: Number(r.tempmin), feels: Number(r.feelslike),
    }));
    return (
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart data={d}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={20} />
          <YAxis tick={{ fontSize: 9 }} unit="°" domain={["auto","auto"]} />
          <Tooltip />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="max"    stroke="#f97316" fill="#fff7ed" strokeWidth={1.5} />
          <Area type="monotone" dataKey="min"    stroke="#3b82f6" fill="#eff6ff" strokeWidth={1.5} />
          <Line type="monotone" dataKey="feels"  stroke="#a855f7" strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (id === "temp_rolling") {
    const d = rollingAvg(data, "temp", 7).slice(0, 150);
    return (
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart data={d}>
          <defs><linearGradient id="tg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={20} />
          <YAxis tick={{ fontSize: 9 }} unit="°" domain={["auto","auto"]} />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#f97316" fill="url(#tg2)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (id === "monthly_precip") {
    const d = monthlySum(data, "precip");
    return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={d}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} unit="mm" />
<Tooltip formatter={(v) => [typeof v === "number" ? `${v} mm` : "—", "Precipitation"]} />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (id === "precip_prob_dist") {
    const bins = [0,10,20,30,40,50,60,70,80,90,100];
    const counts = bins.slice(0,-1).map((lo, i) => {
      const hi = bins[i+1];
      return { range: `${lo}-${hi}`, count: data.filter((r) => Number(r.precipprob) >= lo && Number(r.precipprob) < hi).length };
    });
    return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={counts}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="range" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#06b6d4" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (id === "humidity_scatter") {
    const d = scatter(data, "humidity", "precip");
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="x" name="Humidity" unit="%" tick={{ fontSize: 9 }} />
          <YAxis dataKey="y" name="Precip" unit="mm" tick={{ fontSize: 9 }} />
          <ZAxis range={[30, 30]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => [v, n]} />
          <Scatter data={d.filter((p) => p.rain === 1)} fill="#6366f1" opacity={0.7} name="Rain" />
          <Scatter data={d.filter((p) => p.rain === 0)} fill="#94a3b8" opacity={0.5} name="No rain" />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (id === "solar_uv") {
    const d = scatter(data, "solarradiation", "uvindex");
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="x" name="Solar rad" unit=" W/m²" tick={{ fontSize: 9 }} />
          <YAxis dataKey="y" name="UV" tick={{ fontSize: 9 }} />
          <ZAxis range={[30, 30]} /><Tooltip />
          <Scatter data={d} fill="#f59e0b" opacity={0.7} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (id === "monthly_solar") {
    const d = monthlySum(data, "solarradiation");
    return (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={d}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (id === "wind_cloud") {
    const d = scatter(data, "windspeed", "cloudcover");
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="x" name="Wind" unit=" km/h" tick={{ fontSize: 9 }} />
          <YAxis dataKey="y" name="Cloud" unit="%" tick={{ fontSize: 9 }} />
          <ZAxis range={[30, 30]} /><Tooltip />
          <Scatter data={d} fill="#14b8a6" opacity={0.65} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (id === "monthly_wind") {
    const acc: Record<string, number[]> = {};
    const names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    data.forEach((r) => {
      const m = names[Number(r.month)];
      if (!acc[m]) acc[m] = [];
      acc[m].push(Number(r.windspeed));
    });
    const d = Object.entries(acc).map(([month, vs]) => ({ month, value: +(vs.reduce((a,b)=>a+b,0)/vs.length).toFixed(1) }));
    return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={d}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} unit=" km/h" />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (id === "hum_cloud_line") {
    const d = data.slice(0, 120).map((r) => ({
      date: String(r.datetime).slice(5, 10),
      humidity: Number(r.humidity), cloudcover: Number(r.cloudcover),
    }));
    return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={d}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={20} />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip /><Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="humidity"   stroke="#3b82f6" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="cloudcover" stroke="#a855f7" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (id === "pressure_temp") {
    const d = scatter(data, "sealevelpressure", "temp");
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="x" name="Pressure" unit=" hPa" tick={{ fontSize: 9 }} />
          <YAxis dataKey="y" name="Temp" unit="°C" tick={{ fontSize: 9 }} />
          <ZAxis range={[30, 30]} /><Tooltip />
          <Scatter data={d} fill="#ec4899" opacity={0.65} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (id === "radar_monthly") {
    const names = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const acc: Record<string, { temp: number[]; hum: number[]; wind: number[] }> = {};
    data.forEach((r) => {
      const m = names[Number(r.month)];
      if (!acc[m]) acc[m] = { temp: [], hum: [], wind: [] };
      acc[m].temp.push(Number(r.temp));
      acc[m].hum.push(Number(r.humidity));
      acc[m].wind.push(Number(r.windspeed));
    });
    const avg = (a: number[]) => +(a.reduce((s,x)=>s+x,0)/a.length).toFixed(1);
    const d = Object.entries(acc).map(([month, v]) => ({ month, temp: avg(v.temp), humidity: avg(v.hum), wind: avg(v.wind) }));
    return (
      <ResponsiveContainer width="100%" height={h}>
        <RadarChart data={d}>
          <PolarGrid />
          <PolarAngleAxis dataKey="month" tick={{ fontSize: 9 }} />
          <Radar name="Temp"     dataKey="temp"     stroke="#f97316" fill="#f97316" fillOpacity={0.2} />
          <Radar name="Humidity" dataKey="humidity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        </RadarChart>
      </ResponsiveContainer>
    );
  }

  return <div className="text-gray-400 text-sm">Chart not implemented.</div>;
}