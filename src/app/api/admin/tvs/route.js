import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth.js';
import { listTvs, createTv, departmentFilterFor, isScoped } from '@/lib/store.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const url = new URL(request.url);
  const department = departmentFilterFor(user, url.searchParams.get('department') || '');
  const brandId = url.searchParams.get('brandId') ? Number(url.searchParams.get('brandId')) : undefined;
  return NextResponse.json({ tvs: listTvs({ department, brandId }) });
}

export async function POST(request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  // Scoped editors can only create TVs inside their own department.
  const department = isScoped(user) ? user.department : String(body?.department || '').trim();
  const tv = createTv({
    name,
    department,
    brandId: body?.brandId ? Number(body.brandId) : null,
    pageId: body?.pageId ? Number(body.pageId) : null,
  });
  return NextResponse.json({ tv }, { status: 201 });
}
