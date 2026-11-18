import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AirRing } from '@/components/air/AirRing';
import { DayTimeline } from '@/components/air/DayTimeline';
import { TwoLedger } from '@/components/air/TwoLedger';
import { ImpactReceipt } from '@/components/receipt/ImpactReceipt';
import { AssumptionsDrawer } from '@/components/receipt/AssumptionsDrawer';
import { EvidenceBadge } from '@/components/receipt/EvidenceBadge';
import { MemberTabs } from '@/components/members/MemberTabs';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import { ConfirmChip } from '@/components/common/ConfirmChip';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import demoSnapshot from '@/data/demo_snapshot.json';
import { Receipt, Member } from '@/lib/schemas';

// Helper to strip HTML comments produced by SSR renderToString
function cleanHtml(html: string): string {
  return html.replace(/<!--.*?-->/g, '');
}

describe('UI Components Unit Tests', () => {
  it('renders AirRing with AQI and WHO multiple', () => {
    const raw = renderToString(<AirRing aqi={370} pm25={320} whoMultiple={21.3} />);
    const html = cleanHtml(raw);
    expect(html).toContain('370');
    expect(html).toContain('320 µg/m³');
    expect(html).toContain('×21.3');
    expect(html).toContain('Hazardous');
  });

  it('renders DayTimeline with 24 hours and best windows', () => {
    const timeline = Array.from({ length: 24 }).map((_, h) => ({
      hour: h,
      aqiBand: h >= 13 && h <= 15 ? 'moderate' : 'hazardous',
      tags: h === 13 ? ['Ventilate'] : [],
      advice: 'Test advice for hour ' + h,
    }));
    const html = cleanHtml(
      renderToString(
        <DayTimeline timeline={timeline} bestWindows={[{ start: 13, end: 15 }]} />
      )
    );
    expect(html).toContain('Ventilate Window (1-3 PM)');
    expect(html).toContain('12AM');
    expect(html).toContain('12PM');
  });

  it('renders TwoLedger with Breathe and Give meters', () => {
    const html = cleanHtml(
      renderToString(
        <TwoLedger
          breathe={{ value: 145, who: 9.7, label: 'Indoor personal dose' }}
          give={{ pm25: 64, co2e: 480, label: 'Avoided 64g PM2.5 today' }}
        />
      )
    );
    expect(html).toContain('What you BREATHE');
    expect(html).toContain('What you GIVE');
    expect(html).toContain('145');
    expect(html).toContain('-64g');
  });

  it('renders EvidenceBadge for all grades', () => {
    const htmlA = cleanHtml(renderToString(<EvidenceBadge grade="A" />));
    expect(htmlA).toContain('Grade A');

    const htmlD = cleanHtml(renderToString(<EvidenceBadge grade="D" />));
    expect(htmlD).toContain('Myth (Grade D)');
  });

  it('renders AssumptionsDrawer with scientific details', () => {
    const assumptions = [
      { label: 'Bedroom volume', value: 36, unit: 'm³', source: 'ASHRAE 62.2' },
      { label: 'CADR', value: 250, unit: 'm³/h', source: 'AHAM certified' },
    ];
    const html = cleanHtml(
      renderToString(
        <AssumptionsDrawer assumptions={assumptions} defaultOpen={true} />
      )
    );
    expect(html).toContain('Scientific Assumptions');
    expect(html).toContain('Bedroom volume');
    expect(html).toContain('36 m³');
    expect(html).toContain('ASHRAE 62.2');
  });

  it('renders ImpactReceipt with Breathe and Give rows', () => {
    const receipt: Receipt = {
      id: 'rcpt_test_1',
      actionId: 'purifier_run_high_bedroom_evening',
      memberIds: ['m3'],
      formulaId: 'bedroom_purification',
      breathe: {
        metric: 'pm25_exposure_reduction_pct',
        before: 320,
        after: 42,
        deltaPct: -86.8,
        unit: 'µg/m³',
        low: 35,
        high: 55,
      },
      give: {
        pm25_g: 0,
        co2e_g: 0,
        period: 'nightly',
      },
      cost: { upfront: 0, ongoing: 18, currency: 'INR' },
      effort: 1,
      evidence: 'A',
      confidence: 'high',
      assumptions: [
        { label: 'Room volume', value: '30 m³', source: 'Home model' },
      ],
    };

    const members = demoSnapshot.profile.members as Member[];
    const html = cleanHtml(
      renderToString(<ImpactReceipt receipt={receipt} members={members} />)
    );
    expect(html).toContain('What you BREATHE');
    expect(html).toContain('What you GIVE to the Air');
    expect(html).toContain('320 µg/m³');
    expect(html).toContain('42 µg/m³');
    expect(html).toContain('Aarav (Son)');
    expect(html).toContain('Grade A');
    expect(html).toContain('Mark done');
  });

  it('renders MemberTabs with nicknames and conditions', () => {
    const members = demoSnapshot.profile.members as Member[];
    const html = cleanHtml(
      renderToString(
        <MemberTabs members={members} activeId="m3" onChange={() => {}} />
      )
    );
    expect(html).toContain('Papa (Rajesh)');
    expect(html).toContain('Aarav (Son)');
    expect(html).toContain('Dadaji (Grandfather)');
    expect(html).toContain('🫁');
    expect(html).toContain('❤️');
  });

  it('renders SafetyBanner variants properly', () => {
    const htmlCo = cleanHtml(renderToString(<SafetyBanner type="co_warning" />));
    expect(htmlCo).toContain('Carbon Monoxide Hazard Warning');
    expect(htmlCo).toContain('⚠️');

    const htmlEmergency = cleanHtml(
      renderToString(<SafetyBanner type="breathing_difficulty" />)
    );
    expect(htmlEmergency).toContain('Severe Respiratory Distress Alert');
    expect(htmlEmergency).toContain('112');

    const htmlDisclaimer = cleanHtml(
      renderToString(<SafetyBanner type="not_medical_advice" />)
    );
    expect(htmlDisclaimer).toContain('Not Medical Advice');
  });

  it('renders ConfirmChip in confirmed and unconfirmed states', () => {
    const htmlUnconfirmed = cleanHtml(
      renderToString(
        <ConfirmChip field="Room Area" value="30 m²" isConfirmed={false} />
      )
    );
    expect(htmlUnconfirmed).toContain('Room Area');
    expect(htmlUnconfirmed).toContain('Confirm');

    const htmlConfirmed = cleanHtml(
      renderToString(
        <ConfirmChip field="Room Area" value="30 m²" isConfirmed={true} />
      )
    );
    expect(htmlConfirmed).toContain('(confirmed)');
  });

  it('renders LoadingSkeleton variants', () => {
    const htmlRing = cleanHtml(renderToString(<LoadingSkeleton type="ring" />));
    expect(htmlRing).toContain('Loading air quality gauge');

    const htmlReceipt = cleanHtml(renderToString(<LoadingSkeleton type="receipt" />));
    expect(htmlReceipt).toContain('Loading impact receipt');
  });
});
