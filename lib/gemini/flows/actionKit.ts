import { z } from 'zod';
import { callGemini } from '../callGemini';
import { hasGeminiApiKey, MODELS } from '../client';

export const ActionKitInputSchema = z.object({
  issue: z.string(),
  issueDescription: z.string().optional(),
  communityContext: z
    .object({
      societyOrNeighborhood: z.string().optional(),
      city: z.string().optional(),
      householdCount: z.number().optional(),
    })
    .optional(),
  language: z.enum(['en', 'hi']).default('en'),
});

export type ActionKitInput = z.infer<typeof ActionKitInputSchema>;

export const ActionKitOutputSchema = z.object({
  rwaNotice: z.object({
    subject: z.string(),
    body: z.string(),
  }),
  schoolNotice: z.object({
    subject: z.string(),
    body: z.string(),
  }),
  whatsAppMessage: z.string(),
  actionableAlternatives: z.array(z.string()),
  safetyGuidance: z.string(),
});

export type ActionKitOutput = z.infer<typeof ActionKitOutputSchema>;

const ACTION_KIT_SYSTEM_PROMPT = `You are Saans Community Action Kit Generator. You draft respectful, constructive, and evidence-grounded community communication notices for neighborhoods and residential welfare associations (RWAs).

Issues addressed include:
- Garden leaf and biomass waste burning
- Night security guard bonfires during winter chill (proposing warm electric heating/jackets instead of open fires)
- Vehicle engine idling at school pickup and drop-off zones
- Uncovered neighborhood construction dust and debris piles

RULES:
1. Tone must be respectful, empathetic, collaborative, and constructive. NEVER accusatory, aggressive, or confrontational.
2. Emphasize collective health benefits for children, pregnant mothers, and elderly neighbors.
3. Offer practical, funded, or zero-cost solutions (e.g. electric radiant heaters for night guards, composting leaf bins, switch-off engine pledge).
4. Provide notices in the requested language (English or Hindi).
5. Output valid JSON matching ActionKitOutputSchema.`;

/**
 * Runs Flow D: Community Action Kit Generator.
 */
export async function runActionKit(input: ActionKitInput): Promise<ActionKitOutput> {
  const language = input.language || 'en';
  const isHindi = language === 'hi';

  if (!hasGeminiApiKey()) {
    return generateFallbackActionKit(input, isHindi);
  }

  const prompt = `Generate a community action kit for the following local air quality issue:
Issue: ${input.issue}
Details: ${input.issueDescription || 'Standard seasonal neighborhood pollution source'}
Neighborhood: ${input.communityContext?.societyOrNeighborhood || 'Our Residential Community'}
City: ${input.communityContext?.city || 'Delhi-NCR'}
Households: ${input.communityContext?.householdCount || 120}
Language: ${language}

Produce:
1. Formal RWA / Building Committee Notice
2. School / Parent-Teacher Association Notice
3. Short, respectful WhatsApp group broadcast message
4. Actionable alternatives and safety guidance`;

  try {
    return await callGemini<ActionKitOutput>({
      model: MODELS.main,
      systemInstruction: ACTION_KIT_SYSTEM_PROMPT,
      contents: prompt,
      responseSchema: ActionKitOutputSchema,
      temperature: 0.3,
    });
  } catch (error) {
    console.warn('[ActionKit] Gemini call failed, returning deterministic community notice:', error);
    return generateFallbackActionKit(input, isHindi);
  }
}

