'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ turnstileSiteKey = '' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState('');
  const widgetRef = useRef(null);
  const widgetId = useRef(null);

  // Load + render the Turnstile widget (explicit render) when a site key is present.
  useEffect(() => {
    if (!turnstileSiteKey) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !window.turnstile || !widgetRef.current || widgetId.current !== null) return;
      widgetId.current = window.turnstile.render(widgetRef.current, {
        sitekey: turnstileSiteKey,
        callback: (t) => setToken(t),
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
    };
    if (window.turnstile) {
      render();
    } else if (!document.querySelector('script[data-turnstile]')) {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.setAttribute('data-turnstile', '1');
      s.onload = render;
      document.head.appendChild(s);
    } else {
      document.querySelector('script[data-turnstile]').addEventListener('load', render);
    }
    return () => {
      cancelled = true;
    };
  }, [turnstileSiteKey]);

  function resetWidget() {
    setToken('');
    if (window.turnstile && widgetId.current !== null) window.turnstile.reset(widgetId.current);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (turnstileSiteKey && !token) {
      setError('Please complete the verification.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken: token }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Login failed');
        setBusy(false);
        resetWidget();
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Network error');
      setBusy(false);
      resetWidget();
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
      {turnstileSiteKey ? <div ref={widgetRef} style={{ margin: '4px 0 14px' }} /> : null}
      {error ? <div className="error">{error}</div> : null}
      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        disabled={busy || (!!turnstileSiteKey && !token)}
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
