import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth, RequirePermission, RequireStaff } from './auth/guards'
import AdminLayout from './components/layout/AdminLayout'
import RootLayout from './components/layout/RootLayout'
import RouteError from './components/layout/RouteError'
import Loading from './components/ui/Loading'

/** Code-splits a page: it is downloaded the first time its route is visited. */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default })

const collectionForm = page(() => import('./pages/admin/AdminCollectionFormPage'))
const productForm = page(() => import('./pages/admin/AdminProductFormPage'))

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    // Shown while the first lazy page chunk downloads on a fresh page load.
    hydrateFallbackElement: <Loading />,
    children: [
      // ── Public ────────────────────────────────────────────────
      { index: true, lazy: page(() => import('./pages/LandingPage')) },
      { path: 'collections', lazy: page(() => import('./pages/CollectionsPage')) },
      { path: 'collections/:idOrSlug', lazy: page(() => import('./pages/CollectionPage')) },
      { path: 'pieces', lazy: page(() => import('./pages/PiecesPage')) },
      { path: 'pieces/:idOrSlug', lazy: page(() => import('./pages/ProductPage')) },
      { path: 'museum', lazy: page(() => import('./pages/MuseumPage')) },
      { path: 'community', lazy: page(() => import('./pages/CommunityPage')) },
      { path: 'community/:id', lazy: page(() => import('./pages/PostPage')) },
      { path: 'team', lazy: page(() => import('./pages/TeamPage')) },
      { path: 'collaborations', lazy: page(() => import('./pages/CollaborationsPage')) },
      { path: 'verify/:code', lazy: page(() => import('./pages/VerifyPage')) },
      { path: 'cart', lazy: page(() => import('./pages/CartPage')) },
      { path: 'support', lazy: page(() => import('./pages/SupportPage')) },
      { path: 'login', lazy: page(() => import('./pages/LoginPage')) },
      { path: 'register', lazy: page(() => import('./pages/RegisterPage')) },
      { path: 'forgot-password', lazy: page(() => import('./pages/ForgotPasswordPage')) },

      // ── Signed-in customers ───────────────────────────────────
      {
        element: <RequireAuth />,
        children: [
          { path: 'checkout', lazy: page(() => import('./pages/CheckoutPage')) },
          { path: 'checkout/complete', lazy: page(() => import('./pages/CheckoutCompletePage')) },
          { path: 'account', lazy: page(() => import('./pages/AccountPage')) },
          { path: 'account/orders', lazy: page(() => import('./pages/OrdersPage')) },
          { path: 'account/orders/:id', lazy: page(() => import('./pages/OrderPage')) },
          { path: 'account/consultations', lazy: page(() => import('./pages/ConsultationsPage')) },
          { path: 'account/consultations/new', lazy: page(() => import('./pages/NewConsultationPage')) },
          { path: 'account/consultations/:id', lazy: page(() => import('./pages/ConsultationPage')) },
          { path: 'account/inbox', lazy: page(() => import('./pages/InboxPage')) },
          { path: 'closet', lazy: page(() => import('./pages/ClosetPage')) },
          { path: 'closet/:id', lazy: page(() => import('./pages/ClosetItemPage')) },
        ],
      },

      // ── Staff tools (same site; each group needs a permission) ──
      {
        path: 'admin',
        element: <RequireStaff />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, lazy: page(() => import('./pages/admin/AdminDashboardPage')) },
              {
                element: <RequirePermission permission="collections:write" />,
                children: [
                  { path: 'collections', lazy: page(() => import('./pages/admin/AdminCollectionsPage')) },
                  { path: 'collections/new', lazy: collectionForm },
                  { path: 'collections/:id', lazy: collectionForm },
                ],
              },
              {
                element: <RequirePermission permission="products:write" />,
                children: [
                  { path: 'pieces', lazy: page(() => import('./pages/admin/AdminProductsPage')) },
                  { path: 'pieces/new', lazy: productForm },
                  { path: 'pieces/:id', lazy: productForm },
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

      { path: '*', lazy: page(() => import('./pages/NotFoundPage')) },
    ],
  },
])
