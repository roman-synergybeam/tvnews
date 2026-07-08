import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth.js';
import { getPage, updatePage, deletePage, canAccessDepartment, isScoped } from '@/lib/store.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const page = getPage(Number(id));
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canAccessDepartment(user, page.department))
    return NextResponse.json({ error: 'Out of your department scope' }, { status: 403 });
  return NextResponse.json({ page });
}

export async function PUT(request, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const existing = getPage(Number(id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canAccessDepartment(user, existing.department))
    return NextResponse.json({ error: 'Out of your department scope' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const patch = { title: body?.title, content: body?.content, status: body?.status };
  // Only non-scoped users may reassign a page's department.
  if (body?.department !== undefined && !isScoped(user)) patch.department = body.department;
  if (body?.brandId !== undefined) patch.brandId = body.brandId ? Number(body.brandId) : null;
  const page = updatePage(Number(id), patch);
  return NextResponse.json({ page });
}

export async function DELETE(request, { params }) {
  const { user, error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  const existing = getPage(Number(id));
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canAccessDepartment(user, existing.department))
    return NextResponse.json({ error: 'Out of your department scope' }, { status: 403 });
  deletePage(Number(id));
  return NextResponse.json({ ok: true });
}
