// src/views/transport/transportConfig.js

export const TRANSPORT_UI = {
  header: {
    backText: 'Back to Storefront',
    title: 'Operations & Transportation Ledger',
    subtitle:
      'Unified audit ledger recording storefront sales transactions, warehouse transports (WW, WS), and PO inward receiving',
    badgeSuffix: 'Records Logged',
    typewriter: {
      speed: 26,
      delay: 320,
    },
  },

  kpis: {
    total: 'Total Operations',
    ww: 'WW (Warehouse Transfers)',
    ws: 'WS (Store Restocks)',
    sales: 'Storefront Sales',
    intake: 'PO Stock Intake',
  },

  categories: [
    { key: 'ALL', label: 'All Operations' },
    { key: 'WW', label: 'WW', sublabel: 'Warehouse ➔ Warehouse' },
    { key: 'WS', label: 'WS', sublabel: 'Warehouse ➔ Storefront' },
    { key: 'SALES', label: 'Sales', sublabel: 'POS Outbound' },
    { key: 'INTAKE', label: 'Stock-In', sublabel: 'PO Inward Intake' },
  ],

  toolbar: {
    searchPlaceholder: 'Search reference, product, customer, carrier...',
    locationSelectTitle: 'Filter by Facility (W/S)',
    locationSelectPlaceholder: 'Select Location',
    allLocationsLabel: 'All Locations (Hubs & Storefronts)',
    resetButton: 'Reset',
  },

  tableHeaders: [
    { label: 'Reference & Activity', key: 'ref' },
    { label: 'Movement Route (Origin ➔ Destination)', key: 'route' },
    { label: 'Product / Details', key: 'product' },
    { label: 'Quantity', key: 'qty' },
    { label: 'Handler / Logistics', key: 'carrier' },
    { label: 'Status / Total', key: 'status' },
  ],

  emptyState: {
    title: 'No transactions found',
    subtitle:
      'Transactions and freight transport dispatches are automatically captured as activities occur.',
  },
}

export const DEFAULT_TRANSPORT_RECORDS = [
  {
    id: 1718001,
    manifestNo: 'TRP-2026-8412',
    category: 'WS',
    originType: 'W',
    destType: 'S',
    date: '10:30 AM',
    fullDate: new Date().toLocaleDateString(),
    fromBranchId: 'b-commissary',
    fromName: 'Main Commissary Hub',
    toBranchId: 'b-downtown',
    toName: 'Downtown Branch',
    productName: 'Sunwide Concentrated Fruit Tea Syrup · Green Apple',
    sku: 'SYR-SUN-APL-2.5L',
    tierLabel: 'Cartons',
    qty: 5,
    totalUnits: 30,
    unit: 'bottle',
    vehicle: 'NBD-4819 (Closed Van)',
    driver: 'Marco Ramirez',
    status: 'In Transit',
    notes: 'Store restock delivery',
  },
  {
    id: 1718002,
    manifestNo: 'TRP-2026-3190',
    category: 'WW',
    originType: 'W',
    destType: 'W',
    date: '08:15 AM',
    fullDate: new Date().toLocaleDateString(),
    fromBranchId: 'b-commissary',
    fromName: 'Main Commissary Hub',
    toBranchId: 'b-uptown',
    toName: 'Uptown Hub',
    productName: 'EcoPack U-Cup 16oz (500ml)',
    sku: 'CUP-EP-90-16OZ',
    tierLabel: 'Pallets',
    qty: 2,
    totalUnits: 2400,
    unit: 'sleeve',
    vehicle: 'WQR-9901 (Heavy Freight)',
    driver: 'Eduardo Santos',
    status: 'Received',
    notes: 'Bulk commissary transfer to bay RACK-D01',
  },
]

