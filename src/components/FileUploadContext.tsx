"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export type WeatherRow = Record<string, string | number>;

interface ModelBundle {
  rainSession: unknown | null;   // onnxruntime InferenceSession
  tempSession: unknown | null;
  rainFeatures: string[];
  tempFeatures: string[];
}

interface UploadState {
  csvData: WeatherRow[];
  models: ModelBundle;
  setCsvData: (d: WeatherRow[]) => void;
  setModels: (m: ModelBundle) => void;
  isReady: boolean;
}

const defaultModels: ModelBundle = {
  rainSession: null, tempSession: null,
  rainFeatures: [], tempFeatures: [],
};

const Ctx = createContext<UploadState>({
  csvData: [], models: defaultModels,
  setCsvData: () => {}, setModels: () => {},
  isReady: false,
});

export function FileUploadProvider({ children }: { children: ReactNode }) {
  const [csvData, setCsvData] = useState<WeatherRow[]>([]);
  const [models, setModels] = useState<ModelBundle>(defaultModels);
  const isReady = csvData.length > 0;
  return (
    <Ctx.Provider value={{ csvData, models, setCsvData, setModels, isReady }}>
      {children}
    </Ctx.Provider>
  );
}

export const useUpload = () => useContext(Ctx);