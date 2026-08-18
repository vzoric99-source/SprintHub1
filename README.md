# SprintHub - Sprint Management Application

Fullstack aplikacija za upravljanje sprintovima i tiketima sa **Kanban tabelom**.
Kreirana korišćenjem **Angular 21 + Signals + TailwindCSS** na frontendu i **Node.js + Express 5 + Prisma + SQL Server** na backendu.

---

## Pregled

SprintHub je moderna sprint management aplikacija koja omogućava korisnicima da organizuju svoj rad kroz:

- **Radne prostore (Workspaces)** - Grupisanje sprintova i tagova
- **Sprintove** - Kanban table sa životnim ciklusom (PLANNING → ACTIVE → COMPLETED)
- **Stage-ove** - Prilagodljive faze (Backlog, In Progress, Review, Done, ili custom)
- **Tikete** - Detaljni tiketi sa kodom, tipom, prioritetima, rokovima i procenjenim satima
- **Tagove** - Kategorije/oznake za tikete sa bojom (jedna po tiketu)
- **Vremensku liniju** - Mesečni prikaz tiketa sa rokovima
- **Dashboard** - Pregled radnih prostora, aktivnih sprintova i mojih tiketa
- **Notifikacije** - In-app obaveštenja o dodeljenim tiketima

---

## Funkcionalnosti

### Autentifikacija i Autorizacija

- Registracija i prijava korisnika
- JWT token sa Bearer autorizacijom i HTTP-only cookie
- CSRF zaštita (double-submit cookie pattern)
- Tri nivoa pristupa: **ADMIN**, **MODERATOR**, **USER**
- Zaštićene rute na frontendu (Guards) i backendu (Middleware)

### Radni prostori (Workspaces)

- Kreiranje workspace-ova sa nazivom, opisom i ikonom (boja)
- Pristup baziran na vlasništvu (createdById) i sistemskoj roli
- ADMIN/MODERATOR mogu pristupiti svim workspace-ovima
- USER vidi samo svoje workspace-ove
- Inline prikaz sprintova na listi workspace-ova

### Sprintovi

- Životni ciklus: **PLANNING → ACTIVE → COMPLETED**
- Sprint cilj (goal), datum početka i završetka
- Automatsko kreiranje podrazumevanih stage-ova (Backlog, In Progress, Review, Done)
- Notifikacija pri pokretanju sprinta

### Kanban tabla (Stage-ovi)

- **Drag & Drop** - Premestanje tiketa između stage-ova (Angular CDK)
- Kreiranje custom stage-ova sa bojama
- Promena redosleda stage-ova
- Responzivan dizajn za sve uređaje

### Tiketi

- Auto-generisani kod tiketa (WS1-001, WS1-002...)
- **Tipovi**: TASK, BUG, FEATURE, IMPROVEMENT
- **Prioriteti**: LOW, MEDIUM, HIGH, URGENT
- **Procenjeni sati** (estimatedHours)
- **Due dates** sa vizuelnim indikatorima (overdue, due soon)
- **Dodeljivanje tiketa** - Dodela tiketa korisniku sa automatskom notifikacijom i emailom
- **Tag** - Jedan tag po tiketu sa bojom
- **Move** - Premeštanje tiketa između stage-ova sa automatskim ažuriranjem pozicija

### Vremenska linija (Kalendar)

- Mesečni prikaz tiketa po due date-u
- Navigacija između meseci
- Indikatori na danima (crveno = istekao, narandžasto = uskoro, plavo = u toku)
- Panel sa detaljima tiketa za izabrani dan
- Prikaz ticket koda i tipa

### Notifikacije

- **In-app notifikacije** sa bell ikonom u navbar-u
- Badge sa brojem nepročitanih notifikacija
- Tipovi notifikacija:
  - `TICKET_ASSIGNED` - Kada vam je dodeljen tiket
  - `SPRINT_STARTED` - Kada je sprint pokrenut
  - `REMINDER` - Kada tiket uskoro ističe
- Označavanje pojedinačnih/svih notifikacija kao pročitane

### Email Integracija

- Slanje email-a kada je tiket dodeljen korisniku
- Konfigurisanje preko SMTP (Gmail, Outlook, custom SMTP server)
- Graceful degradation ako SMTP nije konfigurisan

---

## Tehnologije

### Frontend (Angular 21)

