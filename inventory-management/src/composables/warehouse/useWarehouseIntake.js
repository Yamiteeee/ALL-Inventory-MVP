import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '@/stores/inventoryStore'

export function useWarehouseIntake(props, emit) {
  const store = useInventoryStore()

  // Inward Modes: 'supplier' (PO Freight) | 'incoming' (Transfers to Accept)
  const activeMode = ref('supplier')

  const intakeBranchId = ref(props.initialBranchId || store.branches[0]?.id || '')
  const intakeVariantId = ref('')
  const intakeTier = ref('level3') // Default to Level 3 Pallets
  const intakeQty = ref(1)
  const intakeBay = ref('RACK-D01')
  const intakeLot = ref('LOT-2026-0101')
  const intakeExpiry = ref('')
  const intakePoCode = ref('')
  const intakeFeedback = ref('')

  watch(
    () => props.initialBranchId,
    (newId) => {
      if (newId) intakeBranchId.value = newId
    },
  )

  watch(
    () => props.variants,
    (newVariants) => {
      if (newVariants.length && !intakeVariantId.value) {
        intakeVariantId.value = newVariants[0].id
      }
    },
    { immediate: true },
  )

  const activeVariant = computed(() => {
    return props.variants.find((v) => v.id === intakeVariantId.value) || props.variants[0]
  })

  function setActiveMode(mode) {
    activeMode.value = mode
  }

  // Auto-adjust default Bay & Lot code when variant changes
  watch(
    () => activeVariant.value,
    (variant) => {
      if (!variant) return
      intakeBay.value = variant.isPerishable ? 'BAY-C01' : 'RACK-D01'
      intakeLot.value = `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    },
    { immediate: true },
  )

  const branchOptions = computed(() => {
    return props.branches.map((b) => ({
      value: b.id,
      label: `${b.name} Branch`,
    }))
  })

  const variantOptions = computed(() => {
    return props.variants.map((item) => ({
      value: item.id,
      label: `${item.brand ? item.brand + ' · ' : ''}${item.parentName || item.fullName}`,
      sublabel: `[${item.sku}] ${item.category || ''} · ${item.flavor || item.color || item.sizeCapacity || ''}`,
    }))
  })

  const tierOptions = computed(() => {
    const v = activeVariant.value
    const l1Unit = v?.uom?.level1?.unit || 'unit'
    const l2Unit = v?.uom?.level2?.unit || 'Box'
    const l2Mult = v?.uom?.level2?.multiplier || 1
    const l3Unit = v?.uom?.level3?.unit || 'Pallet'
    const l3Mult = v?.uom?.level3?.multiplier || 1

    return [
      {
        value: 'level3',
        label: 'Level 3: Full Pallet (Bulk Lot)',
        sublabel: `1 ${l3Unit} = ${l3Mult} ${l2Unit} (${l3Mult * l2Mult} ${l1Unit})`,
      },
      {
        value: 'level2',
        label: 'Level 2: Master Carton / Box',
        sublabel: `1 ${l2Unit} = ${l2Mult} ${l1Unit}`,
      },
      {
        value: 'level1',
        label: 'Level 1: Base Units',
        sublabel: `1 ${l1Unit}`,
      },
    ]
  })

  const calculatedUnits = computed(() => {
    const v = activeVariant.value
    if (!v) return 0
    const qty = Number(intakeQty.value) || 0
    const l2Mult = v.uom?.level2?.multiplier || 1
    const l3Mult = v.uom?.level3?.multiplier || 1

    if (intakeTier.value === 'level3') return qty * l2Mult * l3Mult
    if (intakeTier.value === 'level2') return qty * l2Mult
    return qty
  })

  const calculatedBoxes = computed(() => {
    const v = activeVariant.value
    if (!v) return 0
    const qty = Number(intakeQty.value) || 0
    const l3Mult = v.uom?.level3?.multiplier || 1

    if (intakeTier.value === 'level3') return qty * l3Mult
    if (intakeTier.value === 'level2') return qty
    return Math.floor(qty / (v.uom?.level2?.multiplier || 1))
  })

  const calculatedCBM = computed(() => {
    const v = activeVariant.value
    if (!v) return '0.00'
    const cbmPerBox = store.calculateCBM ? store.calculateCBM(v.dimensions || {}) : 0.05
    return (calculatedBoxes.value * cbmPerBox).toFixed(2)
  })

  function getBranchName(branchId) {
    return props.branches.find((b) => b.id === branchId)?.name || branchId
  }

  // Incoming in-transit shipments targeting this branch
  const incomingTransfersForBranch = computed(() => {
    return (store.transferRequests || []).filter(
      (r) =>
        r.requestingBranchId === intakeBranchId.value &&
        (r.status === 'in_transit' || r.status === 'completed'),
    )
  })

  const inTransitCount = computed(() => {
    return incomingTransfersForBranch.value.filter((r) => r.status === 'in_transit').length
  })

  // Action: Direct Supplier PO Confirm
  function handleSupplierSubmit() {
    if (intakeQty.value <= 0 || !activeVariant.value) return

    emit('confirm', {
      branchId: intakeBranchId.value,
      variant: activeVariant.value,
      qty: intakeQty.value,
      tier: intakeTier.value,
      bay: intakeBay.value,
      lot: intakeLot.value,
      expiry: intakeExpiry.value,
      poCode: intakePoCode.value,
      totalUnits: calculatedUnits.value,
    })

    intakeQty.value = 1
    intakePoCode.value = ''
    intakeExpiry.value = ''
  }

  // Action: Accept Incoming In-Transit Delivery
  // Action: Accept Incoming In-Transit Delivery
  function handleAcceptDelivery(requestId) {
    try {
      const req = (store.transferRequests || []).find((r) => r.id === requestId)
      if (!req) throw new Error('Transfer record not found.')

      // 🔒 AIRTIGHT LOCK: Ensure the active branch is genuinely the requesting branch
      if (req.requestingBranchId !== intakeBranchId.value) {
        throw new Error(
          `Unauthorized: Only ${getBranchName(req.requestingBranchId)} can sign and accept this delivery.`,
        )
      }

      let updated
      if (typeof store.receiveTransferRequest === 'function') {
        updated = store.receiveTransferRequest(requestId)
      } else {
        req.status = 'completed'
        req.receivedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        if (!store.branchStocks[req.requestingBranchId]) {
          store.branchStocks[req.requestingBranchId] = {}
        }
        const currentStock = store.branchStocks[req.requestingBranchId][req.variantId] || 0
        store.branchStocks[req.requestingBranchId][req.variantId] = currentStock + req.totalUnits

        localStorage.setItem('inventory_transfer_requests', JSON.stringify(store.transferRequests))
        localStorage.setItem('inventory_branch_stocks', JSON.stringify(store.branchStocks))
        updated = req
      }

      intakeFeedback.value = `Delivery Accepted! Credited ${updated?.totalUnits || 0} units to ${getBranchName(updated?.requestingBranchId)}. Customer sale hold is now unlocked in POS!`
      setTimeout(() => {
        intakeFeedback.value = ''
      }, 4500)
    } catch (err) {
      intakeFeedback.value = err.message
    }
  }

  return {
    store,
    activeMode,
    intakeBranchId,
    intakeVariantId,
    intakeTier,
    intakeQty,
    intakeBay,
    intakeLot,
    intakeExpiry,
    intakePoCode,
    intakeFeedback,
    activeVariant,
    branchOptions,
    variantOptions,
    tierOptions,
    calculatedUnits,
    calculatedBoxes,
    calculatedCBM,
    incomingTransfersForBranch,
    inTransitCount,
    setActiveMode,
    getBranchName,
    handleSupplierSubmit,
    handleAcceptDelivery,
  }
}
