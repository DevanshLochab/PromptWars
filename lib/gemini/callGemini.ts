import {
  getGeminiClient,
  hasGeminiApiKey,
  MODELS,
} from './client';
import { z } from 'zod';
import type { Content, Tool } from '@google/genai';

export interface CallGeminiOptions<T> {
  model: string;
  systemInstruction?: string;
  contents: Content[] | string | Array<unknown>;
  tools?: Tool[] | Array<unknown>;
  responseSchema?: z.ZodType<T>;
  responseMimeType?: string;
  timeout?: number;
  temperature?: number;
  language?: string;
}

// In-memory rate limiter: maximum 30 requests per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 30;
const requestTimestamps: number[] = [];

function checkRateLimit(): void {
  const now = Date.now();
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error(
      `Rate limit exceeded: maximum ${MAX_REQUESTS_PER_MINUTE} requests per minute reached. Please retry in a few seconds.`
    );
  }

  requestTimestamps.push(now);
}

/**
 * Parses and optionally validates response text with Zod.
 */
function parseAndValidateResponse<T>(rawText: string, schema?: z.ZodType<T>): T {
  if (!schema) {
    return rawText as unknown as T;
  }

  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch (jsonErr) {
    throw new Error(
      `Failed to parse AI output as JSON: ${(jsonErr as Error).message}\nRaw text: ${rawText.slice(0, 200)}...`
    );
  }

  const validation = schema.safeParse(parsedJson);
  if (!validation.success) {
    throw new Error(
      `Structured output failed Zod schema validation: ${JSON.stringify(validation.error.issues)}`
    );
  }

  return validation.data;
}

/**
 * Executes a call using Google GenAI SDK with automatic single retry on transient error.
 */
async function executeGeminiCall<T>(
  options: CallGeminiOptions<T>,
  timeoutMs: number
): Promise<T> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < 2) {
    attempt++;
    const startTime = Date.now();
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort(new Error(`Gemini API request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const client = getGeminiClient();

      const config: Record<string, unknown> = {
        abortSignal: abortController.signal,
      };

      const langMap: Record<string, string> = {
        en: 'English',
        hi: 'Hindi (हिन्दी)',
        bn: 'Bengali (বাংলা)',
        mr: 'Marathi (मराठी)',
        te: 'Telugu (తెలుగు)',
        ta: 'Tamil (தமிழ்)',
        gu: 'Gujarati (ગુજરાતી)',
        kn: 'Kannada (ಕನ್ನಡ)',
        pa: 'Punjabi (ਪੰਜਾਬੀ)',
      };

      let finalSystemInstruction = options.systemInstruction;
      if (options.language && options.language !== 'en') {
        const langName = langMap[options.language] || options.language;
        const localizationNotice = `\n\nCRITICAL ACCESSIBILITY & LOCALIZATION REQUIREMENT:\nThe user's selected language is ${langName} (${options.language}). You MUST generate all user-facing content, answers, action titles, explanations, and advice naturally in ${langName} using its native script. Do not output English for user-facing guidance.`;
        finalSystemInstruction = finalSystemInstruction
          ? finalSystemInstruction + localizationNotice
          : localizationNotice.trim();
      }

      if (finalSystemInstruction) {
        config.systemInstruction = finalSystemInstruction;
      }

      if (options.tools && options.tools.length > 0) {
        config.tools = options.tools;
      }

      if (options.temperature !== undefined) {
        config.temperature = options.temperature;
      }

      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      } else if (options.responseSchema && !options.tools?.length) {
        config.responseMimeType = 'application/json';
        const responseJsonSchema = z.toJSONSchema(options.responseSchema) as Record<
          string,
          unknown
        >;
        delete responseJsonSchema.$schema;
        config.responseJsonSchema = responseJsonSchema;
      }

      let contentsPayload: unknown = options.contents;
      if (typeof options.contents === 'string') {
        contentsPayload = [{ role: 'user', parts: [{ text: options.contents }] }];
      }

      const response = await client.models.generateContent({
        model: options.model,
        contents: contentsPayload as any,
        config: config as any,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      const usage = response.usageMetadata;
      console.log(
        `[Gemini API] Model: ${options.model} | Latency: ${latencyMs}ms | Tokens: prompt=${usage?.promptTokenCount ?? '?'}, candidates=${usage?.candidatesTokenCount ?? '?'}, total=${usage?.totalTokenCount ?? '?'}`
      );

      const responseText = response.text || '';
      return parseAndValidateResponse<T>(responseText, options.responseSchema);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      lastError = err;
      const latencyMs = Date.now() - startTime;
      console.warn(
        `[Gemini API] Attempt ${attempt} failed after ${latencyMs}ms: ${(err as Error)?.message || String(err)}`
      );

      if (attempt < 2) {
        await new Promise((res) => setTimeout(res, 500));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Universal AI Caller for Saans using Google Gemini models.
 */
export async function callGemini<T>(options: CallGeminiOptions<T>): Promise<T> {
  checkRateLimit();

  const timeoutMs = options.timeout ?? 20000;
  let lastError: unknown = null;

  // 1. PRIMARY: Google Gemini API
  if (hasGeminiApiKey()) {
    const geminiModels = Array.from(new Set([options.model, ...MODELS.geminiFallbacks]));
    for (const geminiModel of geminiModels) {
      try {
        console.log(`[AI Cascade] Routing request to Gemini (${geminiModel})...`);
        return await executeGeminiCall<T>({ ...options, model: geminiModel }, timeoutMs);
      } catch (err: unknown) {
        lastError = err;
        console.warn(
          `[AI Cascade] Gemini model ${geminiModel} failed (${(err as Error)?.message || String(err)}).`
        );
      }
    }
    console.warn('[AI Cascade] All configured Gemini models failed.');
  }

  if (!lastError) {
    lastError = new Error('No GEMINI_API_KEY configured.');
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
