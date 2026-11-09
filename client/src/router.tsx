import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth, RequirePermission, RequireStaff } from './auth/guards'
import AdminLayout from './components/layout/AdminLayout'
import type { PageHandle } from './components/layout/pageMeta'
import RootLayout from './components/layout/RootLayout'
import RouteError from './components/layout/RouteError'
import Loading from './components/ui/Loading'

/** Code-splits a page: it is downloaded the first time its route is visited. */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default })

/**
 * `handle` tells the Topbar what to show:
 *   main(title)       → hamburger + title + search icon on small screens
 *   sub(title, back)  → back arrow + title on small screens; `back` is used when there is no in-app history
 */
const main = (title: string, extra: Partial<PageHandle> = {}): PageHandle => ({ title, kind: 'main', ...extra })
const sub = (title: string, back: string): PageHandle => ({ title, kind: 'sub', back })

const collectionForm = page(() => import('./pages/admin/AdminCollectionFormPage'))
const productForm = page(() => import('./pages/admin/AdminProductFormPage'))

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    // Shown while the first lazy page chunk downloads on a fresh page load.
    hydrateFallbackElement: <Loading />,
    children: [
      // ── Main pages ────────────────────────────────────────────
      { index: true, handle: main('ARADAM', { home: true }), lazy: page(() => import('./pages/LandingPage')) },
      { path: 'collections', handle: main('Collections'), lazy: page(() => import('./pages/CollectionsPage')) },
      { path: 'pieces', handle: main('Singles'), lazy: page(() => import('./pages/PiecesPage')) },
      { path: 'collaborations', handle: main('Collaborations'), lazy: page(() => import('./pages/CollaborationsPage')) },
      { path: 'museum', handle: main('Museum'), lazy: page(() => import('./pages/MuseumPage')) },
      { path: 'community', handle: main('Community'), lazy: page(() => import('./pages/CommunityPage')) },
      { path: 'world', handle: main('World of Aradam'), lazy: page(() => import('./pages/WorldPage')) },
      { path: 'team', handle: main('The Team'), lazy: page(() => import('./pages/TeamPage')) },
      { path: 'about', handle: main('About Us'), lazy: page(() => import('./pages/AboutPage')) },
      { path: 'verify/:code', handle: main('Authentication'), lazy: page(() => import('./pages/VerifyPage')) },
      { path: 'support', handle: main('Help'), lazy: page(() => import('./pages/SupportPage')) },

      // ── Sub-pages (public) ────────────────────────────────────
      { path: 'collections/:idOrSlug', handle: sub('Collections', '/collections'), lazy: page(() => import('./pages/CollectionPage')) },
      { path: 'pieces/:idOrSlug', handle: sub('Singles', '/pieces'), lazy: page(() => import('./pages/ProductPage')) },
      { path: 'community/:id', handle: sub('Community', '/community'), lazy: page(() => import('./pages/PostPage')) },
      { path: 'cart', handle: sub('Your Bag', '/pieces'), lazy: page(() => import('./pages/CartPage')) },
      { path: 'login', handle: sub('Sign in', '/'), lazy: page(() => import('./pages/LoginPage')) },
      { path: 'register', handle: sub('Create account', '/'), lazy: page(() => import('./pages/RegisterPage')) },
      { path: 'forgot-password', handle: sub('Reset password', '/login'), lazy: page(() => import('./pages/ForgotPasswordPage')) },

      // ── Signed-in customers ───────────────────────────────────
      {
        element: <RequireAuth />,
        children: [
          { path: 'checkout', handle: sub('Checkout', '/cart'), lazy: page(() => import('./pages/CheckoutPage')) },
          { path: 'checkout/complete', handle: main('Payment'), lazy: page(() => import('./pages/CheckoutCompletePage')) },
          { path: 'account', handle: main('Account'), lazy: page(() => import('./pages/AccountPage')) },
          { path: 'account/orders', handle: sub('Orders', '/account'), lazy: page(() => import('./pages/OrdersPage')) },
          { path: 'account/orders/:id', handle: sub('Order', '/account/orders'), lazy: page(() => import('./pages/OrderPage')) },
          { path: 'account/consultations', handle: sub('Private Salon', '/account'), lazy: page(() => import('./pages/ConsultationsPage')) },
          { path: 'account/consultations/new', handle: sub('Private Salon', '/account/consultations'), lazy: page(() => import('./pages/NewConsultationPage')) },
          { path: 'account/consultations/:id', handle: sub('Private Salon', '/account/consultations'), lazy: page(() => import('./pages/ConsultationPage')) },
          { path: 'account/inbox', handle: main('Inbox'), lazy: page(() => import('./pages/InboxPage')) },
          { path: 'closet', handle: main('Closet'), lazy: page(() => import('./pages/ClosetPage')) },
          { path: 'closet/:id', handle: sub('Closet', '/closet'), lazy: page(() => import('./pages/ClosetItemPage')) },
        ],
      },

      // ── Staff tools (same site; each group needs a permission) ──
      {
        path: 'admin',
        element: <RequireStaff />,
        handle: main('Admin'),
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, lazy: page(() => import('./pages/admin/AdminDashboardPage')) },
              {
                element: <RequirePermission permission="collections:write" />,
                children: [
                  { path: 'collections', lazy: page(() => import('./pages/admin/AdminCollectionsPage')) },
                  { path: 'collections/new', handle: sub('Collection', '/admin/collections'), lazy: collectionForm },
                  { path: 'collections/:id', handle: sub('Collection', '/admin/collections'), lazy: collectionForm },
                ],
              },
              {
                element: <RequirePermission permission="products:write" />,
                children: [
                  { path: 'pieces', lazy: page(() => import('./pages/admin/AdminProductsPage')) },
                  { path: 'pieces/new', handle: sub('Piece', '/admin/pieces'), lazy: productForm },
                  { path: 'pieces/:id', handle: sub('Piece', '/admin/pieces'), lazy: productForm },
                ],
              },
              {
                element: <RequirePermission permission="orders:read" />,
                children: [{ path: 'orders', lazy: page(() => import('./pages/admin/AdminOrdersPage')) }],
              },
              {
                element: <RequirePermission permission="consultations:read" />,
                children: [{ path: 'consultations', lazy: page(() => import('./pages/admin/AdminConsultationsPage')) }],
              },
              {
                element: <RequirePermission permission="closet:manage" />,
                children: [{ path: 'custom-pieces', lazy: page(() => import('./pages/admin/AdminCustomPiecesPage')) }],
              },
              {
                element: <RequirePermission permission="authenticity:manage" />,
                children: [{ path: 'authenticity', lazy: page(() => import('./pages/admin/AdminAuthenticityPage')) }],
              },
              {
                element: <RequirePermission permission="inbox:send" />,
                children: [{ path: 'messages', lazy: page(() => import('./pages/admin/AdminMessagesPage')) }],
              },
              {
                element: <RequirePermission permission="support:read" />,
                children: [{ path: 'support', lazy: page(() => import('./pages/admin/AdminSupportPage')) }],
              },
              {
                element: <RequirePermission permission="museum:write" />,
                children: [{ path: 'museum', lazy: page(() => import('./pages/admin/AdminMuseumPage')) }],
              },
              {
                element: <RequirePermission permission="community:write" />,
                children: [{ path: 'community', lazy: page(() => import('./pages/admin/AdminCommunityPage')) }],
              },
              {
                element: <RequirePermission permission="team:write" />,
                children: [{ path: 'team', lazy: page(() => import('./pages/admin/AdminTeamPage')) }],
              },
              {
                element: <RequirePermission permission="site:write" />,
                children: [{ path: 'site', lazy: page(() => import('./pages/admin/AdminSitePage')) }],
              },
              {
                element: <RequirePermission permission="users:read" />,
                children: [{ path: 'users', lazy: page(() => import('./pages/admin/AdminUsersPage')) }],
              },
              {
                element: <RequirePermission permission="audit:read" />,
                children: [{ path: 'audit', lazy: page(() => import('./pages/admin/AdminAuditPage')) }],
              },
            ],
          },
        ],
      },

      { path: '*', handle: sub('Not found', '/'), lazy: page(() => import('./pages/NotFoundPage')) },
    ],
  },
])
