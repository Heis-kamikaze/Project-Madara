# Aradam frontend ↔ server integration

React + TypeScript (Vite). This drop-in gives you pages, routing, auth, cart and the whole API layer.
**There is no styling**: every page is plain semantic HTML so you can add Tailwind classes freely.

## 1. Install

From your client folder (PowerShell):

```powershell
npm install react-router-dom firebase @tanstack/react-query
```

Copy the contents of this zip's `src/` over your project's `src/`.
It replaces `src/App.tsx` and adds everything else. It does **not** touch `main.tsx` or `index.css` (your Tailwind setup stays).

## 2. Configure

```powershell
Copy-Item .env.example .env
```

Fill `.env` with your Firebase **web app** config (Firebase console → Project settings → General → Your apps → Web app).
This is not the server's service-account key.

In the **server's** `.env` (Vite runs on port 5173, the server's default CORS origin is 3000):

```
APP_BASE_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

Restart the server after changing it. In the Firebase console, make sure Authentication → Email/Password (and Google if you want it) is enabled.

## 3. Run

```powershell
# terminal 1 (server folder)
npm run dev
# terminal 2 (client folder)
npm run dev
```

Create an account in the browser, then make yourself the owner (server folder):

```powershell
npm run bootstrap:admin -- you@example.com owner
```

Sign out and back in; an **Admin** link appears in the menu.

## 4. How it fits together

```
src/
  lib/          firebase.ts (identity only) · api.ts (fetch wrapper) · format/address/safeNext helpers
  types/api.ts  every API shape + the role/permission lists (mirror of server/src/types/models.ts)
  auth/         AuthProvider (sign in/up/out, loads GET /auth/me, creates the profile on first sign-in),
                useAuth() → { status, me, can(permission), isStaff, refresh … }, route guards
  cart/         CartProvider (localStorage; display data only, the server re-prices every order)
  api/          one file per server module: typed hooks (React Query) for every endpoint
  components/   layout (DonutNav, RootLayout, AdminLayout) · ui (Field, ImageUploader, LoadMore …) · support/ChatThread
  pages/        public + customer pages · pages/admin/* staff tools
  router.tsx    all routes (lazy-loaded) with guards
```

* **Token handling:** `lib/api.ts` attaches the Firebase ID token to every request and retries once with a fresh token if the server rejects it.
* **Errors:** every thrown error is an `ApiError` with `.code` (e.g. `SOLD_OUT`, `COLLECTION_ARCHIVED`), `.message` and `.details`.
* **Roles in the UI:** use `const { can } = useAuth(); can('orders:write')`. The server enforces permissions again, so hiding a button is a convenience, not security.
* **Styling hooks:** components expose state through attributes you can target, e.g. `[data-status="paid"]`, `[data-availability="upcoming"]`, `[data-read="false"]`, `[data-sender="agent"]`. The donut button is an empty `<button aria-label="Menu">` for you to draw.

## 5. Routes

| Path | Page | Access |
|---|---|---|
| `/` | Landing (video background, headline, donut menu) | public |
| `/collections`, `/collections/:idOrSlug` | Collections (+ archive tab), collection with filters | public |
| `/pieces`, `/pieces/:idOrSlug` | All pieces with price/date/release filters; piece detail + add to cart | public |
| `/museum`, `/community`, `/community/:id`, `/team`, `/collaborations` | Gallery, news/discussions/comments, team + org chart + map data, placeholder | public |
| `/verify/:code` | QR-code landing page: verify and claim a piece | public (claim needs sign-in) |
| `/cart`, `/support`, `/login`, `/register`, `/forgot-password` | | public |
| `/checkout`, `/checkout/complete` | Address → create order → Paystack → confirm | signed in |
| `/account`, `/account/orders[/:id]`, `/account/consultations[/new|/:id]`, `/account/inbox` | Profile, orders, bookings, inbox | signed in |
| `/closet`, `/closet/:id` | Private digital closet | signed in |
| `/admin` … | Overview, collections, pieces, orders, consultations, custom pieces, QR codes, messages, support chats, museum, community, team, landing page, people & roles, audit log | staff, per permission |

## 6. Payment round-trip

`/checkout` → `POST /orders` → `POST /payments/initialize` → browser goes to Paystack → returns to `/checkout/complete?reference=…` → the page calls `GET /payments/verify/:reference`.
Set the Paystack webhook URL on the server as described in the server README.

## 7. Known gaps (by design)

* `/collaborations` is a placeholder: the server has no collaborations module yet.
* The map on `/team` renders the data as a list; plug it into your map library (country codes are ISO alpha-2).
* Support chat refreshes every 4 seconds (polling).
* Moderators can hide/delete posts, but the API has no endpoint to list hidden posts, so there is no "unhide" screen yet.
* Not covered: automated tests against a real Firebase project. The included checks ran against mocked API responses.

## 8. Linting note

`typescript-eslint` did not yet support TypeScript 7.0 when this was written. If `npm run lint` fails with
"typescript-eslint does not support TS 7.0", use TypeScript 5.9 or 6.x for linting. This is about your toolchain, not this code.
