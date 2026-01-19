import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'client' | 'admin' | 'superadmin';

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
  description: string;
  photoUrl: string;
  stock: number;
  price: number;
  category: string;
  createdAt: Timestamp;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
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