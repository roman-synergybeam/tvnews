import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth.js';
import { getTv, getTvPlaylist, setTvPlaylist, getPage, canAccessDepartment, isScoped } from '@/lib/store.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const tv = getTv(Number(id));
  if (!tv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canAccessDepartment(user, tv.department))
    return NextResponse.json({ error: 'Out of your department scope' }, { status: 403 });
  return NextResponse.json({ playlist: getTvPlaylist(tv.id) });
}

export async function PUT(request, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const tv = getTv(Number(id));
  if (!tv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canAccessDepartment(user, tv.department))
    return NextResponse.json({ error: 'Out of your department scope' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body?.items) ? body.items : [];

  // A department-scoped editor may only schedule pages from their department.
  if (isScoped(user)) {
    for (const it of items) {
      const page = getPage(Number(it?.pageId));
      if (page && page.department !== user.department) {
        return NextResponse.json(
          { error: `Page "${page.title}" is outside your department` },
          { status: 403 }
        );
      }
    }
  }

  const playlist = setTvPlaylist(tv.id, items);
  return NextResponse.json({ playlist });
}
