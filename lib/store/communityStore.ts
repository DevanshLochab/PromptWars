/**
 * Saans Community Store
 * Local and anonymous peer coordination for neighborhood airsheds.
 * Pre-seeded with realistic data for demo and offline use.
 */

export interface AnonymousTotals {
  householdsCount?: number;
  actionsDone: number;
  estimatedBreathReduction: number; // e.g. % average
  estimatedEmissionsAvoided: number; // in grams of PM2.5/NOx avoided
}

export interface PooledTotals {
  communityCode: string;
  communityName: string;
  householdsCount: number;
  weeklyActionsDone: number;
  weeklyPm25AvoidedGrams: number;
  weeklyAvgExposureReductionPct: number;
  topActions: Array<{
    actionId: string;
    title: string;
    count: number;
  }>;
  recentInitiatives: Array<{
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    active: boolean;
  }>;
}

export interface ActionKit {
  id: string;
  issue: 'waste_burning' | 'bonfires' | 'school_idling' | 'construction_dust';
  issueLabel: string;
  title: string;
  description: string;
  practicalAlternatives: string[];
  whatChangesStats: string;
  buildingNotice: string;
  schoolNotice?: string;
  whatsAppMessage: string;
}

export interface HotspotReport {
  id: string;
  sourceType: 'waste_burning' | 'guard_bonfire' | 'construction_dust' | 'idling' | 'industrial_smoke' | 'other';
  severity: 'low' | 'medium' | 'high' | 'severe';
  locationDescription: string;
  notes?: string;
  photoUrl?: string;
  timestamp: string;
  contactChannel: string;
  status: 'draft' | 'submitted' | 'acknowledged';
}

export interface CommunityStore {
  joinCommunity(code: string, memberId?: string): Promise<void>;
  leaveCommunity(code: string): Promise<void>;
  submitWeeklyTotals(code: string, totals: AnonymousTotals): Promise<void>;
  getPooledTotals(code: string): Promise<PooledTotals>;
  getActionKits(code: string): Promise<ActionKit[]>;
  submitHotspot(code: string, report: HotspotReport): Promise<void>;
  getHotspotReports(): HotspotReport[];
}

// ================= SEED DATA =================

