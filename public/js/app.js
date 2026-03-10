// ── STATE ──────────────────────────────────────────────
let currentUser = null;
let activeDays = new Set([1, 2, 3, 4, 5]);
let mapsLoaded = false;
let fromPAE = null;
let toPAE = null;

// ── TRANSLATIONS ────────────────────────────────────────
const translations = {
  da: {
    // AUTH
    'auth.tagline': 'Din personlige pendler-assistent',
    'auth.tab.login': 'Log ind',
    'auth.tab.register': 'Opret konto',
    'auth.label.name': 'Navn',
    'auth.label.email': 'Email',
    'auth.label.password': 'Password',
    'auth.placeholder.name': 'Dit navn',
    'auth.placeholder.email': 'din@email.dk',
    'auth.placeholder.password': 'Min. 8 tegn',
    'auth.placeholder.password.login': '••••••••',
    'auth.btn.login': 'Log ind',
    'auth.btn.register': 'Opret konto',
    'auth.divider': 'eller',
    'auth.btn.google': 'Fortsæt med Google',
    'auth.error.fill': 'Udfyld alle felter',
    'auth.error.connection': 'Forbindelsesfejl – prøv igen',
    // NAV
    'nav.overview': 'Oversigt',
    'nav.routes': 'Mine ruter',
    'nav.settings': 'Indstillinger',
    'nav.install': 'Installer app',
    'nav.logout': 'Log ud',
    // DASHBOARD
    'dash.title': 'Oversigt',
    'dash.push.title.off': 'Push-notifikationer',
    'dash.push.desc.off': 'Aktiver for at modtage trafikadvarsler',
    'dash.push.btn.enable': 'Aktivér',
    'dash.push.title.on': 'Push-notifikationer aktive',
    'dash.push.desc.on': 'Du modtager advarsler om uheld på dine ruter',
    'dash.push.btn.test': 'Test',
    'dash.push.no.support': 'Push understøttes ikke i denne browser',
    'dash.calendar.title': 'Google Kalender',
    'dash.calendar.desc.off': 'Ikke tilsluttet – Fribane bruger faste tider',
    'dash.calendar.desc.on': 'Tilsluttet – Fribane bruger din kalender',
    'dash.calendar.btn.connect': 'Tilslut',
    'dash.calendar.btn.reconnect': 'Gentilslut',
    'dash.routes.title': 'Dine ruter',
    'dash.routes.empty': 'Ingen ruter endnu – tilføj din første rute',
    'dash.routes.error': 'Kunne ikke hente ruter',
    'dash.btn.add.route': '+ Tilføj rute',
    'dash.btn.test.push': 'Send test-notifikation',
    'dash.hint.test.push': 'Test at push virker på din enhed',
    // ROUTES
    'routes.title': 'Mine ruter',
    'routes.btn.new': '+ Ny rute',
    'routes.empty': 'Du har ingen ruter endnu.',
    'routes.form.title': 'Ny rute',
    'routes.form.name.label': 'Navn på ruten',
    'routes.form.name.placeholder': 'f.eks. Hjem til kontor',
    'routes.form.from.label': 'Fra adresse',
    'routes.form.from.placeholder': 'f.eks. Nørreport Station, København',
    'routes.form.to.label': 'Til adresse',
    'routes.form.to.placeholder': 'f.eks. DTU, Lyngby',
    'routes.schedule.title': 'Hvornår kører du?',
    'routes.sched.calendar': '📅 Brug Google Kalender',
    'routes.sched.calendar.badge': 'Kræver tilslutning',
    'routes.sched.manual': '🕐 Angiv tider selv',
    'routes.sched.always': '🔔 Altid (alle tider)',
    'routes.schedule.morning': 'Morgen',
    'routes.schedule.afternoon': 'Eftermiddag',
    'routes.schedule.days': 'Dage',
    'routes.days.1': 'Ma', 'routes.days.2': 'Ti', 'routes.days.3': 'On',
    'routes.days.4': 'To', 'routes.days.5': 'Fr', 'routes.days.6': 'Lø', 'routes.days.0': 'Sø',
    'routes.btn.save': 'Gem rute',
    'routes.btn.cancel': 'Annuller',
    'routes.btn.delete': 'Slet',
    'routes.btn.deactivate': 'Deaktivér',
    'routes.btn.activate': 'Aktivér',
    'routes.status.active': '● Aktiv',
    'routes.status.inactive': '○ Inaktiv',
    'routes.computing': 'Beregner rute...',
    'routes.computed': 'GPS-punkter gemt',
    'routes.error.name': 'Angiv et navn for ruten',
    'routes.error.from': 'Angiv en fra-adresse',
    'routes.error.to': 'Angiv en til-adresse',
    'routes.error.server': 'Serverfejl – prøv igen',
    'routes.confirm.delete': 'Slet denne rute?',
    // SETTINGS
    'settings.title': 'Indstillinger',
    'settings.section.account': 'Konto',
    'settings.label.email': 'Email',
    'settings.label.calendar': 'Google Kalender',
    'settings.section.notifications': 'Notifikationer',
    'settings.label.push': 'Push-notifikationer',
    'settings.btn.test': 'Send test',
    'settings.push.on': '✅ Aktiveret',
    'settings.push.off': '❌ Ikke aktiveret',
    'settings.calendar.on': '✅ Tilsluttet',
    'settings.calendar.off': '❌ Ikke tilsluttet',
    // PWA MODAL
    'pwa.title': 'Installer Fribane',
    'pwa.intro': 'Få Fribane direkte på din hjemmeskærm – ingen app store nødvendig.',
    'pwa.tab.iphone': 'iPhone',
    'pwa.tab.android': 'Android',
    'pwa.tab.desktop': 'Windows / Mac',
    'pwa.safari.note': 'Skal åbnes i Safari',
    'pwa.chrome.note': 'Skal åbnes i Chrome',
    'pwa.chromeedge.note': 'Kræver Chrome eller Edge',
    'pwa.safari.arrow': 'Tryk her (nederst til højre)',
    // iPhone 5 steps
    'pwa.iphone.1': 'Tryk på <strong>de tre prikker (•••)</strong> nederst til højre i Safari',
    'pwa.iphone.2': 'Tryk på <strong>"Del"</strong> i menuen',
    'pwa.iphone.3': 'Rul ned og tryk på <strong>"Føj til hjemmeskærm"</strong>',
    'pwa.iphone.4': 'Tryk <strong>"Tilføj"</strong> øverst til højre',
    'pwa.iphone.5': 'Åbn appen fra hjemmeskærmen og tryk <strong>"Tillad"</strong> når den beder om tilladelse til notifikationer',
    // Android 3 steps
    'pwa.android.1': 'Tryk på <strong>menuen</strong> øverst til højre (tre prikker)',
    'pwa.android.2': 'Tryk på <strong>"Installer app"</strong> eller <strong>"Føj til startskærm"</strong>',
    'pwa.android.3': 'Bekræft med <strong>"Installer"</strong> – appen vises nu på din startskærm',
    // Desktop 3 steps + tip
    'pwa.desktop.1': 'Se efter <strong>installer-ikonet</strong> i adresselinjen (skærm med pil ned)',
    'pwa.desktop.2': 'Klik på ikonet og vælg <strong>"Installer"</strong>',
    'pwa.desktop.3': 'Fribane åbner nu som en selvstændig app på din computer',
    'pwa.desktop.tip': 'Ser du ikke ikonet? Prøv at genindlæse siden eller brug Chrome-menuen (tre prikker) → Installer Fribane.',
    // MOBILE BANNER
    'banner.title': 'Installer Fribane',
    'banner.sub': 'Tilføj til din hjemmeskærm for hurtig adgang',
    'banner.btn': 'Installer',
    // MISC
    'push.allow.error': 'Du skal tillade notifikationer for at modtage trafikadvarsler',
    'push.not.configured': 'Push er ikke konfigureret på serveren endnu (mangler VAPID nøgler i .env)',
    'push.activate.error': 'Kunne ikke aktivere push – se konsollen for detaljer',
    'push.test.ok': 'Test-notifikation sendt! ✅',
    'push.test.error': 'Kunne ikke sende test',
    'schedule.always': 'Notificerer altid',
    'schedule.smart.cal': '📅 Smart Kalender',
    'sched.mode.manual': 'Manuel',
    'sched.mode.manual.sub': 'Angiv faste køretider selv',
    'sched.mode.calendar.sub': 'Automatisk ud fra din kalender',
    'sched.cal.info': 'fribane.io tjekker hver morgen din kalender og finder automatisk hvornår du skal afsted baseret på dagens møder og deres lokation.',
    'sched.cal.no.calendar': 'Du skal tilslutte Google Kalender for at bruge Smart Kalender.',
    'sched.cal.connect.link': 'Tilslut her →',
    'routes.error.cal.required': 'Tilslut Google Kalender for at bruge Smart Kalender.',
  },
  en: {
    // AUTH
    'auth.tagline': 'Your personal commute assistant',
    'auth.tab.login': 'Log in',
    'auth.tab.register': 'Create account',
    'auth.label.name': 'Name',
    'auth.label.email': 'Email',
    'auth.label.password': 'Password',
    'auth.placeholder.name': 'Your name',
    'auth.placeholder.email': 'your@email.com',
    'auth.placeholder.password': 'Min. 8 characters',
    'auth.placeholder.password.login': '••••••••',
    'auth.btn.login': 'Log in',
    'auth.btn.register': 'Create account',
    'auth.divider': 'or',
    'auth.btn.google': 'Continue with Google',
    'auth.error.fill': 'Please fill in all fields',
    'auth.error.connection': 'Connection error – please try again',
    // NAV
    'nav.overview': 'Overview',
    'nav.routes': 'My routes',
    'nav.settings': 'Settings',
    'nav.install': 'Install app',
    'nav.logout': 'Log out',
    // DASHBOARD
    'dash.title': 'Overview',
    'dash.push.title.off': 'Push notifications',
    'dash.push.desc.off': 'Enable to receive traffic alerts',
    'dash.push.btn.enable': 'Enable',
    'dash.push.title.on': 'Push notifications active',
    'dash.push.desc.on': 'You will receive alerts about incidents on your routes',
    'dash.push.btn.test': 'Test',
    'dash.push.no.support': 'Push is not supported in this browser',
    'dash.calendar.title': 'Google Calendar',
    'dash.calendar.desc.off': 'Not connected – Fribane uses fixed times',
    'dash.calendar.desc.on': 'Connected – Fribane uses your calendar',
    'dash.calendar.btn.connect': 'Connect',
    'dash.calendar.btn.reconnect': 'Reconnect',
    'dash.routes.title': 'Your routes',
    'dash.routes.empty': 'No routes yet – add your first route',
    'dash.routes.error': 'Could not load routes',
    'dash.btn.add.route': '+ Add route',
    'dash.btn.test.push': 'Send test notification',
    'dash.hint.test.push': 'Test that push works on your device',
    // ROUTES
    'routes.title': 'My routes',
    'routes.btn.new': '+ New route',
    'routes.empty': 'You have no routes yet.',
    'routes.form.title': 'New route',
    'routes.form.name.label': 'Route name',
    'routes.form.name.placeholder': 'e.g. Home to office',
    'routes.form.from.label': 'From address',
    'routes.form.from.placeholder': 'e.g. Nørreport Station, Copenhagen',
    'routes.form.to.label': 'To address',
    'routes.form.to.placeholder': 'e.g. DTU, Lyngby',
    'routes.schedule.title': 'When do you drive?',
    'routes.sched.calendar': '📅 Use Google Calendar',
    'routes.sched.calendar.badge': 'Requires connection',
    'routes.sched.manual': '🕐 Set times manually',
    'routes.sched.always': '🔔 Always (all times)',
    'routes.schedule.morning': 'Morning',
    'routes.schedule.afternoon': 'Afternoon',
    'routes.schedule.days': 'Days',
    'routes.days.1': 'Mo', 'routes.days.2': 'Tu', 'routes.days.3': 'We',
    'routes.days.4': 'Th', 'routes.days.5': 'Fr', 'routes.days.6': 'Sa', 'routes.days.0': 'Su',
    'routes.btn.save': 'Save route',
    'routes.btn.cancel': 'Cancel',
    'routes.btn.delete': 'Delete',
    'routes.btn.deactivate': 'Deactivate',
    'routes.btn.activate': 'Activate',
    'routes.status.active': '● Active',
    'routes.status.inactive': '○ Inactive',
    'routes.computing': 'Calculating route...',
    'routes.computed': 'GPS points saved',
    'routes.error.name': 'Please enter a route name',
    'routes.error.from': 'Please enter a from address',
    'routes.error.to': 'Please enter a to address',
    'routes.error.server': 'Server error – please try again',
    'routes.confirm.delete': 'Delete this route?',
    // SETTINGS
    'settings.title': 'Settings',
    'settings.section.account': 'Account',
    'settings.label.email': 'Email',
    'settings.label.calendar': 'Google Calendar',
    'settings.section.notifications': 'Notifications',
    'settings.label.push': 'Push notifications',
    'settings.btn.test': 'Send test',
    'settings.push.on': '✅ Enabled',
    'settings.push.off': '❌ Not enabled',
    'settings.calendar.on': '✅ Connected',
    'settings.calendar.off': '❌ Not connected',
    // PWA MODAL
    'pwa.title': 'Install Fribane',
    'pwa.intro': 'Get Fribane directly on your home screen – no app store needed.',
    'pwa.tab.iphone': 'iPhone',
    'pwa.tab.android': 'Android',
    'pwa.tab.desktop': 'Windows / Mac',
    'pwa.safari.note': 'Must be opened in Safari',
    'pwa.chrome.note': 'Must be opened in Chrome',
    'pwa.chromeedge.note': 'Requires Chrome or Edge',
    'pwa.safari.arrow': 'Tap here (bottom right)',
    // iPhone 5 steps
    'pwa.iphone.1': 'Tap the <strong>three dots (•••)</strong> at the bottom right in Safari',
    'pwa.iphone.2': 'Tap <strong>"Share"</strong> in the menu',
    'pwa.iphone.3': 'Scroll down and tap <strong>"Add to Home Screen"</strong>',
    'pwa.iphone.4': 'Tap <strong>"Add"</strong> in the top right',
    'pwa.iphone.5': 'Open the app from your home screen and tap <strong>"Allow"</strong> when asked for notification permission',
    // Android 3 steps
    'pwa.android.1': 'Tap the <strong>menu</strong> in the top right (three dots)',
    'pwa.android.2': 'Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>',
    'pwa.android.3': 'Confirm with <strong>"Install"</strong> – the app now appears on your home screen',
    // Desktop 3 steps + tip
    'pwa.desktop.1': 'Look for the <strong>install icon</strong> in the address bar (screen with arrow down)',
    'pwa.desktop.2': 'Click the icon and select <strong>"Install"</strong>',
    'pwa.desktop.3': 'Fribane now opens as a standalone app on your computer',
    'pwa.desktop.tip': 'Don\'t see the icon? Try reloading the page or use the Chrome menu (three dots) → Install Fribane.',
    // MOBILE BANNER
    'banner.title': 'Install Fribane',
    'banner.sub': 'Add to your home screen for quick access',
    'banner.btn': 'Install',
    // MISC
    'push.allow.error': 'You must allow notifications to receive traffic alerts',
    'push.not.configured': 'Push is not configured on the server yet (missing VAPID keys in .env)',
    'push.activate.error': 'Could not enable push – see console for details',
    'push.test.ok': 'Test notification sent! ✅',
    'push.test.error': 'Could not send test',
    'schedule.always': 'Always notify',
    'schedule.smart.cal': '📅 Smart Calendar',
    'sched.mode.manual': 'Manual',
    'sched.mode.manual.sub': 'Set fixed departure times yourself',
    'sched.mode.calendar.sub': 'Automatic based on your calendar',
    'sched.cal.info': 'fribane.io checks your calendar every morning and automatically finds when you need to leave based on today\'s meetings and their location.',
    'sched.cal.no.calendar': 'You need to connect Google Calendar to use Smart Calendar.',
    'sched.cal.connect.link': 'Connect here →',
    'routes.error.cal.required': 'Connect Google Calendar to use Smart Calendar.',
  }
};