| Tehnologija | Opis |
|-------------|------|
| **Angular 21** | Frontend framework sa standalone komponentama |
| **Angular Signals** | Reaktivno state management (signal, computed, input, output, model) |
| **Angular CDK** | Drag & Drop za Kanban tablu |
| **TailwindCSS** | Utility-first CSS framework |
| **ng-icons** | Feather icons za UI |
| **RxJS** | Reaktivno programiranje |

### Backend (Node.js)

| Tehnologija | Opis |
|-------------|------|
| **Node.js 20+** | JavaScript runtime |
| **Express 5** | Web framework |
| **Prisma ORM** | Database toolkit |
| **SQL Server** | Relaciona baza podataka |
| **JWT** | JSON Web Tokens za auth |
| **bcryptjs** | Hashovanje lozinki |
| **cookie-parser** | Parsiranje cookies |
| **nodemailer** | Slanje email-ova |
| **express-validator** | Validacija inputa |
| **helmet** | Security headers |
| **hpp** | HTTP Parameter Pollution zaštita |

---

## Arhitektura

```
sprinthub/
├── client/                     # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Services, guards, models, interceptors
│   │   │   ├── layout/         # Navbar, Footer
│   │   │   ├── pages/          # Route components (8 stranica)
│   │   │   └── shared/         # Reusable components (Button, Input, Modal)
│   │   └── styles.css          # Global styles + Tailwind
│   └── package.json
│
├── server/                     # Node.js backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (7 modela)
│   │   ├── migrations/         # SQL migracije
│   │   └── seed.js             # Test data seeder
│   ├── src/
│   │   ├── config/             # Environment, email, swagger
│   │   ├── controllers/        # Route handlers (8 kontrolera)
│   │   ├── middleware/         # Auth, roles, security, validation
│   │   ├── routes/             # API routes (8 fajlova)
│   │   └── server.js           # Entry point
│   └── package.json
│
└── README.md
```

---

## Database Schema

### Entiteti (7 modela)

```
User
├── id, name, email, password
├── role (USER | MODERATOR | ADMIN)
├── createdAt, updatedAt
└── Relacije: workspaces, createdTickets, assignedTickets, notifications

Workspace
├── id, name, description, icon (#hex boja)
├── createdById → User
├── createdAt, updatedAt
└── Relacije: createdBy, sprints, tags

Sprint
├── id, name, goal, startDate, endDate
├── status (PLANNING | ACTIVE | COMPLETED)
├── workspaceId → Workspace
├── createdAt, updatedAt
└── Relacije: workspace, stages

Stage
├── id, name, position, color
├── sprintId → Sprint
├── createdAt, updatedAt
└── Relacije: sprint, tickets

Ticket
├── id, code (WS1-001), title, description
├── type (TASK | BUG | FEATURE | IMPROVEMENT)
├── stageId → Stage, createdById → User, assigneeId → User (nullable)
├── tagId → Tag (nullable, 1 tag po tiketu)
├── position, priority (LOW | MEDIUM | HIGH | URGENT)
├── dueDate, estimatedHours
├── createdAt, updatedAt
└── Relacije: stage, createdBy, assignee, tag

Tag
├── id, name, color, workspaceId → Workspace
├── createdAt
└── Relacije: workspace, tickets (unique: workspaceId + name)

Notification
├── id, userId → User
├── type (TICKET_ASSIGNED | SPRINT_STARTED | REMINDER)
├── title, message, link, isRead
├── createdAt
└── Relacije: user
```

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Opis |
|--------|----------|------|
| POST | `/register` | Registracija novog korisnika |
| POST | `/login` | Prijava korisnika |
| POST | `/logout` | Odjava korisnika |
| GET | `/me` | Trenutno ulogovani korisnik |

### CSRF (`/api`)

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/csrf-token` | Preuzimanje CSRF tokena |

### Workspaces (`/api/workspaces`)

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/` | Lista workspace-ova (paginirano) |
| POST | `/` | Kreiraj novi workspace |
| GET | `/:id` | Detalji workspace-a sa sprintovima i tagovima |
| PUT | `/:id` | Ažuriraj workspace |
| DELETE | `/:id` | Obriši workspace |

