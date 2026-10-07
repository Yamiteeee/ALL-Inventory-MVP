// src/views/stockIn/stockInConfig.js

export const STOCK_IN_UI = {
  header: {
    backText: 'Back to Master Catalog',
    title: 'PO Intake & Receiving',
    subtitle: 'Log incoming shipments, unpack multi-tier packaging, and tag batch expiry',
    badgeSuffix: 'Shipments Logged',
  },
  form: {
    title: 'Receiving Entry',
    step: 'Step 1 of 2',
    branchLabel: 'Destination Branch / Hub',
    variantLabel: 'Sub-Product / Variant',
    tierLabel: 'Packaging Tier (UOM Multiplier)',
    qtyLabel: 'Shipped Quantity',
    expiryLabel: 'Batch Expiry Date (Perishable Item)',
    poLabel: 'Supplier Reference / PO #',
    poPlaceholder: 'e.g. PO #9910 - Golden Dragon Import Corp',
    submitButton: 'Post Intake to Ledger',
    conversionTag: (units, unitName) => `Converts to ${units} base ${unitName}`,
  },
  logs: {
    title: 'Recent Receiving Logs',
    loggedSuffix: 'shipments',
    emptyTitle: 'No shipments received',
    emptySub: 'Incoming delivery entries logged this session will stream here live.',
  },
}