let currentLang = localStorage.getItem('fribane_lang') || 'da';

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) ||
         (translations['da'] && translations['da'][key]) || key;
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('fribane_lang', lang);

  // Update data-i18n text elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = translations[lang][key];
    if (val !== undefined) el.textContent = val;
  });

  // Update data-i18n-html elements (contain HTML like <strong>)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    const val = translations[lang][key];
    if (val !== undefined) el.innerHTML = val;
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const val = translations[lang][key];
    if (val !== undefined) el.placeholder = val;
  });

  // Update language picker active state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Re-render dynamic sections
  checkPushStatus();
  updateCalendarStatus();
}

function setupLanguagePicker() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });
  // Apply saved language on load
  applyLanguage(currentLang);
}

// ── INIT ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupLanguagePicker();
  await checkAuth();
  setupAuthTabs();
  setupAuthForms();
  setupNavigation();
  setupPwaModal();
  registerServiceWorker();
});

// ── GOOGLE MAPS / PLACES ───────────────────────────────
window.onMapsReady = function() {
  mapsLoaded = true;
};

function initPlacesAutocomplete() {
  if (!mapsLoaded || !window.google?.maps?.places?.PlaceAutocompleteElement) return;
  fromPAE = fromPAE || createPAE('route-from-container', 'route-from', t('routes.form.from.placeholder'));
  toPAE   = toPAE   || createPAE('route-to-container',   'route-to',   t('routes.form.to.placeholder'));
}

