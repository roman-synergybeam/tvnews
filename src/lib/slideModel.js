// Shared data model for pages, slides and themes.
// Used by BOTH the admin slide-builder editor and the TV carousel renderer,
// so there is a single source of truth for structure and defaults.

// ---------------------------------------------------------------------------
// Themes: each maps to a set of CSS custom properties consumed by the carousel.
// ---------------------------------------------------------------------------
export const THEMES = {
  gold: {
    label: 'Gold — Luxury',
    vars: {
      '--nc-bg': '#070806',
      '--nc-grad':
        'radial-gradient(circle at 78% 15%, rgba(215,166,62,.18), transparent 32%), radial-gradient(circle at 18% 80%, rgba(23,78,59,.30), transparent 36%), linear-gradient(135deg, #050604 0%, #0b1712 46%, #090704 100%)',
      '--nc-accent': '#d7a63e',
      '--nc-accent2': '#f5d986',
      '--nc-deep': '#0f3c2e',
      '--nc-deep2': '#174e3b',
      '--nc-cream': '#f7f1e5',
      '--nc-white': '#fffaf0',
      '--nc-muted': '#bfb7a5',
      '--nc-line': 'rgba(215,166,62,.45)',
    },
  },
  emerald: {
    label: 'Emerald',
    vars: {
      '--nc-bg': '#05100b',
      '--nc-grad':
        'radial-gradient(circle at 80% 12%, rgba(52,211,153,.18), transparent 34%), radial-gradient(circle at 15% 82%, rgba(16,88,64,.34), transparent 38%), linear-gradient(135deg, #04100a 0%, #072019 48%, #04120c 100%)',
      '--nc-accent': '#34d399',
      '--nc-accent2': '#a7f3d0',
      '--nc-deep': '#0b3b2c',
      '--nc-deep2': '#125b44',
      '--nc-cream': '#eafaf2',
      '--nc-white': '#f5fffb',
      '--nc-muted': '#9fc3b4',
      '--nc-line': 'rgba(52,211,153,.42)',
    },
  },
  sapphire: {
    label: 'Sapphire',
    vars: {
      '--nc-bg': '#05080f',
      '--nc-grad':
        'radial-gradient(circle at 78% 14%, rgba(96,165,250,.20), transparent 34%), radial-gradient(circle at 16% 84%, rgba(30,58,138,.36), transparent 40%), linear-gradient(135deg, #04070f 0%, #0a1430 48%, #05080f 100%)',
      '--nc-accent': '#60a5fa',
      '--nc-accent2': '#bfdbfe',
      '--nc-deep': '#152a5e',
      '--nc-deep2': '#1e3a8a',
      '--nc-cream': '#eaf1ff',
      '--nc-white': '#f6faff',
      '--nc-muted': '#9fb2d6',
      '--nc-line': 'rgba(96,165,250,.42)',
    },
  },
  crimson: {
    label: 'Crimson',
    vars: {
      '--nc-bg': '#0d0505',
      '--nc-grad':
        'radial-gradient(circle at 80% 14%, rgba(248,113,113,.20), transparent 34%), radial-gradient(circle at 15% 82%, rgba(127,29,29,.36), transparent 40%), linear-gradient(135deg, #0e0605 0%, #2a0d0d 48%, #0e0605 100%)',
      '--nc-accent': '#f87171',
      '--nc-accent2': '#fecaca',
      '--nc-deep': '#5b1717',
      '--nc-deep2': '#7f1d1d',
      '--nc-cream': '#fdeeee',
      '--nc-white': '#fff7f7',
      '--nc-muted': '#d6a5a5',
      '--nc-line': 'rgba(248,113,113,.42)',
    },
  },
  slate: {
    label: 'Slate — Corporate',
    vars: {
      '--nc-bg': '#0a0e14',
      '--nc-grad':
        'radial-gradient(circle at 80% 14%, rgba(148,163,184,.16), transparent 34%), radial-gradient(circle at 15% 82%, rgba(51,65,85,.34), transparent 40%), linear-gradient(135deg, #090d13 0%, #141b26 48%, #090d13 100%)',
      '--nc-accent': '#38bdf8',
      '--nc-accent2': '#bae6fd',
      '--nc-deep': '#1e293b',
      '--nc-deep2': '#334155',
      '--nc-cream': '#eef2f7',
      '--nc-white': '#f8fafc',
      '--nc-muted': '#94a3b8',
      '--nc-line': 'rgba(148,163,184,.40)',
    },
  },
};

export const THEME_KEYS = Object.keys(THEMES);
export const DEFAULT_THEME = 'gold';

