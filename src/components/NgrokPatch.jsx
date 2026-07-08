'use client';
import { useEffect } from 'react';

// When served through an ngrok free tunnel, ngrok injects an HTML "browser
// warning" interstitial. That HTML can come back to the app's fetch()/RSC
// requests instead of the expected JSON, breaking TV polling and admin actions.
// Sending the `ngrok-skip-browser-warning` header on same-origin requests makes
// ngrok pass them straight through. It's a harmless no-op when not behind ngrok.
export default function NgrokPatch() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.__ncFetchPatched) return;
    window.__ncFetchPatched = true;
    const orig = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
      try {
        const url = typeof input === 'string' ? input : input?.url || '';
        const sameOrigin =
          url.startsWith('/') || url.startsWith(window.location.origin);
        if (sameOrigin) {
          const headers = new Headers(
            init.headers || (typeof input !== 'string' ? input.headers : undefined)
          );
          headers.set('ngrok-skip-browser-warning', 'true');
          init = { ...init, headers };
        }
      } catch {
        /* fall through to original fetch */
      }
      return orig(input, init);
    };
  }, []);
  return null;
}
