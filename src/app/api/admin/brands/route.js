import { NextResponse } from 'next/server';
import { requireUser, requireSuper } from '@/lib/apiAuth.js';
import { listBrands, createBrand } from '@/lib/store.js';

export const dynamic = 'force-dynamic';

// Any signed-in admin can read the brand list (needed for pickers/filters).
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  return NextResponse.json({ brands: listBrands() });
}

// Only super admins can create brands.
export async function POST(request) {
  const { error } = await requireSuper();
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const brand = createBrand({
    name,
    hostname: String(body?.hostname || ''),
    logoUrl: String(body?.logoUrl || ''),
  });
  return NextResponse.json({ brand }, { status: 201 });
}