// ---------------------------------------------------------------------------
// Slide types. Each entry defines a label, an icon, default data, and a
// `fields` descriptor the editor uses to auto-generate its form.
//
// Field types: text | textarea | list | number | select | image | objlist
//   - list    : array of strings
//   - objlist : array of objects, described by `item` (array of field defs)
//
// Tip shown to editors: wrap text in *asterisks* to highlight it in the
// theme's accent color, e.g. "*Gold* enters the game".
// ---------------------------------------------------------------------------
export const SLIDE_TYPES = {
  hero: {
    label: 'Hero',
    icon: '★',
    hint: 'Big opening statement with badges.',
    defaults: {
      kicker: 'Internal briefing',
      title: '*Gold* enters the game',
      body: 'One idea, repeated: prepare the account *before* the data drops.',
      badges: ['Learn to sell', 'Use the script', 'Close with capital'],
    },
    fields: [
      { key: 'kicker', label: 'Kicker (small label)', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'badges', label: 'Badges', type: 'list' },
    ],
  },

  statement: {
    label: 'Statement',
    icon: '“',
    hint: 'Centered big statement with a divider line.',
    defaults: {
      kicker: 'Splash',
      title: 'Do you know how to *sell*?',
      body: "Don't sell price. Sell the *event*, the *moment*, the *preparation*.",
    },
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
    ],
  },

  cards: {
    label: 'Cards / Stats',
    icon: '▦',
    hint: 'Grid of cards, optionally with a big number/stat.',
    defaults: {
      kicker: 'Quick facts',
      heading: 'Use them to speak with confidence',
      body: '',
      columns: 3,
      source: '',
      cards: [
        { stat: '1', title: 'Read the info', text: 'Know the data, the time, and why it matters.' },
        { stat: '2', title: 'Lean on it', text: 'Use the event, the numbers and the campaign.' },
        { stat: '3', title: 'Close', text: "Offer options, don't ask open questions." },
      ],
    },
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'body', label: 'Intro body (optional)', type: 'textarea' },
      { key: 'columns', label: 'Columns', type: 'select', options: [2, 3] },
      {
        key: 'cards',
        label: 'Cards',
        type: 'objlist',
        item: [
          { key: 'stat', label: 'Number / stat (optional)', type: 'text' },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ],
      },
      { key: 'source', label: 'Source line (optional)', type: 'text' },
    ],
  },

  checklist: {
    label: 'Checklist',
    icon: '✓',
    hint: 'Heading with a list of checkmarked points.',
    defaults: {
      kicker: 'Selling points',
      heading: 'Why does it matter?',
      items: [
        'A safe-haven asset in uncertain times.',
        'Limited supply: mining output does not expand aggressively.',
        'Strong institutional attention.',
        'Reacts sharply around macro events.',
      ],
    },
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'items', label: 'Checklist items', type: 'list' },
    ],
  },

  steps: {
    label: 'Steps / Flow',
    icon: '→',
    hint: 'Ordered horizontal steps with an optional banner.',
    defaults: {
      kicker: 'Sell in stages',
      heading: 'Sell by stages',
      banner: 'Golden rule: *do not improvise, prepare.*',
      steps: [
        { label: 'Stage 1', title: 'Event', note: '"Tomorrow we have key data."' },
        { label: 'Stage 2', title: 'Impact', note: '"It can move the market."' },
        { label: 'Stage 3', title: 'Opportunity', note: '"The account must be ready today."' },
        { label: 'Stage 4', title: 'Close', note: '"2,500, 5,000 or 10,000+?"' },
      ],
    },
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      {
        key: 'steps',
        label: 'Steps',
        type: 'objlist',
        item: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'note', label: 'Note', type: 'text' },
        ],
      },
      { key: 'banner', label: 'Banner (optional)', type: 'text' },
    ],
  },

  pricing: {
    label: 'Pricing / Options',
    icon: '$',
    hint: 'Option cards with amounts and a recommendation banner.',
    defaults: {
      kicker: 'Capital & close',
      heading: 'Offer options, not doubts',
      recommend: 'Desk recommendation: *US$5,000*',
      note: 'Suggested close: "Starter, comfortable, or serious strategy?"',
      options: [
        { amount: 'US$2,500', text: 'Starter entry. Basic, controlled participation.' },
        { amount: 'US$5,000', text: 'Comfortable position. More room to split entries.' },
        { amount: 'US$10,000+', text: 'Serious strategy. Better management and follow-up.' },
      ],
    },
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      {
        key: 'options',
        label: 'Options',
        type: 'objlist',
        item: [
          { key: 'amount', label: 'Amount / headline', type: 'text' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ],
      },
      { key: 'recommend', label: 'Recommendation banner (optional)', type: 'text' },
      { key: 'note', label: 'Footnote (optional)', type: 'text' },
    ],
  },

  quotes: {
    label: 'Do / Don\'t',
    icon: '⇄',
    hint: 'Two columns — e.g. phrases to say vs. avoid.',
    defaults: {
      leftHeading: 'Quick phrases',
      leftLines: [
        '"Tomorrow we have key data."',
        '"Gold is at the center of the market."',
        '"The account is prepared today, not later."',
      ],
      rightHeading: 'Avoid saying',
      rightLines: ['"Guaranteed profit."', '"This only goes up."', '"There is no risk."'],
    },
    fields: [
      { key: 'leftHeading', label: 'Left heading', type: 'text' },
      { key: 'leftLines', label: 'Left lines', type: 'list' },
      { key: 'rightHeading', label: 'Right heading', type: 'text' },
      { key: 'rightLines', label: 'Right lines', type: 'list' },
    ],
  },

  cta: {
    label: 'Call to action',
    icon: '◈',
    hint: 'Title, body and highlighted action buttons.',
    defaults: {
      kicker: 'Active campaign',
      title: 'Go4Rex *Gold*',
      body: 'Core message: *Gold is moving. Prepare your account today.*',
      buttons: ['Open and prepare your account', 'Talk to your advisor'],
      disclaimer: '',
    },
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'buttons', label: 'Buttons', type: 'list' },
      { key: 'disclaimer', label: 'Disclaimer (optional)', type: 'textarea' },
    ],
  },

  image: {
    label: 'Image + Text',
    icon: '🖼',
    hint: 'Image alongside a headline and body. Paste an image URL.',
    defaults: {
      kicker: 'Campaign',
      heading: 'A picture that sells',
      body: 'Pair the message with a strong visual.',
      imageUrl: '',
      layout: 'right',
    },
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'imageUrl', label: 'Image', type: 'image' },
      { key: 'layout', label: 'Image position', type: 'select', options: ['right', 'left', 'full'] },
    ],
  },
};

