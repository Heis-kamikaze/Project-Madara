/**
 * Shapes returned by the Aradam API (/server). Dates are ISO-8601 strings.
 * Keep in sync with server/src/types/models.ts.
 */

export interface ApiEnvelope<T> {
  data: T
  meta?: Record<string, unknown>
}

// ── Roles & permissions ──────────────────────────────────────────────
export const ROLES = ['owner', 'admin', 'manager', 'editor', 'support', 'customer'] as const
export type Role = (typeof ROLES)[number]

export const PERMISSIONS = [
  'site:write',
  'media:upload',
  'collections:write',
  'products:write',
  'orders:read',
  'orders:write',
  'consultations:read',
  'consultations:write',
  'closet:manage',
  'authenticity:manage',
  'inbox:send',
  'museum:write',
  'community:write',
  'community:moderate',
  'team:write',
  'support:read',
  'support:reply',
  'users:read',
  'users:manage-roles',
  'analytics:read',
  'audit:read',
] as const
export type Permission = (typeof PERMISSIONS)[number]

// ── Users ────────────────────────────────────────────────────────────
export interface Address {
  fullName?: string
  phone?: string
  line1: string
  line2?: string
  city: string
  state: string
  country: string
  postalCode?: string
}

export interface UserProfile {
  id: string
  email: string | null
  displayName: string | null
  phone?: string | null
  address?: Address | null
  marketingOptIn?: boolean
  role: Role
  createdAt: string
  updatedAt: string
}

export interface AuthMe {
  uid: string
  email: string | null
  emailVerified: boolean
  role: Role
  permissions: Permission[]
  profile: UserProfile | null
}

// ── Site ─────────────────────────────────────────────────────────────
export interface NavItem {
  key: string
  label: string
  path: string
}

export interface LandingConfig {
  heroVideoUrl: string | null
  heroPosterUrl: string | null
  headline: string
  subheadline: string | null
  featuredCollectionId: string | null
  navigation: NavItem[]
}

// ── Catalogue ────────────────────────────────────────────────────────
export type CollectionStatus = 'draft' | 'active' | 'archived'
export type Availability = 'upcoming' | 'live' | 'ended'

export interface Collection {
  id: string
  slug: string
  title: string
  story: string
  coverImageUrl: string | null
  status: CollectionStatus
  availableFrom: string | null
  availableUntil: string | null
  archivedAt?: string | null
  archiveReason?: 'expired' | 'sold_out' | 'manual' | null
  availability: Availability
  orderable: boolean
  createdAt: string
  updatedAt: string
}

export type ProductStatus = 'draft' | 'active' | 'sold_out' | 'archived'

export interface CollectionSummary {
  id: string
  title: string
  slug: string
  status: CollectionStatus
  availability: Availability
}

export interface Product {
  id: string
  collectionId: string | null
  slug: string
  title: string
  story: string
  priceNgn: number
  currency: 'NGN'
  colorName: string
  colorHex?: string | null
  sizes: string[]
  imageUrls: string[]
  stock: number
  status: ProductStatus
  releaseAt: string | null
  orderable: boolean
  collection: CollectionSummary | null
  createdAt: string
  updatedAt: string
}

/** Pieces inside GET /collections/:id are the raw documents (no `orderable`/`collection`). */
export type CollectionPiece = Omit<Product, 'orderable' | 'collection'>