function createPAE(containerId, hiddenId, placeholder) {
  const container = document.getElementById(containerId);
  if (!container || container.children.length) return null;

  const pac = new google.maps.places.PlaceAutocompleteElement({
    componentRestrictions: { country: 'dk' },
    placeholder,
  });
  container.appendChild(pac);

  pac.addEventListener('gmp-placeselect', async ({ place }) => {
    await place.fetchFields({ fields: ['formattedAddress'] });
    document.getElementById(hiddenId).value = place.formattedAddress ?? '';
  });

  return pac;
}

// ── AUTH ───────────────────────────────────────────────
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      currentUser = await res.json();
      showApp();
    } else {
      showAuth();
    }
  } catch {
    showAuth();
  }
}

function showAuth() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
}

function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  populateUserInfo();
  loadDashboard();
  showMobileInstallBanner();
}

function showMobileInstallBanner() {
  const isMobile = window.innerWidth <= 700;
  const dismissed = sessionStorage.getItem('installBannerDismissed');
  if (!isMobile || dismissed) return;

  const banner = document.getElementById('mobile-install-banner');
  banner.classList.remove('hidden');

  document.getElementById('mobile-install-open').addEventListener('click', () => {
    banner.classList.add('hidden');
    document.getElementById('pwa-modal').classList.remove('hidden');
  });

  document.getElementById('mobile-install-dismiss').addEventListener('click', () => {
    banner.classList.add('hidden');
    sessionStorage.setItem('installBannerDismissed', '1');
  });
}

