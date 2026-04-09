// src/app/predictions/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpload } from "@/components/FileUploadContext";
import { runRainInference, runTempInference } from "@/lib/onnxInfer";
import { Sliders, CloudRain, Thermometer, Info, PlayCircle } from "lucide-react";

const FEATURE_META: Record<string, { label: string; min: number; max: number; step: number; unit: string; default: number }> = {
  humidity:         { label: "Humidity",           min: 30,   max: 100,  step: 1,   unit: "%",    default: 75   },
  cloudcover:       { label: "Cloud cover",        min: 0,    max: 100,  step: 1,   unit: "%",    default: 50   },
  sealevelpressure: { label: "Sea level pressure", min: 990,  max: 1025, step: 0.5, unit: "hPa", default: 1005 },
  windspeed:        { label: "Wind speed",         min: 0,    max: 80,   step: 1,   unit: "km/h", default: 20   },
  windgust:         { label: "Wind gust",          min: 0,    max: 100,  step: 1,   unit: "km/h", default: 30   },
  dew:              { label: "Dew point",          min: 10,   max: 30,   step: 0.5, unit: "°C",   default: 25   },
  temp:             { label: "Temperature",        min: 20,   max: 40,   step: 0.5, unit: "°C",   default: 30   },
  feelslike:        { label: "Feels like",         min: 25,   max: 50,   step: 0.5, unit: "°C",   default: 36   },
  feelslikemax:     { label: "Feels like max",     min: 30,   max: 55,   step: 0.5, unit: "°C",   default: 40   },
  feelslikemin:     { label: "Feels like min",     min: 25,   max: 40,   step: 0.5, unit: "°C",   default: 34   },
  visibility:       { label: "Visibility",         min: 0,    max: 20,   step: 0.5, unit: "km",   default: 5    },
  month:            { label: "Month",              min: 1,    max: 12,   step: 1,   unit: "",      default: 7    },
  dayofyear:        { label: "Day of year",        min: 1,    max: 365,  step: 1,   unit: "",      default: 190  },
  precipcover:      { label: "Precip cover",       min: 0,    max: 100,  step: 1,   unit: "%",    default: 4    },
  precipprob:       { label: "Precip probability", min: 0,    max: 100,  step: 1,   unit: "%",    default: 40   },
  solarradiation:   { label: "Solar radiation",    min: 0,    max: 400,  step: 5,   unit: "W/m²", default: 240  },
  uvindex:          { label: "UV index",           min: 0,    max: 12,   step: 1,   unit: "",      default: 8    },
  daylength_hr:     { label: "Day length",         min: 11,   max: 14,   step: 0.1, unit: "hr",   default: 13   },
};

export default function PredictionsPage() {
  const { models } = useUpload();
  const { rainSession, tempSession, rainFeatures, tempFeatures } = models;
  const hasModels = !!rainSession && !!tempSession;

  const allFeatures = Array.from(new Set([...rainFeatures, ...tempFeatures]));

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    allFeatures.forEach((f) => { init[f] = FEATURE_META[f]?.default ?? 0; });
    return init;
  });

  const [rainResult, setRainResult] = useState<{ prediction: number; probNoRain: number; probRain: number } | null>(null);
  const [tempResult, setTempResult] = useState<number | null>(null);
  const [loading, setLoading]       = useState(false);

