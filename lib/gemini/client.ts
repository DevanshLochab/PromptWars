import { GoogleGenAI } from '@google/genai';

let cachedClient: GoogleGenAI | null = null;

export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
}

// Single client factory
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('GEMINI_API_KEY not set');
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }

  return cachedClient;
}

export const MODELS = {
  main: process.env.GEMINI_MODEL_MAIN || 'gemini-2.5-flash', // Prompt spec: gemini-3.8-flash — not yet available, using newest stable Flash
  lite: process.env.GEMINI_MODEL_LITE || 'gemini-2.0-flash-lite', // Prompt spec: gemini-3.5-flash-lite — not yet available
  live: process.env.GEMINI_MODEL_LIVE || 'gemini-2.0-flash-live-001', // Prompt spec: gemini-3.1-flash-live-preview — not yet available
  tts: process.env.GEMINI_MODEL_TTS || 'gemini-2.5-flash-preview-tts', // Prompt spec: gemini-3.1-flash-tts-preview — not yet available
};
