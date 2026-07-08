import { NextResponse } from 'next/server';
import { requireSuper } from '@/lib/apiAuth.js';
import { getBrand, updateBrand, deleteBrand } from '@/lib/store.js';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const { error } = await requireSuper();
  if (error) return error;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const brand = updateBrand(Number(id), {
    name: body?.name,
    hostname: body?.hostname,
    logoUrl: body?.logoUrl,
  });
  if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ brand });
}

export async function DELETE(request, { params }) {
  const { error } = await requireSuper();
  if (error) return error;
  const { id } = await params;
  if (!getBrand(Number(id))) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  deleteBrand(Number(id));
  return NextResponse.json({ ok: true });
}
