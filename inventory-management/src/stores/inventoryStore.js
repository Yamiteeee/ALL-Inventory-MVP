import { defineStore } from 'pinia'
import { ref, computed } from 'vue' // 1. Added computed

export const useInventoryStore = defineStore('inventory', () => {
  const branches = ref([
    { id: 'b-commissary', name: 'Main Commissary / Central Hub' },
    { id: 'b-downtown', name: 'Downtown Branch' },
    { id: 'b-uptown', name: 'Uptown Branch' },
  ])

  // MASTER PARENT-VARIANT HIERARCHY
  const catalog = ref([
    {
      parentId: 'P-100',
      parentName: 'Concentrated Fruit Tea Syrup',
      category: 'Syrups',
      subCategory: 'Fruit Flavors',
      brand: 'Sunwide',
      supplier: 'Golden Dragon Import Corp',
      isPerishable: true,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-1001',
          sku: 'SYR-SUN-APL-2.5L',
          flavor: 'Green Apple',
          color: 'Emerald Green',
          subtitle: 'Premium Barista Blend',
          supplierItemNo: 'SW-APL-882',
          sizeCapacity: '2.5L',
          shelfLifeDays: 365,
          dimensions: { lengthCm: 35, widthCm: 25, heightCm: 30, weightKg: 16.5 },
          uom: {
            level1: { unit: 'bottle', pcsPerUnit: 1 },
            level2: { unit: 'box', multiplier: 6 },
            level3: { unit: 'pallet', multiplier: 25 },
            bundle: { enabled: true, label: 'Pair Lot', qtyOfLvl1: 2 },
          },
          baseCost: 380.0,
        },
        {
          id: 'V-1002',
          sku: 'SYR-SUN-LYC-2.5L',
          flavor: 'Lychee',
          color: 'Translucent White',
          subtitle: 'Sweet Floral Extract',
          supplierItemNo: 'SW-LYC-104',
          sizeCapacity: '2.5L',
          shelfLifeDays: 365,
          dimensions: { lengthCm: 35, widthCm: 25, heightCm: 30, weightKg: 16.5 },
          uom: {
            level1: { unit: 'bottle', pcsPerUnit: 1 },
            level2: { unit: 'box', multiplier: 6 },
            level3: { unit: 'pallet', multiplier: 25 },
            bundle: { enabled: false },
          },
          baseCost: 380.0,
        },
      ],
    },
    {
      parentId: 'P-200',
      parentName: 'U-Cup Injection Molded Plastic',
      category: 'Packaging',
      subCategory: 'Plastic Cups',
      brand: 'EcoPack',
      supplier: 'Manila Plastics Industrial',
      isPerishable: false,
      itemType: 'consumable',
      variants: [
        {
          id: 'V-2001',
          sku: 'CUP-EP-90-16OZ',
          flavor: null,
          color: 'Ultra Clear',
          subtitle: '90mm Caliber Flat Rim',
          supplierItemNo: 'EP-90-16',
          sizeCapacity: '16oz (500ml)',
          shelfLifeDays: null,
          dimensions: { lengthCm: 45, widthCm: 38, heightCm: 42, weightKg: 12.0 },
          uom: {
            level1: { unit: 'sleeve', pcsPerUnit: 50 },
            level2: { unit: 'master carton', multiplier: 20 },
            level3: { unit: 'pallet', multiplier: 24 },
            bundle: { enabled: true, label: 'Promo Twin-Sleeve', qtyOfLvl1: 2 },
          },
          baseCost: 110.0,
        },
        {
          id: 'V-2002',
          sku: 'CUP-EP-90-22OZ',
          flavor: null,
          color: 'Ultra Clear',
          subtitle: '90mm Caliber Tall Rim',
          supplierItemNo: 'EP-90-22',
          sizeCapacity: '22oz (700ml)',
          shelfLifeDays: null,
          dimensions: { lengthCm: 48, widthCm: 40, heightCm: 46, weightKg: 14.2 },
          uom: {
            level1: { unit: 'sleeve', pcsPerUnit: 50 },
            level2: { unit: 'master carton', multiplier: 20 },
            level3: { unit: 'pallet', multiplier: 20 },
            bundle: { enabled: false },
          },
          baseCost: 135.0,
        },
      ],
    },
    {
      parentId: 'P-300',
      parentName: 'Automatic Cup Sealing Machine',
      category: 'Machines/Hardware',
      subCategory: 'Sealing Equipment',
      brand: 'Fest Tech',
      supplier: 'Kevins Kitchen Equipment',
      isPerishable: false,
      itemType: 'hardware',
      variants: [
        {
          id: 'V-3001',
          sku: 'MAC-FEST-RC95',
          flavor: null,
          color: 'Matte Black',
          subtitle: 'Microcomputer Dual Sensor',
          supplierItemNo: 'FEST-RC95',
          sizeCapacity: '400 cups/hr',
          warranty: '1 Year Full Parts & Labor',
          machineSpecs: '220V / 350W / 90-95mm caliber universal ring',
          dimensions: { lengthCm: 36, widthCm: 25, heightCm: 58, weightKg: 28.5 },
          uom: {
            level1: { unit: 'unit', pcsPerUnit: 1 },
            level2: { unit: 'wooden crate', multiplier: 1 },
            level3: { unit: 'pallet', multiplier: 8 },
            bundle: { enabled: false },
          },
          baseCost: 14500.0,
        },
      ],
    },
  ])

  // Branch Stocks tied to Variant IDs
  const branchStocks = ref({
    'b-commissary': { 'V-1001': 240, 'V-1002': 180, 'V-2001': 350, 'V-2002': 120, 'V-3001': 8 },
    'b-downtown': { 'V-1001': 18, 'V-1002': 6, 'V-2001': 45, 'V-2002': 15, 'V-3001': 1 },
    'b-uptown': { 'V-1001': 6, 'V-1002': 0, 'V-2001': 20, 'V-2002': 0, 'V-3001': 0 },
  })

  // Customer Loyalty List
  const defaultCustomers = [
    { id: 'c-walkin', name: 'Walk-in Retail Buyer', defaultDiscount: 0, tier: 'Retail' },
    {
      id: 'c-bobalove',
      name: 'Boba Bliss Cafe (Loyal Client)',
      defaultDiscount: 5,
      tier: 'Frequent Buyer',
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

    let record
    if (existingIndex !== -1) {
      customers.value[existingIndex].defaultDiscount = Number(discount)
      record = customers.value[existingIndex]
    } else {
      record = { id: `c-${Date.now()}`, name: cleanName, defaultDiscount: Number(discount), tier }
      customers.value.push(record)
    }
    localStorage.setItem('inventory_customers', JSON.stringify(customers.value))
    return record
  }

  function removeCustomer(customerId) {
    if (customerId === 'c-walkin') return
    customers.value = customers.value.filter((c) => c.id !== customerId)
    localStorage.setItem('inventory_customers', JSON.stringify(customers.value))
  }

  // 2. Automated Name Formula (must be defined BEFORE flatVariants)
  function generateVariantName(parent, variant) {
    const descriptors = [variant.flavor, variant.subtitle].filter(Boolean).join(' - ')
    return `${parent.brand} ${parent.parentName} · ${descriptors} (${variant.sizeCapacity})`
  }

  function calculateCBM(dim) {
    if (!dim || !dim.lengthCm) return '0.000'
    return ((dim.lengthCm * dim.widthCm * dim.heightCm) / 1000000).toFixed(3)
  }

  // 3. Flattened variant projection (placed here so catalog & generateVariantName exist)
  const flatVariants = computed(() => {
    return catalog.value.flatMap((parent) =>
      parent.variants.map((v) => ({
        ...v,
        parentId: parent.parentId,
        parentName: parent.parentName,
        brand: parent.brand,
        category: parent.category,
        subCategory: parent.subCategory,
        supplier: parent.supplier,
        isPerishable: parent.isPerishable,
        fullName: generateVariantName(parent, v),
      })),
    )
  })

  // Stock In Receiving Action
  const stockInHistory = ref([])
  function receiveStock({ branchId, variantId, inputQty, uomTier, supplierNote, batchExpiry }) {
    const variant = flatVariants.value.find((v) => v.id === variantId)
    if (!variant) return

    let totalBaseUnits = Number(inputQty)
    if (uomTier === 'level2') {
      totalBaseUnits = Number(inputQty) * variant.uom.level2.multiplier
    } else if (uomTier === 'level3') {
      totalBaseUnits =
        Number(inputQty) * variant.uom.level2.multiplier * variant.uom.level3.multiplier
    }

    if (!branchStocks.value[branchId]) {
      branchStocks.value[branchId] = {}
    }
    const current = branchStocks.value[branchId][variantId] || 0
    branchStocks.value[branchId][variantId] = current + totalBaseUnits

    const branch = branches.value.find((b) => b.id === branchId)

    stockInHistory.value.unshift({
      id: Date.now(),
      date:
        new Date().toLocaleDateString() +
        ' ' +
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      branchName: branch?.name || branchId,
      productName: variant.fullName,
      inputQty: Number(inputQty),
      uomTierLabel:
        uomTier === 'level1'
          ? variant.uom.level1.unit
          : uomTier === 'level2'
            ? variant.uom.level2.unit
            : variant.uom.level3.unit,
      totalBaseUnits,
      baseUnit: variant.uom.level1.unit,
      note: supplierNote || 'Standard Delivery',
      expiry: batchExpiry || (variant.isPerishable ? 'Batch Tagged' : 'N/A'),
    })
  }

  // POS Sales Action
  const salesHistory = ref([])
  function recordSale({
    branchId,
    variantId,
    quantity,
    customerName,
    buyerDiscountPercent,
    specialDiscountPercent,
    specialReason,
  }) {
    const currentStock = branchStocks.value[branchId]?.[variantId] || 0
    const qty = Number(quantity)

    if (currentStock < qty) {
      throw new Error(`Insufficient stock. Only ${currentStock} left in this branch.`)
    }

    branchStocks.value[branchId][variantId] = currentStock - qty

    const variant = flatVariants.value.find((v) => v.id === variantId)
    const branch = branches.value.find((b) => b.id === branchId)

    const subtotal = variant.baseCost * qty
    const totalDiscountPercent = Math.min(
      100,
      Number(buyerDiscountPercent || 0) + Number(specialDiscountPercent || 0),
    )
    const discountAmount = subtotal * (totalDiscountPercent / 100)
    const finalTotal = subtotal - discountAmount

    if (customerName && customerName.trim().toLowerCase() !== 'walk-in retail buyer') {
      saveOrUpdateCustomer({ name: customerName, discount: buyerDiscountPercent })
    }

    salesHistory.value.unshift({
      id: Date.now(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      branchName: branch?.name || branchId,
      productName: variant.fullName,
      unit: variant.uom.level1.unit,
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
    catalog,
    flatVariants, // 4. Exported to store consumers
    branchStocks,
    customers,
    stockInHistory,
    salesHistory,
    generateVariantName,
    calculateCBM,
    saveOrUpdateCustomer,
    removeCustomer,
    receiveStock,
    recordSale,
  }
})
