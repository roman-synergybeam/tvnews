import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/auth.js';
import { getBrandByHostname } from '@/lib/store.js';
import LoginForm from './LoginForm.jsx';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/admin');
  // Pick the Turnstile site key for the brand this hostname belongs to (if any).
  const h = await headers();
  const brand = getBrandByHostname(h.get('host') || '');
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>
          News <span>Control Center</span>
        </h1>
        <p className="sub">Sign in to manage news pages and TVs.</p>
        <LoginForm turnstileSiteKey={brand?.turnstile_site_key || ''} />
      </div>
    </div>
  );
}
