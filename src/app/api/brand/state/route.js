import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getBrandByHostname, getActiveBrandPlaylist } from '@/lib/store.js';

export const dynamic = 'force-dynamic';

// Public endpoint polled by a brand's domain-root display. Resolves the brand
// from the request Host header and returns its active rotation (published brand
// pages + company-wide shared pages). Same JSON shape as the per-TV state so the
// display component can be reused.
export async function GET() {
  const h = await headers();
  const host = h.get('host') || '';
  const brand = getBrandByHostname(host);
  if (!brand) {
    return NextResponse.json({ error: 'No brand for this host' }, { status: 404 });
  }

  const { active, totalItems, hasUnpublished } = getActiveBrandPlaylist(brand.id);
  const signature = active.map((a) => `${a.page.id}:${a.page.version}:${a.dwellSec}`).join('|');

  return NextResponse.json(
    {
      tv: { name: brand.name, department: '', slug: brand.slug, brandLogo: brand.logo_url || null },
      playlist: active.map((a) => ({ dwellSec: a.dwellSec, page: a.page })),
      signature,
      totalItems,
      assignedButUnpublished: active.length === 0 && hasUnpublished,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
