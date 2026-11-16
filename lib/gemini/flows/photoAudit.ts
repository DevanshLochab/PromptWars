import { z } from 'zod';
import { callGemini } from '../callGemini';
import { MODELS } from '../client';
import { Device, Home } from '@/lib/schemas';

export interface PhotoInput {
  base64Data: string;
  mimeType: string;
}

export const PhotoAuditResponseSchema = z.object({
  detectedFeatures: z.array(z.string()),
  home: z
    .object({
      mainRoomAreaM2: z.number().optional(),
      windowLeakiness: z.enum(['tight', 'average', 'leaky']).optional(),
      exhaustHood: z.boolean().optional(),
      canOpenWindows: z.boolean().optional(),
      heating: z.array(z.enum(['electric', 'gas', 'coal_charcoal', 'wood', 'none'])).optional(),
      cooking: z.array(z.enum(['lpg', 'induction', 'biomass', 'electric'])).optional(),
      incenseOrCoils: z.enum(['never', 'sometimes', 'daily']).optional(),
    })
    .optional(),
  devices: z
    .array(
      z.object({
        type: z.enum(['purifier', 'diy_filter', 'co_alarm']),
        cadrM3h: z.number().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        filterAgeMonths: z.number().optional(),
      })
    )
    .optional(),
  maskObserved: z
    .object({
      type: z.enum(['none', 'cloth', 'surgical', 'n95']),
      condition: z.string().optional(),
    })
    .optional(),
  fieldConfidence: z.record(
    z.string(),
    z.object({
      confidence: z.number().min(0).max(1),
      needsConfirmation: z.boolean(),
      note: z.string().optional(),
    })
  ),
  summary: z.string(),
});

export type PhotoAuditResponse = z.infer<typeof PhotoAuditResponseSchema>;

export interface PhotoAuditResult {
  home?: Partial<Home>;
  devices?: Device[];
  maskObserved?: { type: 'none' | 'cloth' | 'surgical' | 'n95'; condition?: string };
  detectedFeatures: string[];
  fieldConfidence: Record<
    string,
    { confidence: number; needsConfirmation: boolean; note?: string }
  >;
  summary: string;
  privacyNotice: string;
}

const PHOTO_AUDIT_SYSTEM_PROMPT = `You are Saans Photo Audit Specialist, an expert environmental auditor analyzing household photos to infer air quality parameters accurately and conservatively.

You may receive up to 4 photos which could include:
1. Room photo: Assess window style (single-glazed, double-glazed, sliding), visible gap/leakiness cues, exhaust hood or wall vent, visible indoor sources (incense burner, stove), clutter.
2. Purifier specification label: Read brand, model, Clean Air Delivery Rate (CADR). If CADR is in CFM (Cubic Feet per Minute), convert to m³/h (multiply CFM by 1.7). If only room area is given, estimate CADR = area (m²) * 2.7m * 5 ACH.
3. Mask photo: Look for standard certification markings (N95, FFP2, KN95, surgical, cloth) and visible condition (soiled, crumpled, missing nose wire).
4. Heater / stove: Identify fuel type (electric blower, oil heater, LPG stove, unvented gas burner, coal/wood angithi).

STRICT AUDIT RULES:
- If a parameter cannot be clearly seen or verified from the photo, say "can't tell" and assign confidence <= 0.3 with needsConfirmation: true. NEVER guess or hallucinate parameters.
- If combustion fuel heating (coal, wood, gas) is visible, flag this prominently for carbon monoxide safety.
- Output ONLY valid JSON matching the schema.`;

/**
 * Runs Flow A: Multimodal Photo Audit on up to 4 images.
 */
export async function runPhotoAudit(photos: PhotoInput[]): Promise<PhotoAuditResult> {
  const privacyNotice =
    'Please avoid including faces, family members, or personal identity documents in audit photos.';

  if (!photos || photos.length === 0) {
    return {
      detectedFeatures: ['No photos provided'],
      fieldConfidence: {},
      summary: 'No photos were provided for auditing.',
      privacyNotice,
    };
  }

  const limitedPhotos = photos.slice(0, 4);

  // Prepare parts for Gemini generateContent
  const parts: Array<Record<string, unknown>> = limitedPhotos.map((p) => ({
    inlineData: {
      data: p.base64Data,
      mimeType: p.mimeType,
    },
  }));

  parts.push({
    text: 'Analyze the attached household photos for indoor air quality and purifier parameters. Provide structured output identifying visible features, estimated parameters, and conservative confidence scores.',
  });

  const parsed = await callGemini<PhotoAuditResponse>({
    model: MODELS.main,
    systemInstruction: PHOTO_AUDIT_SYSTEM_PROMPT,
    contents: [{ role: 'user', parts }],
    responseSchema: PhotoAuditResponseSchema,
    temperature: 0.2,
  });

  return {
    home: parsed.home as Partial<Home> | undefined,
    devices: parsed.devices?.map((d) => ({
      type: d.type,
      cadrM3h: d.cadrM3h,
      filterAgeMonths: d.filterAgeMonths,
    })),
    maskObserved: parsed.maskObserved,
    detectedFeatures: parsed.detectedFeatures,
    fieldConfidence: parsed.fieldConfidence,
    summary: parsed.summary,
    privacyNotice,
  };
}
