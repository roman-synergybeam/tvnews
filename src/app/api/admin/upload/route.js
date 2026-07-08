import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { requireUser } from '@/lib/apiAuth.js';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

export async function POST(request) {
  const { error } = await requireUser();
  if (error) return error;

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 6MB)' }, { status: 413 });
  }
  let ext = path.extname(file.name || '').toLowerCase();
  if (!ALLOWED.has(ext)) ext = '.png';

  const name = `${crypto.randomBytes(10).toString('hex')}${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), buf);

  return NextResponse.json({ url: `/uploads/${name}` });
}
