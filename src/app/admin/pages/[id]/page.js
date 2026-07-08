import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth.js';
import { getPage, listDepartments, listBrands, canAccessDepartment, isScoped } from '@/lib/store.js';
import PageEditor from './PageEditor.jsx';

export const dynamic = 'force-dynamic';

export default async function EditorPage({ params }) {
  const user = await getCurrentUser();
  const { id } = await params;
  const page = getPage(Number(id));
  if (!page) notFound();
  if (!canAccessDepartment(user, page.department)) redirect('/admin/pages');
  return (
    <PageEditor
      initialPage={page}
      departments={listDepartments()}
      brands={listBrands().map((b) => ({ id: b.id, name: b.name, logo_url: b.logo_url }))}
      scoped={isScoped(user)}
      myDepartment={user.department || ''}
    />
  );
}