function populateUserInfo() {
  if (!currentUser) return;
  document.getElementById('user-name').textContent = currentUser.displayName || currentUser.email;
  document.getElementById('user-avatar').textContent =
    (currentUser.displayName || currentUser.email || '?')[0].toUpperCase();
  document.getElementById('settings-email').textContent = currentUser.email;
  document.getElementById('settings-calendar').textContent =
    currentUser.calendarConnected ? t('settings.calendar.on') : t('settings.calendar.off');
}

function setupAuthTabs() {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById('tab-login').classList.toggle('hidden', target !== 'login');
      document.getElementById('tab-register').classList.toggle('hidden', target !== 'register');
    });
  });
}

function setupAuthForms() {
  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        currentUser = data.user;
        showApp();
      } else {
        showError(errorEl, data.error);
      }
    } catch {
      showError(errorEl, t('auth.error.connection'));
    }
  });

  document.getElementById('register-btn').addEventListener('click', async () => {
    const displayName = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('register-error');

    if (!displayName || !email || !password) {
      showError(errorEl, t('auth.error.fill'));
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = await res.json();

      if (res.ok) {
        currentUser = data.user;
        showApp();
      } else {
        showError(errorEl, data.error);
      }
    } catch {
      showError(errorEl, t('auth.error.connection'));
    }
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUser = null;
    showAuth();
  });
}

