import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '@/stores/inventoryStore'

export function useWarehouseTransfer(props, emit) {
  const store = useInventoryStore()

  // Navigation Mode: 'queue' (Review & Dispatch) | 'transit' (On the Road)
  const activeTab = ref('queue')

  function setActiveTab(tab) {
    activeTab.value = tab
  }

  // Origin / Fulfilling Hub context
  const activeHubId = ref(
    props.currentBranchId && props.currentBranchId !== 'all'
      ? props.currentBranchId
      : store.branches[0]?.id || 'b-commissary',
  )

  watch(
    () => props.currentBranchId,
    (newId) => {
      if (newId && newId !== 'all') {
        activeHubId.value = newId
      }
    },
  )

  // Dispatch Form Inputs for Active Selected Request
  const selectedRequestId = ref('')
  const dispatchManifestNo = ref('')
  const dispatchCourierNotes = ref('')
  const feedbackBanner = ref('')

  // Reactive Filters & Lists
  const hubOptions = computed(() => {
    return [
      { value: 'all', label: 'All Warehouses (Global View)' },
      ...props.branches.map((b) => ({
        value: b.id,
        label: `${b.name} Hub`,
      })),
    ]
  })

  // Pending requests where this hub is expected to fulfill and dispatch
  const pendingRequestsForThisHub = computed(() => {
    return (store.transferRequests || []).filter((r) => {
      if (r.status !== 'pending') return false
      if (!activeHubId.value || activeHubId.value === 'all') return true
      return r.fulfillingBranchId === activeHubId.value
    })
  })

  // In-Transit requests involving this hub
  const inTransitRequests = computed(() => {
    return (store.transferRequests || []).filter((r) => {
      if (r.status !== 'in_transit') return false
      if (!activeHubId.value || activeHubId.value === 'all') return true
      return (
        r.fulfillingBranchId === activeHubId.value || r.requestingBranchId === activeHubId.value
      )
    })
  })

  const activeRequest = computed(() => {
    if (selectedRequestId.value) {
      return pendingRequestsForThisHub.value.find((r) => r.id === selectedRequestId.value)
    }
    return pendingRequestsForThisHub.value[0] || null
  })

  // Auto-select first pending request when list changes
  watch(
    () => pendingRequestsForThisHub.value,
    (list) => {
      if (
        list.length &&
        (!selectedRequestId.value || !list.some((r) => r.id === selectedRequestId.value))
      ) {
        selectedRequestId.value = list[0].id
        dispatchManifestNo.value = `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      }
    },
    { immediate: true },
  )

  const activeRequestVariant = computed(() => {
    if (!activeRequest.value) return null
    return props.variants.find((v) => v.id === activeRequest.value.variantId) || null
  })

  const availableStockInHub = computed(() => {
    if (!activeRequest.value || !activeRequestVariant.value) return 0
    const stocks = store.branchStocks?.[activeRequest.value.fulfillingBranchId] || {}
    return stocks[activeRequest.value.variantId] || 0
  })

  const hasSufficientStockForRequest = computed(() => {
    if (!activeRequest.value) return false
    return availableStockInHub.value >= activeRequest.value.totalUnits
  })

  const calculatedCBM = computed(() => {
    if (!activeRequestVariant.value || !activeRequest.value) return '0.00'
    const v = activeRequestVariant.value
    const cbmPerBox = store.calculateCBM ? store.calculateCBM(v.dimensions || {}) : 0.05
    const boxes =
      activeRequest.value.tier === 'level3'
        ? activeRequest.value.qty * (v.uom?.level3?.multiplier || 1)
        : activeRequest.value.tier === 'level2'
          ? activeRequest.value.qty
          : Math.ceil(activeRequest.value.totalUnits / (v.uom?.level2?.multiplier || 1))
    return (boxes * cbmPerBox).toFixed(2)
  })

  function getBranchName(branchId) {
    return props.branches.find((b) => b.id === branchId)?.name || branchId
  }

  // Action: Fulfill & Dispatch Request
  function handleDispatchActiveRequest() {
    if (!activeRequest.value || !hasSufficientStockForRequest.value) return

    const req = activeRequest.value
    const variant = activeRequestVariant.value

    store.dispatchTransferRequest(req.id, {
      manifestNo:
        dispatchManifestNo.value ||
        `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      courierNotes: dispatchCourierNotes.value || 'Scheduled Logistics Delivery',
    })

    feedbackBanner.value = `Dispatched ${req.id} [${dispatchManifestNo.value}]! Stock deducted from ${getBranchName(req.fulfillingBranchId)} and is now in transit.`
    dispatchCourierNotes.value = ''
    selectedRequestId.value = ''

    emit('confirm', {
      fromWarehouseId: req.fulfillingBranchId,
      toWarehouseId: req.requestingBranchId,
      variant,
      totalUnits: req.totalUnits,
      manifestNo: dispatchManifestNo.value,
    })

    setTimeout(() => {
      feedbackBanner.value = ''
    }, 4500)
  }

  return {
    store,
    activeTab,
    setActiveTab,
    activeHubId,
    hubOptions,
    selectedRequestId,
    dispatchManifestNo,
    dispatchCourierNotes,
    feedbackBanner,
    pendingRequestsForThisHub,
    inTransitRequests,
    activeRequest,
    activeRequestVariant,
    availableStockInHub,
    hasSufficientStockForRequest,
    calculatedCBM,
    getBranchName,
    handleDispatchActiveRequest,
  }
}
