'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Carousel from './Carousel.jsx';

const POLL_MS = 5000;

export default function TvDisplay({ slug, endpoint }) {
  const stateUrl = endpoint || `/api/tv/${encodeURIComponent(slug)}/state`;
  const [state, setState] = useState(null); // { tv, playlist, signature, ... }
  const [status, setStatus] = useState('connecting'); // connecting | ok | notfound | error
  const [index, setIndex] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const hideTimer = useRef(null);
  const sigRef = useRef(null);

  const poll = useCallback(async () => {
    try {
      // Cache-bust every poll: smart-TV built-in browsers (and any edge cache)
      // can serve a stale response, which would hide page edits until a manual
      // reload. A unique query param guarantees a fresh fetch each time.
      const url = `${stateUrl}${stateUrl.includes('?') ? '&' : '?'}_=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
      if (res.status === 404) {
        setStatus('notfound');
        return;
      }
      if (!res.ok) throw new Error('bad status');
      const json = await res.json();
      // If the active playlist changed, restart rotation from the top.
      if (json.signature !== sigRef.current) {
        sigRef.current = json.signature;
        setIndex(0);
      }
      setState(json);
      setStatus('ok');
    } catch {
      setStatus((s) => (s === 'ok' ? 'ok' : 'error'));
    }
  }, [stateUrl]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  const playlist = state?.playlist || [];
  const safeIndex = playlist.length ? index % playlist.length : 0;
  const current = playlist[safeIndex] || null;

  // Rotate to the next page after the current item's dwell time.
  useEffect(() => {
    if (playlist.length <= 1 || !current) return;
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % playlist.length);
    }, Math.max(5, current.dwellSec || 60) * 1000);
    return () => clearTimeout(t);
  }, [playlist.length, safeIndex, current]);

  // Auto-hide the fullscreen affordance after a few idle seconds.
  useEffect(() => {
    const wake = () => {
      setChromeVisible(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setChromeVisible(false), 3000);
    };
    wake();
    window.addEventListener('mousemove', wake);
    window.addEventListener('touchstart', wake);
    return () => {
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('touchstart', wake);
      clearTimeout(hideTimer.current);
    };
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505' }}>
      {current ? (
        <Carousel
          key={`${current.page.id}:${current.page.version}`}
          content={current.page.content}
          logoUrl={state?.tv?.brandLogo || current.page.brandLogo || null}
          interactive
        />
      ) : (
        <WaitingScreen status={status} state={state} slug={slug} />
      )}

      {/* Rotation indicator when more than one page is active */}
      {playlist.length > 1 && chromeVisible ? (
        <div
          style={{
            position: 'fixed',
            left: 16,
            top: 16,
            zIndex: 200,
            background: 'rgba(0,0,0,.5)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,.3)',
            borderRadius: 10,
            padding: '6px 12px',
            fontSize: 13,
            opacity: 0.8,
          }}
        >
          {current?.page.title} · {safeIndex + 1}/{playlist.length}
        </div>
      ) : null}

      <button
        onClick={toggleFullscreen}
        title="Toggle fullscreen"
        style={{
          position: 'fixed',
          right: 16,
          top: 16,
          zIndex: 200,
          background: 'rgba(0,0,0,.5)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,.3)',
          borderRadius: 10,
          padding: '8px 12px',
          opacity: chromeVisible ? 0.8 : 0,
          transition: 'opacity .4s',
          pointerEvents: chromeVisible ? 'auto' : 'none',
        }}
      >
        ⛶
      </button>
    </div>
  );
}

function WaitingScreen({ status, state, slug }) {
  let title = 'Connecting…';
  let sub = 'Fetching this screen’s content.';
  if (status === 'notfound') {
    title = 'Screen not registered';
    sub = `No TV found for "${slug}". Register it in the control center.`;
  } else if (status === 'error') {
    title = 'Reconnecting…';
    sub = 'Lost connection to the control center. Retrying.';
  } else if (state && (!state.playlist || state.playlist.length === 0)) {
    if (state.assignedButUnpublished) {
      title = 'Waiting for publish';
      sub = 'Pages are assigned but not published yet.';
    } else if (state.totalItems > 0) {
      title = state.tv?.name || 'Nothing scheduled now';
      sub = 'Pages are assigned but none are scheduled for the current time.';
    } else {
      title = state.tv?.name || 'No pages assigned';
      sub = 'Assign a page to this TV in the control center.';
    }
  }
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        color: '#cbd3e1',
        background:
          'radial-gradient(circle at 50% 30%, rgba(79,140,255,.15), transparent 40%), #0b0f16',
        padding: 40,
      }}
    >
      <div>
        {state?.tv?.brandLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.tv.brandLogo}
            alt=""
            style={{ height: 64, maxWidth: 360, objectFit: 'contain', marginBottom: 26, display: 'inline-block' }}
          />
        ) : null}
        <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 18, color: '#8b97ab' }}>{sub}</div>
        {state?.tv?.department ? (
          <div style={{ marginTop: 18, fontSize: 14, color: '#5c6678', letterSpacing: 1 }}>
            {state.tv.department.toUpperCase()}
          </div>
        ) : null}
      </div>
    </div>
  );
}
