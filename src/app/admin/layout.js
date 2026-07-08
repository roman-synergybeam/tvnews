import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth.js';
import AdminShell from '@/components/AdminShell.jsx';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return <AdminShell user={user}>{children}</AdminShell>;
}