// ── Orders & payments ────────────────────────────────────────────────
export interface OrderItem {
  productId: string
  collectionId: string | null
  title: string
  imageUrl: string | null
  size: string | null
  quantity: number
  unitPriceNgn: number
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'needs_attention'
  | 'cancelled'
  | 'refunded'

export interface Order {
  id: string
  orderNumber: string
  userId: string
  userEmail: string | null
  items: OrderItem[]
  subtotalNgn: number
  shippingFeeNgn: number
  totalNgn: number
  currency: 'NGN'
  shippingAddress: Address
  notes?: string | null
  status: OrderStatus
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  paymentReference: string | null
  paidAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface InitializedPayment {
  authorizationUrl: string
  accessCode: string
  reference: string
  amountNgn: number
}

export interface PaymentVerification {
  paid: boolean
  orderId: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: Order['paymentStatus']
}

// ── Consultations ────────────────────────────────────────────────────
export type ConsultationType = 'custom_piece' | 'measurements' | 'fitting' | 'general'
export type ConsultationStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled'

export interface Consultation {
  id: string
  userId: string
  userEmail: string | null
  type: ConsultationType
  isCustom: boolean
  requestedSlot: string
  scheduledAt: string | null
  notes: string | null
  measurements: Record<string, number> | null
  referenceImageUrls: string[]
  status: ConsultationStatus
  adminNotes?: string | null
  createdAt: string
  updatedAt: string
}

// ── Closet & authenticity ────────────────────────────────────────────
export type ClosetStatus = 'in_production' | 'ready' | 'delivered' | 'owned'

export interface ClosetItem {
  id: string
  source: 'purchase' | 'custom'
  title: string
  story: string | null
  imageUrls: string[]
  productId: string | null
  consultationId: string | null
  authenticityCode: string | null
  authenticated: boolean
  status: ClosetStatus
  isFavorite: boolean
  position: { x: number; y: number } | null
  notes: string | null
  addedAt: string
  updatedAt: string
}

export interface AuthenticityCode {
  id: string
  code: string
  productId: string | null
  closetItemId: string | null
  ownerUid: string | null
  title: string
  imageUrl: string | null
  story: string | null
  qrUrl: string
  status: 'unclaimed' | 'claimed'
  claimedBy: string | null
  claimedAt: string | null
  createdAt: string
}

export type VerifyResult =
  | { valid: false }
  | { valid: true; claimed: boolean; title: string; imageUrl: string | null; story: string | null }

export interface ClaimResult {
  closetItemId: string | null
  alreadyClaimed: boolean
  locationRegistered: boolean
}

export interface MapRegion {
  country: string
  state: string | null
  count: number
}

// ── Inbox ────────────────────────────────────────────────────────────
export type InboxType = 'order' | 'consultation' | 'production' | 'system' | 'support' | 'general'

export interface InboxMessage {
  id: string
  type: InboxType
  title: string
  body: string
  link: string | null
  read: boolean
  emailedAt: string | null
  createdAt: string
}

// ── Community, museum, team ──────────────────────────────────────────
export type PostType = 'news' | 'campaign' | 'discussion'

export interface Post {
  id: string
  type: PostType
  title: string
  body: string
  coverImageUrl: string | null
  authorId: string
  authorName: string
  status: 'published' | 'hidden'
  pinned: boolean
  commentCount: number
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface PostComment {
  id: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
}

export interface MuseumEntry {
  id: string
  title: string
  story: string
  imageUrls: string[]
  clientConsent: boolean
  published: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  name: string
  title: string
  bio: string | null
  portraitUrl: string | null
  parentId: string | null
  order: number
  createdAt: string
  updatedAt: string
}

export type TeamNode = TeamMember & { children: TeamNode[] }

// ── Support ──────────────────────────────────────────────────────────
export interface SupportConversation {
  id: string
  userId: string
  userName: string | null
  status: 'open' | 'resolved'
  mode: 'ai' | 'agent'
  assignedTo: string | null
  lastMessageAt: string
  lastMessagePreview: string
  createdAt: string
}

export interface SupportMessage {
  id: string
  sender: 'user' | 'agent' | 'ai' | 'system'
  senderId: string | null
  text: string
  createdAt: string
}

// ── Admin ────────────────────────────────────────────────────────────
export interface AdminStats {
  orders: { total: number; paid: number; pendingPayment: number; needsAttention: number; revenueNgn: number }
  pieces: { active: number; soldOut: number }
  collections: { active: number; archived: number }
  consultations: { requested: number; confirmed: number }
  support: { openConversations: number }
  customers: number
}

export interface AuditLog {
  id: string
  actorUid: string | null
  actorEmail: string | null
  actorRole: Role | null
  action: string
  entity: string
  entityId: string
  meta: Record<string, unknown> | null
  createdAt: string
}

export interface RoleMatrixRow {
  role: Role
  permissions: Permission[]
}

export interface UploadedFile {
  path: string
  url: string
  contentType: string
  bytes: number
}
