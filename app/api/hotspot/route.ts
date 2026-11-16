import { NextRequest, NextResponse } from 'next/server';
import { runHotspotReport, HotspotPhotoInput } from '@/lib/gemini/flows/hotspotReport';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let photo: HotspotPhotoInput | null = null;
    let locationText = '';
    let userNotes = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = (formData.get('photo') || formData.get('image')) as File | null;
      locationText = (formData.get('location') as string) || '';
      userNotes = (formData.get('notes') as string) || '';

      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Photo exceeds maximum 10MB limit' },
            { status: 400 }
          );
        }

        const buffer = await file.arrayBuffer();
        photo = {
          base64Data: Buffer.from(buffer).toString('base64'),
          mimeType: file.type || 'image/jpeg',
        };
      }
    } else {
      const body = await req.json();
      locationText = body.locationText || body.location || '';
      userNotes = body.userNotes || body.notes || '';

      if (body.photo || body.image) {
        const p = body.photo || body.image;
        photo = {
          base64Data: typeof p === 'string' ? p : p.base64Data,
          mimeType: (typeof p === 'object' && p.mimeType) || 'image/jpeg',
        };
      }
    }

    if (!photo) {
      return NextResponse.json(
        { error: 'A photo file or base64 photo is required for hotspot reporting' },
        { status: 400 }
      );
    }

    const result = await runHotspotReport({
      photo,
      locationText,
      userNotes,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/hotspot route:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process hotspot report' },
      { status: 500 }
    );
  }
}