const PRE_SEEDED_ACTION_KITS: ActionKit[] = [
  {
    id: 'kit_garden_waste',
    issue: 'waste_burning',
    issueLabel: 'Garden Leaf & Horticultural Waste Burning',
    title: 'Autumn Leaf Composting & Mulching Drive',
    description:
      'Burning dry leaves releases toxic smoke, dioxins, and concentrated PM2.5 right at ground breathing level. A cooperative composting approach provides free garden mulch for the colony.',
    practicalAlternatives: [
      'Create a 2m x 2m wire mesh leaf composting pit in the society park corner.',
      'Request MCD horticultural waste collection truck via 311 mobile app.',
      'Use dried leaves as protective moisture-retaining soil mulch around colony trees.',
    ],
    whatChangesStats:
      'Eliminates ~5.0 kg of toxic PM2.5 per 1,000 kg leaves, preventing high-density ground-level smoke in residential lanes.',
    buildingNotice: `COMMUNITY NOTICE: HORTICULTURAL WASTE & LEAF BURNING ADVISORY

Dear Residents & Maintenance Team,

As Delhi winter approaches and ambient AQI enters Unhealthy tiers, we kindly remind all residents, gardeners, and facility staff that open burning of garden leaves, grass clippings, and twigs is strictly prohibited under National Green Tribunal (NGT) orders and poses severe health risks to our children and seniors.

Recommended Colony Action:
1. Please deposit all pruned branches and dry leaves at the designated composting corner behind Park 2.
2. The RWA has scheduled dedicated municipal green-waste pickups every Tuesday and Friday.
3. Gardeners are provided leaf shredders for tree mulching.

Thank you for helping keep our society airshed clean and breathable for all families.

— Resident Welfare Association (RWA) Environment Committee`,
    whatsAppMessage: `🍂 *Clean Air Advisory: Please Do Not Burn Leaves* 🍂

Dear Neighbours,
With AQI touching hazardous levels this week, please ensure our society gardeners and domestic staff do not burn dry leaves or sweepings. Leaf smoke contains fine PM2.5 that enters lungs directly.

✅ *What we are doing instead:*
• Deposit dry leaves in the leaf compost pit near Gate 2
• Use as natural soil mulch for flower beds
• Contact RWA office (Ext 104) for bulk garden green waste pickup

Let's protect our kids and elderly residents together! 🙏🍃`,
  },
  {
    id: 'kit_guard_bonfires',
    issue: 'bonfires',
    issueLabel: "Security Guards' Night Scrap Bonfires",
    title: 'Night Guard Warmth & Electric Kiosk Initiative',
    description:
      'Night security guards burn plastic-laced trash, plywood, and rubber to stay warm in biting 4°C winter temperatures. Providing electric radiant heaters and insulated uniforms eliminates hazardous smoke while keeping guards warm.',
    practicalAlternatives: [
      'Pool RWA funds to install 1000W quartz radiant heaters inside all security guard cabins.',
      'Distribute windproof heavy insulated thermal jackets, woollen gloves, and caps.',
      'Provide an electric thermal kettle in the guard post for hot tea throughout the night.',
    ],
    whatChangesStats:
      'A single scrap wood/plastic bonfire produces up to 350 µg/m³ PM2.5 within 20m of society gates. Electric heaters cut smoke to absolute zero.',
    buildingNotice: `RWA RESOLUTION: WARMTH FOR OUR SECURITY GUARDS WITHOUT TOXIC BONFIRES

Dear Residents,

Our society security personnel work through freezing winter nights to keep us safe. To keep warm, open fires using scrap wood, packaging materials, or leaves are often lit near security gates. This exposes both the guards and nearby ground-floor apartments to hazardous fumes.

To solve this humanely and cleanly, the Management Committee has approved:
1. Installation of 2x radiant electric space heaters in each guard booth.
2. Distribution of heavy thermal winter jackets and blankets to all 12 security staff.
3. Access to hot water dispensing stations at Gate 1 & 2.

We request all tower blocks to contribute towards the staff winter comfort fund and report any unauthorized open scrap fires immediately.

— Management Committee & Security Sub-Committee`,
    whatsAppMessage: `🧤 *Warmth for Our Security Staff — Zero Fumes Drive* 🧤

Dear Society Members,
Our night guards face extreme cold at the colony gates. Open scrap fires produce dangerous smoke for them and surrounding homes.

Our RWA has introduced a dignified, clean solution:
⚡ 2 Electric radiant heaters installed at security kiosks
🧥 12 High-grade windproof thermal jackets distributed
☕ Hot water & tea thermos provided for the night shift

Let us ensure no guard has to burn toxic scrap or plastic to stay warm this winter. Thank you for your support! 💙`,
  },
  {
    id: 'kit_school_idling',
    issue: 'school_idling',
    issueLabel: 'Engine Idling at School Gates During Pickup',
    title: 'School Gate "Engines Off" Clean Breath Zone',
    description:
      'Dozens of cars and school vans idle their diesel/petrol engines for 20–40 minutes while waiting for students. Exhaust concentrates at the exact height of primary school children.',
    practicalAlternatives: [
      'Implement an "Engines Off While Parked" policy with visible student-designed signage.',
      'Coordinate staggered student dismissal times by grade to eliminate queuing bottlenecks.',
      'Establish a volunteer parent carpool and walking-bus system from nearby sectors.',
    ],
    whatChangesStats:
      'Turning off idling engines reduces localized peak PM2.5 and NOx spikes by up to 60% right outside school entrances during peak pickup hours.',
    buildingNotice: `ADVISORY TO PARENTS & CAB DRIVERS: CLEAN AIR ZONE AT SCHOOL GATES

Dear Parents & Transporters,

During the 1:30 PM to 2:30 PM dismissal window, over 80 vehicles idle their engines along the school perimeter road. Children breathe at tailpipe height, where concentrations of nitrogen dioxide (NOx) and diesel particulates are up to 5x higher than ambient levels.

Effective Monday:
1. Please switch off your vehicle ignition completely while waiting for dismissal.
2. School marshals and student green captains will be holding "Turn Engine Off" reminder placards.
3. Drivers are requested not to double-park or idle with air conditioning running.

Let us prioritize our children’s respiratory health.

— Parent-Teacher Association (PTA) & Student Environmental Council`,
    schoolNotice: `CIRCULAR: IMPLEMENTATION OF NO-IDLING POLICY AROUND CAMPUS PERIMETER

To All Parents, Van Operators & Cab Services,
Subject: Mandatory "Engines Off" policy during student drop-off and pickup.

Medical evidence shows that developing lungs are exceptionally vulnerable to combustion aerosols. Idling for more than 10 seconds uses more fuel and emits more pollution than restarting your engine. 

Kindly turn off your ignition as soon as you park in the designated bays. Thank you for your partnership in keeping our children's air safe.`,
    whatsAppMessage: `🛑 *School Gate Clean Air Appeal: Turn Off Your Engine* 🛑

Dear Parents & Carpool Groups,
When waiting for school dismissal, idling vehicles create a dense cloud of exhaust right where our children walk out.

*Quick Habit Change:*
🔑 Turn ignition OFF while waiting
⏱️ Idling for 10+ seconds wastes more fuel than restarting
🫁 Protects small lungs from direct diesel and NOx fumes

Please share this in your class parent groups and with your cab drivers. Every minute with the key turned off counts! 🚸❤️`,
  },
  {
    id: 'kit_construction_dust',
    issue: 'construction_dust',
    issueLabel: 'Uncovered Construction Sand & Demolition Dust',
    title: 'Neighborhood Dust Barrier & Mist Protocol',
    description:
      'Renovation dust and loose sand piles blown by wind cause huge spikes in coarse PM10 and fine PM2.5 across adjoining balconies.',
    practicalAlternatives: [
      'Erect green agro-net shade cloths or geotextile dust curtains around all active renovation sites.',
      'Lightly spray water mist over aggregate, rubble, and sand bags twice daily.',
      'Store all fine cement and plaster materials indoors or securely tarped.',
    ],
    whatChangesStats:
      'Green net barriers and twice-daily misting reduce fugitive construction dust transport into neighboring apartments by 65–75%.',
    buildingNotice: `MANDATORY DUST CONTROL GUIDELINES FOR INTERIOR & CIVIC RENOVATIONS

Attention: Flat Owners, Contractors, and Facility Supervisors,

In compliance with CPCB guidelines and GRAP (Graded Response Action Plan) Stage regulations, the following dust mitigation measures are mandatory for all ongoing flat renovations and society maintenance projects:

1. Green Net Enclosure: All scaffolding and balcony work zones must be fully wrapped in 80% density green dust screens.
2. Sand & Rubble Storage: Sand and debris must never be dumped uncovered on common driveways. Heavy canvas or HDPE tarpaulins must cover all stockpiles.
3. Wet Misting: Contractors must dampen debris prior to bagging and chute transfer.
4. Transport: Debris removal vehicles must be covered before exiting society gates.

Non-compliance may lead to suspension of work permits and civic penalties.

— RWA Engineering & Maintenance Wing`,
    whatsAppMessage: `🏗️ *Dust Control Advisory for Home Renovations* 🏗️

Dear Residents and Contractors,
With high winter dust pollution, please follow these 3 simple rules for any flat remodeling or painting work:
1. Keep loose sand, cement, and demolition rubble completely covered with tarpaulin.
2. Ensure workers mist debris with water before sweeping or hauling down.
3. Install green safety netting on balconies facing common spaces.

Thank you for being thoughtful neighbours and keeping our walkways dust-free! 🏢✨`,
  },
];

