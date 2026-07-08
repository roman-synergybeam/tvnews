import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth.js';
import { getPage, clonePage, canAccessDepartment } from '@/lib/store.js';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const src = getPage(Number(id));
  if (!src) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canAccessDepartment(user, src.department))
    return NextResponse.json({ error: 'Out of your department scope' }, { status: 403 });
  const page = clonePage(Number(id), user.id);
  return NextResponse.json({ page }, { status: 201 });
}
