
// ─── src/components/UploadBanner.tsx ────────────────────────
"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, X } from "lucide-react";
import { useUpload } from "./FileUploadContext";
import { parseCSVFile } from "@/lib/parseCSV";
import { enrich } from "@/lib/dataUtils";
import { loadOnnxSession } from "@/lib/onnxInfer";

export default function UploadBanner() {
  const { setCsvData, setModels, isReady } = useUpload();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const csvRef  = useRef<HTMLInputElement>(null);
  const rainRef = useRef<HTMLInputElement>(null);
  const tempRef = useRef<HTMLInputElement>(null);
  const featRef = useRef<HTMLInputElement>(null);

  async function handleLoad() {
    const csvFile  = csvRef.current?.files?.[0];
    const rainFile = rainRef.current?.files?.[0];
    const tempFile = tempRef.current?.files?.[0];
    const featFile = featRef.current?.files?.[0];

    if (!csvFile) { setStatus("❌ Please select the CSV file."); return; }
    setStatus("Parsing CSV...");
    const raw = await parseCSVFile(csvFile);
    setCsvData(enrich(raw));

    if (rainFile && tempFile && featFile) {
      setStatus("Loading ONNX models (this may take a moment)...");
      const featText = await featFile.text();
      const { rain_features, temp_features } = JSON.parse(featText);
      const [rainSession, tempSession] = await Promise.all([
        loadOnnxSession(rainFile),
        loadOnnxSession(tempFile),
      ]);
      setModels({ rainSession, tempSession, rainFeatures: rain_features, tempFeatures: temp_features });
      setStatus("✅ All files loaded! Models ready.");
    } else {
      setStatus("✅ CSV loaded. (No ONNX models — predictions unavailable)");
    }
    setTimeout(() => setOpen(false), 1500);
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-4 py-2 flex items-center gap-3 text-sm">
        <span className="flex-1">
          {isReady ? "✅ Data loaded — explore the dashboard!" : "Upload your Mumbai weather data to get started."}
        </span>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 font-medium transition"
        >
          <Upload size={14} /> Upload files
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Upload files</h2>
                <button onClick={() => setOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
              </div>

              {[
                { ref: csvRef,  label: "mumbai.csv", accept: ".csv", required: true },
                { ref: rainRef, label: "rain_model.onnx", accept: ".onnx", required: false },
                { ref: tempRef, label: "temp_model.onnx", accept: ".onnx", required: false },
                { ref: featRef, label: "model_features.json", accept: ".json", required: false },
              ].map(({ ref, label, accept, required }) => (
                <div key={label} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    ref={ref} type="file" accept={accept}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              ))}

              {status && (
                <p className="text-sm text-center mt-2 text-gray-600">{status}</p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleLoad}
                className="mt-5 w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl py-2.5 font-medium hover:opacity-90 transition"
              >
                Load files
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}