// Pre-seeded community for demo
const SEED_COMMUNITIES: Record<string, PooledTotals> = {
  'DELHI-GREEN-01': {
    communityCode: 'DELHI-GREEN-01',
    communityName: 'Vasant Kunj Green Enclave (Sector B)',
    householdsCount: 60,
    weeklyActionsDone: 428,
    weeklyPm25AvoidedGrams: 3420,
    weeklyAvgExposureReductionPct: 28,
    topActions: [
      { actionId: 'purifier_run_high_bedroom_evening', title: 'Pre-bed Bedroom Purifier Burst', count: 184 },
      { actionId: 'cooking_exhaust_on_during_and_after', title: 'Exhaust Fan During & Post Cooking', count: 142 },
      { actionId: 'metro_over_cab_smog_days', title: 'Public Metro Commute on Severe Days', count: 102 },
    ],
    recentInitiatives: [
      { id: 'init_1', title: 'Night Guard Electric Heaters Installed', target: 8, current: 8, unit: 'gates', active: true },
      { id: 'init_2', title: 'School Gate Anti-Idling Volunteer Patrol', target: 15, current: 12, unit: 'days', active: true },
      { id: 'init_3', title: 'Society Leaf Composting Bins', target: 4, current: 3, unit: 'parks', active: true },
    ],
  },
  'NOIDA-SECTOR-62': {
    communityCode: 'NOIDA-SECTOR-62',
    communityName: 'Sector 62 Clean Air Collaborative',
    householdsCount: 42,
    weeklyActionsDone: 285,
    weeklyPm25AvoidedGrams: 2190,
    weeklyAvgExposureReductionPct: 24,
    topActions: [
      { actionId: 'purifier_run_high_bedroom_evening', title: 'Pre-bed Bedroom Purifier Burst', count: 96 },
      { actionId: 'wet_mop_not_dry_sweep', title: 'Microfiber Wet Mopping', count: 88 },
    ],
    recentInitiatives: [
      { id: 'init_n1', title: 'Demolition Dust Netting Compliance', target: 10, current: 9, unit: 'sites', active: true },
    ],
  },
};

