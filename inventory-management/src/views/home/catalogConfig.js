// src/views/home/catalogConfig.js

export const CATALOG_UI = {
  header: {
    badge: 'Inventory Core',
    title: 'Master Catalog',
    subtitle: 'Parent families · Variant dimensions · 3-tier UOM packaging',
  },
  kpiLabels: {
    parents: 'Families',
    variants: 'Variants',
    onHand: 'Stock on Hand',
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
}
