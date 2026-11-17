import {
  getGeminiClient,
  hasGeminiApiKey,
  hasMistralApiKey,
  hasNvidiaApiKey,
  hasGlmApiKey,
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
 * Converts Gemini-formatted contents and systemInstruction into OpenAI-compatible messages.
 */
function convertToOpenAiMessages(
  systemInstruction?: string,
  contents?: unknown,
  requireJson?: boolean
): Array<{ role: 'system' | 'user' | 'assistant'; content: any }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: any }> = [];

  let systemText = systemInstruction || '';
  if (requireJson) {
    systemText = systemText
      ? `${systemText}\n\nIMPORTANT: You must return valid raw JSON only conforming to the requested schema. Do not enclose in markdown ticks if possible, or use standard json markdown.`
      : 'You must return valid raw JSON only conforming to the requested schema.';
  }

  if (systemText) {
    messages.push({ role: 'system', content: systemText });
  }

  if (typeof contents === 'string') {
    messages.push({ role: 'user', content: contents });
  } else if (Array.isArray(contents)) {
    for (const item of contents) {
      if (typeof item === 'string') {
        messages.push({ role: 'user', content: item });
      } else if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const role = (obj.role === 'model' ? 'assistant' : obj.role || 'user') as 'user' | 'assistant';
        const parts = Array.isArray(obj.parts) ? obj.parts : [];

        const contentParts: any[] = [];
        let plainText = '';

        for (const p of parts) {
          if (p && typeof p === 'object') {
            const part = p as Record<string, any>;
            if (part.text) {
              contentParts.push({ type: 'text', text: part.text });
              plainText += (plainText ? '\n' : '') + part.text;
            }
            if (part.inlineData && part.inlineData.data && part.inlineData.mimeType) {
              contentParts.push({
                type: 'image_url',
                image_url: {
                  url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                },
              });
            }
          } else if (typeof p === 'string') {
            contentParts.push({ type: 'text', text: p });
            plainText += (plainText ? '\n' : '') + p;
          }
        }

        if (contentParts.length === 1 && contentParts[0].type === 'text') {
          messages.push({ role, content: contentParts[0].text });
        } else if (contentParts.length > 0) {
          messages.push({ role, content: contentParts });
        } else if (plainText) {
          messages.push({ role, content: plainText });
        }
      }
    }
  }

  return messages;
}

/**
 * Standard OpenAI-compatible HTTP fetch helper for Mistral AI, NVIDIA NIM, and GLM.
 */
