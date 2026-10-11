import type { InferenceSession, Tensor as TensorType } from 'onnxruntime-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { preprocessImageForONNX } from './imagePreprocessor';
import { VisionPrediction, TopKPrediction } from './types';

// The 3 classes corresponding to the vision model's output logits
export const VISION_CLASSES = ['Healthy', 'aculus_olive', 'olivepeacockspot'] as const;

export const CLASS_HUMAN_NAMES: Record<string, string> = {
  Healthy: 'Healthy Olive Foliage',
  aculus_olive: 'Olive bud mite (Aculus olearius)',
  olivepeacockspot: 'Peacock spot (Spilocaea oleagina)',
};

let ortModule: typeof import('onnxruntime-react-native') | null = null;
async function getOrt() {
  if (!ortModule) {
    ortModule = await import('onnxruntime-react-native');
  }
  return ortModule;
}

let inferenceSession: InferenceSession | null = null;
let sessionLoadingPromise: Promise<InferenceSession> | null = null;

/**
 * Computes numerically stable Softmax over an array or typed array of logits.
 */
function softmax(logits: Float32Array | number[]): number[] {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] > max) max = logits[i];
  }

  const expValues = new Float64Array(logits.length);
  let sumExp = 0;
  for (let i = 0; i < logits.length; i++) {
    const exp = Math.exp(logits[i] - max);
    expValues[i] = exp;
    sumExp += exp;
  }

  const probabilities: number[] = new Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    probabilities[i] = expValues[i] / (sumExp || 1);
  }
  return probabilities;
}

/**
 * Ensures the MobileNetV4 ONNX model is extracted from bundled assets to a local file path
 * and returns the initialized InferenceSession.
 */
export async function getVisionSession(): Promise<InferenceSession> {
  if (inferenceSession) return inferenceSession;
  if (sessionLoadingPromise) return sessionLoadingPromise;

  sessionLoadingPromise = (async () => {
    try {
      let modelPath = '';
      if (Platform.OS !== 'web' && FileSystem.documentDirectory) {
        const modelsDir = `${FileSystem.documentDirectory}models/`;
        const dirInfo = await FileSystem.getInfoAsync(modelsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(modelsDir, { intermediates: true });
        }

        const destination = `${modelsDir}mobilenetv4_conv_small_fp32.onnx`;
        const destInfo = await FileSystem.getInfoAsync(destination);
        if (destInfo.exists && destInfo.size && destInfo.size > 1000) {
          console.log('[Vision] Model already present on device storage:', destination);
          modelPath = destination;
        } else {
          console.log('[Vision] Loading MobileNetV4 ONNX model asset from bundle...');
          const asset = Asset.fromModule(
            require('../../../assets/models/vision/mobilenetv4_conv_small_fp32.onnx')
          );
          await asset.downloadAsync();
          const sourceUri = asset.localUri || asset.uri;
          if (!sourceUri) {
            throw new Error('[Vision] Could not resolve local URI for vision model asset');
          }
          await FileSystem.copyAsync({ from: sourceUri, to: destination });
          modelPath = destination;
        }
      }

      // Convert file:// prefix to filesystem path on Android
      const cleanPath = Platform.OS === 'android' && modelPath.startsWith('file://')
        ? modelPath.replace('file://', '')
        : modelPath;

      console.log('[Vision] Creating ONNX InferenceSession from:', cleanPath);
      const ort = await getOrt();
      inferenceSession = await ort.InferenceSession.create(cleanPath);
      console.log('[Vision] MobileNetV4 InferenceSession created successfully');
      return inferenceSession;
    } catch (error) {
      console.error('[Vision] Failed to initialize ONNX InferenceSession:', error);
      sessionLoadingPromise = null;
      throw error;
    }
  })();

  return sessionLoadingPromise;
}

/**
 * Classifies a leaf image URI using MobileNetV4-conv-small.
 *
 * @param imageUri URI of the image (local file, camera capture, or sample)
 * @returns Complete VisionPrediction with probabilities, top-K, and latency
 */
export async function classifyOliveLeaf(imageUri: string): Promise<VisionPrediction> {
  const startTime = Date.now();

  // 1. Get or initialize ONNX session and runtime
  const [session, ort] = await Promise.all([getVisionSession(), getOrt()]);

  // 2. Preprocess input image to 224x224 normalized Float32Array
  const float32Data = await preprocessImageForONNX(imageUri);

  // 3. Create input Tensor [1, 3, 224, 224]
  const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 224, 224]);
  const inputName = session.inputNames[0] || 'input';

  // 4. Run inference
  const feeds: Record<string, TensorType> = { [inputName]: inputTensor };
  const outputs = await session.run(feeds);

  const outputName = session.outputNames[0] || 'output';
  const outputTensor = outputs[outputName];
  if (!outputTensor) {
    throw new Error(`[Vision] No output tensor found for '${outputName}'`);
  }

  const logits = outputTensor.data as Float32Array;

  // 5. Compute Softmax probabilities
  const probabilities = softmax(logits);

  // 6. Map to classes and sort top-K
  const topK: TopKPrediction[] = VISION_CLASSES.map((label, idx) => ({
    classLabel: label,
    confidence: Math.round((probabilities[idx] || 0) * 1000) / 10, // e.g. 98.4%
  })).sort((a, b) => b.confidence - a.confidence);

  const topPrediction = topK[0];
  const isHealthy = topPrediction.classLabel.toLowerCase() === 'healthy';
  const latencyMs = Date.now() - startTime;

  console.log(
    `[Vision] Classification: ${topPrediction.classLabel} (${topPrediction.confidence}%) in ${latencyMs}ms`
  );

  return {
    classLabel: topPrediction.classLabel,
    confidence: topPrediction.confidence,
    topK,
    latencyMs,
    status: isHealthy ? 'healthy' : 'infected',
    diseaseName: CLASS_HUMAN_NAMES[topPrediction.classLabel] || topPrediction.classLabel,
  };
}
