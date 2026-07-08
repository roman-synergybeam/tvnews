import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db.js';

export { hashPassword, verifyPassword } from './password.js';

export const SESSION_COOKIE = 'nc_session';
const SESSION_DAYS = 30;

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const created = new Date();
  const expires = new Date(created.getTime() + SESSION_DAYS * 864e5);
  db.prepare(
    'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).run(token, userId, created.toISOString(), expires.toISOString());
  return { token, expires };
}

export function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function userFromToken(token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.department, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token);
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    destroySession(token);
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role, department: row.department || '' };
}

// Read the currently-authenticated user from the request cookies (server-side).
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return userFromToken(token);
}

// Attach the session cookie (call from a route handler / server action).
export async function setSessionCookie(token, expires) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Served over plain HTTP on a LAN by default, so don't force Secure (browsers
    // drop Secure cookies over HTTP). Set NC_SECURE_COOKIES=true when behind HTTPS.
    secure: process.env.NC_SECURE_COOKIES === 'true',
    path: '/',
    expires,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export function isSuperAdmin(user) {
  return user?.role === 'super_admin';
}