### Sprints (`/api`)

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/workspaces/:workspaceId/sprints` | Lista sprintova za workspace |
| POST | `/workspaces/:workspaceId/sprints` | Kreiraj sprint |
| GET | `/sprints/:id` | Sprint sa stage-ovima i tiketima |
| PUT | `/sprints/:id` | Ažuriraj sprint |
| PATCH | `/sprints/:id/status` | Promena statusa (PLANNING→ACTIVE→COMPLETED) |
| DELETE | `/sprints/:id` | Obriši sprint |

### Stages (`/api`)

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/sprints/:sprintId/stages` | Lista stage-ova |
| POST | `/sprints/:sprintId/stages` | Kreiraj stage |
| PUT | `/stages/:id` | Ažuriraj stage |
| DELETE | `/stages/:id` | Obriši stage |
| PATCH | `/sprints/:sprintId/stages/reorder` | Promeni redosled stage-ova |

### Tickets (`/api/tickets`)

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/` | Lista tiketa (filteri: priority, type, dueDate, assignedToMe) |
| POST | `/` | Kreiraj tiket (auto-generisan kod WS1-001) |
| GET | `/:id` | Detalji tiketa |
| PUT | `/:id` | Ažuriraj tiket |
| DELETE | `/:id` | Obriši tiket |
| PATCH | `/:id/move` | Premesti tiket (Kanban D&D) |

### Tags (`/api/tags`)

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/` | Lista tagova (query: workspaceId) |
| POST | `/` | Kreiraj tag |
| PUT | `/:id` | Ažuriraj tag |
| DELETE | `/:id` | Obriši tag (sa force=true za potvrdu) |

### Notifications (`/api/notifications`)

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/` | Lista notifikacija sa unreadCount |
| PATCH | `/:id/read` | Označi kao pročitano |
| PATCH | `/read-all` | Označi sve kao pročitano |
| DELETE | `/:id` | Obriši notifikaciju |

---

## Instalacija

### Preduslovi

- **Node.js 20+** (Angular 21 zahteva minimum v20.19)
- **SQL Server Express** (lokalna instanca sa Windows Authentication ili SQL auth)
- **npm**

### 1. Kloniraj repozitorijum

```bash
git clone <repository-url>
cd sprinthub
```

### 2. Backend Setup

```bash
cd server
npm install
```

Kreiraj `.env` fajl (kopiraj `.env.example`):

```env
PORT=8081
NODE_ENV=development
DATABASE_URL="sqlserver://localhost;instanceName=SQLEXPRESS;database=SprintHub;integratedSecurity=true;trustServerCertificate=true"
JWT_SECRET=sprinthub_dev_secret_key_minimum_32_chars_long
JWT_EXPIRES_IN=7d
COOKIE_NAME=sprinthub_token
CORS_ORIGIN=http://localhost:4200
FRONTEND_URL=http://localhost:4200
```

Pokreni migracije i seed:

```bash
npx prisma generate
npx prisma migrate dev
node prisma/seed.js
```

Pokreni server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install
npm start
```

---

## Pokretanje

| Servis | URL | Komanda |
|--------|-----|---------|
| Backend | http://localhost:8081 | `cd server && npm run dev` |
| Frontend | http://localhost:4200 | `cd client && npm start` |
| API Docs | http://localhost:8081/api-docs | Swagger UI |

---

## Test Kredencijali

Nakon pokretanja `seed.js`, dostupni su sledeći test nalozi:

| Korisnik | Email | Lozinka | Uloga |
|----------|-------|---------|-------|
| Dimitrije Djordjevic | `djordjevicdimitrije147@gmail.com` | `Profesija1` | ADMIN |
| Moderator SprintHub | `mod@sprinthub.test` | `mod123` | MODERATOR |
| Marko Petrović | `marko@sprinthub.test` | `password` | USER |
| Ana Jovanović | `ana@sprinthub.test` | `password` | USER |
| Stefan Nikolić | `stefan@sprinthub.test` | `password` | USER |

**Preporučeni test scenario:**
1. Prijavi se kao `marko@sprinthub.test`
2. Otvori radni prostor i expanduj sprintove
3. Klikni na sprint da otvoriš Kanban tablu
4. Testiraj drag & drop tiketa između stage-ova
5. Dodeli tiket nekom korisniku i dodaj tag
6. Prijavi se kao `ana@sprinthub.test` i proveri notifikacije (bell icon)
7. Otvori vremensku liniju (`/timeline`) i pregledaj tikete po datumima
8. Otvori dashboard (`/dashboard`) za pregled statistike

---

## Struktura Projekta

### Frontend - Ključni Fajlovi

