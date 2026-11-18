import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import WhatIfPage from '@/app/what-if/page';
import { ProfileProvider } from '@/lib/store/ProfileProvider';

function cleanHtml(html: string): string {
  return html.replace(/<!--.*?-->/g, '');
}

describe('What-If Dynamic Calculation Page Tests', () => {
  it('renders WhatIfPage with dynamically computed scenarios', () => {
    const raw = renderToString(
      <ProfileProvider>
        <WhatIfPage />
      </ProfileProvider>
    );
    const html = cleanHtml(raw);

    // Header and structure
    expect(html).toContain('Scenario Simulator &amp; Tradeoff Sandbox');
    expect(html).toContain('Select Comparison Scenario');

    // Scenarios & presets
    expect(html).toContain('Solo Car vs 🚇 Metro');
    expect(html).toContain('Purifier vs 📦 DIY Box');
    expect(html).toContain('Heater vs 🧤 Layers');
    expect(html).toContain('N95 vs 🧣 Cloth Mask');

    // Receipts and decision matrix
    expect(html).toContain('Side-by-Side Impact Receipts');
    expect(html).toContain('Decision Matrix Summary');
    expect(html).toContain('PM2.5 Exposure Level');
    expect(html).toContain('Airshed Emissions');
    expect(html).toContain('Estimated Direct Cost');
    expect(html).toContain('Cost per µg/m³ Avoided');
  });

  it('renders dynamic cost-effectiveness calculations and receipts', () => {
    const raw = renderToString(
      <ProfileProvider>
        <WhatIfPage />
      </ProfileProvider>
    );
    const html = cleanHtml(raw);

    // Default active scenario is car-vs-metro
    expect(html).toContain('Exceptional Economic &amp; Air Health Win-Win');
    expect(html).toContain('Net Savings');
    expect(html).toContain('Delhi Metro Transit');
    expect(html).toContain('Drive Solo Car');
  });
});
