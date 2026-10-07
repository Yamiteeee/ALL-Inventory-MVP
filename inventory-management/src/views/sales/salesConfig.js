// src/views/sales/salesConfig.js

export const SALES_UI = {
  header: {
    backText: 'Back to Master Catalog',
    title: 'Point of Sale & Stock Out',
    subtitle: 'Disburse inventory, apply loyalty contracts, and issue instant receipts',
    badgeSuffix: 'Orders Processed',
  },
  form: {
    title: 'Order Dispatch',
    step: 'Step 1 of 2',
    branchLabel: 'Branch Source',
    stockLabel: 'Available On-Hand',
    variantLabel: 'Sub-Product / Variant',
    qtyLabel: 'Quantity to Sell',
    dividerText: 'Buyer Agreement & Loyalty',
    modes: {
      existing: 'Saved Profile',
      new: '+ New Client',
    },
    newCustomerPlaceholder: 'Enter client or boba shop business name',
    buyerDiscountLabel: 'Contract Discount (%)',
    updateProfileLabel: (discount) => `Update permanent default rate to ${discount}%`,
    specialDiscountLabel: 'Occasion / Clearance (%)',
    reasonLabel: 'Clearance or Occasion Reason',
    reasonPlaceholder: 'e.g. Near-Expiry Clearance, Promo Event, Damaged Box',
    submitButton: 'Process Sale & Issue Receipt',
  },
  summary: {
    subtotal: 'Item Subtotal',
    discount: (pct) => `Total Discount (${pct}%)`,
    finalPayable: 'Final Payable',
  },
  ledger: {
    title: 'Completed Receipts',
    loggedSuffix: 'logged',
    emptyTitle: 'No transactions recorded',
    emptySub: 'Completed sales processed this session will stream here live.',
  },
}
