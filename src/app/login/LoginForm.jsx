'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Login failed');
        setBusy(false);
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Network error');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          autoComplete="username"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error ? <div className="error">{error}</div> : null}
      <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
