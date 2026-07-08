import { NextResponse } from 'next/server';
import { requireSuper } from '@/lib/apiAuth.js';
import { getUser, updateUser, deleteUser, countSuperAdmins } from '@/lib/store.js';

export const dynamic = 'force-dynamic';

const ROLES = ['super_admin', 'editor'];

export async function PUT(request, { params }) {
  const { user: me, error } = await requireSuper();
  if (error) return error;
  const { id } = await params;
  const targetId = Number(id);
  const target = getUser(targetId);
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const patch = {};
  if (body?.name !== undefined) patch.name = String(body.name).trim();
  if (body?.password) {
    if (String(body.password).length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    patch.password = String(body.password);
  }
  if (body?.role !== undefined) {
    if (!ROLES.includes(body.role))
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    // Don't allow removing the last super admin.
    if (target.role === 'super_admin' && body.role !== 'super_admin' && countSuperAdmins() <= 1) {
      return NextResponse.json({ error: 'Cannot demote the last super admin' }, { status: 400 });
    }
    patch.role = body.role;
  }
  if (body?.department !== undefined) patch.department = String(body.department).trim();
  // A super admin is never department-scoped.
  const effectiveRole = patch.role ?? target.role;
  if (effectiveRole === 'super_admin') patch.department = '';

  const updated = updateUser(targetId, patch);
  return NextResponse.json({ user: updated });
}

export async function DELETE(request, { params }) {
  const { user: me, error } = await requireSuper();
  if (error) return error;
  const { id } = await params;
  const targetId = Number(id);
  const target = getUser(targetId);
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (targetId === me.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }
  if (target.role === 'super_admin' && countSuperAdmins() <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last super admin' }, { status: 400 });
  }
  deleteUser(targetId);
  return NextResponse.json({ ok: true });
}
