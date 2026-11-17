import { GoogleGenAI } from '@google/genai';

let cachedClient: GoogleGenAI | null = null;

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

export function hasAnyAiKey(): boolean {
  return hasGeminiApiKey();
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
  geminiFallbacks: [
    process.env.GEMINI_MODEL_FALLBACK_1 || 'gemini-3.5-flash-lite',
    process.env.GEMINI_MODEL_FALLBACK_2 || 'gemini-3.1-flash-lite',
    process.env.GEMINI_MODEL_FALLBACK_3 || 'gemma-4-26b-a4b-it',
    process.env.GEMINI_MODEL_FALLBACK_4 || 'gemma-4-31b-it',
  ],
  live: process.env.GEMINI_MODEL_LIVE || 'gemini-2.0-flash-live-001',
  tts: process.env.GEMINI_MODEL_TTS || 'gemini-2.5-flash-preview-tts',
};
