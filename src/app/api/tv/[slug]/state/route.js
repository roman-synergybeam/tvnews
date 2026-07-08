import { NextResponse } from 'next/server';
import { getTvBySlug, getActivePlaylist, touchTv } from '@/lib/store.js';

export const dynamic = 'force-dynamic';

// Public endpoint polled by a TV display. Returns the pages that should be
// showing right now (respecting each item's schedule), in rotation order, plus
// a signature the client uses to detect changes. Also records a heartbeat.
export async function GET(request, { params }) {
  const { slug } = await params;
  const tv = getTvBySlug(slug);
  if (!tv) {
    return NextResponse.json({ error: 'TV not found' }, { status: 404 });
  }
  touchTv(tv.id);

  const { active, totalItems, hasUnpublished } = getActivePlaylist(tv.id);

  // Signature changes whenever the set/order/content/dwell of active pages
  // changes (including when a scheduled window opens or closes).
  const signature = active.map((a) => `${a.page.id}:${a.page.version}:${a.dwellSec}`).join('|');

  return NextResponse.json(
    {
      tv: { name: tv.name, department: tv.department, slug: tv.slug, brandLogo: tv.brand_logo || null },
      playlist: active.map((a) => ({ dwellSec: a.dwellSec, page: a.page })),
      signature,
      // Help the display choose the right holding screen when nothing is active.
      totalItems,
      assignedButUnpublished: active.length === 0 && hasUnpublished,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
