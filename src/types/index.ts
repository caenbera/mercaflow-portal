import type { Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
export type UserRole = 'client' | 'admin' | 'superadmin' | 'picker' | 'purchaser' | 'salesperson';
export type UserStatus = 'active' | 'pending_approval' | 'blocked';
export type ClientTier = 'standard' | 'bronze' | 'silver' | 'gold';

export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
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
  contactPerson?: string;
  tier?: ClientTier;
  creditLimit?: number;
  paymentTerms?: string;
  priceList?: string;
  rewardPoints?: number;
  creditBalance?: number;
  pushSubscription?: PushSubscriptionJSON | null;
}


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
  name: {
    es: string;
    en: string;
  };
  sku: string;
  description?: string;
  photoUrl?: string;
  category: ProductCategory;
  subcategory?: {
    es: string;
    en: string;
  };
  unit: {
    es: string;
    en: string;
  };
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

export type ProductInput = Omit<Product, 'id' | 'createdAt'>;

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: {
    es: string;
    en: string;
  };
  quantity: number;
  price: number; // This is the price at the time of order
  isBox?: boolean;
}

export interface Order {
  id: string;
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

// NEW TYPES
export interface SupplierContact {
  id?: string;
  department: string;
  name: string;
  phone: string;
  isWhatsapp: boolean;
}

export interface SupplierDiscount {
  id: string; // For react key
  type: 'amount' | 'quantity' | 'monthlyVolume';
  scope: 'order' | 'product';
  productId?: string;
  from: number;
  discount: number;
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
  volumeDiscounts?: SupplierDiscount[];
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

export interface PriceListTier {
  from: number;
  to: number | null;
  discount: number;
}

export interface PriceList {
  id: string;
  name: string;
  tiers: PriceListTier[];
  description?: string;
}


export interface AdminInvite {
  email: string;
  role: UserRole;
  status: 'pending' | 'claimed';
}

export interface OfferCategory {
  id: string;
  name: {
    es: string;
    en: string;
  };
}

export type OfferType = 'percentage' | 'fixedPrice' | 'liquidation' | 'combo';

export interface Offer {
  id: string;
  productId: string;
  productName: { es: string; en: string; };
  productPhotoUrl?: string;
  productUnit: { es: string; en: string; };
  originalPrice: number;
  type: OfferType;
  value: number; // For percentage or fixed price
  comboProductIds?: string[];
  category: OfferCategory['name'];
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

export interface RewardTier {
  id: string;
  name: { es: string; en: string; };
  minPoints: number;
  iconName: string;
}

export interface Reward {
  id:string;
  name: { es: string; en: string; };
  description: { es: string; en: string; };
  pointCost: number;
  iconName: string;
  color: string;
}

export type RewardRuleType =
  | 'pointsPerDollar'
  | 'bonusForAmount'
  | 'fixedPointsPerOrder'
  | 'bonusForProduct'
  | 'multiplierPerDay'
  | 'firstOrderBonus'
  | 'anniversaryBonus'
  | 'bonusForVariety'
  | 'bonusForCategory'
  | 'consecutiveBonus';

export interface RewardRule {
  id: string;
  name: { es: string; en: string; };
  ruleType: RewardRuleType;
  points?: number;      // For fixed points, bonus
  amount?: number;      // For dollar thresholds
  perAmount?: number;   // For pointsPerDollar
  multiplier?: number;  // For multipliers
  productId?: string;   // For product-specific bonus
  category?: ProductCategory; // For category-specific bonus
  dayOfWeek?: number;   // For day-specific multiplier
  weeks?: number;       // For consecutive bonus
  isActive: boolean;
}

export interface RewardActivity {
  id: string;
  description: string;
  points: number;
  createdAt: Timestamp;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  issueType: string;
  orderId?: string;
  details: string;
  photoUrl?: string;
  status: 'new' | 'in_progress' | 'resolved';
  createdAt: Timestamp;
}

export type InvoiceStatus = 'paid' | 'open' | 'overdue';

export interface Invoice {
  id: string;
  orderId: string;
  userId: string;
  invoiceDate: Timestamp;
  dueDate: Timestamp;
  amount: number;
  status: InvoiceStatus;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  data: {
    url: string;
  };
  read: boolean;
  createdAt: Timestamp;
}

export interface PurchaseOrderItem {
  productId: string;
  name: string;
  orderedQty: number;
  receivedQty?: number;
  price: number;
}

export type PurchaseOrderStatus = 'pending' | 'completed' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  poId: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  discountInfo: {
    appliedDiscount: {
      description: string;
      amount: number;
    } | null;
    opportunities: string[];
  };
  total: number;
  status: PurchaseOrderStatus;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export type ProspectStatus = 'pending' | 'contacted' | 'visited' | 'client' | 'not_interested';

export interface Prospect {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  lat?: number | null;
  lng?: number | null;
  phone?: string;
  web?: string;
  zone?: string;
  category: 'Restaurante' | 'Supermercado' | 'Carnicería' | 'Otro';
  ethnic: 'mexicano' | 'peruano' | 'colombiano' | 'ecuatoriano' | 'venezolano' | 'salvadoreno' | 'guatemalteco' | 'otro';
  status: ProspectStatus;
  priority: boolean;
  salespersonId: string; // ID of the user with 'salesperson' role
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  potentialValue?: number;
}

export interface ProspectVisit {
    id: string;
    date: Timestamp;
    notes: string;
    outcome: 'successful' | 'follow-up' | 'no_show';
}


// Exporting Firebase User type for components
export type { User };