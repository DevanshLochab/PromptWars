import { NextRequest, NextResponse } from 'next/server';
import { runAskMythCheck } from '@/lib/gemini/flows/askMythCheck';
import { HouseholdProfileSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = body.question;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }

    let profile = undefined;
    if (body.profile) {
      const parsed = HouseholdProfileSchema.safeParse(body.profile);
      if (parsed.success) {
        profile = parsed.data;
      }
    }

    const language = body.language || profile?.language || 'en';

    const result = await runAskMythCheck({
      question: question.trim(),
      profile,
      language,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/ask route:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to answer question' },
      { status: 500 }
    );
  }
}
