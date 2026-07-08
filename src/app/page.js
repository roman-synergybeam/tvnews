import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/auth.js';
import { getBrandByHostname } from '@/lib/store.js';
import TvDisplay from '@/components/TvDisplay.jsx';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // If this request came in on a brand's public hostname (e.g. news.go4rex.com),
  // the domain root shows that brand's rotating news. Otherwise it's the control
  // center entry point (localhost / the admin host) → admin or login.
  const h = await headers();
  const brand = getBrandByHostname(h.get('host') || '');
  if (brand) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#050505' }}>
        <TvDisplay endpoint="/api/brand/state" />
      </div>
    );
  }

  const user = await getCurrentUser();
  redirect(user ? '/admin' : '/login');
}
