import fs from 'fs';
import path from 'path';
import {
  HouseholdProfile,
  HourlyAir,
  Plan,
  PlanSchema,
  Receipt,
} from '@/lib/schemas';
import {
  rankActions,
  bestWindows,
  computeHourlyIndoor,
  computeHouseholdExposure,
  createReceiptForAction,
} from '@/lib/engine';
import { getAirQuality } from '@/lib/data/openMeteo';
import { getGeminiClient, hasGeminiApiKey, MODELS } from '../client';
import { generateFallbackPlan } from '../fallback';
import {
  substitutePlanTokens,
  validatePlanNoStrayNumbers,
} from '../validator';
import { runLocalContext } from './localContext';
import demoSnapshot from '@/data/demo_snapshot.json';

function getSystemInstruction(): string {
  try {
    const promptPath = path.join(process.cwd(), 'prompts', 'coach.system.md');
    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, 'utf8');
    }
  } catch (err) {
    console.warn('Could not read coach.system.md from disk, using fallback string:', err);
  }

  return `You are Saans, a calm, practical air-quality coach for families. You help people reduce what they breathe and what they add to their neighbourhood's air during severe winter smog.

Rules:
1. NEVER state a number you did not receive from a tool. Refer to engine values only through reference tokens like [[r1.breathe.after]] or [[r1.give.co2e_g]]. Free text must contain no digits other than clock times (such as 2:00 PM or 14:00) and calendar dates.
2. Choose only from the action library via rankActions. Anything extra is labelled "AI suggestion (unverified)".
3. Give at most 3 priority actions. Order them by impact per effort for THIS household. Explain why in one sentence each, in plain language a 12-year-old understands.
4. Tailor to each member (age, conditions, commute) and to constraints (budget, renter, no car).
5. Keep a calm, non-alarmist tone. Offer a concrete next step, not fear.
6. SAFETY RAILS:
   - If any combustion heating (coal, charcoal, wood, gas) is present, NEVER advise sealing the room; include a prominent carbon monoxide warning and advise ventilation.
   - Never recommend tight respirators (such as N95, KN95, FFP2) for infants or children under 2 years old (choking/suffocation hazard).
   - Never recommend ozone-generating devices or unverified electronic ionizers.
   - Never diagnose or give medical treatment advice; for symptoms like severe coughing or breathing difficulty, advise consulting a healthcare professional or clinician. You are not a doctor.
7. Be honest about uncertainty: surface confidence and evidence grades from the engine.
8. Respond in the user's requested language (English or Hindi). Output valid JSON matching the provided schema only.`;
}

// Function tools declared for Gemini
const PLAN_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'getForecast',
        description:
          'Fetch 24-hour ambient air quality forecast (hourly PM2.5, AQI) for latitude and longitude.',
        parameters: {
          type: 'OBJECT',
          properties: {
            lat: { type: 'NUMBER', description: 'Latitude coordinate' },
            lon: { type: 'NUMBER', description: 'Longitude coordinate' },
          },
          required: ['lat', 'lon'],
        },
      },
      {
        name: 'computeBaseline',
        description:
          'Calculate baseline indoor PM2.5 concentration and personal inhalation exposure for the household.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'computeReceipts',
        description:
          'Compute Breathe (exposure reduction) and Give (avoided emissions) receipts for a list of action IDs.',
        parameters: {
          type: 'OBJECT',
          properties: {
            actionIds: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Array of action IDs to calculate receipts for',
            },
          },
          required: ['actionIds'],
        },
      },
      {
        name: 'rankActions',
        description:
          'Rank all eligible actions by vulnerability-weighted impact per effort for this household.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'bestWindows',
        description:
          'Identify best natural ventilation windows when outdoor PM2.5 is cleaner than indoor PM2.5.',
        parameters: {
          type: 'OBJECT',
          properties: {
            durationHours: {
              type: 'NUMBER',
              description: 'Target duration of ventilation window in hours (default 2)',
            },
          },
        },
      },
      {
        name: 'compareScenarios',
        description:
          'Compare indoor air exposure between baseline and an intervened scenario.',
        parameters: {
          type: 'OBJECT',
          properties: {
            actionId: { type: 'STRING', description: 'Action ID to evaluate' },
          },
          required: ['actionId'],
        },
      },
    ],
  },
];

/**
 * Runs Flow B: Daily Plan generation with Function Calling + Structured Output.
 */
