import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '@/stores/inventoryStore'

// Update this line to point to the view's config directory:
import { CATALOG_UI } from '@/views/home/catalogConfig'

export function useCatalog() {
  const router = useRouter()
  const store = useInventoryStore()

  // Warehouse Logistics Modal Visibility Controls
  const showIntakeModal = ref(false)
  const showPoHistoryModal = ref(false)
  const showTransferModal = ref(false)
  const successBanner = ref('')

  const selectedBranchId = ref(store.branches[0]?.id || '')
  const searchQuery = ref('')
  const expandedParents = ref({ 'P-100': true, 'P-200': true, 'P-300': true })

  // Real-time transfer and delivery notification counts
  const pendingTransfersCount = computed(() => {
    return (store.transferRequests || []).filter((r) => r.status === 'pending').length
  })

  const incomingDeliveriesCount = computed(() => {
    const currentBranch = selectedBranchId.value === 'all' ? null : selectedBranchId.value
    return (store.transferRequests || []).filter(
      (r) =>
        r.status === 'in_transit' && (!currentBranch || r.requestingBranchId === currentBranch),
    ).length
  })

  // Normalized branch options for IosSelect
  const branchOptions = computed(() => {
    return store.branches.map((b) => ({
      value: b.id,
      label: `${b.name} Branch`,
    }))
  })

  // Inbound Freight Intake
  function onIntakeConfirm({ branchId, variant, qty, tier, bay, lot, expiry, poCode, totalUnits }) {
    const targetBranchId =
      branchId || (selectedBranchId.value === 'all' ? 'b-commissary' : selectedBranchId.value)
    const branchName = store.branches.find((b) => b.id === targetBranchId)?.name || 'Warehouse'
    const poNote = `[${bay} | ${lot}] ${poCode || 'Pallet Dock Delivery'}`

    store.receiveStock({
      branchId: targetBranchId,
      variantId: variant.id,
      inputQty: qty,
      uomTier: tier,
      supplierNote: poNote,
      batchExpiry: expiry,
    })

    const tierLabel = tier === 'level3' ? 'pallets' : 'boxes'
    const unit = variant.uom?.level1?.unit || 'units'
    successBanner.value = `Docked ${qty} ${tierLabel} of ${variant.fullName} (+${totalUnits} ${unit}) into ${branchName} (${bay})!`
    showIntakeModal.value = false

    setTimeout(() => {
      successBanner.value = ''
    }, 4500)
  }

  // Inter-Warehouse Transfer
  function onTransferConfirm({ fromWarehouseId, toWarehouseId, variant, totalUnits, manifestNo }) {
    if (!store.branchStocks[fromWarehouseId]) store.branchStocks[fromWarehouseId] = {}
    if (!store.branchStocks[toWarehouseId]) store.branchStocks[toWarehouseId] = {}

    store.branchStocks[fromWarehouseId][variant.id] = Math.max(
      0,
      (store.branchStocks[fromWarehouseId][variant.id] || 0) - totalUnits,
    )
    store.branchStocks[toWarehouseId][variant.id] =
      (store.branchStocks[toWarehouseId][variant.id] || 0) + totalUnits

    if (typeof store.saveBranchStocks === 'function') {
      store.saveBranchStocks()
    }

    const fromName = store.branches.find((b) => b.id === fromWarehouseId)?.name || fromWarehouseId
    const toName = store.branches.find((b) => b.id === toWarehouseId)?.name || toWarehouseId
    const unit = variant.uom?.level1?.unit || 'units'

    successBanner.value = `Relocated ${totalUnits} ${unit} of ${variant.fullName} (${fromName} → ${toName})! [${manifestNo}]`
    showTransferModal.value = false

    setTimeout(() => {
      successBanner.value = ''
    }, 4500)
  }

  // Tree View Expand/Collapse Controls
  function toggleParent(parentId) {
    expandedParents.value[parentId] = !expandedParents.value[parentId]
  }

  function expandAll() {
    store.catalog.forEach((p) => {
      expandedParents.value[p.parentId] = true
    })
  }

  function collapseAll() {
    expandedParents.value = {}
  }

  // Stock-enriched Catalog Hierarchy
  const computedCatalog = computed(() => {
    const currentStocks = store.branchStocks[selectedBranchId.value] || {}

    return store.catalog.map((parent) => {
      const variantsWithStock = parent.variants.map((v) => {
        const branchStock = currentStocks[v.id] || 0
        const boxes = Math.floor(branchStock / (v.uom?.level2?.multiplier || 1))
        const pallets = (
          branchStock /
          ((v.uom?.level2?.multiplier || 1) * (v.uom?.level3?.multiplier || 1))
        ).toFixed(1)

        const cbmPerUnit = store.calculateCBM(v.dimensions)
        const totalOccupiedCBM = (boxes * cbmPerUnit).toFixed(2)

        return {
          ...v,
          stock: branchStock,
          boxes,
          pallets,
          cbm: cbmPerUnit,
          totalOccupiedCBM,
          autoName: store.generateVariantName(parent, v),
        }
      })

      const parentTotalUnits = variantsWithStock.reduce((acc, curr) => acc + curr.stock, 0)
      const parentTotalBoxes = variantsWithStock.reduce((acc, curr) => acc + curr.boxes, 0)
      const parentTotalPallets = variantsWithStock
        .reduce((acc, curr) => acc + Number(curr.pallets), 0)
        .toFixed(1)

      return {
        ...parent,
        totalUnits: parentTotalUnits,
        totalBoxes: parentTotalBoxes,
        totalPallets: parentTotalPallets,
        variants: variantsWithStock,
      }
    })
  })

  // Live Query Filter
  const filteredCatalog = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    const list = computedCatalog.value

    if (!q) return list

    return list
      .map((parent) => {
        const parentMatches =
          parent.parentName.toLowerCase().includes(q) ||
          parent.brand.toLowerCase().includes(q) ||
          parent.category.toLowerCase().includes(q)

        const matchedVariants = parent.variants.filter(
          (v) =>
            v.autoName.toLowerCase().includes(q) ||
            v.sku.toLowerCase().includes(q) ||
            (v.flavor && v.flavor.toLowerCase().includes(q)) ||
            v.supplierItemNo.toLowerCase().includes(q),
        )

        if (parentMatches) return parent
        if (matchedVariants.length > 0) return { ...parent, variants: matchedVariants }
        return null
      })
      .filter(Boolean)
  })

  const totalCatalogVariants = computed(() =>
    store.catalog.reduce((acc, p) => acc + p.variants.length, 0),
  )

  const totalBranchUnits = computed(() => {
    const stocks = store.branchStocks[selectedBranchId.value] || {}
    return Object.values(stocks).reduce((a, b) => a + b, 0)
  })

  function colLabel(index) {
    return CATALOG_UI.tableHeaders[index]?.label || ''
  }

  function logout() {
    localStorage.clear()
    router.push('/login')
  }

  return {
    store,
    showIntakeModal,
    showTransferModal,
    successBanner,
    selectedBranchId,
    searchQuery,
    expandedParents,
    pendingTransfersCount,
    incomingDeliveriesCount,
    branchOptions,
    filteredCatalog,
    totalCatalogVariants,
    totalBranchUnits,
    showPoHistoryModal,
    onIntakeConfirm,
    onTransferConfirm,
    toggleParent,
    expandAll,
    collapseAll,
    colLabel,
    logout,
  }
}
