// ── STATE ──────────────────────────────────────────────
let currentUser = null;
let routeMap = null;
let routeRect = null;
let routeBounds = null;
let activeDays = new Set([1, 2, 3, 4, 5]);

// ── INIT ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  setupAuthTabs();
  setupAuthForms();
  setupNavigation();
  registerServiceWorker();
});

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
}

function populateUserInfo() {
  if (!currentUser) return;
  document.getElementById('user-name').textContent = currentUser.displayName || currentUser.email;
  document.getElementById('user-avatar').textContent =
    (currentUser.displayName || currentUser.email || '?')[0].toUpperCase();
  document.getElementById('settings-email').textContent = currentUser.email;
  document.getElementById('settings-calendar').textContent =
    currentUser.calendarConnected ? '✅ Tilsluttet' : '❌ Ikke tilsluttet';
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
      showError(errorEl, 'Forbindelsesfejl – prøv igen');
    }
  });

  document.getElementById('register-btn').addEventListener('click', async () => {
    const displayName = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('register-error');

    if (!displayName || !email || !password) {
      showError(errorEl, 'Udfyld alle felter');
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
      showError(errorEl, 'Forbindelsesfejl – prøv igen');
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
      container.innerHTML = '<p style="color:var(--muted);font-size:.85rem;">Ingen ruter endnu – tilføj din første rute</p>';
      return;
    }

    container.innerHTML = routes.map(r => `
      <div class="route-item">
        <div>
          <div class="route-item-name">${r.name}</div>
          <div class="route-item-meta">${getScheduleLabel(r)}</div>
        </div>
        <div class="route-item-actions">
          <span style="color:${r.active ? 'var(--success)' : 'var(--muted)'}">
            ${r.active ? '● Aktiv' : '○ Inaktiv'}
          </span>
        </div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p style="color:var(--muted)">Kunne ikke hente ruter</p>';
  }
}

function getScheduleLabel(route) {
  if (!route.manualSchedule) return 'Notificerer altid';
  const s = route.manualSchedule;
  return `${s.morningFrom}–${s.morningTo} og ${s.afternoonFrom}–${s.afternoonTo}`;
}

function updateCalendarStatus() {
  if (!currentUser) return;
  const desc = document.getElementById('calendar-desc');
  const btn = document.getElementById('calendar-btn');
  const card = document.getElementById('calendar-status-card');

  if (currentUser.calendarConnected) {
    desc.textContent = 'Tilsluttet – Fribane bruger din kalender';
    btn.textContent = 'Gentilslut';
    card.classList.add('active');
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
    desc.textContent = 'Push understøttes ikke i denne browser';
    btn.style.display = 'none';
    return;
  }

  document.getElementById('settings-push').textContent =
    Notification.permission === 'granted' ? '✅ Aktiveret' : '❌ Ikke aktiveret';

  if (Notification.permission === 'granted') {
    icon.textContent = '✅';
    title.textContent = 'Push-notifikationer aktive';
    desc.textContent = 'Du modtager advarsler om uheld på dine ruter';
    btn.textContent = 'Test';
    btn.onclick = sendTestPush;
    card.classList.add('active');
  } else {
    btn.textContent = 'Aktivér';
    btn.onclick = enablePush;
  }
}

async function enablePush() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Du skal tillade notifikationer for at modtage trafikadvarsler');
      return;
    }

    const sw = await navigator.serviceWorker.ready;

    // Hent VAPID public key
    const keyRes = await fetch('/api/push/vapid-public-key');
    const { publicKey } = await keyRes.json();

    if (!publicKey) {
      alert('Push er ikke konfigureret på serveren endnu (mangler VAPID nøgler i .env)');
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
    alert('Kunne ikke aktivere push – se konsollen for detaljer');
  }
}

async function sendTestPush() {
  try {
    const res = await fetch('/api/push/test', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) alert('Fejl: ' + data.error);
    else alert('Test-notifikation sendt! ✅');
  } catch {
    alert('Kunne ikke sende test');
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

  // Schedule type toggle
  document.querySelectorAll('[name="schedule-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const manual = document.getElementById('manual-schedule');
      manual.classList.toggle('hidden', radio.value !== 'manual');
    });
  });
}

function renderRoutesList(routes) {
  const container = document.getElementById('routes-list');

  if (!routes.length) {
    container.innerHTML = '<p style="color:var(--muted);padding:1rem 0">Du har ingen ruter endnu.</p>';
    return;
  }

  container.innerHTML = routes.map(r => `
    <div class="route-item">
      <div>
        <div class="route-item-name">${r.name}</div>
        <div class="route-item-meta">${getScheduleLabel(r)}</div>
      </div>
      <div class="route-item-actions">
        <button class="btn-sm" onclick="deleteRoute('${r._id}')">Slet</button>
        <button class="btn-sm" onclick="toggleRoute('${r._id}', ${!r.active})">
          ${r.active ? 'Deaktivér' : 'Aktivér'}
        </button>
      </div>
    </div>
  `).join('');
}

function showRouteForm() {
  document.getElementById('route-form').classList.remove('hidden');
  document.getElementById('new-route-btn').classList.add('hidden');
  setTimeout(initRouteMap, 100);
}

function hideRouteForm() {
  document.getElementById('route-form').classList.add('hidden');
  document.getElementById('new-route-btn').classList.remove('hidden');
  routeBounds = null;
  document.getElementById('coords-display').textContent = 'Vælg område på kortet';
  document.getElementById('route-error').classList.add('hidden');
}

function initRouteMap() {
  if (routeMap) {
    routeMap.remove();
    routeMap = null;
    routeRect = null;
  }

  // Centreret over Danmark
  routeMap = L.map('route-map').setView([55.9, 10.2], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18,
  }).addTo(routeMap);

  // Standard bounding box for Danmark
  const defaultBounds = [[56.5, 9.0], [55.3, 11.5]];
  routeRect = L.rectangle(defaultBounds, {
    color: '#ff5c35',
    weight: 2,
    fillOpacity: 0.1,
    draggable: true,
  }).addTo(routeMap);

  routeBounds = {
    swLat: 55.3, swLng: 9.0,
    neLat: 56.5, neLng: 11.5,
  };
  updateCoordsDisplay();

  // Opdater bounds når rektangel ændres
  routeMap.on('click', (e) => {
    // Simpel klik-for-at-centrere logik
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const delta = 0.3;

    const newBounds = [[lat + delta, lng - delta * 1.5], [lat - delta, lng + delta * 1.5]];
    routeRect.setBounds(newBounds);

    routeBounds = {
      swLat: lat - delta,
      swLng: lng - delta * 1.5,
      neLat: lat + delta,
      neLng: lng + delta * 1.5,
    };
    updateCoordsDisplay();
  });
}

function updateCoordsDisplay() {
  if (!routeBounds) return;
  const el = document.getElementById('coords-display');
  el.textContent = `SW: ${routeBounds.swLat.toFixed(3)}, ${routeBounds.swLng.toFixed(3)}  →  NE: ${routeBounds.neLat.toFixed(3)}, ${routeBounds.neLng.toFixed(3)}`;
}

async function saveRoute() {
  const name = document.getElementById('route-name').value.trim();
  const errorEl = document.getElementById('route-error');
  const schedType = document.querySelector('[name="schedule-type"]:checked').value;

  if (!name) { showError(errorEl, 'Angiv et navn for ruten'); return; }
  if (!routeBounds) { showError(errorEl, 'Vælg et område på kortet'); return; }

  let manualSchedule = null;

  if (schedType === 'manual') {
    manualSchedule = {
      morningFrom: document.getElementById('morning-from').value,
      morningTo: document.getElementById('morning-to').value,
      afternoonFrom: document.getElementById('afternoon-from').value,
      afternoonTo: document.getElementById('afternoon-to').value,
      activeDays: Array.from(activeDays),
    };
  }

  try {
    const res = await fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ...routeBounds, manualSchedule }),
    });

    const data = await res.json();

    if (res.ok) {
      hideRouteForm();
      renderRoutesList(data.routes);
    } else {
      showError(errorEl, data.error);
    }
  } catch {
    showError(errorEl, 'Serverfejl – prøv igen');
  }
}

async function deleteRoute(routeId) {
  if (!confirm('Slet denne rute?')) return;
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
