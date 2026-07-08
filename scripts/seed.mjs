// Seed script — safe to run multiple times (idempotent on slugs/emails).
//   node scripts/seed.mjs
// Optional env: NC_ADMIN_EMAIL, NC_ADMIN_PASSWORD
import { db } from '../src/lib/db.js';
import {
  getUserByEmail,
  createUser,
  getPageBySlug,
  createPage,
  listTvs,
  createTv,
  setTvPlaylist,
  listBrands,
  createBrand,
  updateBrand,
} from '../src/lib/store.js';
import { makeId } from '../src/lib/slideModel.js';

const ADMIN_EMAIL = (process.env.NC_ADMIN_EMAIL || 'admin@news.local').toLowerCase();
const ADMIN_PASSWORD = process.env.NC_ADMIN_PASSWORD || 'ChangeMe123!';

function s(type, data) {
  return { id: makeId('slide'), type, data };
}

// --- Gold Sales Room, translated from the example into structured slides ---
const goldContent = {
  brand: 'Gold Sales Room',
  eventLabel: 'Nóminas No Agrícolas · Jueves 2 de julio · 8:30 a. m. ET',
  theme: 'gold',
  durationSec: 10,
  showClock: true,
  ticker: [
    'TIP: vende el evento, no solo el activo.',
    'FRASE: la cuenta se prepara antes del dato, no después.',
    'CIERRE: US$2,500 inicial · US$5,000 cómoda · US$10,000+ seria.',
    'EVITA: "ganancia segura", "sube sí o sí", "no hay riesgo".',
    'ORO: activo limitado, observado y sensible a datos macro.',
  ],
  popups: [
    { tag: 'Cash Push', title: 'Activa capital', text: 'US$5,000 da más margen para dividir entradas y manejar volatilidad.' },
    { tag: 'Aprende a vender', title: 'Tú sabes vender', text: 'Lee la info, apóyate en el evento y cierra con opciones claras.' },
    { tag: 'Tip del día', title: 'No vendas promesas', text: 'Vende preparación, estrategia y capacidad de reacción.' },
    { tag: 'Cierre', title: 'Opciones claras', text: 'Entrada inicial, posición cómoda o estrategia seria.' },
  ],
  slides: [
    s('hero', {
      kicker: 'Carrusel interno para agentes',
      title: '*Oro* entra en acción',
      body: 'Email + publicidad + speech + carrusel. Todo apunta a una idea: *preparar la cuenta antes del dato*.',
      badges: ['Aprende a vender', 'Usa el speech', 'Cierra con capital'],
    }),
    s('cards', {
      kicker: 'Splash push',
      heading: '¿Tú sabes *vender oro*?',
      body: 'No vendas "precio". Vende *evento*, vende *momento*, vende *preparación*.',
      columns: 3,
      source: '',
      cards: [
        { stat: '1', title: 'Lee la info', text: 'Conoce el dato, la hora y por qué puede mover el mercado.' },
        { stat: '2', title: 'Apóyate', text: 'Usa los datos del oro, el evento y las imágenes de campaña.' },
        { stat: '3', title: 'Cierra', text: 'No preguntes "¿qué desea hacer?". Ofrece 2,500, 5,000 o 10,000+.' },
      ],
    }),
    s('cards', {
      kicker: 'Evento clave',
      heading: 'Nóminas No Agrícolas',
      body: 'El dato de empleo de EE. UU. puede mover dólar, tasas y oro. La cuenta se prepara *antes* del dato.',
      columns: 3,
      source: 'Fuente operativa: BLS. Publicación jueves 2 de julio, 8:30 a. m. ET.',
      cards: [
        { stat: '', title: 'Antes del dato', text: 'Confirmar capital disponible y nivel de entrada.' },
        { stat: '', title: 'Durante el dato', text: 'Seguir reacción del oro y ejecutar con estrategia.' },
        { stat: '', title: 'Después del dato', text: 'Seguimiento, gestión y siguiente oportunidad.' },
      ],
    }),
    s('checklist', {
      kicker: 'Argumentos de venta',
      heading: '¿Por qué el *oro* importa?',
      items: [
        'Activo refugio en periodos de incertidumbre.',
        'Activo limitado: la oferta minera no se expande de forma agresiva.',
        'Alta atención institucional: bancos centrales e inversión física.',
        'En eventos macro, puede reaccionar con fuerza frente al dólar y tasas.',
      ],
    }),
    s('cards', {
      kicker: 'Datos rápidos para el agente',
      heading: 'Úsalos para hablar con seguridad',
      body: '',
      columns: 3,
      source: 'Fuente: World Gold Council, Gold Demand Trends Q1 2026.',
      cards: [
        { stat: '1,231 t', title: 'Demanda Q1 2026', text: 'Demanda total de oro con crecimiento interanual de 2%.' },
        { stat: '474 t', title: 'Lingotes y monedas', text: 'Inversión física fuerte en el trimestre.' },
        { stat: '244 t', title: 'Bancos centrales', text: 'Compras netas relevantes en Q1 2026.' },
        { stat: 'US$4,873/oz', title: 'Promedio Q1', text: 'Récord trimestral promedio reportado por WGC.' },
        { stat: 'US$5,405/oz', title: 'Máximo histórico', text: 'Máximo reportado en enero 2026 por WGC.' },
        { stat: '+6%', title: 'Retorno Q1', text: 'El precio del oro retornó 6% durante Q1 2026.' },
      ],
    }),
    s('steps', {
      kicker: 'Tipos de venta',
      heading: 'Vende por etapas',
      banner: 'Regla de oro: *no improvisar, preparar.*',
      steps: [
        { label: 'Etapa 1', title: 'Evento', note: '"Mañana tenemos un dato clave."' },
        { label: 'Etapa 2', title: 'Impacto', note: '"Puede mover el oro con fuerza."' },
        { label: 'Etapa 3', title: 'Oportunidad', note: '"La cuenta debe estar preparada hoy."' },
        { label: 'Etapa 4', title: 'Cierre', note: '"¿2,500, 5,000 o 10,000+?"' },
      ],
    }),
    s('pricing', {
      kicker: 'Capital y cierre',
      heading: 'Ofrece opciones, no dudas',
      recommend: 'Recomendación de mesa: *US$5,000*',
      note: 'Cierre sugerido: "¿Prefiere entrada inicial, posición cómoda o estrategia seria?"',
      options: [
        { amount: 'US$2,500', text: 'Entrada inicial. Participación básica y controlada.' },
        { amount: 'US$5,000', text: 'Posición cómoda. Más margen para dividir entradas.' },
        { amount: 'US$10,000+', text: 'Estrategia seria. Mejor gestión y seguimiento.' },
      ],
    }),
    s('quotes', {
      leftHeading: 'Frases rápidas',
      leftLines: [
        '"Mañana tenemos un dato clave."',
        '"El oro está en el centro del mercado."',
        '"La cuenta se prepara hoy, no después."',
        '"US$5,000 le da más margen de maniobra."',
      ],
      rightHeading: 'Evita decir',
      rightLines: [
        '"Ganancia segura."',
        '"Esto sube sí o sí."',
        '"No hay riesgo."',
        '"Usted va a ganar mañana."',
      ],
    }),
    s('cta', {
      kicker: 'Campaña activa',
      title: 'Go4Rex *Gold*',
      body: 'Mensaje central: *El oro se mueve. Prepara tu cuenta hoy.*',
      buttons: ['Entra y prepara tu cuenta', 'Habla con tu asesor'],
      disclaimer: '',
    }),
    s('cta', {
      kicker: 'Cierre operativo',
      title: 'La pantalla debe repetir *una idea*',
      body: 'El cliente no compra "oro". Compra una razón para actuar hoy: *evento + movimiento + preparación + capital definido.*',
      buttons: ['Aprende', 'Vende', 'Cierra'],
      disclaimer:
        'Uso interno. Material educativo/comercial para agentes. Operar CFD y FX implica riesgo y puede no ser adecuado para todos los inversores. No usar promesas de rentabilidad ni garantías de resultado.',
    }),
  ],
};

