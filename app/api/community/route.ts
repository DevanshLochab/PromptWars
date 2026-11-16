import { NextRequest, NextResponse } from 'next/server';
import { runActionKit, ActionKitInputSchema } from '@/lib/gemini/flows/actionKit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ActionKitInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid action kit input',
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const result = await runActionKit(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/community route:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate community kit' },
      { status: 500 }
    );
  }
}
