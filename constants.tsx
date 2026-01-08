
import { InventoryItem, Transaction, Staff } from './types';

export const INITIAL_CATEGORIES = ['電子產品', '家具', '服飾', '食品', '工具', '其他'];
export const INITIAL_WAREHOUSES = ['P2 倉', 'P3 倉'];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'MacBook Pro 14', sku: 'MBP-14-2023', category: '電子產品', quantity: 45, minThreshold: 10, price: 59000, warehouse: 'P2 倉', lastUpdated: '2023-10-25' },
  { id: '2', name: 'Ergonomic Chair', sku: 'CH-ERG-01', category: '家具', quantity: 8, minThreshold: 15, price: 4500, warehouse: 'P3 倉', lastUpdated: '2023-10-24' },
  { id: '3', name: 'USB-C Cable 2m', sku: 'ACC-USBC-02', category: '電子產品', quantity: 200, minThreshold: 50, price: 390, warehouse: 'P2 倉', lastUpdated: '2023-10-26' },
];

export const RECENT_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-MAINT-001',
    itemId: '1',
    itemName: 'MacBook Pro 14 [MBP-14-2023]',
    type: 'OUT',
    label: '維修撥出',
    quantity: 2,
    priceAtTime: 59000,
    date: new Date().toLocaleString('zh-TW', { hour12: false }),
    operator: '系統管理員'
  }
];

export const INITIAL_STAFF: Staff[] = [];
