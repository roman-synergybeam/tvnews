import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getUserByEmail, getBrandTurnstile } from '@/lib/store.js';
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth.js';

export const dynamic = 'force-dynamic';

// Verify a Cloudflare Turnstile token against the given secret.
async function verifyTurnstile(secret, token, request) {
  try {
    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);
    const ip = request.headers.get('cf-connecting-ip');
    if (ip) form.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    return !!data?.success;
  } catch {
    return false;
  }
}

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

  // If this brand host has Turnstile configured, require + verify the token
  // before doing any password work.
  const h = await headers();
  const ts = getBrandTurnstile(h.get('host') || '');
  if (ts?.secretKey) {
    const token = String(body?.turnstileToken || '');
    if (!token) {
      return NextResponse.json({ error: 'Please complete the verification.' }, { status: 400 });
    }
    if (!(await verifyTurnstile(ts.secretKey, token, request))) {
      return NextResponse.json({ error: 'Verification failed — please try again.' }, { status: 403 });
    }
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