export const SLIDE_TYPE_KEYS = Object.keys(SLIDE_TYPES);

// Generate a reasonably-unique id without external deps.
export function makeId(prefix = 'id') {
  const rnd = Math.floor(Math.random() * 1e9).toString(36);
  return `${prefix}_${rnd}${(typeof performance !== 'undefined' ? Math.floor(performance.now()) : 0).toString(36)}`;
}

// Build a fresh slide of a given type with its default data.
export function makeSlide(type) {
  const def = SLIDE_TYPES[type];
  if (!def) throw new Error(`Unknown slide type: ${type}`);
  return { id: makeId('slide'), type, data: structuredCloneSafe(def.defaults) };
}

function structuredCloneSafe(v) {
  return JSON.parse(JSON.stringify(v));
}

// A blank page content document.
export function newPageContent() {
  return {
    brand: 'News Channel',
    eventLabel: '',
    theme: DEFAULT_THEME,
    durationSec: 10,
    showClock: true,
    ticker: [],
    popups: [],
    slides: [makeSlide('hero')],
  };
}

// Coerce/repair a stored content object so the renderer never crashes on
// missing fields (older pages, partial data, etc.).
export function normalizeContent(raw) {
  const base = newPageContent();
  const c = raw && typeof raw === 'object' ? raw : {};
  return {
    brand: typeof c.brand === 'string' ? c.brand : base.brand,
    eventLabel: typeof c.eventLabel === 'string' ? c.eventLabel : '',
    theme: THEMES[c.theme] ? c.theme : DEFAULT_THEME,
    durationSec: Number.isFinite(c.durationSec) && c.durationSec > 1 ? c.durationSec : 10,
    showClock: c.showClock !== false,
    ticker: Array.isArray(c.ticker) ? c.ticker.filter((t) => typeof t === 'string') : [],
    popups: Array.isArray(c.popups)
      ? c.popups
          .filter((p) => p && typeof p === 'object')
          .map((p) => ({
            tag: String(p.tag || ''),
            title: String(p.title || ''),
            text: String(p.text || ''),
          }))
      : [],
    slides:
      Array.isArray(c.slides) && c.slides.length
        ? c.slides
            .filter((s) => s && SLIDE_TYPES[s.type])
            .map((s) => ({
              id: s.id || makeId('slide'),
              type: s.type,
              data: s.data && typeof s.data === 'object' ? s.data : {},
            }))
        : base.slides,
  };
}
