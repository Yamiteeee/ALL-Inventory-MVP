import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useInventoryStore = defineStore('inventory', () => {
  const branches = ref([
    { id: 'b-commissary', name: 'Main Commissary / Central Hub' },
    { id: 'b-downtown', name: 'Downtown Branch' },
    { id: 'b-uptown', name: 'Uptown Branch' },
  ])

  // Master Parent-Variant Catalog
  const products = ref([
    {
      id: 101,
      sku: 'SYR-SUN-APL-2.5L',
      parentName: 'Concentrated Fruit Syrup',
      brand: 'Sunwide',
      category: 'Syrups',
      subCategory: 'Fruit Syrups',
      supplier: 'Golden Dragon Import Corp',
      isPerishable: true,
      shelfLifeDays: 365,
      flavor: 'Green Apple',
      color: 'Emerald Green',
      subtitle: 'Premium Barista Blend',
      supplierItemNo: 'SW-APL-882',
      sizeCapacity: '2.5L',
      fullName: 'Sunwide Concentrated Fruit Syrup - Green Apple (2.5L)',
      uom: {
        level1: { unit: 'bottle', pcs: 1 },
        level2: { unit: 'box', multiplier: 6 },
        level3: { unit: 'pallet', multiplier: 25 },
      },
      baseCost: 380.0,
    },
    {
      id: 102,
      sku: 'PRL-AND-BOBA-3K',
      parentName: 'Tapioca Pearls',
      brand: 'Andes Boba',
      category: 'Toppings',
      subCategory: 'Pearls',
      supplier: 'Taiwan Direct Foods',
      isPerishable: true,
      shelfLifeDays: 180,
      flavor: 'Brown Sugar Aroma',
      color: 'Glossy Black',
      subtitle: 'Quick-Cook 25min',
      supplierItemNo: 'TB-BBA-03',
      sizeCapacity: '3kg',
      fullName: 'Andes Boba Tapioca Pearls - Brown Sugar Aroma (3kg)',
      uom: {
        level1: { unit: 'bag', pcs: 1 },
        level2: { unit: 'sack/box', multiplier: 6 },
        level3: { unit: 'pallet', multiplier: 30 },
      },
      baseCost: 260.0,
    },
    {
      id: 103,
      sku: 'CUP-PP-90-16OZ',
      parentName: 'U-Cup Injection Molded',
      brand: 'EcoPack',
      category: 'Packaging',
      subCategory: 'Plastic Cups',
      supplier: 'Manila Plastics Industrial',
      isPerishable: false,
      shelfLifeDays: null,
      flavor: null,
      color: 'Ultra Clear',
      subtitle: '90mm Caliber Flat Rim',
      supplierItemNo: 'EP-90-16',
      sizeCapacity: '16oz / 500ml',
      fullName: 'EcoPack U-Cup Injection Molded - Ultra Clear (16oz / 500ml)',
      uom: {
        level1: { unit: 'sleeve (50pcs)', pcs: 50 },
        level2: { unit: 'master carton', multiplier: 20 },
        level3: { unit: 'pallet', multiplier: 24 },
      },
      baseCost: 110.0,
    },
    {
      id: 104,
      sku: 'MAC-SEALER-AUTO-90',
      parentName: 'Automatic Cup Sealer',
      brand: 'Fest Tech',
      category: 'Machines/Hardware',
      subCategory: 'Sealing Machines',
      supplier: 'Kevins Kitchen Equipment',
      isPerishable: false,
      shelfLifeDays: null,
      flavor: null,
      color: 'Matte Black',
      subtitle: 'Microcomputer Dual Sensor',
      supplierItemNo: 'FEST-RC95',
      sizeCapacity: '400 cups/hr',
      fullName: 'Fest Tech Automatic Cup Sealer - Microcomputer Dual Sensor (400 cups/hr)',
      warranty: '1 Year Parts & Labor',
      machineSpecs: '220V / 350W / 90-95mm caliber',
      uom: {
        level1: { unit: 'unit', pcs: 1 },
        level2: { unit: 'wooden crate', multiplier: 1 },
        level3: { unit: 'pallet', multiplier: 8 },
      },
      baseCost: 14500.0,
    },
  ])

  // Branch Stocks: Base Unit (Level 1) counts
  const branchStocks = ref({
    'b-commissary': { 101: 240, 102: 180, 103: 350, 104: 8 },
    'b-downtown': { 101: 18, 102: 12, 103: 45, 104: 1 },
    'b-uptown': { 101: 6, 102: 0, 103: 20, 104: 0 },
  })

  // Customer Loyalty List (Hydrated from localStorage)
  const defaultCustomers = [
    { id: 'c-walkin', name: 'Walk-in Retail Buyer', defaultDiscount: 0, tier: 'Retail' },
    {
      id: 'c-bobalove',
      name: 'Boba Bliss Cafe (Loyal Client)',
      defaultDiscount: 5,
      tier: 'Frequent Buyer',
    },
    {
      id: 'c-franchise',
      name: 'Bubble Tea Hub 10-Store Franchise',
      defaultDiscount: 12,
      tier: 'Wholesale Partner',
    },
  ]

  const savedCustomers = localStorage.getItem('inventory_customers')
  const customers = ref(savedCustomers ? JSON.parse(savedCustomers) : defaultCustomers)

  function saveOrUpdateCustomer({ name, discount = 0, tier = 'Registered Buyer' }) {
    const cleanName = name.trim()
    if (!cleanName || cleanName.toLowerCase() === 'walk-in retail buyer') return null

    const existingIndex = customers.value.findIndex(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase(),
    )

    let customerRecord
    if (existingIndex !== -1) {
      customers.value[existingIndex].defaultDiscount = Number(discount)
      customerRecord = customers.value[existingIndex]
    } else {
      customerRecord = {
        id: `c-${Date.now()}`,
        name: cleanName,
        defaultDiscount: Number(discount),
        tier,
      }
      customers.value.push(customerRecord)
    }

    localStorage.setItem('inventory_customers', JSON.stringify(customers.value))
    return customerRecord
  }

  // Proper store-level method for removing a customer
  function removeCustomer(customerId) {
    if (customerId === 'c-walkin') return

    customers.value = customers.value.filter((c) => c.id !== customerId)
    localStorage.setItem('inventory_customers', JSON.stringify(customers.value))
  }

  // Stock In / PO Receiving (Handles Level 1, Level 2 Box, or Level 3 Pallet)
  const stockInHistory = ref([])
  const salesHistory = ref([])

  function receiveStock({ branchId, productId, inputQty, uomTier, supplierNote, batchExpiry }) {
    const product = products.value.find((p) => p.id === Number(productId))
    if (!product) return

    let totalBaseUnits = Number(inputQty)
    if (uomTier === 'level2') {
      totalBaseUnits = Number(inputQty) * product.uom.level2.multiplier
    } else if (uomTier === 'level3') {
      totalBaseUnits =
        Number(inputQty) * product.uom.level2.multiplier * product.uom.level3.multiplier
    }

    if (!branchStocks.value[branchId]) {
      branchStocks.value[branchId] = {}
    }
    const current = branchStocks.value[branchId][productId] || 0
    branchStocks.value[branchId][productId] = current + totalBaseUnits

    const branch = branches.value.find((b) => b.id === branchId)

    stockInHistory.value.unshift({
      id: Date.now(),
      date:
        new Date().toLocaleDateString() +
        ' ' +
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      branchName: branch?.name || branchId,
      productName: product.fullName,
      inputQty: Number(inputQty),
      uomTierLabel:
        uomTier === 'level1'
          ? product.uom.level1.unit
          : uomTier === 'level2'
            ? product.uom.level2.unit
            : product.uom.level3.unit,
      totalBaseUnits,
      baseUnit: product.uom.level1.unit,
      note: supplierNote || 'Standard Delivery',
      expiry: batchExpiry || (product.isPerishable ? 'Batch Tagged' : 'N/A'),
    })
  }

  // Stock Out / POS Sale
  function recordSale({
    branchId,
    productId,
    quantity,
    customerName,
    buyerDiscountPercent,
    specialDiscountPercent,
    specialReason,
  }) {
    const currentStock = branchStocks.value[branchId]?.[productId] || 0
    const qty = Number(quantity)

    if (currentStock < qty) {
      throw new Error(`Insufficient stock. Only ${currentStock} left in this branch.`)
    }

    branchStocks.value[branchId][productId] = currentStock - qty

    const product = products.value.find((p) => p.id === Number(productId))
    const branch = branches.value.find((b) => b.id === branchId)

    const subtotal = product.baseCost * qty
    const totalDiscountPercent = Math.min(
      100,
      Number(buyerDiscountPercent || 0) + Number(specialDiscountPercent || 0),
    )
    const discountAmount = subtotal * (totalDiscountPercent / 100)
    const finalTotal = subtotal - discountAmount

    // Auto-save recurring customer & default discount rate to localStorage
    if (customerName && customerName.trim().toLowerCase() !== 'walk-in retail buyer') {
      saveOrUpdateCustomer({
        name: customerName,
        discount: buyerDiscountPercent,
      })
    }

    salesHistory.value.unshift({
      id: Date.now(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      branchName: branch?.name || branchId,
      productName: product.fullName,
      unit: product.uom.level1.unit,
      quantity: qty,
      subtotal,
      totalDiscountPercent,
      discountAmount,
      finalTotal,
      customerName: customerName.trim() || 'Walk-in Retail Buyer',
      specialReason: specialReason || 'Regular Sale',
    })

    return finalTotal
  }

  return {
    branches,
    products,
    branchStocks,
    customers,
    stockInHistory,
    salesHistory,
    removeCustomer,
    receiveStock,
    recordSale,
    saveOrUpdateCustomer,
  }
})