async function callOpenAiCompatible(params: {
  providerName: string;
  endpoint: string;
  apiKey: string;
  model: string;
  systemInstruction?: string;
  contents: unknown;
  temperature?: number;
  timeoutMs?: number;
  jsonMode?: boolean;
}): Promise<string> {
  const timeoutMs = params.timeoutMs ?? 20000;
  const messages = convertToOpenAiMessages(
    params.systemInstruction,
    params.contents,
    params.jsonMode
  );

  const body: Record<string, unknown> = {
    model: params.model,
    messages,
    temperature: params.temperature ?? 0.2,
  };

  if (params.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const startTime = Date.now();
  const res = await fetch(params.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(
      `[${params.providerName}] HTTP ${res.status}: ${errorText.slice(0, 300)}`
    );
  }

  const data = await res.json();
  const latencyMs = Date.now() - startTime;
  const content = data.choices?.[0]?.message?.content ?? '';

  console.log(
    `[${params.providerName}] Model: ${params.model} | Latency: ${latencyMs}ms | Tokens: prompt=${data.usage?.prompt_tokens ?? '?'}, completion=${data.usage?.completion_tokens ?? '?'}`
  );

  return typeof content === 'string' ? content : JSON.stringify(content);
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

      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }

      if (options.tools && options.tools.length > 0) {
        config.tools = options.tools;
      }

      if (options.temperature !== undefined) {
        config.temperature = options.temperature;
      }

      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      } else if (options.responseSchema) {
        config.responseMimeType = 'application/json';
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
 * Universal AI Caller for Saans:
 * 1. Primary: Google Gemini Models (e.g. gemini-2.5-flash, gemini-2.0-flash-lite)
 * 2. Backup 1: Mistral AI API (mistral-large-latest, mistral-small-latest)
 * 3. Backup 2: NVIDIA AI API (GLM & GLM Fast via NVIDIA NIM: thudm/glm-4-9b-chat, meta/llama-3.1-8b-instruct)
 * 4. Backup 3: Direct GLM API (glm-4-plus, glm-4-flash)
 */
export async function callGemini<T>(options: CallGeminiOptions<T>): Promise<T> {
  checkRateLimit();

  const timeoutMs = options.timeout ?? 20000;
  const isLiteModel = options.model.includes('lite') || options.model === MODELS.lite;
  const requiresJson = Boolean(options.responseSchema || options.responseMimeType === 'application/json');
  let lastError: unknown = null;

  // 1. PRIMARY: Google Gemini API
  if (hasGeminiApiKey()) {
    try {
      return await executeGeminiCall<T>(options, timeoutMs);
    } catch (err: unknown) {
      lastError = err;
      console.warn(
        `[AI Cascade] Gemini call failed (${(err as Error)?.message || String(err)}). Cascading to backup providers...`
      );
    }
  }

  // 2. BACKUP 1: Mistral AI API
  if (hasMistralApiKey()) {
    try {
      const mistralModel = isLiteModel ? MODELS.mistralFast : MODELS.mistralMain;
      console.log(`[AI Cascade] Routing request to Mistral AI backup (${mistralModel})...`);
      const rawText = await callOpenAiCompatible({
        providerName: 'Mistral AI',
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        apiKey: process.env.MISTRAL_API_KEY!.trim(),
        model: mistralModel,
        systemInstruction: options.systemInstruction,
        contents: options.contents,
        temperature: options.temperature,
        timeoutMs,
        jsonMode: requiresJson,
      });
      return parseAndValidateResponse<T>(rawText, options.responseSchema);
    } catch (err: unknown) {
      lastError = err;
      console.warn(
        `[AI Cascade] Mistral AI backup call failed (${(err as Error)?.message || String(err)}). Cascading to NVIDIA AI API...`
      );
    }
  }

  // 3. BACKUP 2: NVIDIA AI API (GLM & GLM Fast via NVIDIA NIM)
  if (hasNvidiaApiKey()) {
    try {
      const nvidiaModel = isLiteModel ? MODELS.nvidiaFast : MODELS.nvidiaMain;
      console.log(`[AI Cascade] Routing request to NVIDIA AI API backup (${nvidiaModel})...`);
      const rawText = await callOpenAiCompatible({
        providerName: 'NVIDIA AI API (GLM)',
        endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
        apiKey: process.env.NVIDIA_API_KEY!.trim(),
        model: nvidiaModel,
        systemInstruction: options.systemInstruction,
        contents: options.contents,
        temperature: options.temperature,
        timeoutMs,
        jsonMode: requiresJson,
      });
      return parseAndValidateResponse<T>(rawText, options.responseSchema);
    } catch (err: unknown) {
      lastError = err;
      console.warn(
        `[AI Cascade] NVIDIA AI backup call failed (${(err as Error)?.message || String(err)}). Cascading to Direct GLM API...`
      );
    }
  }

  // 4. BACKUP 3: Direct GLM API (Zhipu AI)
  if (hasGlmApiKey()) {
    try {
      const glmModel = isLiteModel ? MODELS.glmFast : MODELS.glmMain;
      console.log(`[AI Cascade] Routing request to Direct GLM API backup (${glmModel})...`);
      const rawText = await callOpenAiCompatible({
        providerName: 'Direct GLM API',
        endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        apiKey: process.env.GLM_API_KEY!.trim(),
        model: glmModel,
        systemInstruction: options.systemInstruction,
        contents: options.contents,
        temperature: options.temperature,
        timeoutMs,
        jsonMode: requiresJson,
      });
      return parseAndValidateResponse<T>(rawText, options.responseSchema);
    } catch (err: unknown) {
      lastError = err;
      console.warn(
        `[AI Cascade] Direct GLM API backup call failed: ${(err as Error)?.message || String(err)}`
      );
    }
  }

  // If no AI keys configured or all failed
  if (!lastError) {
    lastError = new Error(
      'No AI API key configured (checked GEMINI_API_KEY, MISTRAL_API_KEY, NVIDIA_API_KEY, and GLM_API_KEY).'
    );
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
