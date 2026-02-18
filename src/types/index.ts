
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
  belongsToOrgId?: string; // Para consumidores (customers)
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

// --- CATALOG ---
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

export interface SupplierContact {
  id: string;
  department: string;
  name: string;
  phone: string;
  isWhatsapp: boolean;
}

export interface SupplierDiscount {
  id: string;
  type: 'amount' | 'quantity' | 'monthlyVolume';
  scope: 'order' | 'product';
  productId?: string;
  from: number;
  discount: number;
}

export interface Supplier {
  id: string;
  organizationId: string;
  linkedOrgId?: string; // ID del edificio MercaFlow vinculado
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

export type { User };
