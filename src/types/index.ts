import type { Timestamp, User } from 'firebase/firestore';

export type UserRole = 'client' | 'admin' | 'superadmin' | 'picker';

export interface UserProfile {
  uid: string;
  email: string;
  businessName: string;
  address: string;
  phone: string;
  role: UserRole;
  createdAt: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  photoUrl: string;
  category: string;
  unit: string;
  supplierId: string;
  cost: number;
  salePrice: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: Timestamp;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
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
export interface Supplier {
  id: string;
  name: string;
  category: string;
  logo: string;
  contact: {
    name: string;
    phone: string;
    email: string;
  };
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

export interface Client {
  id: string;
  name: string;
  tier: 'gold' | 'silver' | 'bronze';
  contact: string;
  email: string;
  creditLimit: number;
  creditUsed: number;
  totalSales: number;
  status: 'active' | 'inactive' | 'blocked';
  color: string;
  address: string;
  gateCode?: string;
  paymentTerms: string;
  priceList: string;
  memberSince: number;
}

export interface ClientNote {
  author: string;
  date: string;
  text: string;
  color: string;
}

export interface Branch {
  id: string;
  alias: string;
  address: string;
  city: string;
  manager: string;
}

// Exporting Firebase User type for components
export type { User };
