export const WAREHOUSE_UI = {
  header: {
    title: 'Central Warehouse Storage',
    subtitleAll: 'All Branch Warehouses (Consolidated)',
    subtitleSuffix: 'Inbound Lots, Pallet Multipliers & Cubic Volume Allocations',
    backButton: 'Return to Storefront',
    backButtonMobile: 'Catalog',
    modeStorefront: 'Storefront',
    modeWarehouse: 'Warehouse Hub',
    dockButton: 'Dock Inbound Freight',
    transferButton: 'Hub Transfer',
    dispatchButton: 'Dispatch to Branch',
  },

  overview: {
    branchLabel: 'Branch',
    warehouseSuffix: 'Warehouse',
    allWarehousesLabel: 'All Warehouses (Combined)',
    branchSelectTitle: 'Select Branch Warehouse',
    branchSelectPlaceholder: 'Choose Branch Warehouse',
    zoneLabel: 'Zone',
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

  kpiUnits: {
    pallets: 'plt',
    cartons: 'bx',
    volume: 'm³',
  },

  searchPlaceholder: 'Search bay ID, lot code, master SKU, or product...',

  statusFilters: [
    { key: 'all', label: 'All Stock' },
    { key: 'nominal', label: 'Nominal' },
    { key: 'low', label: 'Low' },
    { key: 'depleted', label: 'Depleted' },
  ],

  statusLabels: {
    nominal: 'Nominal',
    low: 'Low Stock',
    depleted: 'Depleted',
  },

  tags: {
    coldChain: 'Cold Chain',
    dryAmbient: 'Dry Ambient',
  },

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

  banners: {
    intake: (qty, tierLabel, variantName, totalUnits, unit, branchName, bay) =>
      `Docked ${qty} ${tierLabel} of ${variantName} (+${totalUnits} ${unit}) into ${branchName} (${bay})!`,
    transfer: (totalUnits, unit, variantName, fromName, toName, manifestNo) =>
      `Relocated ${totalUnits} ${unit} of ${variantName} (${fromName} → ${toName})! [${manifestNo}]`,
    dispatch: (qty, tierLabel, totalUnits, unit, variantName, originName, destName, manifestNo) =>
      `Dispatched ${qty} ${tierLabel} (${totalUnits} ${unit}) from ${originName} → ${destName}! [${manifestNo}]`,
  },

  modal: {
    eyebrow: 'Direct Warehouse PO',
    title: 'Inbound Pallet & Lot Intake',
    submitButton: 'Confirm & Dock Freight into Commissary',
  },
}
