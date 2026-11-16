import { describe, it, expect } from 'vitest';
import { PlanSchema } from '@/lib/schemas';
import { PhotoAuditResponseSchema } from '@/lib/gemini/flows/photoAudit';
import { ActionKitOutputSchema } from '@/lib/gemini/flows/actionKit';
import { HotspotReportOutputSchema } from '@/lib/gemini/flows/hotspotReport';
import { AskMythCheckOutputSchema } from '@/lib/gemini/flows/askMythCheck';

describe('Gemini Output Schema Validations', () => {
  it('validates mock Gemini Plan output against PlanSchema', () => {
    const mockGeminiPlan = {
      generatedAt: '2025-01-15T12:00:00.000Z',
      language: 'en',
      headline: 'Targeted actions for severe winter smog.',
      severityTier: 'Severe Smog Emergency',
      topActions: [
        {
          receiptId: 'r1',
          why: 'Reduces bedroom particulate load during sleep.',
          how: 'Turn purifier to high mode thirty minutes before bed.',
          whenWindow: '8:00 PM to 10:00 PM',
          forWhom: 'All resting family members',
        },
      ],
      timeline: Array(24)
        .fill(null)
        .map((_, i) => ({
          hour: i,
          aqiBand: 'Severe',
          tags: ['Smog Peak'],
          advice: 'Keep windows shut and run purifier.',
        })),
      perMember: [
        {
          memberId: 'm1',
          nickname: 'Aarav',
          tips: ['Avoid intense outdoor play.'],
        },
      ],
      safetyNotes: ['Consult a doctor for severe symptoms.'],
      citations: [
        {
          url: 'https://www.who.int/',
          title: 'WHO Air Quality Guidelines',
        },
      ],
    };

    const parsed = PlanSchema.safeParse(mockGeminiPlan);
    expect(parsed.success).toBe(true);
  });

  it('validates PhotoAuditResponseSchema', () => {
    const mockAudit = {
      detectedFeatures: ['Double-glazed sliding window', 'Wall exhaust fan'],
      home: {
        windowLeakiness: 'tight',
        exhaustHood: true,
      },
      devices: [
        {
          type: 'purifier',
          cadrM3h: 320,
          brand: 'Philips',
        },
      ],
      fieldConfidence: {
        windowLeakiness: {
          confidence: 0.85,
          needsConfirmation: false,
        },
      },
      summary: 'Well-sealed apartment with operational purifier and exhaust.',
    };

    const parsed = PhotoAuditResponseSchema.safeParse(mockAudit);
    expect(parsed.success).toBe(true);
  });

  it('validates ActionKitOutputSchema', () => {
    const mockKit = {
      rwaNotice: {
        subject: 'Cooperative Winter Heating Initiative',
        body: 'Notice text here.',
      },
      schoolNotice: {
        subject: 'Turn Off Engines at School Gate',
        body: 'School notice text.',
      },
      whatsAppMessage: 'Friendly WhatsApp broadcast message.',
      actionableAlternatives: ['Electric heater sponsorship'],
      safetyGuidance: 'Never confront individuals.',
    };

    const parsed = ActionKitOutputSchema.safeParse(mockKit);
    expect(parsed.success).toBe(true);
  });

  it('validates HotspotReportOutputSchema', () => {
    const mockHotspot = {
      sourceClassification: 'Horticultural leaf burning',
      severity: 'High',
      factualDescription: 'Observed active smoke plume from leaf piles.',
      reportingChannel: {
        name: 'CPCB Sameer App',
        instructions: 'Report via app',
        linkOrApp: 'https://cpcb.nic.in/',
      },
      privacyCheck: {
        facesDetected: false,
        licensePlatesDetected: false,
        cleanForSubmission: true,
      },
      safetyNotice: 'Never confront individuals directly.',
      readyToSendDraft: {
        subject: 'Report of open burning',
        body: 'Factual text',
      },
    };

    const parsed = HotspotReportOutputSchema.safeParse(mockHotspot);
    expect(parsed.success).toBe(true);
  });

  it('validates AskMythCheckOutputSchema', () => {
    const mockAsk = {
      shortAnswer: 'Indoor plants do not meaningfully filter PM2.5.',
      isMyth: true,
      evidenceGrade: 'D',
      evidenceExplanation: 'Lack of air exchange capacity.',
      whatToDoInstead: 'Use true HEPA purifiers.',
      citations: [
        {
          title: 'Drexel Study',
          url: 'https://drexel.edu/',
        },
      ],
      medicalDisclaimer: 'Not medical advice.',
    };

    const parsed = AskMythCheckOutputSchema.safeParse(mockAsk);
    expect(parsed.success).toBe(true);
  });
});
