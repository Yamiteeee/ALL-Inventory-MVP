// src/views/home/catalogConfig.js

export const CATALOG_UI = {
  header: {
    badge: 'Master Inventory & Logistics Hub',
    title: 'Master Catalog',
    subtitle: 'Parent families · Variant dimensions · 3-tier UOM packaging & multi-branch logistics',
    receiveButton: 'Receive PO',
    dockButton: 'Receive PO',
    transferButton: 'Hub Transfer',
    transportButton: 'Goods Transport',
  },
  kpiLabels: {
    parents: 'Families',
    variants: 'Variants',
    onHand: 'Stock on Hand',
    poCount: 'PO Received',
  },
  toolbar: {
    searchPlaceholder: 'Search catalog, SKU, flavor, or vendor...',
    expandAll: 'Expand All',
    collapseAll: 'Collapse All',
    resetSearch: 'Reset Filter',
  },
  tableHeaders: [
    { key: 'sku', label: 'SKU / Item Ref', width: '150px' },
    { key: 'specs', label: 'Variant & Specifications', width: 'auto' },
    { key: 'cbm', label: 'CBM & Weight', width: '120px' },
    { key: 'uom', label: 'Packaging Matrix (L1 · L2 · L3)', width: '280px' },
    { key: 'cost', label: 'Unit Cost', width: '110px' },
    { key: 'stock', label: 'Available', width: '130px' },
    { key: 'status', label: 'State', width: '100px' },
  ],
  statusLabels: {
    out: 'Depleted',
    low: 'Low',
    healthy: 'Nominal',
  },
  warehouseModals: {
    intake: {
      eyebrow: 'Direct Supplier PO Dock',
      title: 'Inbound PO & Freight Receiving',
      submitButton: 'Confirm & Receive Freight into Inventory',
    },
    transfer: {
      eyebrow: 'Inter-Warehouse Logistics',
      title: 'Hub-to-Hub Freight Transfer',
      submitButton: 'Dispatch Inter-Warehouse Freight',
    },
    banners: {
      intake: (qty, tierLabel, variantName, totalUnits, unit, branchName, bay) =>
        `Docked ${qty} ${tierLabel} of ${variantName} (+${totalUnits} ${unit}) into ${branchName} (${bay})!`,
      transfer: (totalUnits, unit, variantName, fromName, toName, manifestNo) =>
        `Relocated ${totalUnits} ${unit} of ${variantName} (${fromName} → ${toName})! [${manifestNo}]`,
    },
  },
}

