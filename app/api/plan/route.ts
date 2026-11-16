import { NextRequest, NextResponse } from 'next/server';
import { HouseholdProfileSchema } from '@/lib/schemas';
import { runDailyPlan } from '@/lib/gemini/flows/dailyPlan';
import { generateFallbackPlan } from '@/lib/gemini/fallback';
import { hasGeminiApiKey } from '@/lib/gemini/client';
import { getAirQuality } from '@/lib/data/openMeteo';

// Simple in-memory rate limiter per IP / global
let requestCount = 0;
let lastReset = Date.now();
const MAX_REQUESTS_PER_MIN = 60;

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastReset > 60000) {
    requestCount = 0;
    lastReset = now;
  }
  requestCount++;
  return requestCount <= MAX_REQUESTS_PER_MIN;
}

export async function POST(req: NextRequest) {
  if (!checkRateLimit()) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again shortly.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parseResult = HouseholdProfileSchema.safeParse(body.profile || body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid household profile payload',
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const profile = parseResult.data;
    const isDemoMode =
      process.env.DEMO_MODE === 'true' ||
      process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
      req.headers.get('x-demo-mode') === 'true';

    // Fetch air data
    const airData = await getAirQuality(profile.location.lat, profile.location.lon, !isDemoMode);

    if (isDemoMode || !hasGeminiApiKey()) {
      const plan = generateFallbackPlan(profile, airData || undefined, undefined, profile.language);
      return NextResponse.json(plan);
    }

    const plan = await runDailyPlan(profile, airData || undefined);
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error generating plan in /api/plan:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
