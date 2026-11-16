import { z } from 'zod';

// Generic SourcedValue wrapper for fields that can be inferred or confirmed
export function createSourcedValueSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema,
    source: z.enum(['user', 'photo', 'default']),
    confidence: z.number().min(0).max(1),
    needsConfirmation: z.boolean(),
  });
}

export type SourcedValue<T> = {
  value: T;
  source: 'user' | 'photo' | 'default';
  confidence: number;
  needsConfirmation: boolean;
};

// Location
export const LocationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  placeName: z.string(),
  timezone: z.string().default('Asia/Kolkata'),
});
export type Location = z.infer<typeof LocationSchema>;

// Home
export const HomeTypeEnum = z.enum(['apartment', 'house', 'studio', 'other']);
export const WindowLeakinessEnum = z.enum(['tight', 'average', 'leaky']);
export const AcTypeEnum = z.enum(['none', 'split', 'window', 'central']);
export const HeatingTypeEnum = z.enum(['electric', 'gas', 'coal_charcoal', 'wood', 'none']);
export const CookingTypeEnum = z.enum(['lpg', 'induction', 'biomass', 'electric']);
export const IncenseFrequencyEnum = z.enum(['never', 'sometimes', 'daily']);

export const HomeSchema = z.object({
  type: HomeTypeEnum,
  mainRoomAreaM2: z.number().positive(),
  ceilingHeightM: z.number().positive().default(2.7),
  windowLeakiness: WindowLeakinessEnum,
  canOpenWindows: z.boolean().default(true),
  renter: z.boolean().default(false),
  exhaustHood: z.boolean().default(false),
  ac: AcTypeEnum.default('none'),
  heating: z.array(HeatingTypeEnum).default(['none']),
  cooking: z.array(CookingTypeEnum).default(['lpg']),
  smokingIndoors: z.boolean().default(false),
  incenseOrCoils: IncenseFrequencyEnum.default('never'),
});
export type Home = z.infer<typeof HomeSchema>;

// Devices
export const DeviceTypeEnum = z.enum(['purifier', 'diy_filter', 'co_alarm']);

export const DeviceSchema = z.object({
  type: DeviceTypeEnum,
  cadrM3h: z.number().positive().optional(),
  filterAgeMonths: z.number().nonnegative().optional(),
  room: z.string().optional(),
});
export type Device = z.infer<typeof DeviceSchema>;

// Commute
export const CommuteModeEnum = z.enum([
  'walk',
  'cycle',
  'two_wheeler',
  'car',
  'bus',
  'metro',
  'auto',
  'none',
]);
export type CommuteMode = z.infer<typeof CommuteModeEnum>;

export const CommuteSchema = z.object({
  mode: CommuteModeEnum,
  km: z.number().nonnegative(),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(0).max(23),
});
export type Commute = z.infer<typeof CommuteSchema>;

// Member
export const AgeBandEnum = z.enum(['infant', 'toddler', 'child', 'teen', 'adult', 'senior']);
export const HealthConditionEnum = z.enum([
  'asthma',
  'copd',
  'heart',
  'pregnant',
  'diabetes',
  'none',
]);
export const OutdoorActivityEnum = z.enum(['none', 'light', 'exercise', 'physical_work']);
export const MaskTypeEnum = z.enum(['none', 'cloth', 'surgical', 'n95']);

export const MemberSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  ageBand: AgeBandEnum,
  conditions: z.array(HealthConditionEnum).default(['none']),
  commute: CommuteSchema,
  outdoorHoursPerDay: z.number().nonnegative(),
  outdoorActivity: OutdoorActivityEnum.default('none'),
  maskOwned: MaskTypeEnum.default('none'),
});
export type Member = z.infer<typeof MemberSchema>;

// Constraints
export const BudgetBandEnum = z.enum(['none', 'low', 'medium', 'high']);

export const ConstraintsSchema = z.object({
  budgetBand: BudgetBandEnum.default('low'),
  hasCar: z.boolean().default(false),
  hasTwoWheeler: z.boolean().default(false),
});
export type Constraints = z.infer<typeof ConstraintsSchema>;

// Household Profile
export const LanguageEnum = z.enum(['en', 'hi']);

export const HouseholdProfileSchema = z.object({
  location: LocationSchema,
  language: LanguageEnum.default('en'),
  units: z.enum(['metric', 'imperial']).default('metric'),
  home: HomeSchema,
  devices: z.array(DeviceSchema).default([]),
  members: z.array(MemberSchema).min(1),
  constraints: ConstraintsSchema,
  communityCode: z.string().optional(),
});
export type HouseholdProfile = z.infer<typeof HouseholdProfileSchema>;

