
import type { Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export type UserRole = 'client' | 'admin' | 'superadmin' | 'picker' | 'purchaser' | 'salesperson';
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

export interface StoreConfig {
  enabled: boolean;
  themeColor?: string;
  welcomeMessage?: { es: string; en: string };
  logoUrl?: string;
  allowDelivery?: boolean;
  minOrderAmount?: number;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  slug: string;
  ownerId: string;
  ownerEmail?: string; // Correo reservado para el cliente
  adminAgreements?: AdminAgreements; // Permisos otorgados al Super Admin
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
  organizationId?: string; // Para vincular directamente al edificio
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
