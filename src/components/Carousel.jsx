'use client';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import SlideView from './SlideView.jsx';
import { renderText } from './renderText.jsx';
import { THEMES, DEFAULT_THEME, normalizeContent } from '@/lib/slideModel.js';

// The design is always authored on a 1920×1080 canvas. A page's `format` picks
// the native render resolution: '1080' renders that canvas 1:1; '4k' renders it
// into a native 3840×2160 stage (design scaled 2×) for sharper output on 4K TVs.
const DESIGN_W = 1920;
const DESIGN_H = 1080;

// The News carousel. Renders a page's structured content onto a fixed
// 1920x1080 stage that is scaled to fit whatever container it is placed in
// (fullscreen TV, or a small editor preview).
//
// Props:
//   content        : page content object (raw or normalized)
//   controlledIndex: if a number, forces that slide and disables autoplay
//                    (used by the editor to preview the slide being edited)
//   interactive    : show nav buttons + enable keyboard arrows (TV/manual)
//   logoUrl        : brand logo shown in the top bar (falls back to brand text)
export default function Carousel({ content, controlledIndex = null, interactive = false, logoUrl = null }) {
  const data = useMemo(() => normalizeContent(content), [content]);
  const slides = data.slides;
  const theme = THEMES[data.theme] || THEMES[DEFAULT_THEME];
  const is4k = data.format === '4k';
  const designScale = is4k ? 2 : 1;
  const stageW = DESIGN_W * designScale;
  const stageH = DESIGN_H * designScale;
  const durationMs = Math.max(2000, (data.durationSec || 10) * 1000);
  const controlled = controlledIndex !== null && controlledIndex !== undefined;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [clock, setClock] = useState('');
  const [popup, setPopup] = useState(null);

  const fitRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Keep index in range when slide count changes.
  useEffect(() => {
    setIndex((i) => (i >= slides.length ? 0 : i));
  }, [slides.length]);

  const activeIndex = controlled
    ? Math.max(0, Math.min(controlledIndex, slides.length - 1))
    : index;

  // ---- Fit-to-container scaling -----------------------------------------
  useLayoutEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const compute = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      setScale(Math.min(r.width / stageW, r.height / stageH));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [stageW, stageH]);

  // ---- Clock ------------------------------------------------------------
  useEffect(() => {
    if (!data.showClock) return;
    const tick = () =>
      setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data.showClock]);

  // ---- Autoplay + progress bar -----------------------------------------
  const barRef = useRef(null);
  useEffect(() => {
    if (controlled || !playing || slides.length <= 1) {
      if (barRef.current) barRef.current.style.width = controlled ? '0%' : barRef.current.style.width;
      return;
    }
    let raf;
    const start = performance.now();
    const loop = (now) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      if (barRef.current) barRef.current.style.width = pct + '%';
      if (elapsed >= durationMs) {
        setIndex((i) => (i + 1) % slides.length);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [activeIndex, playing, controlled, durationMs, slides.length]);

  // ---- Popups -----------------------------------------------------------
  useEffect(() => {
    if (controlled || !data.popups.length) return;
    let hideId;
    const show = () => {
      const p = data.popups[Math.floor(Math.random() * data.popups.length)];
      setPopup(p);
      hideId = setTimeout(() => setPopup(null), 4700);
    };
    const first = setTimeout(show, 1500);
    const id = setInterval(show, 16000);
    return () => {
      clearTimeout(first);
      clearTimeout(hideId);
      clearInterval(id);
    };
  }, [controlled, data.popups]);

  // ---- Keyboard (interactive only) --------------------------------------
  useEffect(() => {
    if (!interactive || controlled) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % slides.length);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + slides.length) % slides.length);
      if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interactive, controlled, slides.length]);

  const go = (i) => setIndex(((i % slides.length) + slides.length) % slides.length);

  const tickerText = data.ticker.filter(Boolean);

  return (
    <div className="nc-fit" ref={fitRef}>
      <div
        className="nc-stage"
        style={{ width: stageW, height: stageH, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
      <div
        className="nc-screen"
        style={{ ...theme.vars, transform: `scale(${designScale})` }}
      >
        <div className="nc-noise" />

        {/* Top bar */}
        <div className="nc-topbar">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="nc-logo" src={logoUrl} alt={data.brand || 'Brand'} />
          ) : (
            <div className="nc-brand">{data.brand}</div>
          )}
          <div className="nc-clock">
            {data.eventLabel ? <span className="nc-pill">{data.eventLabel}</span> : null}
            {data.showClock ? <span className="nc-pill">{clock || '--:--'}</span> : null}
          </div>
        </div>

        {/* Popup */}
        {popup ? (
          <div className="nc-popup show">
            {popup.tag ? <div className="nc-popup-tag">{popup.tag}</div> : null}
            {popup.title ? <h3>{renderText(popup.title)}</h3> : null}
            {popup.text ? <p>{renderText(popup.text)}</p> : null}
          </div>
        ) : null}

        {/* Slides */}
        <div className="nc-slides">
          {slides.map((s, i) => (
            <section className={`nc-slide ${i === activeIndex ? 'active' : ''}`} key={s.id || i}>
              <SlideView slide={s} />
            </section>
          ))}
        </div>

        {/* Ticker */}
        {tickerText.length ? (
          <div className="nc-ticker">
            <div className="nc-ticker-track">
              {tickerText.concat(tickerText).map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Bottom nav */}
        <div className="nc-bottom-nav">
          <div className="nc-dots">
            {slides.map((s, i) => (
              <div
                className={`nc-dot ${i === activeIndex ? 'active' : ''}`}
                key={s.id || i}
                onClick={interactive ? () => go(i) : undefined}
              />
            ))}
          </div>
          <div className="nc-progress">
            <div className="nc-bar" ref={barRef} style={controlled ? { width: '0%' } : undefined} />
          </div>
          {interactive ? (
            <div className="nc-controls">
              <button onClick={() => go(activeIndex - 1)}>◀</button>
              <button onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</button>
              <button onClick={() => go(activeIndex + 1)}>▶</button>
            </div>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}
