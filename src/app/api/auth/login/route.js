import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/store.js';
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const email = String(body?.email || '').trim();
  const password = String(body?.password || '');
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const { token, expires } = createSession(user.id);
  await setSessionCookie(token, expires);
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, department: user.department || '' },
  });
}
