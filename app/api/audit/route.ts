import { NextRequest, NextResponse } from 'next/server';
import { runPhotoAudit, PhotoInput } from '@/lib/gemini/flows/photoAudit';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const photos: PhotoInput[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const files = formData.getAll('images') as File[];

      if (files.length === 0) {
        // Try singular 'image'
        const single = formData.get('image') as File | null;
        if (single) files.push(single);
      }

      if (files.length > 4) {
        return NextResponse.json(
          { error: 'Maximum 4 images allowed per audit request' },
          { status: 400 }
        );
      }

      for (const file of files) {
        // Max 10MB per file
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: `File ${file.name} exceeds maximum 10MB limit` },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        photos.push({
          base64Data,
          mimeType: file.type || 'image/jpeg',
        });
      }
    } else {
      // JSON payload support
      const body = await req.json();
      const rawPhotos: Array<{ base64Data: string; mimeType?: string }> =
        body.photos || body.images || [];

      if (rawPhotos.length > 4) {
        return NextResponse.json(
          { error: 'Maximum 4 images allowed per audit request' },
          { status: 400 }
        );
      }

      for (const p of rawPhotos) {
        photos.push({
          base64Data: p.base64Data,
          mimeType: p.mimeType || 'image/jpeg',
        });
      }
    }

    if (photos.length === 0) {
      return NextResponse.json(
        { error: 'No valid images provided in request' },
        { status: 400 }
      );
    }

    const auditResult = await runPhotoAudit(photos);
    return NextResponse.json(auditResult);
  } catch (error) {
    console.error('Error during photo audit in /api/audit:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Photo audit failed' },
      { status: 500 }
    );
  }
}
