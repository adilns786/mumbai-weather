// src/lib/onnxInfer.ts

// Global mutex — one ONNX call at a time across ALL sessions
let globalLock: Promise<unknown> = Promise.resolve();

function withGlobalLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = globalLock.then(fn, fn);
  globalLock = next;
  return next;
}

export async function loadOnnxSession(file: File) {
  const { InferenceSession } = await import("onnxruntime-web");
  const buf = await file.arrayBuffer();
  return InferenceSession.create(buf);
}

export async function runRainInference(
  session: unknown,
  features: string[],
  values: Record<string, number>
): Promise<{ prediction: number; probNoRain: number; probRain: number }> {
  return withGlobalLock(async () => {
    const { Tensor } = await import("onnxruntime-web");
    const inp = new Float32Array(features.map((f) => values[f] ?? 0));
    const tensor = new Tensor("float32", inp, [1, features.length]);
    // @ts-ignore
    const out = await session.run({ float_input: tensor });
    const label = Number(Object.values(out)[0].data[0]);
    const probs = Object.values(out)[1]?.data as Float32Array ?? new Float32Array([1 - label, label]);
    return { prediction: label, probNoRain: +probs[0].toFixed(3), probRain: +probs[1].toFixed(3) };
  });
}

export async function runTempInference(
  session: unknown,
  features: string[],
  values: Record<string, number>
): Promise<number> {
  return withGlobalLock(async () => {
    const { Tensor } = await import("onnxruntime-web");
    const inp = new Float32Array(features.map((f) => values[f] ?? 0));
    const tensor = new Tensor("float32", inp, [1, features.length]);
    // @ts-ignore
    const out = await session.run({ float_input: tensor });
    const val = Number(Object.values(out)[0].data[0]);
    return +val.toFixed(2);
  });
}