import { getGeminiClient } from './client';
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

// Simple in-memory rate limiter: maximum 30 requests per minute
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 30;
const requestTimestamps: number[] = [];

function checkRateLimit(): void {
  const now = Date.now();
  // Evict timestamps older than 1 minute
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
 * Robust wrapper for Google GenAI SDK generateContent call.
 * Features:
 * - 20-second default timeout with AbortController
 * - One automatic retry on transient failure
 * - Token and latency logging to console
 * - Structured output parsing & Zod schema validation
 * - In-memory rate limiting (30 req/min)
 */
export async function callGemini<T>(options: CallGeminiOptions<T>): Promise<T> {
  checkRateLimit();

  const timeoutMs = options.timeout ?? 20000;
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

      // Configure request
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

      // Format contents
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

      // Token and latency logging
      const usage = response.usageMetadata;
      console.log(
        `[Gemini API] Model: ${options.model} | Latency: ${latencyMs}ms | Tokens: prompt=${usage?.promptTokenCount ?? '?'}, candidates=${usage?.candidatesTokenCount ?? '?'}, total=${usage?.totalTokenCount ?? '?'}`
      );

      const responseText = response.text || '';

      if (options.responseSchema) {
        let parsedJson: unknown;
        try {
          // Handle markdown code fences if model returned ```json ... ```
          let cleaned = responseText.trim();
          if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
          } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
          }
          parsedJson = JSON.parse(cleaned);
        } catch (jsonErr) {
          throw new Error(
            `Failed to parse Gemini output as JSON: ${(jsonErr as Error).message}\nRaw text: ${responseText.slice(0, 200)}...`
          );
        }

        const validation = options.responseSchema.safeParse(parsedJson);
        if (!validation.success) {
          throw new Error(
            `Gemini structured output failed Zod schema validation: ${JSON.stringify(validation.error.issues)}`
          );
        }

        return validation.data;
      }

      return responseText as unknown as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      lastError = err;
      const latencyMs = Date.now() - startTime;
      console.warn(
        `[Gemini API] Attempt ${attempt} failed after ${latencyMs}ms: ${(err as Error)?.message || String(err)}`
      );

      if (attempt < 2) {
        // Brief exponential backoff pause before retrying once
        await new Promise((res) => setTimeout(res, 500));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
