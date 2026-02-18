
import type { Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export type UserRole = 'client' | 'admin' | 'superadmin' | 'picker' | 'purchaser' | 'salesperson' | 'customer';
export type UserStatus = 'active' | 'pending_approval' | 'blocked';
export type ClientTier = 'standard' | 'bronze' | 'silver' | 'gold';

// --- ORGANIZATIONS ---
export type OrganizationType = 'importer' | 'distributor' | 'wholesaler' | 'retailer';
export type OrganizationStatus = 'active' | 'suspended' | 'pending';

export interface AdminAgreements {
  catalog: boolean;
  operations: boolean;
  finance: boolean;
}

export interface StoreTestimonial {
  name: string;
  role: string;
  text: string;
  avatarUrl?: string;
}

export interface StoreConfig {
  enabled: boolean;
  themeColor?: string;
  logoUrl?: string;
  heroImage?: string;
  heroTitle?: { es: string; en: string };
  heroSubtitle?: { es: string; en: string };
  welcomeMessage?: { es: string; en: string };
  categoriesImages?: {
    fruits?: string;
    vegetables?: string;
    groceries?: string;
  };
  testimonials?: StoreTestimonial[];
  contactPhone?: string;
  contactWhatsapp?: string;
  contactEmail?: string;
  contactAddress?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  minOrderAmount?: number;
  newsletterEnabled?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  slug: string;
  ownerId: string;
  ownerEmail?: string; 
  adminAgreements?: AdminAgreements; 
  parentOrgId?: string;
  createdAt: Timestamp;
  contactEmail?: string;
  phone?: string;
  address?: string;
  storeConfig?: StoreConfig;
}

export interface OrganizationConnection {
  id: string;
  fromOrgId: string;
  toOrgId: string;
  status: 'pending' | 'accepted' | 'rejected';
  type: 'supplier-client';
  createdAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string;
  businessName: string;
  address: string;
  phone: string;
  role: UserRole;
  createdAt: Timestamp;
  status?: UserStatus;
  organizationId?: string;
  belongsToOrgId?: string; 
  contactPerson?: string;
  tier?: ClientTier;
  creditLimit?: number;
  paymentTerms?: string;
  priceList?: string;
  rewardPoints?: number;
  pushSubscription?: any;
}

export interface AdminInvite {
  email: string;
  role: UserRole;
  status: 'pending' | 'claimed';
  organizationId?: string; 
}

// --- CATALOG & OFFERS ---
export interface ProductCategory {
  es: string;
  en: string;
}

export interface ProductSupplier {
  supplierId: string;
  cost: number;
  isPrimary: boolean;
  supplierProductName?: string;
}

export interface Product {
  id: string;
  organizationId: string;
  name: { es: string; en: string; };
  sku: string;
  description?: string;
  photoUrl?: string;
  category: ProductCategory;
  subcategory?: { es: string; en: string; };
  unit: { es: string; en: string; };
  isBox?: boolean;
  suppliers: ProductSupplier[];
  salePrice: number;
  pricingMethod?: 'margin' | 'markup';
  calculationDirection?: 'costToPrice' | 'priceToCost';
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: Timestamp;
}

export type OfferType = 'percentage' | 'fixedPrice' | 'liquidation' | 'combo';

export interface Offer {
  id: string;
  productId: string;
  productName: { es: string; en: string };
  productPhotoUrl?: string;
  productUnit: { es: string; en: string };
  originalPrice: number;
  type: OfferType;
  value: number;
  category: { es: string; en: string };
  expiresAt: Timestamp;
  createdAt: Timestamp;
  comboProductIds?: string[];
}

export interface OfferCategory {
  id: string;
  name: { es: string; en: string };
}

// --- SALES & PROSPECTS ---
export type ProspectStatus = 'pending' | 'contacted' | 'visited' | 'client' | 'not_interested';

export interface ProspectVisit {
  id: string;
  date: Timestamp;
  notes: string;
  outcome: 'successful' | 'follow-up' | 'no_show';
}

export interface Prospect {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  phone?: string;
  web?: string;
  category: string;
  ethnic: string;
  zone?: string;
  status: ProspectStatus;
  priority: boolean;
  notes?: string;
  potentialValue?: number;
  salespersonId: string;
  lat?: number | null;
  lng?: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ClientNote {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
}

// --- FINANCE & PRICING ---
export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  status: 'open' | 'paid' | 'overdue';
  invoiceDate: Timestamp;
  dueDate: Timestamp;
}

export interface PriceListTier {
  from: number;
  to: number | null;
  discount: number;
}

export interface PriceList {
  id: string;
  name: string;
  tiers: PriceListTier[];
}

// --- PROCUREMENT ---
export interface PurchaseOrderItem {
  productId: string;
  name: string;
  orderedQty: number;
  receivedQty?: number;
  price: number;
}

export interface PurchaseOrder {
  id: string;
  poId: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  discountInfo?: any;
  total: number;
  status: 'pending' | 'completed';
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// --- SUPPLIERS ---
export interface SupplierContact {
  id?: string;
  department: string;
  name: string;
  phone: string;
  isWhatsapp: boolean;
}

export interface SupplierDiscount {
  id?: string;
  type: 'amount' | 'quantity' | 'monthlyVolume';
  scope: 'order' | 'product';
  productId?: string;
  from: number;
  discount: number;
}

export interface Supplier {
  id: string;
  organizationId: string;
  linkedOrgId?: string;
  name: string;
  category: string;
  email: string;
  address: string;
  deliveryDays: string;
  paymentTerms: string;
  rating: number;
  status: 'active' | 'inactive';
  verified: boolean;
  notes?: string;
  contacts: SupplierContact[];
  volumeDiscounts?: SupplierDiscount[];
  finance: {
    pendingBalance: number;
    ytdSpend: number;
    fillRate: number;
    onTimeDelivery: boolean;
  };
}

// --- ORDERS ---
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: { es: string; en: string; };
  quantity: number;
  price: number;
  isBox?: boolean;
}

export interface Order {
  id: string;
  organizationId: string;
  userId: string;
  businessName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Timestamp;
  deliveryDate?: Timestamp;
  shippingAddress: string;
  discountApplied?: number;
  notes?: {
    general?: string;
    items?: Record<string, string>;
  };
}

// --- REWARDS ---
export interface Reward {
  id: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  pointCost: number;
  iconName: string;
  color: string;
}

export interface RewardTier {
  id: string;
  name: { es: string; en: string };
  minPoints: number;
  iconName: string;
}

export interface RewardRule {
  id: string;
  name: { es: string; en: string };
  ruleType: 'pointsPerDollar' | 'bonusForAmount' | 'fixedPointsPerOrder' | 'bonusForProduct' | 'multiplierPerDay' | 'firstOrderBonus' | 'anniversaryBonus' | 'bonusForVariety' | 'bonusForCategory' | 'consecutiveBonus';
  points?: number;
  amount?: number;
  perAmount?: number;
  multiplier?: number;
  productId?: string;
  category?: ProductCategory;
  dayOfWeek?: number;
  weeks?: number;
  isActive: boolean;
}

export interface RewardActivity {
  id: string;
  description: string;
  points: number;
  createdAt: Timestamp;
}

// --- SUPPORT & NOTIFICATIONS ---
export interface SupportTicket {
  id: string;
  organizationId?: string;
  userId: string;
  userName: string;
  issueType: string;
  orderId?: string;
  details: string;
  photoUrl?: string;
  status: 'new' | 'in_progress' | 'resolved';
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Timestamp;
  data: {
    url: string;
  };
}

export interface Branch {
  id: string;
  alias: string;
  address: string;
  city: string;
  manager: string;
}

export type { User };
