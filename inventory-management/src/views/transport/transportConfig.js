export const TRANSPORT_UI = {
  header: {
    backText: 'Catalog',
    title: 'Store Operations & Transport Ledger',
    subtitle: 'Unified audit trail for POS sales, shortage transfers, and freight movement',
    badgeSuffix: 'Recorded Movements',
    typewriter: { speed: 28, delay: 350 },
  },

  kpis: {
    total: 'Total Movements',
    transfers: 'Branch Restocks',
    sales: 'Customer Sales',
    inTransit: 'Active In-Transit',
  },

  categories: [
    { key: 'ALL', label: 'All Movements', sublabel: 'Combined Feed' },
    { key: 'TRANSFERS', label: 'Branch Restocks', sublabel: 'Hub Logistics' },
    { key: 'SALES', label: 'Customer Sales', sublabel: 'POS Checkouts' },
  ],

  toolbar: {
    searchPlaceholder: 'Search manifest, invoice, SKU, branch, or customer...',
    locationSelectTitle: 'Filter by Location',
    locationSelectPlaceholder: 'All Branches',
    allLocationsLabel: 'All Stores & Hubs',
    resetButton: 'Reset Filters',
  },

  tableHeaders: [
    { key: 'ref', label: 'Ref / Order #' },
    { key: 'route', label: 'Movement Flow' },
    { key: 'product', label: 'Product Details' },
    { key: 'qty', label: 'Quantity' },
    { key: 'handler', label: 'Operator / Courier' },
    { key: 'status', label: 'Status' },
  ],

  emptyState: {
    title: 'No Ledger Entries Found',
    subtitle: 'No records match your selected category, branch filter, or search term.',
  },
}

export const DEFAULT_TRANSPORT_RECORDS = []
