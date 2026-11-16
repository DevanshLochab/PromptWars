# Saans Architectural & Physical Assumptions Catalog

This document catalogues all physical, mathematical, behavioral, and architectural assumptions implemented across the Saans decision engine, data catalogues, and user interfaces, together with scientific rationales and potential error bounds.

---

## 1. Gemini Model Selection & Availability Rationale

### 1.1 Specification Defaults vs. Current API Availability
* **Spec Requirement**: The specification outlines the following default model IDs:
  - `GEMINI_MODEL_MAIN`: `gemini-3.8-flash`
  - `GEMINI_MODEL_LITE`: `gemini-3.5-flash-lite`
  - `GEMINI_MODEL_LIVE` (stretch): `gemini-3.1-flash-live-preview`
  - `GEMINI_MODEL_TTS` (stretch): `gemini-3.1-flash-tts-preview`
* **Prompt Rule**: *"If a default ID is not valid, fall back to the newest stable Flash model in the docs."*
* **Design Decision**:
  - The Gemini 3.x Flash series (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-*`) represents anticipated next-generation Gemini endpoints not yet accessible on standard Google AI Studio / Gemini API production tiers.
  - To ensure that Saans builds, tests, and runs cleanly both with live API keys and in offline evaluation, `/lib/gemini/client.ts` uses environment variables with defaults targeting the newest stable endpoints:
    - Main: `process.env.GEMINI_MODEL_MAIN || 'gemini-2.5-flash'` (or `gemini-3.8-flash` if supplied in `.env.local`)
    - Lite: `process.env.GEMINI_MODEL_LITE || 'gemini-2.0-flash-lite'` (or `gemini-3.5-flash-lite` if supplied)
    - Live: `process.env.GEMINI_MODEL_LIVE || 'gemini-2.0-flash-live-001'`
    - TTS: `process.env.GEMINI_MODEL_TTS || 'gemini-2.5-flash-preview-tts'`
  - All calls degrade gracefully to deterministic offline engine calculation if `GEMINI_API_KEY` is omitted or calls fail.

---

## 2. Indoor Air Quality Physics Model (`indoor.ts`)

### 2.1 Single-Zone Well-Mixed Compartment Assumption
* **Assumption**: The primary living area or bedroom is modeled as a single, well-mixed control volume where concentration $C_{in}(t)$ is spatially uniform.
* **Rationale**: In typical Indian urban apartments (30 m² living rooms or 15–20 m² bedrooms), ceiling fans and thermal convection maintain relatively well-mixed interior air. Modeling multi-zone coupling or localized stagnant zones requires Computational Fluid Dynamics (CFD), which is computationally prohibitive and requires detailed CAD geometries unavailable on mobile devices.
* **Bound**: Under slow air movement (<0.05 m/s), local micro-gradients of up to ±20% may exist near windows and doors.

### 2.2 Steady-State Formulation
* **Assumption**: Daytime and overnight indoor concentration baselines are evaluated using the steady-state solution:
  $$C_{ss} = \frac{P \cdot a \cdot C_{out} + \frac{S}{V}}{a + k + \frac{\eta \cdot Q_{CADR}}{V}}$$
* **Rationale**: When windows remain shut and purifiers run continuously for >45 minutes, transient decay exponential terms $e^{-(a+k+\frac{Q}{V})t}$ decay to near zero, making $C_{ss}$ a robust and computationally fast indicator of sustained exposure.
* **Transient Mode**: Hourly projections calculate exponential step transitions when external $C_{out}(t)$ fluctuates dynamically.

### 2.3 Particle Penetration Factor ($P$)
* **Assumption**: Envelope penetration factor for PM2.5 is parameterized by building envelope leakiness:
  * Tight (modern sealed double-glazed): $P = 0.60$ (range: 0.40–0.70)
  * Average (standard Indian brick-and-mortar with sliding aluminum windows): $P = 0.80$ (range: 0.60–0.90)
  * Leaky (wooden frames, open louvers, unsealed under-door gaps): $P = 0.95$ (range: 0.80–1.00)
* **Rationale**: Infiltration studies (Stephens & Siegel 2012; Chen & Zhao 2011; EPA IAQ guidelines) demonstrate that sub-micron particles (0.1–1.0 µm) penetrate building envelope cracks with high efficiency due to minimal impaction or gravitational settling in narrow channels.

### 2.4 Air Change Rate ($a$ in ACH / $\text{h}^{-1}$)
* **Assumption**: Natural building infiltration rates when windows are shut:
  * Tight: $a = 0.30 \text{ h}^{-1}$ (range: 0.10–0.50)
  * Average: $a = 0.50 \text{ h}^{-1}$ (range: 0.30–0.80)
  * Leaky: $a = 1.00 \text{ h}^{-1}$ (range: 0.70–1.50)
* **Natural Cross-Ventilation (Windows Open)**:
  * Cracked windows: $3.0\times$ baseline ACH
  * Fully open cross-ventilation: $6.0\times$ baseline ACH ($3.0 \text{ to } 6.0 \text{ h}^{-1}$)
* **Rationale**: ASHRAE Standard 62.2 (2019) and National Building Code of India (NBC 2016).

### 2.5 Surface Deposition Rate ($k$)
* **Assumption**: Natural indoor surface deposition loss rate is set to $k = 0.20 \text{ h}^{-1}$ (range: 0.10–0.40 h⁻¹).
* **Rationale**: For PM2.5 in typical furnished rooms with carpet, upholstery, and wall surfaces, gravitational settling and Brownian diffusion account for approximately 0.15 to 0.25 air volume particle losses per hour (Lai & Nazaroff 2000; Thatcher et al., 2002; Wallace et al., 2004).

### 2.6 Air Purifier CADR Derating & Room Mixing Factor ($\eta$)
* **Assumption**: Manufacturer-rated Clean Air Delivery Rate (CADR in m³/h) is derated by a factor of $\eta = 0.80$ (range: 0.60–0.90) for standard room placement.
* **Rationale**: Purifier ratings (ANSI/AHAM AC-1) are measured in optimal test chambers. In real living spaces with furniture obstructions, corner placement, and non-ideal airflow loops, short-circuiting reduces real-world clean air delivery by 15–25% (Noris et al. 2013; Batterman et al. 2017).

### 2.7 Filter Age Degradation Factor
* **Assumption**: Purifier effective CADR decays over time without filter replacement:
  * < 6 months: $1.00\times$ (100% capacity)
  * 6–12 months: $0.80\times$ (80% capacity)
  * 12–18 months: $0.60\times$ (60% capacity — overdue alert)
  * > 18 months: $0.40\times$ (40% capacity — severely clogged)
* **Rationale**: Particle loading clogs HEPA fiber matrices, increasing flow resistance across centrifugal fans.

---

## 3. Personal Exposure & Vulnerability Model (`exposure.ts`)

### 3.1 Micro-Environmental Time-Activity Weighting
* **Assumption**: Daily integrated inhaled exposure (in µg·h/m³) is evaluated as the sum of micro-environments:
  $$E_{daily} = \sum_{i} C_i \cdot t_i \cdot r_{activity, i} \cdot (1 - \eta_{mask})$$
* **Rationale**: Individuals spend 80–90% of their day indoors, 5–10% in transit, and 5% in outdoor public spaces. Applying pure outdoor monitor readings grossly overestimates personal exposure if indoor filtration is active, or underestimates it if indoor unvented cooking takes place.

### 3.2 Mask Fit & Filtration Efficiencies ($\eta_{mask}$)
* **Assumed Real-World Efficiencies**:
  * No mask: 0%
  * Cloth mask / Bandana: 20% (low: 10%, high: 30%)
  * Surgical mask: 30% (low: 20%, high: 40%)
  * Well-fitted certified N95 / FFP2 / ISI: 70% to 85% real-world fitted (accounting for realistic perimeter seal leakage vs. 95%+ laboratory bench tests)
* **Rationale**: Field intervention trials (Langrish et al. 2012 RCT; Cherrie et al. 2018; Shakya et al. 2017) demonstrate that while raw certified N95 media traps >95% of fine particulates, real-world user fit, facial hair, and talk-slippage yield a practical field effectiveness around 70–85%. Cloth masks suffer severe bypass leakage and low fiber filtration efficiency.

### 3.3 Health Vulnerability Multipliers
* **Assumed Relative Risk Weightings**:
  * Pediatric asthma: 2.00× (GINA 2022 guidelines)
  * Adult COPD / Respiratory: 2.00× (GOLD 2022 guidelines)
  * Cardiovascular disease (seniors): 2.00× (AHA 2020 scientific statement)
  * Children (< 12 years) / Infants: 1.50× (WHO 2021)
  * Pregnancy: 1.50× (WHO 2021)
  * Senior citizens (65+): 1.30× (WHO 2021)
  * Diabetes: 1.20× (Rajagopalan et al. 2018 Circulation)
  * Healthy adults: 1.00×
* **Rationale**: Epidemiological literature (WHO 2021 Global Guidelines) demonstrates heightened relative risk (RR) and hazard ratios for cardiopulmonary mortality and acute asthma exacerbations per 10 µg/m³ PM2.5 increment in these vulnerable subgroups.

---

## 4. Atmospheric Inversion & Ventilation Windows (`windows.ts`)

### 4.1 Planetary Boundary Layer (PBL) Diurnal Cycle
* **Assumption**: During Indo-Gangetic winter smog events (Nov–Jan), surface PM2.5 exhibits an inverse relationship with boundary layer height, consistently dropping to its daily minimum between 12:00 PM and 3:30 PM.
* **Rationale**: Strong surface radiational cooling creates a shallow nocturnal thermal inversion layer (100–200m). Solar insolation by midday breaks the inversion and deepens the convective mixing layer to 600–900m, diluting ground-level particulate concentrations by 35–50%.

### 4.2 Natural Ventilation Threshold Rule
* **Assumption**: Natural window opening is recommended if and only if $C_{out} < C_{in}$ for a contiguous window of at least 30 minutes, or when indoor CO/CO2 thresholds mandate emergency air flushing.
* **Safety Override**: If a profile registers unvented combustion heating (gas, coal, wood), the window finder overrides outdoor smog warnings and enforces mandatory ventilation or electric layer transition.

---

## 5. Give Ledger Emissions Catalog (`emissions.ts`)

### 5.1 Modal Shift Commute Reductions
* **Assumption**: Switching 1 passenger-km from an individual ICE vehicle (petrol/diesel car) to electrified mass transit (Delhi Metro) avoids ~0.045g of tailpipe PM2.5 and 0.40g NOx.
* **Rationale**: Central Electricity Authority (CEA) grid intensity factors combined with DMRC passenger-km benchmarks confirm electrified metro transit generates negligible roadside ground-level emissions within urban residential breathing zones.

### 5.2 Biomass vs. Composting
* **Assumption**: Open horticultural leaf burning releases 5.0g of fine particulate matter per kg burned, whereas community pit composting generates 0.0g combustion aerosols.
* **Rationale**: CPCB emission factors for agricultural and horticultural residue open combustion.

---

## 6. Evidence Grade Disclaimers & Methodology

Saans assigns an explicit Evidence Grade (A through D) to every mitigation action:

* **Grade A (Gold Standard)**: Direct empirical validation via randomized controlled chamber trials, certified standards (e.g., ANSI/AHAM AC-1, NIOSH 42 CFR 84), or verified aerosol physics mass-balance equations. Examples: Sealed HEPA air cleaners, certified N95 respirators.
* **Grade B (Strong Practical Evidence)**: Rigorous observational field studies, published municipal aerosol studies, or controlled source capture measurements. Examples: High-efficiency kitchen exhaust hoods, wet mopping vs. dry broom sweeping.
* **Grade C (Engineering Heuristics)**: General indoor environmental quality best practices with indirect empirical backing. Examples: Door draft snake seals, tape on window gaps.
* **Grade D (Disproven / Ineffective / Hazardous)**: Interventions popular in folklore that fail scientific scrutiny or introduce severe health risks. Examples:
  - *Houseplants for smog removal*: NASA chamber studies utilized sealed, low-volume bell jars; in real homes with normal air infiltration (0.5 ACH), plants remove less than 0.1% of PM2.5.
  - *Uncertified ozone air purifiers*: Produce hazardous tropospheric ozone ($O_3$) that oxidizes lung tissue and exacerbates asthma.
* **Disclaimer**: Evidence grades are author-assigned classifications synthesized from published literature (WHO, EPA, CDC, ICMR). They do not constitute formal medical device authorizations or clinical trial endorsements.

---

## 7. Community Data & Airshed Privacy Assumptions

### 7.1 Seeded Demo Data vs. Live Cloud Infrastructure
* **Assumption**: The default community society (`DELHI-GREEN-01`), its 60 active households, 428 weekly actions, 3.4 kg PM2.5 prevented, and notice boards are pre-seeded synthetic fixtures (`SeedStore`).
* **Rationale**: Allows full zero-configuration offline demonstration and testing. In live production environments, Saans switches seamlessly to the `SupabaseStore` backend adapter when `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided.

### 7.2 Local-First Zero-Telemetry Guarantee
* **Assumption**: All household medical conditions, resident names, child ages, commute patterns, and neighbour care lists are stored strictly in client-side Web Storage (`localStorage`).
* **Rationale**: Health privacy is paramount. Users should never fear that their household vulnerability parameters or neighborhood reporting will be shared with advertising networks or insurance underwriters.

### 7.3 Mandatory Hotspot Privacy Sanitization
* **Assumption**: Community hotspot reports are pre-screened to ensure zero facial identifiers, personal private interiors, or vehicle registration plates are transmitted.
* **Rationale**: Protects community goodwill and prevents vigilantism or privacy violations while maintaining focus on collective airshed stewardship.
