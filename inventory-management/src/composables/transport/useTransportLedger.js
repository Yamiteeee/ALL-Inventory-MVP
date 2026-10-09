import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '@/stores/inventoryStore'
import { TRANSPORT_UI } from '@/views/transport/transportConfig'

export function useTransportLedger() {
  const router = useRouter()
  const store = useInventoryStore()

  function goBackToCatalog() {
    if (window.history.state?.back) {
      router.back()
    } else {
      router.push('/inventory')
    }
  }

  // Active filter state: 'ALL' | 'TRANSFERS' | 'SALES'
  const selectedCategory = ref('ALL')
  const selectedLocation = ref('all')
  const searchQuery = ref('')

  const categoryFilters = TRANSPORT_UI.categories

  // Normalized location options (Commissary Hub + Branches)
  const locationFilterOptions = computed(() => [
    { value: 'all', label: TRANSPORT_UI.toolbar.allLocationsLabel },
    ...store.branches.map((b) => ({
      value: b.id,
      label: `${b.name} (${b.id.includes('commissary') ? 'Hub' : 'Store'})`,
    })),
  ])

  // Unified stream: POS Sales + Inter-Branch Restock Transfers
  const unifiedTransactions = computed(() => {
    const feed = []

    // 1. POS Customer Sales & Released Holds
    ;(store.salesHistory || []).forEach((sale) => {
      const isHoldRelease = sale.specialReason && sale.specialReason.includes('Released from Hold')

      feed.push({
        id: `sale-${sale.id}`,
        refNo: `ORD-${String(sale.id).slice(-6)}`,
        category: 'SALES',
        typeLabel: isHoldRelease ? 'Hold Released Sale' : 'Storefront Sale',
        timestamp: sale.date || 'Today',
        origin: {
          name: sale.branchName,
          type: 'BRANCH',
          branchId: sale.branchId || '',
        },
        destination: {
          name: sale.customerName || 'Walk-in Retail Buyer',
          type: 'CLIENT',
          branchId: '',
        },
        productName: sale.productName,
        sku: '',
        qtyDisplay: `${sale.quantity} ${sale.unit || 'units'}`,
        partyLabel: 'Customer',
        partyValue: sale.customerName || 'Walk-in Retail Buyer',
        status: sale.status || 'Completed',
        notes: sale.specialReason || 'Standard Sale',
        amount: sale.finalTotal
          ? `₱${Number(sale.finalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          : null,
        rawTime: sale.timestampMs || Number(sale.id) || Date.now(),
      })
    })

    // 2. Inter-Branch Restock Requests & Shortage Transfers
    ;(store.transferRequests || []).forEach((tr) => {
      const variant = store.flatVariants.find((v) => v.id === tr.variantId)
      const fromBranch = store.branches.find((b) => b.id === tr.fulfillingBranchId)
      const toBranch = store.branches.find((b) => b.id === tr.requestingBranchId)

      feed.push({
        id: `req-${tr.id}`,
        refNo: tr.manifestNo || tr.id,
        category: 'TRANSFERS',
        typeLabel: tr.holdSale ? 'Shortage Restock' : 'Branch Restock',
        timestamp: tr.dispatchedAt || tr.createdAt || 'Today',
        origin: {
          name: fromBranch?.name || tr.fulfillingBranchId,
          type: tr.fulfillingBranchId.includes('commissary') ? 'HUB' : 'BRANCH',
          branchId: tr.fulfillingBranchId,
        },
        destination: {
          name: toBranch?.name || tr.requestingBranchId,
          type: 'BRANCH',
          branchId: tr.requestingBranchId,
        },
        productName: variant?.fullName || tr.variantId,
        sku: variant?.sku || '',
        qtyDisplay: `${tr.totalUnits} ${variant?.uom?.level1?.unit || 'units'} (${tr.qty} ${tr.tier})`,
        partyLabel: 'Courier / Fleet',
        partyValue: tr.courierNotes || 'Scheduled Dispatch',
        status:
          tr.status === 'in_transit'
            ? 'In Transit'
            : tr.status === 'completed'
              ? 'Delivered'
              : 'Pending Dispatch',
        notes:
          tr.notes ||
          (tr.heldCustomerName ? `Reserved for ${tr.heldCustomerName}` : 'Restock Order'),
        amount: null,
        rawTime: tr.timestampMs || Date.now(),
      })
    })

    return feed.sort((a, b) => b.rawTime - a.rawTime)
  })

  // Filtered stream
  const filteredLedger = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()

    return unifiedTransactions.value.filter((row) => {
      // Category filter
      if (selectedCategory.value !== 'ALL' && row.category !== selectedCategory.value) {
        return false
      }

      // Location filter
      if (selectedLocation.value !== 'all') {
        const targetBranch = store.branches.find((b) => b.id === selectedLocation.value)
        const targetName = targetBranch ? targetBranch.name.toLowerCase() : ''
        const originMatch =
          row.origin.branchId === selectedLocation.value ||
          row.origin.name.toLowerCase().includes(targetName)
        const destMatch =
          row.destination.branchId === selectedLocation.value ||
          row.destination.name.toLowerCase().includes(targetName)

        if (!originMatch && !destMatch) return false
      }

      // Search query
      if (!q) return true
      return (
        row.refNo?.toLowerCase().includes(q) ||
        row.productName?.toLowerCase().includes(q) ||
        row.sku?.toLowerCase().includes(q) ||
        row.origin.name?.toLowerCase().includes(q) ||
        row.destination.name?.toLowerCase().includes(q) ||
        row.partyValue?.toLowerCase().includes(q) ||
        row.notes?.toLowerCase().includes(q)
      )
    })
  })

  // Relevant KPIs
  const totalEvents = computed(() => unifiedTransactions.value.length)
  const countTransfers = computed(
    () => unifiedTransactions.value.filter((r) => r.category === 'TRANSFERS').length,
  )
  const countSales = computed(
    () => unifiedTransactions.value.filter((r) => r.category === 'SALES').length,
  )
  const countInTransit = computed(
    () => unifiedTransactions.value.filter((r) => r.status === 'In Transit').length,
  )

  function resetFilters() {
    selectedCategory.value = 'ALL'
    selectedLocation.value = 'all'
    searchQuery.value = ''
  }

  return {
    store,
    selectedCategory,
    selectedLocation,
    searchQuery,
    categoryFilters,
    locationFilterOptions,
    filteredLedger,
    totalEvents,
    countTransfers,
    countSales,
    countInTransit,
    resetFilters,
    goBackToCatalog,
  }
}
