# Fribane 🚦

Intelligent pendler-advarsel – push-notifikationer når der er uheld på din rute, **inden** du sætter dig i bilen.

## Tech Stack

- **Backend**: Express + TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (cookie-baseret) + Google OAuth 2.0
- **Push**: Web Push (VAPID)
- **Trafik**: Vejdirektoratets NAP API (SSE/REST)
- **Kalender**: Google Calendar API
- **Frontend**: Vanilla HTML + CSS + TypeScript (PWA)

---

## Hurtig start

### 1. Forudsætninger
- Node.js 18+
- MongoDB (lokalt eller MongoDB Atlas)

### 2. Installation
```bash
npm install
cp .env.example .env
```

### 3. Konfigurér `.env`

**MongoDB** – hvis du kører lokalt:
```
MONGODB_URI=mongodb://localhost:27017/fribane
```

**JWT** – generér en hemmelig nøgle:
```
JWT_SECRET=noget-langt-og-tilfaeldigt-her
```

**VAPID nøgler** (til push-notifikationer):
```bash
npx web-push generate-vapid-keys
```
Kopiér output til `.env`.

**Google OAuth** (til kalender-integration):
1. Gå til [console.cloud.google.com](https://console.cloud.google.com)
2. Opret projekt → Aktivér "Google Calendar API"
3. Opret OAuth 2.0 credentials (Web application)
4. Tilføj redirect URI: `http://localhost:3000/auth/google/callback
# Produktion: https://fribane.io/auth/google/callback`
5. Kopiér Client ID og Client Secret til `.env`

**Vejdirektoratet API nøgle**:
1. Gå til [nap.vd.dk/themes/1](https://nap.vd.dk/themes/1)
2. Opret konto og generér API nøgle
3. Kopiér til `.env`

> **Bemærk**: Appen virker uden API nøgle – den bruger mock-data til test.

### 4. Start appen
```bash
npm run dev
```

Åbn:
- **Landing page**: http://localhost:3000/
- **App**: http://localhost:3000/app

---

## Arkitektur

```
src/
├── index.ts              # Express app entry point
├── routes/
│   ├── auth.ts           # Login, register, Google OAuth
│   ├── routes.ts         # CRUD for bruger-ruter
│   ├── push.ts           # Push subscription management
│   └── stats.ts          # Offentlig slots-counter til landing page
├── models/
│   ├── User.ts           # Bruger med ruter og push-subs
│   └── TrafficEvent.ts   # Trafikhændelser og notifikations-log
├── services/
│   ├── trafficService.ts # Poller Vejdirektoratet, matcher ruter
│   ├── pushService.ts    # Sender Web Push notifikationer
│   └── calendarService.ts# Google Calendar integration
├── middleware/
│   └── auth.ts           # JWT middleware + token generator
└── types/
    └── index.ts          # TypeScript typer
    
public/
├── pages/
│   ├── landing.html      # Landing page med slots-countdown
│   └── app.html          # Hoved-app (PWA)
├── css/
│   ├── landing.css
│   └── app.css
├── js/
│   └── app.js            # Frontend logik
├── sw.js                 # Service Worker (push + cache)
└── manifest.json         # PWA manifest
```

---

## Næste skridt til produktion

- [ ] Opret ikoner (192x192 og 512x512 PNG) i `public/icons/`
- [ ] Konfigurér HTTPS (påkrævet til push på rigtige enheder)
- [ ] Deploy til Hetzner/DigitalOcean (~50 kr/md)
- [ ] Sæt MongoDB Atlas op (gratis tier til start)
- [ ] Send app til Google OAuth review
- [ ] Tilføj MobilePay Recurring til betalingsflow

---

## Forretningsmodel

| Produkt | Pris | Margin |
|---|---|---|
| Solo (1 device) | 9 kr/md | ~87% |
| Family (5 devices) | 19 kr/md | ~92% |
| SMS-tillæg | +9 kr/md | ~75% |

Break-even: ~250 betalende devices.
