// src/services/llm/llamaService.ts
import { initLlama, LlamaContext, TokenData } from 'llama.rn';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const MODEL_NAME = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';

let cachedContext: LlamaContext | null = null;
let initPromise: Promise<LlamaContext> | null = null;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerationResult {
  text: string;
  latencyMs: number;
}

/**
 * Returns the path to the on-device GGUF model file.
 */
export async function getModelPath(): Promise<string> {
  const docDir = FileSystem.documentDirectory;
  if (!docDir) throw new Error('FileSystem documentDirectory is not available');

  const modelPath = `${docDir}models/${MODEL_NAME}`;
  const info = await FileSystem.getInfoAsync(modelPath);

  if (!info.exists) {
    throw new Error(
      `SLM model not found at ${modelPath}. Ensure ${MODEL_NAME} is present on device.`
    );
  }

  // Strip file:// prefix on Android
  return Platform.OS === 'android' && modelPath.startsWith('file://')
    ? modelPath.replace('file://', '')
    : modelPath;
}

/**
 * Initializes or returns the cached LlamaContext for Qwen2.5 0.5B.
 */
export async function getLlamaContext(
  onProgress?: (progress: number) => void
): Promise<LlamaContext> {
  if (cachedContext) return cachedContext;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('[Llama] Resolving model path...');
      const modelPath = await getModelPath();
      console.log('[Llama] Initializing LlamaContext from:', modelPath);

      const context = await initLlama(
        {
          model: modelPath,
          n_ctx: 2048,
          n_threads: 4,
          n_batch: 512,
        },
        onProgress
      );

      cachedContext = context;
      console.log('[Llama] LlamaContext initialized successfully');
      return context;
    } catch (error) {
      console.error('[Llama] Failed to initialize LlamaContext:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Builds the Tier 1 grounded system prompt.
 */
export function buildSystemPrompt(params: {
  diseaseName?: string | null;
  diseaseDocMarkdown?: string | null;
  isHealthy?: boolean;
}): string {
  if (params.isHealthy) {
    return `You are Olive Care AI, a certified agronomist for olive farmers.
The farmer's leaf scan was diagnosed as Healthy Olive Foliage.
Congratulate the grower and answer questions about routine orchard management: irrigation, balanced soil nutrition, light pruning for airflow, and preventive monitoring. Keep answers concise and practical.`;
  }

  if (params.diseaseDocMarkdown) {
    return `You are Olive Care AI, a specialist agronomist helping an olive farmer.
The farmer's leaf was diagnosed with: ${params.diseaseName || 'Olive Disease'}.

### VERIFIED DIAGNOSTIC REFERENCE
${params.diseaseDocMarkdown}

INSTRUCTIONS:
1. Ground your advice, treatments, and prevention strictly on the reference document above.
2. Keep recommendations practical, concise, and formatted with clear bullet points.
3. If asked something outside this verified document, state that you do not have that data and suggest consulting local agricultural extension services.`;
  }

  return `You are Olive Care AI, an expert olive agronomist.
Assist the farmer with olive grove care, soil testing, irrigation schedules, annual pruning, and integrated pest management. Be concise, polite, and farmer-friendly.`;
}

/**
 * Formats messages into Qwen2.5 ChatML template.
 */
export function formatChatML(messages: ChatMessage[]): string {
  let prompt = '';
  for (const msg of messages) {
    prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
  }
  prompt += '<|im_start|>assistant\n';
  return prompt;
}

/**
 * Streams generation from Qwen2.5 SLM on-device.
 */
export async function generateChatResponse(params: {
  messages: ChatMessage[];
  onToken?: (token: string) => void;
  maxTokens?: number;
  temperature?: number;
}): Promise<GenerationResult> {
  const startTime = Date.now();
  const context = await getLlamaContext();
  const prompt = formatChatML(params.messages);

  let accumulated = '';

  const result = await context.completion(
    {
      prompt,
      n_predict: params.maxTokens ?? 384,
      temperature: params.temperature ?? 0.7,
      stop: ['<|im_end|>', '<|endoftext|>', '<|im_start|>'],
    },
    (data: TokenData) => {
      const token = data.token || '';
      accumulated += token;
      if (params.onToken) {
        params.onToken(token);
      }
    }
  );

  const text = (result?.text || accumulated).replace(/<\|im_end\|>/g, '').trim();
  const latencyMs = Date.now() - startTime;

  console.log(`[Llama] Completed response in ${latencyMs}ms (${text.length} chars)`);

  return { text, latencyMs };
}
