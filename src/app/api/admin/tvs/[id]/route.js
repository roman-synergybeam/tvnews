import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth.js';
import { getTv, updateTv, deleteTv, canAccessDepartment, isScoped } from '@/lib/store.js';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const tv = getTv(Number(id));
  if (!tv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canAccessDepartment(user, tv.department))
    return NextResponse.json({ error: 'Out of your department scope' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const patch = {};
  if (body?.name !== undefined) patch.name = String(body.name).trim();
  // Scoped editors cannot move a TV out of their department.
  if (body?.department !== undefined && !isScoped(user)) patch.department = String(body.department).trim();
  if (body?.brandId !== undefined) patch.brandId = body.brandId ? Number(body.brandId) : null;
  const updated = updateTv(Number(id), patch);
  return NextResponse.json({ tv: updated });
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const tv = getTv(Number(id));
  if (!tv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canAccessDepartment(user, tv.department))
    return NextResponse.json({ error: 'Out of your department scope' }, { status: 403 });
  deleteTv(Number(id));
  return NextResponse.json({ ok: true });
}