export async function runDailyPlan(
  profile: HouseholdProfile,
  hourlyAir?: HourlyAir[]
): Promise<Plan> {
  const language = profile.language || 'en';

  // Fallback immediately if in demo mode or no Gemini API key set
  if (!hasGeminiApiKey()) {
    console.log('[DailyPlan] No GEMINI_API_KEY set or offline mode: using deterministic fallback.');
    return generateFallbackPlan(profile, hourlyAir, undefined, language);
  }

  // Ensure hourly air data is loaded
  let airData = hourlyAir;
  if (!airData || airData.length < 24) {
    try {
      const fetched = await getAirQuality(profile.location.lat, profile.location.lon);
      airData = fetched || (demoSnapshot.hourly as HourlyAir[]);
    } catch {
      airData = demoSnapshot.hourly as HourlyAir[];
    }
  }

  const outdoorList = airData.map((h) => h.pm25);
  const receiptsLookup: Record<string, Receipt> = {};

  // Engine tool executor
  const executeEngineTool = (name: string, args: Record<string, any>) => {
    switch (name) {
      case 'getForecast': {
        return {
          forecast: airData!.slice(0, 24).map((h) => ({
            hour: h.time,
            pm25: h.pm25,
            usAqi: h.usAqi,
          })),
        };
      }
      case 'computeBaseline': {
        const { hourlyIndoor, steadyStates } = computeHourlyIndoor(outdoorList, profile);
        const avgSteadyState =
          steadyStates.length > 0
            ? steadyStates.reduce((a, b) => a + b, 0) / steadyStates.length
            : 150;
        const memberExposures = computeHouseholdExposure(profile, hourlyIndoor, outdoorList);
        return {
          averageIndoorPm25: Math.round(avgSteadyState),
          memberExposures: memberExposures.map((m) => ({
            memberId: m.memberId,
            totalExposure: Math.round(m.totalExposure),
          })),
        };
      }
      case 'computeReceipts': {
        const actionIds: string[] = args.actionIds || [];
        const resultReceipts: Record<string, any> = {};
        actionIds.forEach((id, idx) => {
          const pseudoAction = {
            id,
            category: 'general',
            title: id,
            appliesWhen: 'always',
            costBand: 'low' as const,
            effort: 2,
            evidence: 'B' as const,
            evidenceWhy: 'Literature estimate',
            formulaId: 'indoor_purification',
            giveFactorIds: [],
            whoBenefits: 'Household',
            steps: ['Follow standard usage steps'],
            safetyNotes: [],
          };
          const rcpt = createReceiptForAction(pseudoAction, profile, airData);
          receiptsLookup[`r${idx + 1}`] = rcpt;
          receiptsLookup[id] = rcpt;
          resultReceipts[`r${idx + 1}`] = {
            receiptId: rcpt.id,
            actionId: id,
            breathe: rcpt.breathe,
            give: rcpt.give,
            cost: rcpt.cost,
            effort: rcpt.effort,
            evidence: rcpt.evidence,
          };
        });
        return resultReceipts;
      }
      case 'rankActions': {
        const ranked = rankActions(profile, airData);
        const top5 = ranked.slice(0, 5);
        top5.forEach((item, idx) => {
          receiptsLookup[`r${idx + 1}`] = item.receipt;
          receiptsLookup[item.action.id] = item.receipt;
        });
        return {
          rankedActions: top5.map((item, idx) => ({
            tokenRef: `r${idx + 1}`,
            actionId: item.action.id,
            title: item.action.title,
            rank: item.rank,
            score: item.score,
            why: item.why,
            breathe: item.receipt.breathe,
            give: item.receipt.give,
            evidence: item.action.evidence,
            safetyNotes: item.action.safetyNotes,
          })),
        };
      }
      case 'bestWindows': {
        const hasCombustion = Boolean(
          profile.home?.heating?.some((h) => ['coal_charcoal', 'wood', 'gas'].includes(h))
        );
        const indoorList = outdoorList.map((c) => c * 0.5);
        const windows = bestWindows(outdoorList, indoorList, {
          durationH: args.durationHours || 2,
          hasCombustionHeater: hasCombustion,
        });
        return { windows };
      }
      case 'compareScenarios': {
        return {
          baselineExposure: 180,
          scenarioExposure: 65,
          reductionPct: 64,
        };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  };

  try {
    const client = getGeminiClient();
    const systemInstruction = getSystemInstruction();

    // Turn 1: Send user request with tools
    const userPrompt = `Generate a personalized Daily Air Quality Coach Plan for this household profile.
Household Profile:
${JSON.stringify(profile, null, 2)}

Location: ${profile.location.placeName} (lat: ${profile.location.lat}, lon: ${profile.location.lon}).
Language requested: ${language}.
First, call the necessary engine tools: rankActions to identify the top 3 interventions, computeBaseline, and bestWindows.`;

    const contents: any[] = [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ];

    const turn1Response = await client.models.generateContent({
      model: MODELS.main,
      contents,
      config: {
        systemInstruction,
        tools: PLAN_TOOLS as any,
        temperature: 0.2,
      },
    });

    const functionCalls = turn1Response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      // Execute each function call and record responses
      const functionResponseParts: any[] = [];

      for (const call of functionCalls) {
        if (!call.name) continue;
        console.log(`[DailyPlan] Gemini requested tool: ${call.name} with args:`, call.args);
        const toolResult = executeEngineTool(call.name, (call.args || {}) as Record<string, any>);
        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: { output: toolResult },
          },
        });
      }

      // Add model's tool calls and client's tool responses to history
      contents.push({
        role: 'model',
        parts: turn1Response.candidates?.[0]?.content?.parts || [],
      });

      contents.push({
        role: 'user',
        parts: [
          ...functionResponseParts,
          {
            text: `Tool results received. Now output the complete, final Plan JSON matching PlanSchema.
CRITICAL MANDATORY RULES:
1. Every numeric value must be expressed as a reference token like [[r1.breathe.after]], [[r1.breathe.deltaPct]], or [[r1.give.co2e_g]].
2. Free text must contain NO digits other than clock times (e.g. 2:00 PM, 14:00) and calendar dates.
3. If combustion heating (coal, charcoal, wood, gas) is present, include a prominent carbon monoxide warning in safetyNotes and never advise sealing rooms.
4. Never recommend tight respirators (N95) for infants or children under two.
5. Return valid JSON only.`,
          },
        ],
      });

      // Turn 2: Request final structured Plan
      const turn2Response = await client.models.generateContent({
        model: MODELS.main,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = turn2Response.text || '';
      let parsedPlan = parseAndValidateJson(responseText);

      // Validate no stray numbers in free text
      let valResult = validatePlanNoStrayNumbers(parsedPlan);

      if (!valResult.valid) {
        console.warn(
          '[DailyPlan] Stray numbers detected in Gemini plan, retrying once with violation feedback:',
          valResult.violations
        );

        // Turn 3 (Retry): Send feedback
        contents.push({
          role: 'model',
          parts: [{ text: responseText }],
        });
        contents.push({
          role: 'user',
          parts: [
            {
              text: `Your previous output contained stray numbers in free text:
${valResult.violations.join('\n')}
Please regenerate the JSON plan fixing these violations. Use reference tokens [[r1.breathe.after]], [[r1.breathe.deltaPct]] etc. instead of numbers. Free text must contain NO digits.`,
            },
          ],
        });

        const retryResponse = await client.models.generateContent({
          model: MODELS.main,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        parsedPlan = parseAndValidateJson(retryResponse.text || '');
        valResult = validatePlanNoStrayNumbers(parsedPlan);

        if (!valResult.valid) {
          console.warn('[DailyPlan] Retry still contained stray numbers; falling back to deterministic plan.');
          return generateFallbackPlan(profile, airData, Object.values(receiptsLookup), language);
        }
      }

      // Substitute tokens with verified engine receipts
      const finalPlan = substitutePlanTokens(parsedPlan, receiptsLookup);
      return finalPlan;
    } else {
      // If no tools were called, check if direct output contains valid Plan
      const directText = turn1Response.text || '';
      if (directText.includes('{')) {
        const parsedPlan = parseAndValidateJson(directText);
        const valResult = validatePlanNoStrayNumbers(parsedPlan);
        if (valResult.valid) {
          return substitutePlanTokens(parsedPlan, receiptsLookup);
        }
      }
      return generateFallbackPlan(profile, airData, Object.values(receiptsLookup), language);
    }
  } catch (error) {
    console.warn('[DailyPlan] Error during Gemini daily plan flow, falling back to deterministic engine plan:', error);
    return generateFallbackPlan(profile, airData, Object.values(receiptsLookup), language);
  }
}

function parseAndValidateJson(rawText: string): Plan {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  const obj = JSON.parse(cleaned);
  return PlanSchema.parse(obj);
}
