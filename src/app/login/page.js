import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth.js';
import LoginForm from './LoginForm.jsx';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/admin');
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>
          News <span>Control Center</span>
        </h1>
        <p className="sub">Sign in to manage news pages and TVs.</p>
        <LoginForm />
      </div>
    </div>
  );
}
