import { ref, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventoryStore'

export function usePoHistory(props) {
  const store = useInventoryStore()

  const searchQuery = ref('')
  const selectedBranchFilter = ref(props.initialBranchId || 'all')

  const branchFilterOptions = computed(() => [
    { value: 'all', label: 'All Warehouse Branches' },
    ...store.branches.map((b) => ({
      value: b.id,
      label: `${b.name} Branch`,
    })),
  ])

  const filteredHistory = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    const branch = selectedBranchFilter.value

    return (store.stockInHistory || []).filter((entry) => {
      // 1. Branch Filter
      if (branch !== 'all' && entry.branchId && entry.branchId !== branch) {
        return false
      }

      // 2. Search Query (SKU, Product, PO Reference, Bay/Lot)
      if (!q) return true
      return (
        entry.productName?.toLowerCase().includes(q) ||
        entry.note?.toLowerCase().includes(q) ||
        entry.branchName?.toLowerCase().includes(q) ||
        entry.expiry?.toLowerCase().includes(q)
      )
    })
  })

  // Quick Summary Stats
  const totalDockedUnits = computed(() => {
    return filteredHistory.value.reduce((acc, curr) => acc + (curr.totalBaseUnits || 0), 0)
  })

  const totalPalletsEstimate = computed(() => {
    return filteredHistory.value
      .filter((e) => e.uomTierLabel?.toLowerCase().includes('pallet'))
      .reduce((acc, curr) => acc + (curr.inputQty || 0), 0)
  })

  return {
    store,
    searchQuery,
    selectedBranchFilter,
    branchFilterOptions,
    filteredHistory,
    totalDockedUnits,
    totalPalletsEstimate,
  }
}