const COMMUNITY_STORAGE_KEY = 'saans_community_data_v1';
const HOTSPOT_STORAGE_KEY = 'saans_hotspot_reports_v1';

export class SeedStore implements CommunityStore {
  private communities: Record<string, PooledTotals>;
  private hotspotReports: HotspotReport[];

  constructor() {
    this.communities = { ...SEED_COMMUNITIES };
    this.hotspotReports = [];
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const commRaw = localStorage.getItem(COMMUNITY_STORAGE_KEY);
      if (commRaw) {
        this.communities = { ...SEED_COMMUNITIES, ...JSON.parse(commRaw) };
      }
      const hotspotRaw = localStorage.getItem(HOTSPOT_STORAGE_KEY);
      if (hotspotRaw) {
        this.hotspotReports = JSON.parse(hotspotRaw);
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(this.communities));
      localStorage.setItem(HOTSPOT_STORAGE_KEY, JSON.stringify(this.hotspotReports));
    } catch {
      // ignore
    }
  }

  async joinCommunity(code: string, _memberId?: string): Promise<void> {
    const cleanCode = (code || 'DELHI-GREEN-01').toUpperCase().trim();
    if (!this.communities[cleanCode]) {
      // Initialize new community with base figures
      this.communities[cleanCode] = {
        communityCode: cleanCode,
        communityName: `${cleanCode} Resident Airshed`,
        householdsCount: 1,
        weeklyActionsDone: 3,
        weeklyPm25AvoidedGrams: 45,
        weeklyAvgExposureReductionPct: 18,
        topActions: [
          { actionId: 'purifier_run_high_bedroom_evening', title: 'Bedroom Purifier Routine', count: 1 },
        ],
        recentInitiatives: [
          { id: 'init_new', title: 'Welcome New Airshed Members', target: 10, current: 1, unit: 'households', active: true },
        ],
      };
    } else {
      this.communities[cleanCode].householdsCount += 1;
    }
    this.saveToStorage();
  }

  async leaveCommunity(code: string): Promise<void> {
    const cleanCode = (code || '').toUpperCase().trim();
    if (this.communities[cleanCode] && this.communities[cleanCode].householdsCount > 1) {
      this.communities[cleanCode].householdsCount -= 1;
      this.saveToStorage();
    }
  }

  async submitWeeklyTotals(code: string, totals: AnonymousTotals): Promise<void> {
    const cleanCode = (code || 'DELHI-GREEN-01').toUpperCase().trim();
    const target = this.communities[cleanCode] || this.communities['DELHI-GREEN-01'];
    if (target) {
      target.weeklyActionsDone += totals.actionsDone;
      target.weeklyPm25AvoidedGrams += totals.estimatedEmissionsAvoided;
      // Weighted average exposure reduction
      target.weeklyAvgExposureReductionPct = Math.round(
        (target.weeklyAvgExposureReductionPct * 0.8) + (totals.estimatedBreathReduction * 0.2)
      );
      this.saveToStorage();
    }
  }

  async getPooledTotals(code: string): Promise<PooledTotals> {
    const cleanCode = (code || 'DELHI-GREEN-01').toUpperCase().trim();
    return this.communities[cleanCode] || this.communities['DELHI-GREEN-01'];
  }

  async getActionKits(_code: string): Promise<ActionKit[]> {
    return PRE_SEEDED_ACTION_KITS;
  }

  async submitHotspot(_code: string, report: HotspotReport): Promise<void> {
    const newReport: HotspotReport = {
      ...report,
      id: report.id || `hotspot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'submitted',
      timestamp: report.timestamp || new Date().toISOString(),
    };
    this.hotspotReports.unshift(newReport);
    this.saveToStorage();
  }

  getHotspotReports(): HotspotReport[] {
    return this.hotspotReports;
  }
}

// Optional Supabase adapter - activated by SUPABASE_URL and SUPABASE_ANON_KEY env vars
export class SupabaseStore implements CommunityStore {
  // Placeholder - requires SUPABASE_URL and SUPABASE_ANON_KEY
  constructor() {
    if (typeof process === 'undefined' || !process.env?.SUPABASE_URL || !process.env?.SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
    }
  }

  async joinCommunity(_code: string, _memberId?: string): Promise<void> {
    throw new Error('Supabase integration not configured');
  }

  async leaveCommunity(_code: string): Promise<void> {
    throw new Error('Supabase integration not configured');
  }

  async submitWeeklyTotals(_code: string, _totals: AnonymousTotals): Promise<void> {
    throw new Error('Supabase integration not configured');
  }

  async getPooledTotals(_code: string): Promise<PooledTotals> {
    throw new Error('Supabase integration not configured');
  }

  async getActionKits(_code: string): Promise<ActionKit[]> {
    throw new Error('Supabase integration not configured');
  }

  async submitHotspot(_code: string, _report: HotspotReport): Promise<void> {
    throw new Error('Supabase integration not configured');
  }

  getHotspotReports(): HotspotReport[] {
    return [];
  }
}

export function createCommunityStore(): CommunityStore {
  if (typeof process !== 'undefined' && process.env?.SUPABASE_URL && process.env?.SUPABASE_ANON_KEY) {
    try {
      return new SupabaseStore();
    } catch (e) {
      console.warn('Supabase store initialization failed, falling back to SeedStore:', e);
    }
  }
  return new SeedStore();
}

// Singleton export
export const communityStore = createCommunityStore();
