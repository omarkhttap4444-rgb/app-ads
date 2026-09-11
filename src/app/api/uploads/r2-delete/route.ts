import { NextResponse } from 'next/server';

import { requireUserId } from '@/lib/route-auth';
import { deleteR2Objects, isR2Configured } from '@/lib/r2-server';

// POST /api/uploads/r2-delete
// Body: { keys: string[] } (R2 object keys, e.g. products/<uid>/<pid>-0.webp)
// Deletes only keys owned by the caller (products/{userId}/...). Best effort:
// reports per-key outcome and never throws for R2-side failures, so product
// deletion must not depend on this succeeding.
export async function POST(request: Request) {
  try {
    const userId = await requireUserId(request);
    if (!isR2Configured()) {
      return NextResponse.json(
        { error: 'Image storage is temporarily unavailable.' },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { keys?: unknown };
    const keys = Array.isArray(body.keys)
      ? body.keys.filter((k): k is string => typeof k === 'string').slice(0, 8)
      : [];
    if (keys.length === 0) {
      return NextResponse.json({ error: 'No object keys provided.' }, { status: 400 });
    }

    const result = await deleteR2Objects(userId, keys);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Request failed';
    const status =
      message === 'Authentication required' || message === 'Invalid session'
        ? 401
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
