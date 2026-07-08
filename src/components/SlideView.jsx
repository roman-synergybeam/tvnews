import React from 'react';
import { renderText } from './renderText.jsx';

// Renders a single slide's inner content based on its type.
// Layout classes are defined in globals.css, scoped under .nc-screen.
export default function SlideView({ slide }) {
  const d = slide?.data || {};
  switch (slide?.type) {
    case 'hero':
      return (
        <div className="nc-inner nc-hero">
          <div>
            {d.kicker ? <div className="nc-kicker">{renderText(d.kicker)}</div> : null}
            <h1 className="nc-h1">{renderText(d.title)}</h1>
            {d.body ? <p className="nc-big">{renderText(d.body)}</p> : null}
            {Array.isArray(d.badges) && d.badges.length ? (
              <div className="nc-badge-row">
                {d.badges.map((b, i) => (
                  <div className="nc-badge" key={i}>
                    {renderText(b)}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );

    case 'statement':
      return (
        <div className="nc-inner nc-center">
          {d.kicker ? <div className="nc-kicker">{renderText(d.kicker)}</div> : null}
          <h1 className="nc-h1">{renderText(d.title)}</h1>
          <div className="nc-accent-line" />
          {d.body ? <p className="nc-big nc-big-center">{renderText(d.body)}</p> : null}
        </div>
      );

    case 'cards': {
      const cols = d.columns === 2 ? 2 : 3;
      const cards = Array.isArray(d.cards) ? d.cards : [];
      return (
        <div className="nc-inner">
          {d.kicker ? <div className="nc-kicker">{renderText(d.kicker)}</div> : null}
          {d.heading ? <h2 className="nc-h2">{renderText(d.heading)}</h2> : null}
          {d.body ? <p className="nc-big">{renderText(d.body)}</p> : null}
          <div className={`nc-cards nc-cols-${cols}`}>
            {cards.map((c, i) => (
              <div className="nc-card" key={i}>
                {c.stat ? <div className="nc-card-num">{renderText(c.stat)}</div> : null}
                {c.title ? <h3>{renderText(c.title)}</h3> : null}
                {c.text ? <p>{renderText(c.text)}</p> : null}
              </div>
            ))}
          </div>
          {d.source ? <div className="nc-source">{renderText(d.source)}</div> : null}
        </div>
      );
    }

    case 'checklist': {
      const items = Array.isArray(d.items) ? d.items : [];
      return (
        <div className="nc-inner">
          {d.kicker ? <div className="nc-kicker">{renderText(d.kicker)}</div> : null}
          {d.heading ? <h2 className="nc-h2">{renderText(d.heading)}</h2> : null}
          <div className="nc-list">
            {items.map((it, i) => (
              <div className="nc-item" key={i}>
                <span className="nc-check">✓</span>
                <span>{renderText(it)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'steps': {
      const steps = Array.isArray(d.steps) ? d.steps : [];
      return (
        <div className="nc-inner">
          {d.kicker ? <div className="nc-kicker">{renderText(d.kicker)}</div> : null}
          {d.heading ? <h2 className="nc-h2">{renderText(d.heading)}</h2> : null}
          <div className={`nc-flow-row nc-flow-${Math.min(steps.length || 1, 5)}`}>
            {steps.map((st, i) => (
              <div className="nc-flow" key={i}>
                {st.label ? <span>{renderText(st.label)}</span> : null}
                {st.title ? <b>{renderText(st.title)}</b> : null}
                {st.note ? <p className="nc-sub">{renderText(st.note)}</p> : null}
              </div>
            ))}
          </div>
          {d.banner ? <div className="nc-recommend">{renderText(d.banner)}</div> : null}
        </div>
      );
    }

    case 'pricing': {
      const options = Array.isArray(d.options) ? d.options : [];
      return (
        <div className="nc-inner">
          {d.kicker ? <div className="nc-kicker">{renderText(d.kicker)}</div> : null}
          {d.heading ? <h2 className="nc-h2">{renderText(d.heading)}</h2> : null}
          <div className={`nc-money-grid nc-cols-${Math.min(options.length || 1, 4)}`}>
            {options.map((o, i) => (
              <div className="nc-money" key={i}>
                <div className="nc-amount">{renderText(o.amount)}</div>
                {o.text ? <p>{renderText(o.text)}</p> : null}
              </div>
            ))}
          </div>
          {d.recommend ? <div className="nc-recommend">{renderText(d.recommend)}</div> : null}
          {d.note ? <p className="nc-sub nc-sub-center">{renderText(d.note)}</p> : null}
        </div>
      );
    }

    case 'quotes':
      return (
        <div className="nc-inner nc-quotes">
          <div className="nc-quote-box">
            {d.leftHeading ? <h3>{renderText(d.leftHeading)}</h3> : null}
            {(Array.isArray(d.leftLines) ? d.leftLines : []).map((l, i) => (
              <p key={i}>{renderText(l)}</p>
            ))}
          </div>
          <div className="nc-quote-box nc-avoid">
            {d.rightHeading ? <h3>{renderText(d.rightHeading)}</h3> : null}
            {(Array.isArray(d.rightLines) ? d.rightLines : []).map((l, i) => (
              <p key={i}>{renderText(l)}</p>
            ))}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="nc-inner nc-center">
          {d.kicker ? <div className="nc-kicker">{renderText(d.kicker)}</div> : null}
          <h1 className="nc-h1">{renderText(d.title)}</h1>
          {d.body ? <p className="nc-big nc-big-center">{renderText(d.body)}</p> : null}
          {Array.isArray(d.buttons) && d.buttons.length ? (
            <div className="nc-cta-row">
              {d.buttons.map((b, i) => (
                <div className="nc-cta" key={i}>
                  {renderText(b)}
                </div>
              ))}
            </div>
          ) : null}
          {d.disclaimer ? <div className="nc-disclaimer">{renderText(d.disclaimer)}</div> : null}
        </div>
      );

    case 'image': {
      const layout = d.layout === 'left' || d.layout === 'full' ? d.layout : 'right';
      const textBlock = (
        <div>
          {d.kicker ? <div className="nc-kicker">{renderText(d.kicker)}</div> : null}
          {d.heading ? <h2 className="nc-h2">{renderText(d.heading)}</h2> : null}
          {d.body ? <p className="nc-big">{renderText(d.body)}</p> : null}
        </div>
      );
      const img = d.imageUrl ? (
        <div className="nc-image-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.imageUrl} alt={d.heading || ''} />
        </div>
      ) : (
        <div className="nc-image-card nc-image-empty">No image</div>
      );

      if (layout === 'full') {
        return (
          <div className="nc-inner">
            <div className="nc-full-image">{d.imageUrl ? <img src={d.imageUrl} alt="" /> : null}</div>
            <div className="nc-inner-over">{textBlock}</div>
          </div>
        );
      }
      return (
        <div className={`nc-inner nc-two-col ${layout === 'left' ? 'nc-img-left' : ''}`}>
          {layout === 'left' ? (
            <>
              {img}
              {textBlock}
            </>
          ) : (
            <>
              {textBlock}
              {img}
            </>
          )}
        </div>
      );
    }

    default:
      return (
        <div className="nc-inner nc-center">
          <p className="nc-big">Unsupported slide</p>
        </div>
      );
  }
}
