import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/apiAuth.js';
import { listPages, createPage, departmentFilterFor, isScoped } from '@/lib/store.js';
import { newPageContent } from '@/lib/slideModel.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const url = new URL(request.url);
  const department = departmentFilterFor(user, url.searchParams.get('department') || '');
  const brandId = url.searchParams.get('brandId') ? Number(url.searchParams.get('brandId')) : undefined;
  return NextResponse.json({ pages: listPages({ department, brandId }) });
}

export async function POST(request) {
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const title = String(body?.title || 'Untitled page').trim() || 'Untitled page';
  const content = body?.content || newPageContent();
  // Scoped editors create pages inside their department; others may choose.
  const department = isScoped(user) ? user.department : String(body?.department || '').trim();
  const brandId = body?.brandId ? Number(body.brandId) : null;
  const page = createPage({ title, content, status: body?.status || 'draft', department, brandId, userId: user.id });
  return NextResponse.json({ page }, { status: 201 });
}
