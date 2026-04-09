// ─── src/lib/parseCSV.ts ────────────────────────────────────
import Papa from "papaparse";
import type { WeatherRow } from "@/components/FileUploadContext";

export function parseCSVFile(file: File): Promise<WeatherRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data as WeatherRow[]),
      error: reject,
    });
  });
}

