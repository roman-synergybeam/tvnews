import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth.js';
import { getPage } from '@/lib/store.js';
import Carousel from '@/components/Carousel.jsx';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;
  const page = getPage(Number(id));
  if (!page) notFound();
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505' }}>
      <Carousel content={page.content} logoUrl={page.brand_logo || null} interactive />
    </div>
  );
}