// ── NAVIGATION ─────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const view = item.dataset.view;
      showView(view);
    });
  });
}

function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(`view-${viewName}`).classList.remove('hidden');
  if (viewName === 'routes') setupRoutesView();
  if (viewName === 'dashboard') loadDashboard();
}

// ── DASHBOARD ──────────────────────────────────────────
async function loadDashboard() {
  await checkPushStatus();
  updateCalendarStatus();
  await loadRoutesDash();

  document.getElementById('add-route-dash-btn').onclick = () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-view="routes"]').classList.add('active');
    showView('routes');
    setTimeout(() => showRouteForm(), 100);
  };

  document.getElementById('test-push-btn').onclick = sendTestPush;
  document.getElementById('settings-test-push').onclick = sendTestPush;
}

async function loadRoutesDash() {
  const container = document.getElementById('routes-list-dash');
  try {
    const res = await fetch('/api/routes');
    const routes = await res.json();

    if (!routes.length) {
      container.innerHTML = `<p style="color:var(--muted);font-size:.85rem;">${t('dash.routes.empty')}</p>`;
      return;
    }

    container.innerHTML = routes.map(r => `
      <div class="route-item">
        <div>
          <div class="route-item-name">${r.name}</div>
          <div class="route-item-meta route-addresses">${r.fromAddress || ''} → ${r.toAddress || ''}</div>
          <div class="route-item-meta">${getScheduleLabel(r)}</div>
        </div>
        <div class="route-item-actions">
          <span style="color:${r.active ? 'var(--success)' : 'var(--muted)'}">
            ${r.active ? t('routes.status.active') : t('routes.status.inactive')}
          </span>
        </div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = `<p style="color:var(--muted)">${t('dash.routes.error')}</p>`;
  }
}

function getScheduleLabel(route) {
  if (route.scheduleMode === 'calendar') return `${t('schedule.smart.cal')} 🧪`;
  if (!route.manualSchedule) return t('schedule.always');
  const s = route.manualSchedule;
  return `${s.morningFrom}–${s.morningTo} og ${s.afternoonFrom}–${s.afternoonTo}`;
}

function updateCalendarStatus() {
  if (!currentUser) return;
  const desc = document.getElementById('calendar-desc');
  const btn = document.getElementById('calendar-btn');
  const card = document.getElementById('calendar-status-card');

  if (currentUser.calendarConnected) {
    desc.textContent = t('dash.calendar.desc.on');
    btn.textContent = t('dash.calendar.btn.reconnect');
    card.classList.add('active');
  } else {
    desc.textContent = t('dash.calendar.desc.off');
    btn.textContent = t('dash.calendar.btn.connect');
  }
}

// ── PUSH NOTIFICATIONS ─────────────────────────────────
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.error('SW registrering fejlede:', err);
  }
}

async function checkPushStatus() {
  const icon = document.getElementById('push-icon');
  const title = document.getElementById('push-title');
  const desc = document.getElementById('push-desc');
  const btn = document.getElementById('push-toggle-btn');
  const card = document.getElementById('push-status-card');

  if (!('Notification' in window)) {
    desc.textContent = t('dash.push.no.support');
    btn.style.display = 'none';
    return;
  }

  document.getElementById('settings-push').textContent =
    Notification.permission === 'granted' ? t('settings.push.on') : t('settings.push.off');

  if (Notification.permission === 'granted') {
    icon.textContent = '✅';
    title.textContent = t('dash.push.title.on');
    desc.textContent = t('dash.push.desc.on');
    btn.textContent = t('dash.push.btn.test');
    btn.onclick = sendTestPush;
    card.classList.add('active');
  } else {
    title.textContent = t('dash.push.title.off');
    desc.textContent = t('dash.push.desc.off');
    btn.textContent = t('dash.push.btn.enable');
    btn.onclick = enablePush;
  }
}

async function enablePush() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert(t('push.allow.error'));
      return;
    }

    const sw = await navigator.serviceWorker.ready;

    // Hent VAPID public key
    const keyRes = await fetch('/api/push/vapid-public-key');
    const { publicKey } = await keyRes.json();

    if (!publicKey) {
      alert(t('push.not.configured'));
      return;
    }

    const sub = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Gem subscription
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
          auth: arrayBufferToBase64(sub.getKey('auth')),
        },
        userAgent: navigator.userAgent,
      }),
    });

    await checkPushStatus();
  } catch (err) {
    console.error('Push aktivering fejlede:', err);
    alert(t('push.activate.error'));
  }
}

async function sendTestPush() {
  try {
    const res = await fetch('/api/push/test', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) alert('Fejl: ' + data.error);
    else alert(t('push.test.ok'));
  } catch {
    alert(t('push.test.error'));
  }
}

// ── ROUTES ─────────────────────────────────────────────
async function setupRoutesView() {
  const res = await fetch('/api/routes');
  const routes = await res.json();
  renderRoutesList(routes);

  document.getElementById('new-route-btn').onclick = showRouteForm;
  document.getElementById('cancel-route-btn').onclick = hideRouteForm;
  document.getElementById('save-route-btn').onclick = saveRoute;

  // Day toggles
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const day = parseInt(btn.dataset.day);
      if (activeDays.has(day)) {
        activeDays.delete(day);
        btn.classList.remove('active');
      } else {
        activeDays.add(day);
        btn.classList.add('active');
      }
    });
  });

  // Schedule mode picker
  document.querySelectorAll('.sched-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sched-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      document.getElementById('sched-manual-panel').classList.toggle('hidden', mode !== 'manual');
      document.getElementById('sched-calendar-panel').classList.toggle('hidden', mode !== 'calendar');
      const calError = document.getElementById('sched-cal-error');
      if (mode === 'calendar' && !currentUser?.calendarConnected) {
        calError.classList.remove('hidden');
      } else {
        calError.classList.add('hidden');
      }
    });
  });
}

function renderRoutesList(routes) {
  const container = document.getElementById('routes-list');

  if (!routes.length) {
    container.innerHTML = `<p style="color:var(--muted);padding:1rem 0">${t('routes.empty')}</p>`;
    return;
  }

  container.innerHTML = routes.map(r => `
    <div class="route-item">
      <div>
        <div class="route-item-name">${r.name}</div>
        <div class="route-item-meta route-addresses">${r.fromAddress || ''} → ${r.toAddress || ''}</div>
        <div class="route-item-meta">${getScheduleLabel(r)}</div>
      </div>
      <div class="route-item-actions">
        <button class="btn-sm" onclick="deleteRoute('${r._id}')">${t('routes.btn.delete')}</button>
        <button class="btn-sm" onclick="toggleRoute('${r._id}', ${!r.active})">
          ${r.active ? t('routes.btn.deactivate') : t('routes.btn.activate')}
        </button>
      </div>
    </div>
  `).join('');
}

function showRouteForm() {
  document.getElementById('route-form').classList.remove('hidden');
  document.getElementById('new-route-btn').classList.add('hidden');
  document.getElementById('route-from').focus();
  initPlacesAutocomplete();
}

function hideRouteForm() {
  document.getElementById('route-form').classList.add('hidden');
  document.getElementById('new-route-btn').classList.remove('hidden');
  document.getElementById('route-name').value = '';
  document.getElementById('route-from').value = '';
  document.getElementById('route-to').value = '';
  if (fromPAE) fromPAE.value = '';
  if (toPAE)   toPAE.value   = '';
  document.getElementById('route-preview').classList.add('hidden');
  document.getElementById('route-error').classList.add('hidden');
  // Reset schedule mode to manual
  document.querySelectorAll('.sched-mode-btn').forEach(b => b.classList.remove('active'));
  const manualModeBtn = document.querySelector('.sched-mode-btn[data-mode="manual"]');
  if (manualModeBtn) manualModeBtn.classList.add('active');
  document.getElementById('sched-manual-panel')?.classList.remove('hidden');
  document.getElementById('sched-calendar-panel')?.classList.add('hidden');
  document.getElementById('sched-cal-error')?.classList.add('hidden');
}

async function saveRoute() {
  const name = document.getElementById('route-name').value.trim();
  const fromAddress = document.getElementById('route-from').value.trim() || fromPAE?.value?.trim() || '';
  const toAddress   = document.getElementById('route-to').value.trim()   || toPAE?.value?.trim()   || '';
  const errorEl = document.getElementById('route-error');
  const saveBtn = document.getElementById('save-route-btn');
  const preview = document.getElementById('route-preview');
  const previewText = document.getElementById('route-preview-text');
  const schedMode = document.querySelector('.sched-mode-btn.active')?.dataset.mode || 'manual';

  if (!name) { showError(errorEl, t('routes.error.name')); return; }
  if (!fromAddress) { showError(errorEl, t('routes.error.from')); return; }
  if (!toAddress) { showError(errorEl, t('routes.error.to')); return; }
  if (schedMode === 'calendar' && !currentUser?.calendarConnected) {
    showError(errorEl, t('routes.error.cal.required'));
    return;
  }

  let manualSchedule = null;
  if (schedMode === 'manual') {
    manualSchedule = {
      morningFrom: document.getElementById('morning-from').value,
      morningTo: document.getElementById('morning-to').value,
      afternoonFrom: document.getElementById('afternoon-from').value,
      afternoonTo: document.getElementById('afternoon-to').value,
      activeDays: Array.from(activeDays),
    };
  }

  saveBtn.textContent = t('routes.computing');
  saveBtn.disabled = true;
  preview.classList.add('hidden');

  try {
    const res = await fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, fromAddress, toAddress, manualSchedule, scheduleMode: schedMode }),
    });

    const data = await res.json();

    if (res.ok) {
      const newRoute = data.routes[data.routes.length - 1];
      previewText.textContent = `Rute beregnet – ${newRoute.waypoints?.length || 0} ${t('routes.computed')}`;
      preview.classList.remove('hidden');
      setTimeout(() => {
        hideRouteForm();
        renderRoutesList(data.routes);
      }, 1200);
    } else {
      showError(errorEl, data.error);
    }
  } catch {
    showError(errorEl, t('routes.error.server'));
  } finally {
    saveBtn.textContent = t('routes.btn.save');
    saveBtn.disabled = false;
  }
}

async function deleteRoute(routeId) {
  if (!confirm(t('routes.confirm.delete'))) return;
  await fetch(`/api/routes/${routeId}`, { method: 'DELETE' });
  const res = await fetch('/api/routes');
  renderRoutesList(await res.json());
}

async function toggleRoute(routeId, active) {
  await fetch(`/api/routes/${routeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  });
  const res = await fetch('/api/routes');
  renderRoutesList(await res.json());
}

// ── HELPERS ────────────────────────────────────────────
function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return window.btoa(binary);
}

// ── PWA INSTALL MODAL ──────────────────────────────────
function setupPwaModal() {
  const openBtn = document.getElementById('install-pwa-btn');
  const closeBtn = document.getElementById('pwa-close-btn');
  const overlay = document.getElementById('pwa-modal');
  const tabs = document.querySelectorAll('.pwa-tab');
  const platforms = document.querySelectorAll('.pwa-platform');

  openBtn.addEventListener('click', () => {
    overlay.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      platforms.forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
      tab.classList.add('active');
      const target = document.getElementById('platform-' + tab.dataset.platform);
      target.classList.add('active');
      target.classList.remove('hidden');
    });
  });
}
