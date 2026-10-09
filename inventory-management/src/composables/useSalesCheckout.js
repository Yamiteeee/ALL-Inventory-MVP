import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '@/stores/inventoryStore'
import { SALES_UI } from '@/views/sales/salesConfig'

export function useSalesCheckout() {
  const router = useRouter()
  const store = useInventoryStore()

  function goBackToCatalog() {
    if (window.history.state?.back) {
      router.back()
    } else {
      router.push('/inventory')
    }
  }

  const activeStep = ref('cart')
  const activeViewMode = ref('direct')
  const mobileActiveTab = ref('pos')

  function setPosTab(mode) {
    mobileActiveTab.value = 'pos'
    activeViewMode.value = mode
  }

  const successMessage = ref('')
  const errorMessage = ref('')

  // Branch Selection
  const selectedBranch = ref(store.branches[0]?.id || '')

  const branchOptions = computed(() => {
    return store.branches.map((b) => ({
      value: b.id,
      label: b.name,
    }))
  })

  const selectedBranchName = computed(() => {
    return store.branches.find((b) => b.id === selectedBranch.value)?.name || selectedBranch.value
  })

  const selectedVariantId = ref(store.flatVariants[0]?.id || '')
  const quantityToAdd = ref(1)
  const cartItems = ref([])

  const variantOptions = computed(() => {
    return store.flatVariants.map((p) => ({
      value: p.id,
      label: `${p.brand ? p.brand + ' · ' : ''}${p.productName || p.autoName || p.fullName}`,
      sublabel: `₱${p.baseCost.toFixed(2)} / ${p.uom.level1.unit} · ${p.flavor || p.color || p.sizeCapacity || p.sku}`,
    }))
  })

  const currentVariant = computed(() => {
    return store.flatVariants.find((v) => v.id === selectedVariantId.value)
  })

  const branchStockForVariant = computed(() => {
    if (!currentVariant.value) return 0
    return store.branchStocks[selectedBranch.value]?.[currentVariant.value.id] || 0
  })

  const stagedQtyForVariant = computed(() => {
    if (!currentVariant.value) return 0
    return cartItems.value
      .filter((item) => item.variantId === currentVariant.value.id)
      .reduce((sum, item) => sum + item.quantity, 0)
  })

  const remainingAvailableStock = computed(() => {
    return Math.max(0, branchStockForVariant.value - stagedQtyForVariant.value)
  })

  // Customer Profile
  const customerMode = ref('existing')
  const selectedCustomerId = ref(store.customers[0]?.id || '')
  const newCustomerName = ref('')
  const buyerDiscount = ref(store.customers[0]?.defaultDiscount || 0)
  const shouldUpdateProfileDiscount = ref(false)

  const specialDiscount = ref(0)
  const specialReason = ref('')

  const customerOptions = computed(() => {
    return store.customers.map((c) => ({
      value: c.id,
      label: c.name,
      sublabel: `${c.tier} Tier · Default: ${c.defaultDiscount}% off`,
    }))
  })

  const selectedCustomer = computed(() => {
    return store.customers.find((c) => c.id === selectedCustomerId.value)
  })

  const currentCustomerDisplayName = computed(() => {
    if (customerMode.value === 'new') {
      return newCustomerName.value.trim() || 'New Buyer'
    }
    return selectedCustomer.value?.name || 'Walk-in Retail Buyer'
  })

  function onCustomerChange() {
    if (selectedCustomer.value) {
      buyerDiscount.value = selectedCustomer.value.defaultDiscount
      shouldUpdateProfileDiscount.value = false
    }
  }

  function handleRemoveCustomer() {
    if (selectedCustomerId.value === 'c-walkin') return
    const cust = selectedCustomer.value
    if (!cust) return

    if (window.confirm(`Remove "${cust.name}" from recurring buyers?`)) {
      store.removeCustomer(selectedCustomerId.value)
      selectedCustomerId.value = store.customers[0]?.id || ''
      onCustomerChange()
    }
  }

  // Inter-Branch Replenishment Options
  const otherBranches = computed(() => {
    return store.branches.filter((b) => b.id !== selectedBranch.value)
  })

  const requestSourceBranch = ref(
    store.branches.find((b) => b.id !== selectedBranch.value)?.id || 'b-commissary',
  )

  watch(
    [() => currentVariant.value?.id, () => selectedBranch.value],
    () => {
      if (!otherBranches.value.length) return
      const variantId = currentVariant.value?.id
      if (variantId) {
        const sorted = [...otherBranches.value].sort((a, b) => {
          const stockA = store.branchStocks[a.id]?.[variantId] || 0
          const stockB = store.branchStocks[b.id]?.[variantId] || 0
          return stockB - stockA
        })
        requestSourceBranch.value = sorted[0]?.id || otherBranches.value[0]?.id
      } else {
        requestSourceBranch.value = otherBranches.value[0]?.id
      }
    },
    { immediate: true },
  )

  const sourceBranchOptions = computed(() => {
    if (!currentVariant.value) return []
    return otherBranches.value.map((b) => {
      const stock = store.branchStocks[b.id]?.[currentVariant.value.id] || 0
      return {
        value: b.id,
        label: b.name,
        sublabel: `${stock} ${currentVariant.value.uom?.level1?.unit || 'units'} on-hand in warehouse`,
      }
    })
  })

  const selectedSourceBranchStock = computed(() => {
    if (!currentVariant.value || !requestSourceBranch.value) return 0
    return store.branchStocks[requestSourceBranch.value]?.[currentVariant.value.id] || 0
  })

  const selectedSourceBranchName = computed(() => {
    return store.branches.find((b) => b.id === requestSourceBranch.value)?.name || 'Selected Branch'
  })

  // Cart Handlers
  function handleAddToCart() {
    errorMessage.value = ''
    successMessage.value = ''

    if (!currentVariant.value) return
    const qty = Number(quantityToAdd.value) || 0

    if (qty <= 0) {
      errorMessage.value = 'Please enter a valid quantity greater than zero.'
      return
    }

    if (qty > remainingAvailableStock.value) {
      errorMessage.value = `Cannot stage ${qty} units. Only ${remainingAvailableStock.value} ${currentVariant.value.uom.level1.unit} remaining in branch stock.`
      return
    }

    const existingIdx = cartItems.value.findIndex(
      (item) => item.variantId === currentVariant.value.id,
    )

    if (existingIdx !== -1) {
      cartItems.value[existingIdx].quantity += qty
    } else {
      cartItems.value.push({
        id: `${currentVariant.value.id}-${Date.now()}`,
        variantId: currentVariant.value.id,
        fullName: currentVariant.value.fullName,
        sku: currentVariant.value.sku,
        unit: currentVariant.value.uom?.level1?.unit || 'units',
        unitPrice: currentVariant.value.baseCost,
        quantity: qty,
        category: currentVariant.value.category,
        held: false,
      })
    }

    quantityToAdd.value = 1
  }

  // Excess Shortage: Creates Request & Stages in Cart (Sale not yet finalized)
  function handleCreateShortageRequest() {
    errorMessage.value = ''
    successMessage.value = ''

    if (!currentVariant.value) return
    const requested = Math.max(1, Number(quantityToAdd.value) || 1)
    const available = remainingAvailableStock.value
    const deficit = Math.max(1, requested - available)
    const sourceBranchId = requestSourceBranch.value || 'b-commissary'
    const sourceBranchName = selectedSourceBranchName.value

    let req
    if (typeof store.createTransferRequest === 'function') {
      req = store.createTransferRequest({
        requestingBranchId: selectedBranch.value,
        fulfillingBranchId: sourceBranchId,
        variantId: currentVariant.value.id,
        qty: deficit,
        tier: 'level1',
        totalUnits: deficit,
        notes: `Customer Order Shortage: wants ${requested} ${currentVariant.value.uom?.level1?.unit || 'units'} (${available} on-hand at ${selectedBranchName.value}, ${deficit} deficit requested from ${sourceBranchName})`,
        holdSale: true,
        heldCustomerName: currentCustomerDisplayName.value,
      })
    } else {
      req = {
        id: `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        requestingBranchId: selectedBranch.value,
        fulfillingBranchId: sourceBranchId,
        variantId: currentVariant.value.id,
        qty: Number(deficit),
        tier: 'level1',
        totalUnits: Number(deficit),
        status: 'pending',
        manifestNo: '',
        notes: `Customer Order Shortage: wants ${requested} ${currentVariant.value.uom?.level1?.unit || 'units'} (${available} on-hand at ${selectedBranchName.value}, ${deficit} deficit requested from ${sourceBranchName})`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dispatchedAt: null,
        receivedAt: null,
        holdSale: true,
        heldCustomerName: currentCustomerDisplayName.value,
      }
      if (store.transferRequests && Array.isArray(store.transferRequests)) {
        store.transferRequests.unshift(req)
        localStorage.setItem('inventory_transfer_requests', JSON.stringify(store.transferRequests))
      }
    }

    // Keep item in the active cart with held metadata
    const existingIdx = cartItems.value.findIndex(
      (item) => item.variantId === currentVariant.value.id,
    )

    if (existingIdx !== -1) {
      cartItems.value[existingIdx].quantity += requested
      cartItems.value[existingIdx].held = true
      cartItems.value[existingIdx].requestId = req.id
      cartItems.value[existingIdx].deficit = (cartItems.value[existingIdx].deficit || 0) + deficit
      cartItems.value[existingIdx].sourceBranchId = sourceBranchId
      cartItems.value[existingIdx].sourceBranchName = sourceBranchName
    } else {
      cartItems.value.push({
        id: `${currentVariant.value.id}-${Date.now()}`,
        variantId: currentVariant.value.id,
        fullName: currentVariant.value.fullName,
        sku: currentVariant.value.sku,
        unit: currentVariant.value.uom?.level1?.unit || 'units',
        unitPrice: currentVariant.value.baseCost,
        quantity: requested,
        category: currentVariant.value.category,
        held: true,
        requestId: req.id,
        deficit,
        sourceBranchId,
        sourceBranchName,
      })
    }

    quantityToAdd.value = 1
    successMessage.value = `Transfer Request ${req.id} created from ${sourceBranchName}. Item added to cart (order will be held pending delivery).`
  }

  function incrementCartItem(index) {
    errorMessage.value = ''
    const item = cartItems.value[index]
    if (!item) return
    if (!item.held) {
      const stock = store.branchStocks[selectedBranch.value]?.[item.variantId] || 0
      if (item.quantity + 1 > stock) {
        errorMessage.value = `Cannot exceed available branch stock of ${stock} ${item.unit} for ${item.sku}.`
        return
      }
    }
    item.quantity++
  }

  function decrementCartItem(index) {
    errorMessage.value = ''
    const item = cartItems.value[index]
    if (!item) return
    if (item.quantity > 1) {
      item.quantity--
    } else {
      removeCartItem(index)
    }
  }

  function removeCartItem(index) {
    cartItems.value.splice(index, 1)
  }

  function clearCart() {
    cartItems.value = []
  }

  const cartStockErrors = computed(() => {
    return cartItems.value.filter((item) => {
      if (item.held) return false
      const stock = store.branchStocks[selectedBranch.value]?.[item.variantId] || 0
      return item.quantity > stock
    })
  })

  const isEntireOrderOnHold = computed(() => {
    return cartItems.value.some((item) => item.held)
  })

  const heldItemsCount = computed(() => {
    return cartItems.value.filter((item) => item.held).length
  })

  const hasStockErrors = computed(() => cartStockErrors.value.length > 0)

  const totalCartUnits = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const cartSubtotal = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  })

  const totalDiscountPercent = computed(() => {
    return Math.min(100, Number(buyerDiscount.value || 0) + Number(specialDiscount.value || 0))
  })

  const totalDiscountAmount = computed(() => {
    return cartSubtotal.value * (totalDiscountPercent.value / 100)
  })

  const finalTotal = computed(() => {
    return Math.max(0, cartSubtotal.value - totalDiscountAmount.value)
  })

  // Held Orders Queue
  const heldSalesForBranch = computed(() => {
    return (store.heldSales || []).filter(
      (h) => !selectedBranch.value || h.branchId === selectedBranch.value,
    )
  })

  function getTransferStatus(requestId) {
    if (!requestId) return null
    return (store.transferRequests || []).find((r) => r.id === requestId)
  }

  // STRICT REQUIREMENT: Order is ready ONLY when ALL linked transfer requests are 'completed'
  function isHeldOrderReady(hold) {
    const reqIds = hold.requestIds || (hold.requestId ? [hold.requestId] : [])
    if (reqIds.length === 0) return false

    return reqIds.every((rId) => {
      const trf = getTransferStatus(rId)
      return trf && trf.status === 'completed'
    })
  }

  const readyHeldSalesCount = computed(() => {
    return heldSalesForBranch.value.filter((h) => isHeldOrderReady(h)).length
  })

  // Cashier finalizes order AFTER receiving freight
  function handleCompleteHeldOrder(holdId) {
    try {
      const hold = (store.heldSales || []).find((h) => h.id === holdId)
      if (!hold) return

      if (!isHeldOrderReady(hold)) {
        errorMessage.value =
          'Cannot complete sale: Delivery has not been accepted in the PO Dock yet.'
        return
      }

      let completed
      if (typeof store.completeHeldSale === 'function') {
        completed = store.completeHeldSale(holdId)
      } else {
        const holdIdx = store.heldSales.findIndex((h) => h.id === holdId)
        if (holdIdx !== -1) {
          completed = store.heldSales[holdIdx]
          // Deduct the stock and record verified sale
          completed.items.forEach((item) => {
            store.recordSale({
              branchId: completed.branchId,
              variantId: item.variantId,
              quantity: item.quantity,
              customerName: completed.customerName,
              buyerDiscountPercent: completed.discountPercent || 0,
              specialDiscountPercent: 0,
              specialReason: `[COMPLETED HELD] ${completed.orderRef}`,
              isHeld: false,
            })
          })
          store.heldSales.splice(holdIdx, 1)
          localStorage.setItem('inventory_held_sales', JSON.stringify(store.heldSales))
        }
      }

      successMessage.value = `Order ${completed?.orderRef || holdId} released! Stock deducted and transaction recorded for ${completed?.customerName}.`
    } catch (err) {
      errorMessage.value = err.message
    }
  }

  function handleCancelHeldOrder(holdId) {
    if (window.confirm('Cancel this held order? Any associated reserved items will be released.')) {
      if (typeof store.cancelHeldSale === 'function') {
        store.cancelHeldSale(holdId)
      } else {
        const idx = (store.heldSales || []).findIndex((h) => h.id === holdId)
        if (idx !== -1) {
          store.heldSales.splice(idx, 1)
          localStorage.setItem('inventory_held_sales', JSON.stringify(store.heldSales))
        }
      }
      successMessage.value = 'Held order cancelled.'
    }
  }

  function goToConfirmation() {
    errorMessage.value = ''
    successMessage.value = ''

    if (cartItems.value.length === 0) {
      errorMessage.value = 'Please add at least one item to the bulk order before proceeding.'
      return
    }

    if (hasStockErrors.value) {
      errorMessage.value =
        'Some staged items exceed available branch stock. Please adjust quantities before proceeding.'
      return
    }

    if (customerMode.value === 'new' && !newCustomerName.value.trim()) {
      errorMessage.value = 'Please enter a name for the new client or switch to Saved Profile.'
      return
    }

    activeStep.value = 'confirm'
  }

  function backToCart() {
    errorMessage.value = ''
    activeStep.value = 'cart'
  }

  // Authorize Sale
  function handleAuthorizeSale() {
    errorMessage.value = ''
    successMessage.value = ''

    if (cartItems.value.length === 0) {
      activeStep.value = 'cart'
      return
    }

    if (hasStockErrors.value) {
      errorMessage.value =
        'Stock changed! Some items exceed on-hand inventory. Please review your cart.'
      activeStep.value = 'cart'
      return
    }

    const custName = currentCustomerDisplayName.value
    const orderRef = `ORD-${Date.now().toString().slice(-6)}`
    const reasonText = specialReason.value.trim()
      ? `[${orderRef}] ${specialReason.value.trim()}`
      : `[${orderRef}] Bulk Order`

    const isOrderHeld = isEntireOrderOnHold.value

    try {
      if (isOrderHeld) {
        const heldItems = cartItems.value.filter((item) => item.held)
        const primaryReq = heldItems[0]

        const heldPayload = {
          id: `HOLD-${Date.now().toString().slice(-6)}`,
          orderRef,
          branchId: selectedBranch.value,
          customerName: custName,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          requestId: primaryReq?.requestId || '',
          requestIds: heldItems.map((it) => it.requestId),
          sourceBranchId: primaryReq?.sourceBranchId || '',
          sourceBranchName: primaryReq?.sourceBranchName || '',
          totalAmount: finalTotal.value,
          discountPercent: totalDiscountPercent.value,
          items: [...cartItems.value],
          specialReason: reasonText,
        }

        let heldRecord
        if (typeof store.createHeldSale === 'function') {
          heldRecord = store.createHeldSale(heldPayload) || heldPayload
        } else {
          heldRecord = heldPayload
          if (!store.heldSales) store.heldSales = []
          store.heldSales.unshift(heldRecord)
          localStorage.setItem('inventory_held_sales', JSON.stringify(store.heldSales))
        }

        const totalUnits = totalCartUnits.value
        const totalAmt = finalTotal.value.toFixed(2)
        successMessage.value = `Order ${heldRecord.orderRef || orderRef} for ${custName} placed in Held Orders (${totalUnits} units, ₱${totalAmt})! Awaiting transfer arrival.`

        cartItems.value = []
        quantityToAdd.value = 1
        specialDiscount.value = 0
        specialReason.value = ''
        shouldUpdateProfileDiscount.value = false
        activeStep.value = 'cart'
        activeViewMode.value = 'held'

        if (window.innerWidth <= 768) {
          mobileActiveTab.value = 'pos'
        }
        return
      }

      // Normal in-stock checkout
      cartItems.value.forEach((item, idx) => {
        const shouldUpdate = idx === 0 ? shouldUpdateProfileDiscount.value : false

        store.recordSale({
          branchId: selectedBranch.value,
          variantId: item.variantId,
          quantity: item.quantity,
          customerName: custName,
          buyerDiscountPercent: buyerDiscount.value,
          specialDiscountPercent: specialDiscount.value,
          specialReason: reasonText,
          updateDefaultDiscount: shouldUpdate,
          isHeld: false,
        })
      })

      const itemCount = cartItems.value.length
      const totalUnits = totalCartUnits.value
      const totalAmt = finalTotal.value.toFixed(2)

      successMessage.value = `Order ${orderRef} authorized: ${itemCount} items (${totalUnits} units, ₱${totalAmt}) processed and stock deducted.`

      if (customerMode.value === 'new') {
        const added = store.customers?.find(
          (c) => c.name.toLowerCase() === newCustomerName.value.trim().toLowerCase(),
        )
        if (added) selectedCustomerId.value = added.id
        newCustomerName.value = ''
        customerMode.value = 'existing'
      }

      cartItems.value = []
      quantityToAdd.value = 1
      specialDiscount.value = 0
      specialReason.value = ''
      shouldUpdateProfileDiscount.value = false
      activeStep.value = 'cart'

      if (window.innerWidth <= 768) {
        mobileActiveTab.value = 'ledger'
      }
    } catch (err) {
      errorMessage.value = err.message
    }
  }

  return {
    store,
    activeStep,
    activeViewMode,
    mobileActiveTab,
    setPosTab,
    successMessage,
    errorMessage,
    selectedBranch,
    branchOptions,
    selectedBranchName,
    selectedVariantId,
    quantityToAdd,
    cartItems,
    variantOptions,
    currentVariant,
    branchStockForVariant,
    stagedQtyForVariant,
    remainingAvailableStock,
    customerMode,
    selectedCustomerId,
    newCustomerName,
    buyerDiscount,
    shouldUpdateProfileDiscount,
    specialDiscount,
    specialReason,
    customerOptions,
    currentCustomerDisplayName,
    onCustomerChange,
    handleRemoveCustomer,
    requestSourceBranch,
    sourceBranchOptions,
    selectedSourceBranchStock,
    selectedSourceBranchName,
    handleAddToCart,
    handleCreateShortageRequest,
    incrementCartItem,
    decrementCartItem,
    removeCartItem,
    clearCart,
    isEntireOrderOnHold,
    heldItemsCount,
    hasStockErrors,
    totalCartUnits,
    cartSubtotal,
    totalDiscountPercent,
    totalDiscountAmount,
    finalTotal,
    heldSalesForBranch,
    getTransferStatus,
    isHeldOrderReady,
    readyHeldSalesCount,
    handleCompleteHeldOrder,
    handleCancelHeldOrder,
    goToConfirmation,
    backToCart,
    handleAuthorizeSale,
    goBackToCatalog,
  }
}
