import { GoogleGenAI } from '@google/genai';

let cachedClient: GoogleGenAI | null = null;

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

export function hasMistralApiKey(): boolean {
  return Boolean(process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY.trim().length > 0);
}

export function hasNvidiaApiKey(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim().length > 0);
}

export function hasGlmApiKey(): boolean {
  return Boolean(process.env.GLM_API_KEY && process.env.GLM_API_KEY.trim().length > 0);
}

export function hasAnyAiKey(): boolean {
  return hasGeminiApiKey() || hasMistralApiKey() || hasNvidiaApiKey() || hasGlmApiKey();
}

// Single client factory
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('GEMINI_API_KEY not set');
  }

  if (!cachedClient) {
    // Explicitly configure apiVersion: 'v1beta' because Google GenAI v1 rejects developer/systemInstruction
    cachedClient = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
  }

  return cachedClient;
}

export const MODELS = {
  // Main: Google Gemini API Models
  main: process.env.GEMINI_MODEL_MAIN || 'gemini-2.5-flash',
  lite: process.env.GEMINI_MODEL_LITE || 'gemini-2.0-flash-lite',
  live: process.env.GEMINI_MODEL_LIVE || 'gemini-2.0-flash-live-001',
  tts: process.env.GEMINI_MODEL_TTS || 'gemini-2.5-flash-preview-tts',

  // Backup 1: Mistral AI Models (2 models)
  mistralMain: process.env.MISTRAL_MODEL_MAIN || 'mistral-large-latest',
  mistralFast: process.env.MISTRAL_MODEL_FAST || 'mistral-small-latest',

  // Backup 2: NVIDIA AI API Models (2 models: GLM and GLM Fast)
  nvidiaMain: process.env.NVIDIA_MODEL_MAIN || 'thudm/glm-4-9b-chat',
  nvidiaFast: process.env.NVIDIA_MODEL_FAST || 'meta/llama-3.1-8b-instruct',

  // Backup 3: Direct GLM (Zhipu AI) Models (2 models: GLM and GLM Fast)
  glmMain: process.env.GLM_MODEL_MAIN || 'glm-4-plus',
  glmFast: process.env.GLM_MODEL_FAST || 'glm-4-flash',
};
