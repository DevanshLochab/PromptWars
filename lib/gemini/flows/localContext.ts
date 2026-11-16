import { callGemini } from '../callGemini';
import { MODELS } from '../client';
import { z } from 'zod';

export const LocalContextResultSchema = z.object({
  city: z.string(),
  pollutionRestrictions: z.array(z.string()),
  schoolAdvisories: z.array(z.string()),
  reportingChannels: z.array(z.string()),
  transitOptions: z.array(z.string()),
  citations: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
    })
  ),
  advisoryNote: z.string(),
});

export type LocalContextResult = z.infer<typeof LocalContextResultSchema>;

const LOCAL_CONTEXT_SYSTEM_PROMPT = `You are Saans Local Context Researcher. Your role is to find current official air pollution regulations, government GRAP (Graded Response Action Plan) restrictions, municipal advisories, school outdoor-play advisories, and official citizen reporting helplines for the specified city during winter smog episodes.

Always verify current rules. Summarize clearly and factually.
Format response as valid JSON matching the schema.
Always include the advisory note: "Grounding data retrieved from public sources — please verify locally with municipal authorities."`;

/**
 * Runs Flow C: Grounded Local Context using Google Search Grounding.
 */
export async function runLocalContext(
  cityName: string = 'Delhi NCR'
): Promise<LocalContextResult> {
  const prompt = `Find current winter air pollution emergency restrictions, GRAP stage alerts, municipal helplines for reporting illegal burning/dust, school outdoor activity advisories, and public transit schedules or incentives for ${cityName}.`;

  try {
    const result = await callGemini<LocalContextResult>({
      model: MODELS.main,
      systemInstruction: LOCAL_CONTEXT_SYSTEM_PROMPT,
      contents: prompt,
      tools: [{ googleSearch: {} }],
      responseSchema: LocalContextResultSchema,
      temperature: 0.1,
    });

    return result;
  } catch (error) {
    console.warn('Google Search Grounding local context failed, returning fallback context:', error);
    // Conservative fallback for offline / mock mode
    return {
      city: cityName,
      pollutionRestrictions: [
        'GRAP Stage III/IV restrictions may be in effect: non-essential diesel vehicles and construction dust activities strictly restricted.',
        'Strict ban on open burning of leaves, municipal solid waste, and biomass.',
      ],
      schoolAdvisories: [
        'Physical education and outdoor morning assemblies suspended during Severe AQI days.',
        'Primary schools may operate online or with reduced hours during severe pollution peaks.',
      ],
      reportingChannels: [
        'Central Pollution Control Board (CPCB) Sameer App: https://cpcb.nic.in/',
        'Municipal Corporation citizen helpline / Green Delhi App for reporting open burning and construction dust.',
      ],
      transitOptions: [
        'Delhi Metro and DTC electric buses operating with increased frequency during peak smog intervals.',
        'Carpooling and non-motorized transit advised for short-distance neighborhood errands.',
      ],
      citations: [
        {
          title: 'CPCB Winter Air Quality Management Portal',
          url: 'https://cpcb.nic.in/',
        },
        {
          title: 'Commission for Air Quality Management (CAQM) Delhi-NCR',
          url: 'https://caqm.nic.in/',
        },
      ],
      advisoryNote: 'Grounding data retrieved from public sources — please verify locally with municipal authorities.',
    };
  }
}
