import type { Timestamp, User } from 'firebase/firestore';

export type UserRole = 'client' | 'admin' | 'superadmin' | 'picker';
export type UserStatus = 'active' | 'pending_approval' | 'blocked';
export type ClientTier = 'standard' | 'bronze' | 'silver' | 'gold';


export interface UserProfile {
  uid: string;
  email: string;
  businessName: string;
  address: string;
  phone: string;
  role: UserRole;
  createdAt: Timestamp;
  status?: UserStatus;
  contactPerson?: string;
  tier?: ClientTier;
  creditLimit?: number;
  paymentTerms?: string; 
  priceList?: string; 
}


export interface ProductCategory {
  es: string;
  en: string;
}

export interface ProductSupplier {
  supplierId: string;
  cost: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: {
    es: string;
    en: string;
  };
  sku: string;
  description?: string;
  photoUrl?: string;
  category: ProductCategory;
  unit: {
    es: string;
    en: string;
  };
  suppliers: ProductSupplier[];
  salePrice: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: Timestamp;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: {
    es: string;
    en: string;
  };
  quantity: number;
  price: number; // This is the price at the time of order
}

export interface Order {
  id: string;
  userId: string;
  businessName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Timestamp;
  shippingAddress: string;
}

// NEW TYPES
export interface SupplierContact {
  id?: string;
  department: string;
  name: string;
  phone: string;
  isWhatsapp: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  email: string;
  address: string;
  contacts: SupplierContact[];
  rating: number;
  deliveryDays: string;
  paymentTerms: string; 
  status: 'active' | 'inactive';
  verified: boolean;
  notes?: string;
  finance: {
    pendingBalance: number;
    ytdSpend: number;
    fillRate: number;
    onTimeDelivery: boolean;
  };
}

export interface SupplierProduct {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  purchaseUnit: string; 
  currentCost: number;
  previousCost: number | null;
  stockStatus: 'available' | 'limited' | 'unavailable';
}

export interface ClientNote {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Timestamp;
}

export interface Branch {
  id: string;
  alias: string;
  address: string;
  city: string;
  manager: string;
}

export interface PriceList {
  name: string;
  discount: number;
  description: string;
}

// Exporting Firebase User type for components
export type { User };
