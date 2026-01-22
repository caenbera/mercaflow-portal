import type { PriceList } from '@/types';

export const priceLists: PriceList[] = [
  { name: 'Standard', discount: 0, description: 'Standard pricing for all customers.' },
  { name: 'Bronze', discount: 3, description: 'A 3% discount for our valued bronze partners.' },
  { name: 'Silver', discount: 7, description: 'A 7% discount for our committed silver partners.' },
  { name: 'Gold', discount: 12, description: 'A 12% discount for high-volume gold partners.' },
  { name: 'VIP', discount: 15, description: 'A 15% discount for our most strategic partners.' },
];
