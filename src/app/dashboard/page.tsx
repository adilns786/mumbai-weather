"use client";
import { motion } from "framer-motion";
import { useUpload } from "@/components/FileUploadContext";
import { num, monthlySum, rollingAvg } from "@/lib/dataUtils";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Thermometer, Droplets, Wind, Sun } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

function StatCard({ label, value, unit, color, icon: Icon }:
  { label: string; value: string; unit: string; color: string; icon: React.ElementType }) {
  return (
    <motion.div variants={fadeUp}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-semibold text-gray-800">{value}<span className="text-sm text-gray-400 ml-1">{unit}</span></p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { csvData, isReady } = useUpload();

  if (!isReady) return (
    <div className="flex flex-col items-center justify-center h-72 text-gray-400 gap-3">
      <Sun size={40} className="opacity-30" />
      <p className="text-lg">Upload <strong>mumbai.csv</strong> using the banner above to begin.</p>
    </div>
  );

  const avgTemp  = (num(csvData, "temp").reduce((a, b) => a + b, 0) / csvData.length).toFixed(1);
  const avgHum   = (num(csvData, "humidity").reduce((a, b) => a + b, 0) / csvData.length).toFixed(1);
  const avgWind  = (num(csvData, "windspeed").reduce((a, b) => a + b, 0) / csvData.length).toFixed(1);
  const rainDays = csvData.filter((r) => Number(r.will_rain) === 1).length;

  const tempRolling = rollingAvg(csvData, "temp", 7).slice(0, 120);
  const monthRain   = monthlySum(csvData, "precip");
  const humCloud    = csvData.slice(0, 120).map((r) => ({
    date: String(r.datetime).slice(5, 10),
    humidity: Number(r.humidity),
    cloudcover: Number(r.cloudcover),
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-semibold text-gray-800">Mumbai Weather Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">{csvData.length} days of data loaded</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Avg Temperature" value={avgTemp} unit="°C" color="bg-orange-400" icon={Thermometer} />
        <StatCard label="Avg Humidity"    value={avgHum}  unit="%" color="bg-blue-400"   icon={Droplets} />
        <StatCard label="Avg Wind Speed"  value={avgWind} unit="km/h" color="bg-teal-400" icon={Wind} />
        <StatCard label="Rain Days"       value={String(rainDays)} unit="days" color="bg-purple-400" icon={Droplets} />
      </div>

      {/* Top charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rolling temp */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">7-day rolling avg temperature</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={tempRolling}>
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval={20} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} domain={["auto","auto"]} unit="°" />
              <Tooltip formatter={(v: number) => [`${v}°C`, "Temp"]} />
              <Area type="monotone" dataKey="value" stroke="#f97316" fill="url(#tg)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly rain */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Monthly total precipitation</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthRain}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} unit="mm" />
              <Tooltip formatter={(v: number) => [`${v} mm`, "Precipitation"]} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Humidity vs cloudcover */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Humidity vs cloud cover (first 120 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={humCloud}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval={15} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="humidity"   stroke="#3b82f6" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="cloudcover" stroke="#a855f7" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
}