// Hourly Air Quality & Weather
export const HourlyAirSchema = z.object({
  time: z.string(),
  pm25: z.number(),
  pm10: z.number(),
  no2: z.number(),
  o3: z.number(),
  usAqi: z.number(),
  tempC: z.number(),
  rh: z.number(),
  windMs: z.number(),
});
export type HourlyAir = z.infer<typeof HourlyAirSchema>;

// Action & Receipt
export const CostBandEnum = z.enum(['none', 'low', 'medium', 'high']);
export const EvidenceGradeEnum = z.enum(['A', 'B', 'C', 'D']);
export const ConfidenceLevelEnum = z.enum(['low', 'medium', 'high']);

export const ActionSchema = z.object({
  id: z.string(),
  category: z.string(),
  title: z.string(),
  appliesWhen: z.string(),
  blockedWhen: z.string().nullable().optional(),
  costBand: CostBandEnum,
  effort: z.number().int().min(1).max(5),
  evidence: EvidenceGradeEnum,
  evidenceWhy: z.string(),
  formulaId: z.string(),
  giveFactorIds: z.array(z.string()).default([]),
  whoBenefits: z.string(),
  steps: z.array(z.string()),
  safetyNotes: z.array(z.string()).default([]),
});
export type Action = z.infer<typeof ActionSchema>;

export const BreatheImpactSchema = z.object({
  metric: z.string().default('pm25_exposure_reduction_pct'),
  before: z.number(),
  after: z.number(),
  deltaPct: z.number(),
  unit: z.string().default('µg/m³·h'),
  low: z.number(),
  high: z.number(),
});
export type BreatheImpact = z.infer<typeof BreatheImpactSchema>;

export const GiveImpactSchema = z.object({
  pm25_g: z.number().optional(),
  nox_g: z.number().optional(),
  co2e_g: z.number().optional(),
  period: z.string().default('daily'),
  low: z.number().optional(),
  high: z.number().optional(),
});
export type GiveImpact = z.infer<typeof GiveImpactSchema>;

export const ReceiptCostSchema = z.object({
  upfront: z.number().default(0),
  ongoing: z.number().default(0),
  currency: z.string().default('INR'),
});
export type ReceiptCost = z.infer<typeof ReceiptCostSchema>;

export const ReceiptAssumptionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  source: z.string().optional(),
});
export type ReceiptAssumption = z.infer<typeof ReceiptAssumptionSchema>;

export const ReceiptSchema = z.object({
  id: z.string(),
  actionId: z.string(),
  memberIds: z.array(z.string()),
  window: z
    .object({
      start: z.number().min(0).max(23),
      end: z.number().min(0).max(23),
    })
    .optional(),
  formulaId: z.string(),
  breathe: BreatheImpactSchema,
  give: GiveImpactSchema,
  cost: ReceiptCostSchema,
  effort: z.number().int().min(1).max(5),
  evidence: EvidenceGradeEnum,
  confidence: ConfidenceLevelEnum,
  assumptions: z.array(ReceiptAssumptionSchema).default([]),
});
export type Receipt = z.infer<typeof ReceiptSchema>;

// Plan Top Action
export const PlanTopActionSchema = z.object({
  receiptId: z.string(),
  why: z.string(),
  how: z.string(),
  whenWindow: z.string(),
  forWhom: z.string(),
});
export type PlanTopAction = z.infer<typeof PlanTopActionSchema>;

// Plan Timeline Entry
export const PlanTimelineEntrySchema = z.object({
  hour: z.number().int().min(0).max(23),
  aqiBand: z.string(),
  tags: z.array(z.string()),
  advice: z.string(),
});
export type PlanTimelineEntry = z.infer<typeof PlanTimelineEntrySchema>;

// Plan Member Tip
export const PlanMemberTipsSchema = z.object({
  memberId: z.string(),
  nickname: z.string(),
  tips: z.array(z.string()),
});
export type PlanMemberTips = z.infer<typeof PlanMemberTipsSchema>;

// Citation
export const CitationSchema = z.object({
  url: z.string(),
  title: z.string(),
});
export type Citation = z.infer<typeof CitationSchema>;

// Complete Plan
export const PlanSchema = z.object({
  generatedAt: z.string(),
  language: LanguageEnum.default('en'),
  headline: z.string(),
  severityTier: z.string(),
  topActions: z.array(PlanTopActionSchema).max(3),
  timeline: z.array(PlanTimelineEntrySchema).length(24),
  perMember: z.array(PlanMemberTipsSchema),
  safetyNotes: z.array(z.string()).default([]),
  citations: z.array(CitationSchema).default([]),
});
export type Plan = z.infer<typeof PlanSchema>;
