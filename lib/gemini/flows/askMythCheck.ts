import { z } from 'zod';
import { callGemini } from '../callGemini';
import { MODELS } from '../client';
import { HouseholdProfile, Language } from '@/lib/schemas';

export const AskMythCheckOutputSchema = z.object({
  shortAnswer: z.string(),
  isMyth: z.boolean(),
  evidenceGrade: z.enum(['A', 'B', 'C', 'D']),
  evidenceExplanation: z.string(),
  whatToDoInstead: z.string().optional(),
  citations: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
    })
  ),
  medicalDisclaimer: z.string(),
});

export type AskMythCheckOutput = z.infer<typeof AskMythCheckOutputSchema>;

const ASK_MYTH_CHECK_SYSTEM_PROMPT = `You are Saans Air Quality & Evidence Coach. You answer questions and evaluate air quality claims, household habits, and common myths using rigorous environmental health science.

Evidence Grades:
- Grade A: High-quality randomized trials or established physics/standard engineering (e.g. HEPA filtration, N95 respirators, gas vs biomass cooking).
- Grade B: Cohort studies, observational air monitoring, or official regulatory guidelines (e.g. wet mopping, cooking exhaust, window ventilation timing).
- Grade C: Small studies or plausible mechanisms with limited direct efficacy data (e.g. DIY Corsi-Rosenthal boxes, indoor activity shifts).
- Grade D: Anecdotal, traditional, or commercially exaggerated claims lacking scientific efficacy for PM2.5 (e.g. air-purifying indoor snake plants for severe smog, jaggery/gur lung detox, cloth handkerchiefs as respirators).

CRITICAL RULES:
1. For myths (Grade D claims): Set isMyth: true, explain WHY the claim lacks sufficient air change or clearance physics, and provide "whatToDoInstead" recommending proven Grade A/B alternatives.
2. For medical / clinical inquiries: NEVER prescribe, diagnose, or advise altering medical treatments. Provide general exposure context and append: "This is general health information, not medical advice. Consult a healthcare provider or clinician for diagnosis and medication management."
3. Language and Regional Script: Always write the user-facing explanation, short answer, and what to do instead in the requested Indian regional language using its native script when requested.
4. Output valid JSON matching AskMythCheckOutputSchema.`;

const LANG_MAP: Record<string, string> = {
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

/**
 * Runs Flow F: Evidence-Grounded Q&A and Myth Buster.
 */
export async function runAskMythCheck(options: {
  question: string;
  profile?: HouseholdProfile;
  language?: Language;
}): Promise<AskMythCheckOutput> {
  const language = options.language || (options.profile?.language as Language) || 'en';
  const targetLanguageName = LANG_MAP[language] || 'English';

  const prompt = `Question/Claim: "${options.question}"
Requested Output Language: ${targetLanguageName} (${language})
Household Context: ${
    options.profile
      ? `Location: ${options.profile.location.placeName}, Members: ${options.profile.members.length}`
      : 'General household'
  }

CRITICAL ACCESSIBILITY & LOCALIZATION REQUIREMENT:
You MUST respond entirely in ${targetLanguageName}. The "shortAnswer", "evidenceExplanation", "whatToDoInstead", and "medicalDisclaimer" fields MUST be written naturally in ${targetLanguageName} using its native script (unless English is selected).

Search reliable medical and environmental health sources to verify this claim or question. Produce a structured JSON response with evidence grade, citations, and practical guidance.`;

  try {
    return await callGemini<AskMythCheckOutput>({
      model: MODELS.main,
      systemInstruction: ASK_MYTH_CHECK_SYSTEM_PROMPT,
      contents: prompt,
      responseSchema: AskMythCheckOutputSchema,
      temperature: 0.2,
    });
  } catch (error) {
    console.error('[AskMythCheck] All configured AI providers failed:', error);
    throw error;
  }
}