```
client/src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts          # Zaštita ruta za ulogovane
│   │   ├── guest.guard.ts         # Zaštita za neulogovane (login/register)
│   │   └── admin.guard.ts         # Zaštita za ADMIN rolu
│   ├── interceptors/
│   │   ├── auth.interceptor.ts    # Bearer token na requests
│   │   └── csrf.interceptor.ts    # CSRF token header
│   ├── models/
│   │   ├── user.model.ts          # User tipovi (3 role)
│   │   ├── workspace.model.ts     # Workspace, PaginatedResponse tipovi
│   │   ├── sprint.model.ts        # Sprint, Stage tipovi
│   │   ├── ticket.model.ts        # Ticket, Tag tipovi
│   │   └── notification.model.ts  # Notification tipovi
│   └── services/
│       ├── api.service.ts         # HTTP wrapper
│       ├── auth.service.ts        # Autentifikacija (JWT + localStorage)
│       ├── workspaces.service.ts  # CRUD workspace-ova
│       ├── sprints.service.ts     # CRUD sprintova + stage-ova
│       ├── tickets.service.ts     # CRUD tiketa + move
│       ├── tags.service.ts        # CRUD tagova
│       ├── users.service.ts       # Lista korisnika (dropdown)
│       └── notifications.service.ts # Notifikacije
├── layout/
│   ├── navbar/                    # Navigacija sa user menijem i notifikacijama
│   └── footer/                    # Footer
├── pages/
│   ├── dashboard/                 # Dashboard sa statistikom
│   ├── login/                     # Login forma
│   ├── register/                  # Registracija
│   ├── projects/                  # Lista workspace-ova sa inline sprintovima
│   ├── board/                     # KANBAN TABLA sa tag menadžerom
│   ├── calendar/                  # VREMENSKA LINIJA sa tiketima
│   ├── admin/                     # Admin panel (korisnici)
│   └── not-found/                 # 404 stranica
└── shared/
    ├── components/
    │   ├── button/                # Reusable button
    │   ├── input/                 # Reusable input
    │   └── modal/                 # Reusable modal
    ├── directives/
    │   └── priority-badge.directive.ts  # Vizuelni prioritet badge
    └── pipes/
        └── relative-time.pipe.ts  # Relativno vreme (pre 5 min)
```

### Backend - Ključni Fajlovi

```
server/src/
├── config/
│   ├── env.js                     # Environment varijable
│   ├── email.js                   # Nodemailer konfiguracija
│   └── swagger.js                 # Swagger/OpenAPI spec
├── controllers/
│   ├── auth.controller.js         # Login, register, logout, me
│   ├── workspace.controller.js    # CRUD workspace-ova
│   ├── sprint.controller.js       # CRUD sprintova + status tranzicije
│   ├── stage.controller.js        # CRUD stage-ova + reorder
│   ├── ticket.controller.js       # CRUD tiketa + move + auto-code
│   ├── tag.controller.js          # CRUD tagova (sa force delete)
│   ├── user.controller.js         # Lista korisnika + admin ops
│   └── notification.controller.js # CRUD notifikacija
├── middleware/
│   ├── auth.js                    # JWT verifikacija (requireAuth)
│   ├── roles.js                   # Role provera (requireRole, requireOneOfRoles)
│   ├── security.js                # Helmet, CSRF, HPP, rate limiting, sanitization
│   └── validate.js                # express-validator pravila
├── routes/
│   ├── auth.routes.js             # POST register/login/logout, GET me
│   ├── workspace.routes.js        # CRUD workspace-ova
│   ├── sprint.routes.js           # CRUD sprintova + status
│   ├── stage.routes.js            # CRUD stage-ova + reorder
│   ├── ticket.routes.js           # CRUD tiketa + move
│   ├── tag.routes.js              # CRUD tagova
│   ├── user.routes.js             # Lista korisnika
│   └── notification.routes.js     # CRUD notifikacija + mark read
└── server.js                      # Express app entry point
```

---

## Role i Permisije

### Sistemske uloge

| Rola | Opis | Workspace pristup |
|------|------|----------|
| **ADMIN** | Pun pristup svemu | Vidi i edituje sve workspace-ove |
| **MODERATOR** | Može editovati tuđe workspace-ove | Vidi i edituje sve workspace-ove |
| **USER** | Obični korisnik | Samo svoje workspace-ove (createdById) |

---

## Licenca

MIT License