function generateFallbackActionKit(input: ActionKitInput, isHindi: boolean): ActionKitOutput {
  if (isHindi) {
    return {
      rwaNotice: {
        subject: 'अनुरोध: शीतकालीन स्मॉग के दौरान स्वच्छ वायु और सुरक्षा गार्डों के लिए हीटिंग व्यवस्था',
        body: `आदरणीय निवासीगण एवं समिति सदस्य,\n\nसर्दियों में बढ़ते प्रदूषण स्तर को ध्यान में रखते हुए, हमारे परिसर के बच्चों, बुजुर्गों और अस्थमा रोगियों के स्वास्थ्य की सुरक्षा हेतु हम एक सहयोगात्मक पहल का प्रस्ताव रखते हैं।\n\nरात के समय कचरा या पत्तियां जलाने के बजाय, आइए हम सुरक्षा कर्मचारियों के लिए इलेक्ट्रिक हीटर या गर्म जैकेट उपलब्ध कराएं। पत्तियों के लिए परिसर में खाद गड्ढा (कंपोस्टिंग) शुरू किया जा सकता है।\n\nआप सभी के सहयोग से हम अपने परिसर को स्वच्छ और सुरक्षित बना सकते हैं।`,
      },
      schoolNotice: {
        subject: 'अपील: स्कूल गेट पर वाहन इंजन बंद रखने (नो-आइडलिंग) का अभियान',
        body: `आदरणीय अभिभावक एवं शिक्षकगण,\n\nस्कूली बच्चों के फेफड़ों को सीधे जहरीले धुएं से बचाने के लिए, कृपया पिकअप और ड्रॉप के समय वाहन का इंजन बंद रखें। इंजन बंद रखने से स्कूल गेट के पास 40% तक तुरंत धुआं कम होता है।\n\nबच्चों के स्वस्थ भविष्य के लिए इस पहल में साथ दें।`,
      },
      whatsAppMessage: `🌿 *स्वच्छ हवा, स्वस्थ परिवार पहल* 🌿\nनमस्ते पड़ोसियों! सर्दियों के गंभीर स्मॉग को देखते हुए, आइए हम सब मिलकर खुले में पत्तियां/कचरा न जलाएं। यदि किसी गार्ड भाई को ठंड लगे तो मिलकर इलेक्ट्रिक हीटर या कंबल दें। छोटी सी सावधानी, बड़ी राहत! 🙏`,
      actionableAlternatives: [
        'सूखी पत्तियों को जलाने के बजाय खाद गड्ढे में डालें।',
        'सुरक्षा गार्डों के लिए सोसायटी फंड से 1000W इलेक्ट्रिक हीटर उपलब्ध कराएं।',
        'स्कूल गेट और पिकअप एरिया में "नो आइडलिंग" बोर्ड लगाएं।',
      ],
      safetyGuidance: 'किसी से विवाद न करें। शांतिपूर्ण और सहयोगात्मक संवाद से ही स्थायी समाधान संभव है।',
    };
  }

  return {
    rwaNotice: {
      subject: 'Collaborative Community Initiative: Clean Air & Guard Warmth This Winter',
      body: `Dear Residents and Management Committee Members,\n\nIn light of the severe winter smog affecting our region, we propose a constructive initiative to safeguard our children, senior citizens, and vulnerable members from toxic smoke.\n\nRather than open burning of leaves or night bonfires by security staff, we recommend:\n1. Providing our hardworking night guards with energy-efficient electric heaters and thermal jackets.\n2. Dedicating a clean composting pit for horticultural leaf waste instead of disposal by burning.\n\nThank you for working together to make our community healthy and clean.`,
    },
    schoolNotice: {
      subject: 'Clean Gates Initiative: Clean Air Zone for School Drop-off & Pickup',
      body: `Dear Parents and School Community,\n\nChildren's lungs are particularly vulnerable to vehicle tailpipe emissions at ground level. We kindly appeal to all drivers and parents to switch off vehicle engines while waiting at the school gate.\n\nTurning off idling engines reduces localized particulate pollution by up to 40% in minutes.\n\nThank you for protecting our children's breathing zone!`,
    },
    whatsAppMessage: `🌿 *Neighbourhood Clean Air Initiative* 🌿\nHi neighbours! During this peak smog season, let us protect our elders and kids by keeping our air clean. Please avoid burning dry leaves, and let's support our security guards with an electric heater instead of open fires. Every small step helps our families breathe easier! 🙏`,
    actionableAlternatives: [
      'Transition leaf waste to neighborhood composting pits.',
      'Sponsor a clean electric radiant heater for security gate cabins.',
      'Adopt a "Turn Off Engine When Waiting" norm at society and school gates.',
    ],
    safetyGuidance: 'Always approach community members with empathy and cooperation. Never escalate or confront individuals.',
  };
}
