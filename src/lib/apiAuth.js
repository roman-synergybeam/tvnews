import { NextResponse } from 'next/server';
import { getCurrentUser, isSuperAdmin } from './auth.js';

// Returns { user } when authenticated, or { error: Response } to return directly.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return { user };
}

export async function requireSuper() {
  const { user, error } = await requireUser();
  if (error) return { error };
  if (!isSuperAdmin(user))
    return { error: NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 }) };
  return { user };
}
