import { NextResponse } from 'next/server';
import { requireSuper } from '@/lib/apiAuth.js';
import { listUsers, createUser, getUserByEmail } from '@/lib/store.js';

export const dynamic = 'force-dynamic';

const ROLES = ['super_admin', 'editor'];

export async function GET() {
  const { error } = await requireSuper();
  if (error) return error;
  return NextResponse.json({ users: listUsers() });
}

export async function POST(request) {
  const { error } = await requireSuper();
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const role = ROLES.includes(body?.role) ? body.role : 'editor';
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  if (getUserByEmail(email)) {
    return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 });
  }
  // Department only applies to editors (super admins always see everything).
  const department = role === 'editor' ? String(body?.department || '').trim() : '';
  const created = createUser({ email, name: String(body?.name || '').trim(), password, role, department });
  return NextResponse.json({ user: created }, { status: 201 });
}
