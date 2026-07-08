import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth.js';
import { listUsers, listDepartments } from '@/lib/store.js';
import AdminsManager from './AdminsManager.jsx';

export const dynamic = 'force-dynamic';

export default async function AdminsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'super_admin') redirect('/admin');
  return <AdminsManager initialUsers={listUsers()} meId={user.id} departments={listDepartments()} />;
}