// A second, plainer sample so departments feel populated.
const welcomeContent = {
  brand: 'Company News',
  eventLabel: 'Weekly update',
  theme: 'sapphire',
  durationSec: 9,
  showClock: true,
  ticker: ['Welcome to the team news channel', 'Submit updates to comms@company'],
  popups: [{ tag: 'Reminder', title: 'All-hands Friday', text: '3:00 PM in the main hall and on Zoom.' }],
  slides: [
    s('hero', {
      kicker: 'This week',
      title: 'Welcome to *Company News*',
      body: 'One place for updates across every department. Managed from the News Control Center.',
      badges: ['Sales', 'Support', 'Engineering'],
    }),
    s('checklist', {
      kicker: 'Highlights',
      heading: "What's new",
      items: ['Q3 targets published', 'New hires onboarding Monday', 'Office closed next Friday'],
    }),
    s('cta', {
      kicker: 'Stay in the loop',
      title: 'Questions? *Ask us*',
      body: 'Reach the comms team any time.',
      buttons: ['#company-news on Slack', 'comms@company'],
      disclaimer: '',
    }),
  ],
};

function main() {
  // 1) Super admin
  let admin = getUserByEmail(ADMIN_EMAIL);
  if (!admin) {
    const created = createUser({
      email: ADMIN_EMAIL,
      name: 'Super Admin',
      password: ADMIN_PASSWORD,
      role: 'super_admin',
    });
    admin = getUserByEmail(ADMIN_EMAIL);
    console.log(`✔ Created super admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    console.log(`• Super admin already exists: ${ADMIN_EMAIL}`);
  }

  // 2) Brands (each serves its screens on its own public hostname + its own logo)
  const brandByName = (n) => listBrands().find((b) => b.name === n);
  let go4rex = brandByName('Go4Rex');
  if (!go4rex) {
    go4rex = createBrand({ name: 'Go4Rex', hostname: 'news.go4rex.com', logoUrl: '/brands/go4rex.png' });
    console.log('✔ Created brand: Go4Rex (news.go4rex.com)');
  }
  let intermagnum = brandByName('Intermagnum');
  if (!intermagnum) {
    intermagnum = createBrand({ name: 'Intermagnum', hostname: 'news.intermagnum.com', logoUrl: '/brands/intermagnum.png' });
    console.log('✔ Created brand: Intermagnum (news.intermagnum.com)');
  }

  // Backfill logos for brands created before logos existed (only if unset).
  const brandLogos = { Go4Rex: '/brands/go4rex.png', Intermagnum: '/brands/intermagnum.png' };
  for (const b of listBrands()) {
    const wanted = brandLogos[b.name];
    if (wanted && !b.logo_url) {
      updateBrand(b.id, { logoUrl: wanted });
      console.log(`✔ Set logo for ${b.name}: ${wanted}`);
    }
  }
  go4rex = brandByName('Go4Rex');
  intermagnum = brandByName('Intermagnum');

  // 3) Pages — Gold belongs to Go4Rex (Sales dept); Company News is shared.
  let goldPage = getPageBySlug('gold-sales-room');
  if (!goldPage) {
    goldPage = createPage({
      title: 'Gold Sales Room',
      content: goldContent,
      status: 'published',
      department: 'Sales',
      brandId: go4rex.id,
      userId: admin.id,
    });
    console.log(`✔ Created page: Gold Sales Room (/${goldPage.slug}) [Go4Rex · Sales]`);
  } else {
    console.log('• Page "Gold Sales Room" already exists');
  }

  let welcomePage = getPageBySlug('company-news');
  if (!welcomePage) {
    welcomePage = createPage({
      title: 'Company News',
      content: welcomeContent,
      status: 'published',
      department: '',
      brandId: null,
      userId: admin.id,
    });
    console.log(`✔ Created page: Company News (/${welcomePage.slug}) [shared]`);
  } else {
    console.log('• Page "Company News" already exists');
  }

  // 4) Sample TVs across both brands — single, rotating, and scheduled playlists.
  if (listTvs().length === 0) {
    const t1 = createTv({ name: 'Sales Floor 1', department: 'Sales', brandId: go4rex.id, pageId: goldPage.id });

    // Go4Rex Sales Floor 2: rotate Gold (60s) then Company News (30s), all day.
    const t2 = createTv({ name: 'Sales Floor 2', department: 'Sales', brandId: go4rex.id });
    setTvPlaylist(t2.id, [
      { pageId: goldPage.id, dwellSec: 60, days: '', startMin: null, endMin: null },
      { pageId: welcomePage.id, dwellSec: 30, days: '', startMin: null, endMin: null },
    ]);

    // Intermagnum Support Lobby: Company News weekday mornings, Gold weekday afternoons.
    const t3 = createTv({ name: 'Support Lobby', department: 'Support', brandId: intermagnum.id });
    setTvPlaylist(t3.id, [
      { pageId: welcomePage.id, dwellSec: 45, days: '1,2,3,4,5', startMin: 8 * 60, endMin: 12 * 60 },
      { pageId: goldPage.id, dwellSec: 45, days: '1,2,3,4,5', startMin: 12 * 60, endMin: 18 * 60 },
    ]);

    const t4 = createTv({ name: 'Kitchen', department: 'Engineering', brandId: intermagnum.id, pageId: welcomePage.id });
    console.log('✔ Created 4 sample TVs across Go4Rex + Intermagnum');
  } else {
    console.log('• TVs already exist, skipping sample TVs');
  }

  // 4) Sample department-scoped editor
  if (!getUserByEmail('sales@news.local')) {
    createUser({
      email: 'sales@news.local',
      name: 'Sales Editor',
      password: 'editor12345',
      role: 'editor',
      department: 'Sales',
    });
    console.log('✔ Created scoped editor: sales@news.local / editor12345 (Sales only)');
  }

  console.log('\nDone. Start the app and log in at /login');
}

main();
db.close();
