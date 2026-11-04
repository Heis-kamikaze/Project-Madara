# Aradam Backend

REST API for the Aradam e-commerce website: a Nigerian crochet fashion house with limited-run collections, custom pieces, a private digital closet, QR-code authentication and a community space.

**Stack:** Node.js 20+ · Express 4 · TypeScript · Firebase (Auth, Firestore, Cloud Storage) · Paystack (NGN payments)

---

## Contents

1. [How it fits together](#1-how-it-fits-together)
2. [Quick start](#2-quick-start)
3. [Firebase setup](#3-firebase-setup)
4. [Environment variables](#4-environment-variables)
5. [Project structure](#5-project-structure)
6. [Module reference](#6-module-reference)
7. [Roles and permissions](#7-roles-and-permissions)
8. [Key flows](#8-key-flows)
9. [Data model](#9-data-model)
10. [Conventions](#10-conventions)
11. [What the frontend must provide](#11-what-the-frontend-must-provide)
12. [Deployment](#12-deployment)
13. [Design decisions and limits](#13-design-decisions-and-limits)
14. [Handover checklist](#14-handover-checklist)

---

## 1. How it fits together

```
 Browser / app (Firebase client SDK: sign up, sign in)
        │  Authorization: Bearer <Firebase ID token>
        ▼
 ┌──────────────────────────── Express API ─────────────────────────────┐
 │  helmet → CORS → JSON parser (keeps raw body) → maintenance → rate   │
 │  limit → /api/v1 router                                               │
 │        route → validate (zod) → authenticate → authorize (RBAC)       │
 │              → handler → service (business rules) → Firebase Admin    │
 │  errors of any kind → one error handler → { error: { code, message } }│
 └──────────────┬───────────────────┬──────────────────┬────────────────┘
                ▼                   ▼                  ▼
          Firebase Auth         Firestore        Cloud Storage
        (identity + role      (all data)       (images, video, QR
         custom claim)                           code PNGs)
                                   ▲
   Paystack ── webhook ────────────┘   Cloud Scheduler / cron ── POST /internal/jobs/run
```

* **Identity** is Firebase Auth. Customers sign up and sign in in the browser with the Firebase client SDK; this API never sees a password. It verifies the ID token on every request.
* **Authorisation** is role-based. A user's role is a Firebase custom claim (`role`); the permissions each role holds are defined in `src/config/permissions.ts`.
* **All data access goes through this API** using the Firebase Admin SDK. Firestore and Storage security rules are set to *deny everything* to clients (see `firestore.rules`, `storage.rules`), so there is exactly one place where rules are enforced.
* **Services own the business rules.** Route files only describe HTTP (paths, validation, permissions); the logic lives in `*.service.ts`.

---

## 2. Quick start

You need Node.js 20 or newer (`node -v`).

**Step 1 — install dependencies**

```bash
cd aradam-backend
npm install
```

**Step 2 — create the Firebase project** and collect the credentials (section 3).

**Step 3 — fill in `.env`.** Open the `.env` file in this folder and replace every placeholder. Generate the two secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it once for `CRON_SECRET` and once for `MAINTENANCE_BYPASS_TOKEN`.

**Step 4 — start the API**

```bash
npm run dev
```

You should see `Aradam API listening on :4000`. If you see `Could not initialise Firebase`, the three `FIREBASE_*` values are wrong (see Troubleshooting).

**Step 5 — check it is alive**

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/site/landing
```

**Step 6 — make yourself the owner.** Create your account first (sign up from the website, or Firebase console → Authentication → Add user), then run:

```bash
npm run bootstrap:admin -- you@example.com owner
```

Sign out and back in so the new role is in your token.

**Step 7 — call the API from the frontend**

```ts
import { getAuth } from 'firebase/auth';

const API = 'http://localhost:4000/api/v1';

async function api(path: string, init: RequestInit = {}) {
  const token = await getAuth().currentUser?.getIdToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json.error.message), json.error);
  return json; // { data, meta? }
}

// once, right after the first sign-in:
await api('/auth/register', { method: 'POST', body: JSON.stringify({ displayName: 'Ada' }) });
// what can this user see/do?
const { data } = await api('/auth/me'); // { role, permissions: [...], profile }
```

After a role change, call `getIdToken(true)` (force refresh) so the new role reaches the token immediately.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-reload (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run typecheck` | Type-check without emitting files |
| `npm run bootstrap:admin -- <email> [role]` | Give an existing user a role (default `owner`) |

### Troubleshooting

| Message | Cause / fix |
|---|---|
| `Invalid environment configuration` | A required `.env` value is missing or malformed; the message names each one. |
| `Could not initialise Firebase … Failed to parse private key` | `FIREBASE_PRIVATE_KEY` must be in quotes and keep its `\n` sequences. |
| `9 FAILED_PRECONDITION: The query requires an index` | Deploy `firestore.indexes.json` (section 3, step 6), or click the link in the error. |
| `401 INVALID_TOKEN` | Token expired or from a different Firebase project than `FIREBASE_PROJECT_ID`. |
| `403 CORS_ORIGIN_DENIED` | Add the frontend URL to `CORS_ORIGINS`. |
| Emails not arriving | Check `SMTP_*`; clear `SMTP_HOST` to switch mirroring off. The in-app inbox is unaffected. |

---

## 3. Firebase setup

1. Go to <https://console.firebase.google.com> → **Add project**.
2. **Authentication** → *Get started* → enable **Email/Password** (and Google if wanted).
3. **Firestore Database** → *Create database* → **production mode**, pick a region close to Nigeria/your users.
4. **Storage** → *Get started*. Copy the bucket name into `FIREBASE_STORAGE_BUCKET`.
5. **Project settings → Service accounts → Generate new private key.** From the downloaded JSON copy `project_id`, `client_email` and `private_key` into `.env`. Keep the JSON out of git.
6. Deploy the rules and indexes:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add            # choose your project
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```

The rules deny all direct client access on purpose; everything goes through the API.

---

## 4. Environment variables

All variables are validated at startup (`src/config/env.ts`). Empty values count as "not set".

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | no | `development` / `production` / `test`. |
| `PORT`, `API_PREFIX`, `LOG_LEVEL` | no | Port (4000), base path (`/api/v1`), `debug`/`info`/`warn`/`error`. |
| `APP_BASE_URL` | **yes** | Public website URL; used in email links and QR codes. |
| `CORS_ORIGINS` | no | Comma-separated frontend origins allowed to call the API. |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | no | Global per-IP limit. Raise it if many customers share mobile-network IPs. |
| `MAINTENANCE_MODE` | no | `true` → public API returns 503. |
| `MAINTENANCE_BYPASS_TOKEN` | no | Header `x-maintenance-bypass: <token>` lets the team through while in maintenance. |
| `FIREBASE_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | **yes** | Service-account credentials (Admin SDK). |
| `FIREBASE_STORAGE_BUCKET` | **yes** | Bucket for uploads and QR images. |
| `PAYSTACK_SECRET_KEY` | **yes** | Initialises payments and verifies webhook signatures. |
| `PAYSTACK_BASE_URL` | no | Defaults to `https://api.paystack.co`. |
| `PAYMENT_CALLBACK_URL` | no | Return page after payment; defaults to `{APP_BASE_URL}/checkout/complete`. |
| `SHIPPING_FLAT_FEE_NGN` | no | Flat shipping fee per order (naira). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | no | Email mirroring of inbox messages. No `SMTP_HOST` = email off. |
| `SUPPORT_AI_ENABLED` | no | `true` → AI answers support chats first. |
| `ANTHROPIC_API_KEY`, `SUPPORT_AI_MODEL` | only if AI on | Credentials and model for the support assistant. |
| `CRON_SECRET` | **yes** | Protects `POST /internal/jobs/run` (min. 16 chars). |
| `ENABLE_INTERNAL_SCHEDULER`, `JOB_INTERVAL_MINUTES` | no | Run the jobs inside the API process. |
| `STALE_ORDER_HOURS` | no | Auto-cancel unpaid orders after this many hours (24). |
| `MAX_UPLOAD_MB` | no | Max staff upload size (50). |

---

## 5. Project structure

```
aradam-backend/
├── .env                      placeholder configuration (never commit)
├── firebase.json             tells the Firebase CLI which rules/index files to deploy
├── firestore.rules           deny-all: only the API (Admin SDK) touches data
├── firestore.indexes.json    composite indexes the queries need
├── storage.rules             deny-all (public media uses tokenised URLs)
└── src/
    ├── server.ts             starts the HTTP server, scheduler, graceful shutdown
    ├── app.ts                builds the Express app and middleware chain
    ├── routes.ts             mounts every module under /api/v1
    ├── config/               env validation, Firebase init, roles & permissions
    ├── middleware/           authenticate, authorize, validate, rateLimit, maintenance, errorHandler
    ├── lib/                  errors, ids/slugs, Firestore helpers, mailer, storage, audit log
    ├── types/                shared document types, Express request typing
    ├── scripts/              bootstrap-admin.ts
    └── modules/<name>/       <name>.routes.ts (HTTP) + <name>.service.ts (rules)
```

### Shared building blocks

| File | Function |
|---|---|
| `config/env.ts` | Loads `.env`, validates every variable with zod, exits with a readable list if something is wrong. |
| `config/firebase.ts` | Initialises the Admin SDK once; exports `db` (Firestore), `adminAuth`, `bucket`. |
| `config/permissions.ts` | The single source of truth for roles and what each may do. |
| `middleware/authenticate.ts` | Verifies the Firebase ID token and sets `req.user` (`optionalAuth` for public routes that behave differently for staff). |
| `middleware/authorize.ts` | `requirePermission(...)`, `requireRole(...)`, `can(user, permission)`. |
| `middleware/validate.ts` | Validates body/query/params with zod; unknown fields are rejected on write routes (`.strict()`). |
| `middleware/rateLimit.ts` | Global limiter plus a stricter limiter counted per account for chat, comments, claims, uploads. |
| `middleware/maintenance.ts` | Maintenance-mode switch. |
| `middleware/errorHandler.ts` | Converts every failure (validation, app errors, upload errors, bad JSON, unexpected) into one JSON shape. |
| `lib/firestore.ts` | Timestamp → ISO conversion, cursor pagination, sort helpers. |
| `lib/storage.ts` | Uploads files/buffers to Storage and returns tokenised public URLs. |
| `lib/mailer.ts` | SMTP sending and the HTML email template. |
| `lib/audit.ts` | Writes the staff audit trail (`auditLogs`). |
| `lib/ids.ts`, `lib/slug.ts` | Order numbers, authenticity codes, unique slugs. |

---

## 6. Module reference

Every path is under `/api/v1`. **Public** = no token. **Auth** = any signed-in user. A permission name (e.g. `products:write`) means a staff role holding it. Lists accept `limit` and `cursor` where noted; the next cursor is returned in `meta.nextCursor`.

### `auth` — sign-in glue
Creates the customer profile after Firebase sign-in and tells the frontend who the user is.
* `POST /auth/register` (auth) — create the profile on first sign-in; safe to repeat.
* `GET /auth/me` (auth) — `{ role, permissions[], profile }`; drives role-based UI.

### `users` — profiles and role management
* `GET /users/me`, `PATCH /users/me` (auth) — name, phone, delivery address, marketing opt-in.
* `GET /users`, `GET /users/:uid` (`users:read`).
* `PATCH /users/:uid/role` (`users:manage-roles`) — sets the role claim. Nobody can change their own role; only an `owner` can grant or revoke `admin`/`owner`.

### `site` — landing page
* `GET /site/landing` (public) — hero video/poster, headline, featured collection and the items for the central "donut" navigation button.
* `PUT /site/landing` (`site:write`) — change them (e.g. new video when a collection drops).

### `collections` — limited-run collections and the archive
Each collection has cover art, a story, an availability window (`availableFrom` / `availableUntil`) and a status: `draft → active → archived`.
* `GET /collections` (public) — filters `status`, `releaseFrom`, `releaseTo`; sort by `release | created | title`. Each item carries `availability` (`upcoming | live | ended`) and `orderable`.
* `GET /collections/:idOrSlug` (public) — the collection and its pieces. Archived collections stay viewable.
* `POST /collections`, `PATCH /collections/:id`, `POST /collections/:id/publish`, `POST /collections/:id/archive`, `DELETE /collections/:id` (`collections:write`).
* A collection moves to the archive automatically when its window ends (job) or when every piece has sold out (after a payment).

### `products` — pieces
Fixed colour and design; stock; story; price in whole naira.
* `GET /products` (public) — filters `collectionId`, `minPrice`, `maxPrice`, `releasedFrom`, `releasedTo`, `q`, `status`; sort by `price | date | release`. Each piece carries `orderable` and a collection summary so the UI can show a help button for archived collections.
* `GET /products/:idOrSlug` (public).
* `POST /products`, `PATCH /products/:id`, `DELETE /products/:id` (`products:write`). Stock `0` automatically becomes `sold_out`.

### `consultations` — bookings and custom pieces
Requests for custom measurements, fittings or colour/design changes. A `custom_piece` consultation is flagged `isCustom`; pieces in a collection can never be customised through the order endpoint.
* `POST /consultations` (auth) — max 5 open at a time.
* `GET /consultations/mine`, `GET /consultations/:id`, `POST /consultations/:id/cancel` (auth, owner).
* `GET /consultations` (`consultations:read`), `PATCH /consultations/:id` (`consultations:write`) — confirm with a time, reschedule, complete, cancel. The customer is notified in their inbox (and by email) at each step.

### `orders` — checkout and fulfilment
* `POST /orders` (auth) — body is only `items[{ productId, quantity, size? }]`, `shippingAddress`, `notes`. Prices, names and availability come from the database; unknown fields (such as a colour change) are rejected.
  Errors you can show directly: `COLLECTION_ARCHIVED` (with `details.showHelp: true`), `COLLECTION_NOT_LIVE`, `SOLD_OUT`, `INSUFFICIENT_STOCK`, `SIZE_REQUIRED`.
* `GET /orders/mine`, `GET /orders/:id`, `POST /orders/:id/cancel` (auth, owner; unpaid orders only).
* `GET /orders` (`orders:read`), `PATCH /orders/:id/status` (`orders:write`) — `processing → shipped → delivered`, or `cancelled` / `refunded`; invalid jumps are refused and stock is restored on cancel/refund.

### `payments` — Paystack
* `POST /payments/initialize` (auth) `{ orderId }` → `{ authorizationUrl, reference }`; redirect the customer to `authorizationUrl`.
* `GET /payments/verify/:reference` (auth) — call from the return page; confirms with Paystack instead of trusting the browser.
* `POST /payments/webhook` (Paystack) — verified with the HMAC-SHA512 signature over the raw body.
* Payment confirmation is idempotent and runs inside a transaction: it checks the amount, re-checks stock, deducts it, and marks the order `paid`. If something does not add up (wrong amount, stock gone, order already cancelled) the order becomes `needs_attention` for a person to resolve or refund.

### `closet` — the private digital closet
* `GET /closet`, `GET /closet/:id` (auth) — the customer's pieces.
* `PATCH /closet/:id` (auth) — `isFavorite`, `position {x,y}` (0–1, for the visual wardrobe), private `notes`.
* `POST /closet/admin/custom-pieces` (`closet:manage`) — after a custom piece is commissioned: adds it to the customer's closet, issues a QR code reserved for that customer, and notifies them.
* `PATCH /closet/admin/:uid/:id/status` (`closet:manage`) — `in_production → ready → delivered`, notifying the customer.

### `inbox` — in-app messages mirrored to email
* `GET /inbox`, `GET /inbox/unread-count`, `PATCH /inbox/:id/read`, `POST /inbox/read-all`, `DELETE /inbox/:id` (auth).
* `POST /inbox/send` (`inbox:send`) — staff message to a customer (production updates, fitting appointments).
* Other modules call `inbox.sendMessage()`; each message is written to `users/{uid}/inbox` and emailed so nothing is missed offline.

### `authenticity` — QR-code product authentication
* `POST /authenticity/codes` (`authenticity:manage`) `{ productId, quantity }` — generates unique codes and QR images (stored in Storage) to print on packaging. The QR encodes `{APP_BASE_URL}/verify/{code}`.
* `GET /authenticity/codes` (`authenticity:manage`).
* `GET /authenticity/verify/:code` (public) — genuine or not, and whether it is already claimed. Never reveals the owner.
* `POST /authenticity/claim` (auth) `{ code, shareLocation, country?, state? }` — one owner per code. Adds the piece to the closet (or marks a custom piece authenticated) and, only if the customer opts in, counts it on the global map.

### `map` — global reach
* `GET /map/regions` (public) — `[{ country, state, count }]` and `meta.total`. Only anonymous counts per country/state are stored: no user, address, coordinates or time.

### `museum` — curated custom pieces
* `GET /museum`, `GET /museum/:id` (public; published only).
* `POST`, `PATCH /museum/:id`, `DELETE /museum/:id` (`museum:write`). An entry can only be published once the client's consent is recorded (`clientConsent: true`) and it has an image.

### `community` — news, campaigns, discussions
* `GET /community/posts`, `GET /community/posts/:id` (public) — filter by `type`.
* `POST /community/posts` (auth) — `discussion` for any customer; `news` and `campaign` need `community:write`.
* `PATCH` / `DELETE /community/posts/:id` — author or `community:moderate`. `POST …/hide`, `…/unhide` (`community:moderate`).
* `GET` / `POST /community/posts/:id/comments`, `DELETE /community/posts/:postId/comments/:commentId`.

### `team` — people and org chart
* `GET /team` (public) — `{ members[], tree[] }` (flat list for portraits, nested tree for the chart).
* `POST`, `PATCH /team/:id`, `DELETE /team/:id` (`team:write`). Reporting loops are refused; deleting someone re-attaches their reports to their manager.

### `support` — customer chat (AI or agent)
* `POST /support/conversations` (auth) `{ text }` — opens a chat. With `SUPPORT_AI_ENABLED=true` the AI answers; if it fails or is off, the chat goes to the team automatically.
* `GET /support/conversations/mine` (auth); `GET /support/conversations` (`support:read`).
* `GET /support/conversations/:id/messages?afterId=` — poll every few seconds for new messages.
* `POST /support/conversations/:id/messages` — customer message, or an agent reply (`support:reply`).
* `POST /support/conversations/:id/handoff` (owner) — "talk to a person".
* `PATCH /support/conversations/:id` (`support:reply`) — resolve or assign.
* The AI cannot see orders or accounts and is told not to invent order, price or delivery information.

### `media` — uploads
* `POST /media/upload?folder=products|collections|museum|team|landing|community` (`media:upload`) — multipart field `file`; images (jpeg, png, webp, avif) and, for `landing`/`community`/`museum`, video (mp4, webm). Returns `{ url, path }`; store `url` on the product/collection/etc.
* `POST /media/reference-image` (auth) — customer reference images for a consultation (images, max 5 MB).
* `DELETE /media` (`media:upload`) `{ path }`.

### `admin` — dashboard
* `GET /admin/stats` (`analytics:read`) — revenue, orders, pieces, collections, consultations, open chats, customers (Firestore aggregations).
* `GET /admin/roles` (`users:read`) — role/permission matrix for the UI.
* `GET /admin/audit-logs` (`audit:read`) — who changed what.

### `jobs` — scheduled maintenance
* `POST /internal/jobs/run` — header `x-cron-secret: <CRON_SECRET>`, body `{ "job": "all" | "archive-collections" | "cancel-stale-orders" }`.
* `archive-collections` archives active collections whose window has closed. `cancel-stale-orders` cancels orders unpaid after `STALE_ORDER_HOURS`. Both are idempotent.

---

## 7. Roles and permissions

The admin dashboard is not a separate app: staff use the same website, and what they see depends on `permissions` from `GET /auth/me`.

| Permission | owner / admin | manager | editor | support | customer |
|---|:-:|:-:|:-:|:-:|:-:|
| `site:write` | ✔ | | ✔ | | |
| `media:upload` | ✔ | ✔ | ✔ | | |
| `collections:write`, `products:write` | ✔ | ✔ | ✔ | | |
| `orders:read` | ✔ | ✔ | | ✔ | |
| `orders:write` | ✔ | ✔ | | | |
| `consultations:read`, `consultations:write` | ✔ | ✔ | | ✔ | |
| `closet:manage`, `authenticity:manage` | ✔ | ✔ | | | |
| `inbox:send` | ✔ | ✔ | | ✔ | |
| `museum:write`, `community:write`, `community:moderate`, `team:write` | ✔ | | ✔ | | |
| `support:read` | ✔ | ✔ | | ✔ | |
| `support:reply` | ✔ | | | ✔ | |
| `analytics:read` | ✔ | ✔ | | | |
| `users:read`, `users:manage-roles`, `audit:read` | ✔ | | | | |

Only an `owner` may grant or revoke `admin` and `owner`. To add a role, edit `config/permissions.ts` — nothing else needs to change.

---

## 8. Key flows

**Checkout.** `POST /orders` → `POST /payments/initialize` → customer pays on Paystack → Paystack calls the webhook (and the return page calls `/payments/verify`) → order becomes `paid`, stock is deducted, the customer gets an inbox message and email → staff move it through `processing → shipped → delivered`.

**Collection lifecycle.** Staff create a collection (draft) and its pieces → publish → it shows on the site inside its availability window → when the window closes, or the last piece sells, it is archived, its pieces are archived, and ordering from it returns `COLLECTION_ARCHIVED` (the frontend shows the help button).

**Custom piece.** Customer books a `custom_piece` consultation → staff confirm a time → after the fitting, staff call `POST /closet/admin/custom-pieces` → the piece appears in the customer's closet with status updates → on delivery the customer scans the QR code to authenticate it.

**Authentication of a purchased piece.** Staff generate codes for a product and print the QR codes on packaging → the buyer scans (opens `/verify/{code}` on the website) → signed in, the frontend calls `POST /authenticity/claim` → piece is added to the closet and, if they opted in, counted on the map.

**Inbox.** Any status change in orders, consultations or closet writes an inbox message and mirrors it to the customer's email.

---

## 9. Data model

Firestore collections (dates are Firestore timestamps; the API returns ISO strings).

| Collection | Contents |
|---|---|
| `users/{uid}` | profile, role · sub-collections `inbox`, `closet` |
| `collections/{id}` | title, slug, story, cover, status, availability window, archive reason |
| `products/{id}` | collectionId, title, story, `priceNgn`, colour, sizes, images, stock, status |
| `orders/{id}` | items (price snapshot), totals, shipping address, status, payment reference |
| `consultations/{id}` | type, requested/scheduled time, notes, measurements, reference images, status |
| `authenticityCodes/{code}` | product or reserved owner, QR image, claim status |
| `mapRegions/{country__state}` | anonymous counter |
| `museum/{id}` | curated entries with consent flag |
| `posts/{id}` | community posts · sub-collection `comments` |
| `team/{id}` | members with `parentId` for the org chart |
| `supportConversations/{id}` | chat metadata · sub-collection `messages` |
| `siteConfig/landing` | landing-page configuration |
| `auditLogs/{id}` | staff actions |

Types for the API shapes are in `src/types/models.ts`.

---

## 10. Conventions

* **Success:** `{ "data": … , "meta": { … } }`. **Failure:** `{ "error": { "code": "SOLD_OUT", "message": "…", "details": … } }`. Branch on `code`, show `message`.
* **Statuses:** 400 validation, 401 not signed in, 403 not allowed, 404 not found (also used to hide other people's records), 409 state conflict, 429 rate-limited, 502 payment provider problem, 503 maintenance.
* **Money:** whole naira in the API (`priceNgn`, `totalNgn`); converted to kobo only when talking to Paystack.
* **Dates:** ISO-8601 strings with offset, e.g. `2026-12-01T09:00:00+01:00`.
* **Writes are strict:** unknown fields are rejected, not ignored.

---

## 11. What the frontend must provide

The API links to these pages in emails, inbox messages and QR codes:

| Route | Used for |
|---|---|
| `/checkout/complete` | Paystack return page — call `GET /payments/verify/:reference` (`reference` is in the query string). |
| `/verify/:code` | Opened by scanning the QR code — call `GET /authenticity/verify/:code`; offer **Claim** if signed in. |
| `/account/orders/:id`, `/account/consultations/:id`, `/closet/:id` | Deep links inside notifications. |

---

## 12. Deployment

1. Build and run: `npm ci && npm run build && npm start` (any Node host: Cloud Run, Render, Railway, a VPS).
2. Put the `.env` values into the host's secret manager / environment settings rather than a file.
3. Set `NODE_ENV=production`, `APP_BASE_URL` and `CORS_ORIGINS` to the real website.
4. In the Paystack dashboard set the webhook URL to `https://<api-host>/api/v1/payments/webhook`.
5. Run the jobs either with `ENABLE_INTERNAL_SCHEDULER=true` (single instance) or with a scheduler calling `POST /internal/jobs/run` with `x-cron-secret` (several instances).
6. Deploy `firestore.rules`, `firestore.indexes.json` and `storage.rules` (section 3).

---

## 13. Design decisions and limits

* **Stock is deducted when payment is confirmed**, not when the order is created, so abandoned checkouts never lock a limited piece. The cost is that two buyers can pay for the last piece at the same moment; the second order is flagged `needs_attention` for a refund.
* **Filtering and sorting of collections and products happen in memory** after a single-field query. That keeps Firestore indexes minimal and is fine for a boutique catalogue (hundreds of pieces). Move to indexed queries or a search service if the catalogue grows into the thousands.
* **Chat is poll-based** (`?afterId=`). Swap in Firestore listeners or server-sent events later without changing the data model.
* **Refunds are recorded, not sent.** Marking an order `refunded` updates the system; the money is returned from the Paystack dashboard.
* **Role changes** reach a user's token on its next refresh (up to an hour, or instantly with `getIdToken(true)`).
* **Uploads** trust the browser-reported MIME type; uploads are staff-only except customer reference images, which are limited to 5 MB images and rate-limited.
* **The map is deliberately coarse** (country/state counters) to protect owners' privacy.
* **Validation library is pinned to zod 3.** `npm audit` flags a memory-exhaustion advisory in zod 3 for very large constrained arrays; request bodies are capped at 1 MB and every array has a `max`, which bounds the exposure. Do not simply run `npm audit fix --force`: zod 4 changes how field defaults behave inside `.partial()`, which would silently reset fields on every PATCH endpoint. Upgrade deliberately, with tests.
* **Not included:** a frontend, automated tests against a live Firebase project, and email templating beyond one simple layout.

---

## 14. Handover checklist

The credentials below are the project's "keys". They live only in the environment/secret manager, never in the code, so they can be transferred cleanly when the engagement is complete:

* Firebase service account (`FIREBASE_*`) and the Firebase project itself
* Paystack secret key (and the Paystack account/webhook configuration)
* SMTP credentials
* Anthropic API key (if the AI support assistant is enabled)
* `CRON_SECRET` and `MAINTENANCE_BYPASS_TOKEN` (rotate on handover)

`MAINTENANCE_MODE=true` is the switch that takes the public site offline while keeping health checks and payment webhooks alive.
