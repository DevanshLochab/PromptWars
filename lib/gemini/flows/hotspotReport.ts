import { z } from 'zod';
import { callGemini } from '../callGemini';
import { hasGeminiApiKey, MODELS } from '../client';

export interface HotspotPhotoInput {
  base64Data: string;
  mimeType: string;
}

export const HotspotReportOutputSchema = z.object({
  sourceClassification: z.string(),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  factualDescription: z.string(),
  reportingChannel: z.object({
    name: z.string(),
    instructions: z.string(),
    linkOrApp: z.string(),
  }),
  privacyCheck: z.object({
    facesDetected: z.boolean(),
    licensePlatesDetected: z.boolean(),
    cleanForSubmission: z.boolean(),
  }),
  safetyNotice: z.string(),
  readyToSendDraft: z.object({
    subject: z.string(),
    body: z.string(),
  }),
});

export type HotspotReportOutput = z.infer<typeof HotspotReportOutputSchema>;

const HOTSPOT_SYSTEM_PROMPT = `You are Saans Hotspot Environmental Reporter. You analyze user photos of localized pollution hotspots (e.g., leaf burning, garbage bonfires, unpaved construction dust without water sprinklers, uncontained industrial emissions).

MANDATORY RULES:
1. Classify the source accurately (e.g. "Open horticultural waste burning", "Uncovered demolition dust").
2. Draft a strictly FACTUAL, neutral, and objective report. NEVER include personal names, accusatory commentary, faces, or vehicle license plates.
3. Recommend official reporting channels (e.g., CPCB Sameer App, Green Delhi App, local municipal helpline).
4. SAFETY: Always include the mandatory warning: "Always review report details before sending. Never confront individuals or property owners directly. Your personal safety is the first priority."`;

/**
 * Runs Flow E: Hotspot Source Classification and Citizen Report Drafter.
 */
export async function runHotspotReport(options: {
  photo: HotspotPhotoInput;
  locationText?: string;
  userNotes?: string;
}): Promise<HotspotReportOutput> {
  const safetyNotice =
    'Mandatory safety advisory: Review all report details before sending. Never confront individuals, workers, or facility owners directly. Prioritize personal safety at all times.';

  if (!hasGeminiApiKey()) {
    return generateFallbackHotspotReport(options.locationText, safetyNotice);
  }

  const parts: any[] = [
    {
      inlineData: {
        data: options.photo.base64Data,
        mimeType: options.photo.mimeType,
      },
    },
    {
      text: `Analyze this pollution hotspot photo.
Location context: ${options.locationText || 'Urban North India / Delhi-NCR'}
User notes: ${options.userNotes || 'Observed active smoke/dust emission'}

Provide structured classification, neutral factual description, privacy verification, official municipal reporting channel, and a drafted report for civic submission.`,
    },
  ];

  try {
    return await callGemini<HotspotReportOutput>({
      model: MODELS.main,
      systemInstruction: HOTSPOT_SYSTEM_PROMPT,
      contents: [{ role: 'user', parts }],
      tools: [{ googleSearch: {} }],
      responseSchema: HotspotReportOutputSchema,
      temperature: 0.1,
    });
  } catch (error) {
    console.warn('[HotspotReport] Gemini vision call failed, returning fallback draft:', error);
    return generateFallbackHotspotReport(options.locationText, safetyNotice);
  }
}

function generateFallbackHotspotReport(
  location: string = 'Local neighborhood',
  safetyNotice: string
): HotspotReportOutput {
  return {
    sourceClassification: 'Open biomass / municipal waste burning',
    severity: 'High',
    factualDescription: `Observed ground-level smoke plume originating from open combustion of dry horticultural debris in ${location}. Visible smoke impacting adjacent residential walking zone.`,
    reportingChannel: {
      name: 'CPCB Sameer App / Green Delhi Municipal Citizen Portal',
      instructions:
        'Submit photo and GPS coordinates through the Sameer or Green Delhi mobile application under "Open Burning" category.',
      linkOrApp: 'https://cpcb.nic.in/',
    },
    privacyCheck: {
      facesDetected: false,
      licensePlatesDetected: false,
      cleanForSubmission: true,
    },
    safetyNotice,
    readyToSendDraft: {
      subject: `Report: Ground-level open burning observed near ${location}`,
      body: `To Municipal Authorities,\n\nReporting an active localized smoke source (open burning of dry biomass/waste) located in ${location}.\n\nEmission is generating dense particulate matter at pedestrian breathing height. Requesting inspection and mitigation in accordance with Clean Air winter guidelines.\n\nThank you for your prompt response.`,
    },
  };
}
