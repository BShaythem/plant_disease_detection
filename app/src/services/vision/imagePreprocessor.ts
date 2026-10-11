// src/services/vision/imagePreprocessor.ts
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

const TARGET_SIZE = 224;
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

/**
 * Fast Base64 string to Uint8Array decoder without external polyfills.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Resizes an image to 224x224, decodes JPEG pixels to raw RGBA,
 * and formats a normalized Float32Array in CHW (planar) order for MobileNetV4.
 *
 * @param imageUri File URI or local asset URI of the leaf image
 * @returns Float32Array of size [1 * 3 * 224 * 224] = 150,528 values
 */
export async function preprocessImageForONNX(imageUri: string): Promise<Float32Array> {
  // 1. Resize directly on native layer and encode to JPEG base64
  const manipulated = await manipulateAsync(
    imageUri,
    [{ resize: { width: TARGET_SIZE, height: TARGET_SIZE } }],
    {
      format: SaveFormat.JPEG,
      compress: 0.95,
      base64: true,
    }
  );

  if (!manipulated.base64) {
    throw new Error('ImageManipulator failed to return base64 data for image');
  }

  // 2. Decode JPEG bytes to raw RGBA
  const jpegBytes = base64ToUint8Array(manipulated.base64);
  const rawData = jpeg.decode(jpegBytes, { useTArray: true });

  const { width, height, data } = rawData; // data is Uint8Array of RGBA
  const area = TARGET_SIZE * TARGET_SIZE;
  const float32Data = new Float32Array(3 * area);

  // 3. Convert RGBA (HWC) to normalized RGB (CHW planar order)
  // Planar layout: [Channel 0 (R): 0..area-1, Channel 1 (G): area..2*area-1, Channel 2 (B): 2*area..3*area-1]
  const rOffset = 0;
  const gOffset = area;
  const bOffset = 2 * area;

  for (let i = 0; i < area; i++) {
    const pixelIndex = i * 4;
    const r = data[pixelIndex] / 255.0;
    const g = data[pixelIndex + 1] / 255.0;
    const b = data[pixelIndex + 2] / 255.0;

    float32Data[rOffset + i] = (r - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
    float32Data[gOffset + i] = (g - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
    float32Data[bOffset + i] = (b - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
  }

  return float32Data;
}
