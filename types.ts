
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minThreshold: number;
  price: number;
  warehouse: string;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT';
  label?: string;
  quantity: number;
  priceAtTime: number;
  date: string;
  operator: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Inactive';
  avatar: string;
  lastLogin: string;
}

export interface DashboardStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  recentTransactions: Transaction[];
}

// Added BOMItem and BOMTemplate interfaces to support automated deduction features and fix import errors
export interface BOMItem {
  sku: string;
  quantityPerKit: number;
}

export interface BOMTemplate {
  id: string;
  name: string;
  description: string;
  items: BOMItem[];
}
