import { NextResponse } from 'next/server';

import { requireUserId } from '@/lib/route-auth';
import {
  isR2Configured,
  presignProductImageUpload,
} from '@/lib/r2-server';

// POST /api/uploads/presign
// Body: { productId, index, contentType, sizeBytes }
// Returns: { key, uploadUrl, publicUrl, contentType }
//
// The browser then PUTs the file bytes directly to R2 (uploadUrl). R2
// credentials never leave the server; the signed URL is scoped to exactly
// one object key owned by the caller and expires in 5 minutes.
export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'Image upload is temporarily unavailable.' },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      productId?: unknown;
      index?: unknown;
      contentType?: unknown;
      sizeBytes?: unknown;
    };

    const result = await presignProductImageUpload({
      userId,
      productId: typeof body.productId === 'string' ? body.productId : '',
      index: typeof body.index === 'number' ? body.index : -1,
      contentType:
        typeof body.contentType === 'string' ? body.contentType : '',
      sizeBytes: typeof body.sizeBytes === 'number' ? body.sizeBytes : 0,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Request failed';
    const status =
      message === 'Authentication required' || message === 'Invalid session'
        ? 401
        : message === 'Image upload is temporarily unavailable.' ||
            message === 'R2 storage is not configured' ||
            message === 'Auth service is not configured'
          ? 503
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
