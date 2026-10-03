import { GoogleGenAI } from '@google/genai';

export const MODEL_REGISTRY: Record<string, { originalName: string; premiumName: string; feel: string; category: string; description: string }> = {
  'gemini-3.8-flash': {
    originalName: 'Gemini 3.8 Flash',
    premiumName: 'Apex',
    feel: 'Flagship Intelligence',
    category: 'reasoning',
    description: 'Frontier multimodal flagship powerhouse combining deep thought with speed.',
  },
  'gemini-3.1-pro-preview': {
    originalName: 'Gemini 3.1 Pro',
    premiumName: 'Titan',
    feel: 'Heavyweight Reasoning',
    category: 'reasoning',
    description: 'Heavyweight reasoning and master-tier coding engine built for complex architectures.',
  },
  'gemini-3.1-flash-lite': {
    originalName: 'Gemini 3.1 Flash Lite',
    premiumName: 'Zephyr',
    feel: 'Ultra-Fast Lightweight',
    category: 'fast',
    description: 'Sub-second latency model optimized for instant code completion and snappy responses.',
  },
  'gemini-3.5-flash': {
    originalName: 'Gemini 3.5 Flash',
    premiumName: 'Vela',
    feel: 'Fast & Effortless',
    category: 'fast',
    description: 'Ultra-responsive intelligence designed for fluid, high-throughput daily interactions.',
  },
};

export function getGenAIClient(): GoogleGenAI {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  return new GoogleGenAI({ apiKey });
}

export async function generateWithModelFallback(
  preferredModel: string,
  contents: any,
  config?: any,
  timeoutMs = 25000
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAIClient();
  let normalized = preferredModel || 'gemini-3.8-flash';
  if (!MODEL_REGISTRY[normalized]) {
    normalized = 'gemini-3.8-flash';
  }

  const candidateModels = [
    normalized,
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];
  const uniqueCandidates = [...new Set(candidateModels)];

  let lastError: any;
  for (let i = 0; i < uniqueCandidates.length; i++) {
    const modelToTry = uniqueCandidates[i];
    try {
      const attemptConfig: any = { ...(config || {}) };

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on ${modelToTry}`)), timeoutMs)
      );

      const response: any = await Promise.race([
        ai.models.generateContent({
          model: modelToTry,
          contents,
          config: attemptConfig,
        }),
        timeoutPromise,
      ]);

      return {
        text: response.text || '',
        modelUsed: modelToTry,
      };
    } catch (err: any) {
      lastError = err;
      const status = err.status || err.statusCode || 0;
      const msg = (err.message || '').slice(0, 120);
      console.warn(`[Vikranth AI] Model ${modelToTry} attempt failed (${status || 'error'}): ${msg}. Trying next candidate...`);
    }
  }

  throw lastError;
}
