export const WAREHOUSE_UI = {
  header: {
    title: 'Central Warehouse & Pallet Ledger',
    subtitle:
      'Wholesale Logistics Hub · Inbound Lots, Pallet Multipliers & Cubic Volume Allocations',
    backButton: 'Return to Storefront',
    dockButton: 'Dock Inbound Pallet',
    posButton: 'POS Dispatch',
  },
  zones: [
    { key: 'all', label: 'All Bays' },
    { key: 'cold', label: 'Cold Racks' },
    { key: 'dry', label: 'Dry Pallets' },
  ],
  kpis: {
    pallets: 'Pallets (L3)',
    cartons: 'Master Cartons (L2)',
    volume: 'Occupied Volume',
    depleted: 'Depleted',
  },
  searchPlaceholder: 'Search bay ID, lot code, master SKU, or product...',
  statusFilters: [
    { key: 'all', label: 'All Stock' },
    { key: 'nominal', label: 'Nominal' },
    { key: 'low', label: 'Low' },
    { key: 'depleted', label: 'Depleted' },
  ],
  tableHeaders: [
    { key: 'bay', label: 'Storage Bay & Lot', width: '14%' },
    { key: 'sku', label: 'Master SKU', width: '13%' },
    { key: 'specs', label: 'Product Specifications', width: '25%' },
    { key: 'cbm', label: 'Occupancy (m³)', width: '13%' },
    { key: 'matrix', label: 'Pallet & Carton Matrix', width: '15%' },
    { key: 'stock', label: 'Bulk Balance', width: '10%' },
    { key: 'status', label: 'Lot Status', width: '10%' },
  ],
  emptyState: {
    text: 'No warehouse inventory matches your filters',
    resetButton: 'Reset Filters',
  },
  modal: {
    eyebrow: 'Direct Warehouse PO',
    title: 'Inbound Pallet & Lot Intake',
    submitButton: 'Confirm & Dock Freight into Commissary',
  },
}
