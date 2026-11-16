import { z } from 'zod';
import { callGemini } from '../callGemini';
import { hasGeminiApiKey, MODELS } from '../client';
import { HouseholdProfile } from '@/lib/schemas';

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
3. Output valid JSON matching AskMythCheckOutputSchema.`;

/**
 * Runs Flow F: Evidence-Grounded Q&A and Myth Buster.
 */
export async function runAskMythCheck(options: {
  question: string;
  profile?: HouseholdProfile;
  language?: 'en' | 'hi';
}): Promise<AskMythCheckOutput> {
  const language = options.language || options.profile?.language || 'en';
  const medicalDisclaimer =
    language === 'hi'
      ? 'यह जानकारी केवल सामान्य जागरूकता के लिए है, चिकित्सा सलाह नहीं। स्वास्थ्य संबंधी समस्या में तुरंत डॉक्टर से संपर्क करें।'
      : 'Saans provides environmental exposure guidance, not medical diagnosis or clinical treatment. Always consult a healthcare professional for persistent respiratory symptoms.';

  if (!hasGeminiApiKey()) {
    return generateFallbackAskAnswer(options.question, language, medicalDisclaimer);
  }

  const prompt = `Question/Claim: "${options.question}"
User language: ${language}
Household Context: ${options.profile ? `Location: ${options.profile.location.placeName}, Members: ${options.profile.members.length}` : 'General household'}

Search reliable medical and environmental health sources to verify this claim or question. Produce a structured JSON response with evidence grade, citations, and practical guidance.`;

  try {
    return await callGemini<AskMythCheckOutput>({
      model: MODELS.main,
      systemInstruction: ASK_MYTH_CHECK_SYSTEM_PROMPT,
      contents: prompt,
      tools: [{ googleSearch: {} }],
      responseSchema: AskMythCheckOutputSchema,
      temperature: 0.2,
    });
  } catch (error) {
    console.warn('[AskMythCheck] Gemini call failed, returning fallback answer:', error);
    return generateFallbackAskAnswer(options.question, language, medicalDisclaimer);
  }
}

function generateFallbackAskAnswer(
  question: string,
  language: 'en' | 'hi',
  medicalDisclaimer: string
): AskMythCheckOutput {
  const qLower = question.toLowerCase();

  // Known myth: Plants
  if (qLower.includes('plant') || qLower.includes('snake plant') || qLower.includes('पौध')) {
    return {
      shortAnswer:
        language === 'hi'
          ? 'कमरे में पौधे रखने से स्मॉग और PM2.5 कण साफ नहीं होते। नासा (NASA) का अध्ययन बंद बक्से में रसायनों के लिए था, भारी वायु प्रदूषण के लिए नहीं।'
          : 'Indoor plants do NOT meaningfully remove fine particulate smog (PM2.5). The famous NASA study measured volatile gases in sealed test chambers, not particulate smog in real-world living spaces.',
      isMyth: true,
      evidenceGrade: 'D',
      evidenceExplanation:
        'To match one basic HEPA purifier delivering 300 m³/h clean air, you would need between 100 to 1,000 plants per room. Plants do not create airflow or capture microscopic soot.',
      whatToDoInstead:
        language === 'hi'
          ? 'सच्चे HEPA फिल्टर वाले एयर प्यूरीफायर का उपयोग करें जो कमरे के आकार के अनुसार कम से कम 5 ACH (एयर चेंज प्रति घंटा) दे सके।'
          : 'Use a certified true HEPA air purifier or build a DIY Corsi-Rosenthal box fan filter delivering at least 4 to 5 Air Changes per Hour.',
      citations: [
        {
          title: 'Drexel University Study: Potted Plants Do Not Improve Indoor Air Quality',
          url: 'https://drexel.edu/news/archive/2019/november/potted-plants-dont-clean-air',
        },
      ],
      medicalDisclaimer,
    };
  }

  // Known myth: Jaggery / Gur
  if (qLower.includes('jaggery') || qLower.includes('gur') || qLower.includes('गुड़')) {
    return {
      shortAnswer:
        language === 'hi'
          ? 'गुड़ खाने से फेफड़ों में जमा PM2.5 प्रदूषण साफ नहीं होता। श्वसन नली और भोजन नली अलग-अलग होती हैं।'
          : 'Eating jaggery (gur) does NOT detoxify or cleanse the lungs of inhaled PM2.5. Food travels down the esophagus to the stomach, whereas inhaled fine particles lodge deep in the alveolar tissue of the lungs.',
      isMyth: true,
      evidenceGrade: 'D',
      evidenceExplanation:
        'There are no peer-reviewed human clinical trials proving that jaggery clears deep alveolar particulate deposition. Particulate matter entering the bloodstream causes systemic inflammation that dietary sugar cannot reverse.',
      whatToDoInstead:
        language === 'hi'
          ? 'बाहर जाते समय प्रमाणित N95 मास्क पहनें और घर के अंदर स्वच्छ हवा बनाए रखें।'
          : 'Prevent inhalation directly by wearing a certified N95/FFP2 respirator when outdoors and running indoor mechanical filtration.',
      citations: [
        {
          title: 'WHO: Ambient Air Pollution and Health Evidence',
          url: 'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
        },
      ],
      medicalDisclaimer,
    };
  }

  // General answer
  return {
    shortAnswer:
      language === 'hi'
        ? 'सर्दियों के गंभीर स्मॉग में सबसे प्रभावी कदम है: घर के अंदर HEPA प्यूरीफायर चलाना, बाहरी यात्रा के समय N95 मास्क पहनना और खिड़कियों को पीक प्रदूषण के समय बंद रखना।'
        : 'During severe winter smog episodes, the highest-evidence protective measures are running certified HEPA filtration indoors, wearing tight-fitting N95 respirators outdoors, and avoiding indoor combustion sources.',
    isMyth: false,
    evidenceGrade: 'A',
    evidenceExplanation:
      'True HEPA filters capture over 99.97% of fine particulates at 0.3 microns, and well-sealed N95 masks filter at least 95% of airborne particles under high breathing resistance.',
    whatToDoInstead: 'Follow the personalized Daily Plan generated by Saans for your household.',
    citations: [
      {
        title: 'WHO Global Air Quality Guidelines',
        url: 'https://www.who.int/publications/i/item/9789240034228',
      },
    ],
    medicalDisclaimer,
  };
}
