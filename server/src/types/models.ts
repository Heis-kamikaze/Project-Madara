/**
 * Shapes of the documents the API returns (dates are ISO-8601 strings).
 * Firestore stores the same fields, with dates as Timestamps.
 */
import type { Role } from '../config/permissions';

export interface Address {
  fullName?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface UserProfile {
  id: string; // = Firebase uid
  email: string | null;
  displayName: string | null;
  phone?: string | null;
  address?: Address | null;
  marketingOptIn?: boolean;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export type CollectionStatus = 'draft' | 'active' | 'archived';
export type ArchiveReason = 'expired' | 'sold_out' | 'manual';

export interface Collection {
  id: string;
  slug: string;
  title: string;
  story: string;
  coverImageUrl: string | null;
  status: CollectionStatus;
  availableFrom: string | null;
  availableUntil: string | null;
  archivedAt?: string | null;
  archiveReason?: ArchiveReason | null;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'draft' | 'active' | 'sold_out' | 'archived';

export interface Product {
  id: string;
  collectionId: string | null;
  slug: string;
  title: string;
  story: string;
  priceNgn: number;
  currency: 'NGN';
  colorName: string;
  colorHex?: string | null;
  sizes: string[];
  imageUrls: string[];
  stock: number;
  status: ProductStatus;
  releaseAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  collectionId: string | null;
  title: string;
  imageUrl: string | null;
  size: string | null;
  quantity: number;
  unitPriceNgn: number;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'needs_attention'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string | null;
  items: OrderItem[];
  subtotalNgn: number;
  shippingFeeNgn: number;
  totalNgn: number;
  currency: 'NGN';
  shippingAddress: Address;
  notes?: string | null;
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentReference: string | null;
  stockDeducted: boolean;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ConsultationType = 'custom_piece' | 'measurements' | 'fitting' | 'general';
export type ConsultationStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export interface Consultation {
  id: string;
  userId: string;
  userEmail: string | null;
  type: ConsultationType;
  isCustom: boolean;
  requestedSlot: string;
  scheduledAt: string | null;
  notes: string | null;
  measurements: Record<string, number> | null;
  referenceImageUrls: string[];
  status: ConsultationStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ClosetStatus = 'in_production' | 'ready' | 'delivered' | 'owned';

export interface ClosetItem {
  id: string;
  source: 'purchase' | 'custom';
  title: string;
  story: string | null;
  imageUrls: string[];
  productId: string | null;
  consultationId: string | null;
  authenticityCode: string | null;
  authenticated: boolean;
  status: ClosetStatus;
  isFavorite: boolean;
  position: { x: number; y: number } | null;
  notes: string | null;
  addedAt: string;
  updatedAt: string;
}

export interface AuthenticityCode {
  id: string; // = the code itself
  code: string;
  productId: string | null;
  closetItemId: string | null;
  ownerUid: string | null;
  title: string;
  imageUrl: string | null;
  story: string | null;
  qrUrl: string;
  status: 'unclaimed' | 'claimed';
  claimedBy: string | null;
  claimedAt: string | null;
  createdAt: string;
}

export type InboxType = 'order' | 'consultation' | 'production' | 'system' | 'support' | 'general';

export interface InboxMessage {
  id: string;
  type: InboxType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  emailedAt: string | null;
  createdAt: string;
}

export type PostType = 'news' | 'campaign' | 'discussion';

export interface Post {
  id: string;
  type: PostType;
  title: string;
  body: string;
  coverImageUrl: string | null;
  authorId: string;
  authorName: string;
  status: 'published' | 'hidden';
  pinned: boolean;
  commentCount: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  portraitUrl: string | null;
  parentId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MuseumEntry {
  id: string;
  title: string;
  story: string;
  imageUrls: string[];
  clientConsent: boolean;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportConversation {
  id: string;
  userId: string;
  userName: string | null;
  status: 'open' | 'resolved';
  mode: 'ai' | 'agent';
  assignedTo: string | null;
  lastMessageAt: string;
  lastMessagePreview: string;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'agent' | 'ai' | 'system';
  senderId: string | null;
  text: string;
  createdAt: string;
}
