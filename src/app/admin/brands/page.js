import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth.js';
import { listBrands } from '@/lib/store.js';
import BrandsManager from './BrandsManager.jsx';

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'super_admin') redirect('/admin');
  return <BrandsManager initialBrands={listBrands()} />;
}