const handlePredict = useCallback(async () => {
  if (!hasModels) return;
  setLoading(true);
  try {
    // Sequential — not Promise.all — because ONNX runtime is single-threaded
    const r = await runRainInference(rainSession, rainFeatures, values);
    const t = await runTempInference(tempSession, tempFeatures, values);
    setRainResult(r);
    setTempResult(t);
  } catch (e) {
    console.error("Inference error:", e);
  } finally {
    setLoading(false);
  }
}, [hasModels, rainSession, tempSession, rainFeatures, tempFeatures, values]);
  // Run once automatically when models first become available
  useEffect(() => {
    if (hasModels) handlePredict();
  }, [hasModels]); // eslint-disable-line react-hooks/exhaustive-deps

  function set(f: string, v: number) {
    setValues((prev) => ({ ...prev, [f]: v }));
  }

  if (!hasModels) return (
    <div className="flex flex-col items-center justify-center h-72 text-gray-400 gap-3">
      <Sliders size={40} className="opacity-30" />
      <p className="text-lg text-center">
        Upload <strong>rain_model.onnx</strong>, <strong>temp_model.onnx</strong>, and{" "}
        <strong>model_features.json</strong> to use the prediction tool.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Prediction Tool</h1>
        <p className="text-sm text-gray-400 mt-1">Adjust parameters, then click Predict.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {allFeatures.map((f) => {
              const meta = FEATURE_META[f];
              if (!meta) return null;
              const usedBy: string[] = [];
              if (rainFeatures.includes(f)) usedBy.push("Rain");
              if (tempFeatures.includes(f)) usedBy.push("Temp");
              return (
                <div key={f}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">{meta.label}</label>
                    <div className="flex items-center gap-1.5">
                      {usedBy.map((u) => (
                        <span key={u} className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${u === "Rain" ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}>
                          {u}
                        </span>
                      ))}
                      <span className="text-sm font-semibold text-gray-800 min-w-[52px] text-right">
                        {values[f]?.toFixed(meta.step < 1 ? 1 : 0)}{meta.unit}
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={meta.min} max={meta.max} step={meta.step}
                    value={values[f] ?? meta.default}
                    onChange={(e) => set(f, parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                    <span>{meta.min}{meta.unit}</span><span>{meta.max}{meta.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Predict button */}
          <button
            onClick={handlePredict}
            disabled={loading}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       bg-blue-500 hover:bg-blue-600 active:bg-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-semibold text-sm transition-colors"
          >
            <PlayCircle size={16} />
            {loading ? "Predicting..." : "Predict"}
          </button>
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {/* Rain result */}
          <AnimatePresence mode="wait">
            {rainResult && (
              <motion.div key={rainResult.prediction}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`rounded-2xl p-6 border-2 ${rainResult.prediction === 1
                  ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <CloudRain size={22} className={rainResult.prediction === 1 ? "text-blue-500" : "text-gray-400"} />
                  <h2 className="font-semibold text-gray-700">Rain prediction</h2>
                </div>
                <div className={`text-4xl font-bold mb-1 ${rainResult.prediction === 1 ? "text-blue-600" : "text-gray-500"}`}>
                  {rainResult.prediction === 1 ? "RAIN" : "NO RAIN"}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {rainResult.prediction === 1
                    ? `${(rainResult.probRain * 100).toFixed(1)}% probability of rain`
                    : `${(rainResult.probNoRain * 100).toFixed(1)}% probability of no rain`}
                </p>
                <div className="space-y-2">
                  <ProbBar label="Rain"    value={rainResult.probRain}   color="bg-blue-400" />
                  <ProbBar label="No rain" value={rainResult.probNoRain} color="bg-gray-300" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Temp result */}
          <AnimatePresence mode="wait">
            {tempResult !== null && (
              <motion.div key={tempResult}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-2xl p-6 bg-orange-50 border-2 border-orange-200">
                <div className="flex items-center gap-3 mb-2">
                  <Thermometer size={22} className="text-orange-400" />
                  <h2 className="font-semibold text-gray-700">Temperature prediction</h2>
                </div>
                <div className="text-4xl font-bold text-orange-500">{tempResult}°C</div>
                <p className="text-sm text-gray-400 mt-1">Predicted mean temperature</p>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && (
            <div className="text-center text-sm text-gray-400 animate-pulse">Running inference...</div>
          )}

          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex gap-2 text-xs text-gray-400">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>Blue badges = used by Rain model. Orange badges = used by Temp model. Click Predict after adjusting sliders.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span><span>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ type: "spring", stiffness: 120 }}
        />
      </div>
    </div>
  );
}