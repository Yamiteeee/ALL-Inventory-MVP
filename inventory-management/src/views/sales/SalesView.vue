<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'
import { SALES_UI } from './salesConfig'
import { usePageEntrance } from '@/animations/usePageEntrance'
import { useTypewriter } from '@/animations/useTypewriter'
import IosSelect from '@/components/ui/IosSelect.vue'

// Lucide Vue Next Icons
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Receipt,
  Percent,
  Sparkles,
  ShoppingBag,
  CreditCard,
  UserCheck,
  ListOrdered,
  Tag,
  Plus,
  Minus,
  ShoppingCart,
  Store,
  ShieldCheck,
  RotateCcw,
} from 'lucide-vue-next'

const router = useRouter()
const store = useInventoryStore()

// 1. Run universal entrance animation
usePageEntrance()

// 2. Start typewriter right after the top bar settles (~350ms)
const { displayedText: pageTitle, isComplete: isTypingDone } = useTypewriter(
  SALES_UI.header.title,
  { speed: 28, delay: 350 },
)

// Workflow step: 'cart' (builder & staging) | 'confirm' (review & verification)
const activeStep = ref('cart')

// Branch Selection
const selectedBranch = ref(store.branches[0]?.id || '')

// Active item builder inputs
const selectedVariantId = ref(store.flatVariants[0]?.id || '')
const quantityToAdd = ref(1)

// Staged bulk order cart: Array of { id, variantId, fullName, sku, unit, unitPrice, quantity, category }
const cartItems = ref([])

// Customer & loyalty inputs
const customerMode = ref('existing')
const selectedCustomerId = ref(store.customers[0]?.id || '')
const newCustomerName = ref('')
const buyerDiscount = ref(store.customers[0]?.defaultDiscount || 0)
const shouldUpdateProfileDiscount = ref(false)

const specialDiscount = ref(0)
const specialReason = ref('')

const successMessage = ref('')
const errorMessage = ref('')
const mobileActiveTab = ref('pos') // 'pos' | 'ledger'

function goBackToCatalog() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/inventory')
  }
}

// Normalized Options for IosSelect
const branchOptions = computed(() => {
  return store.branches.map((b) => ({
    value: b.id,
    label: b.name,
  }))
})

const selectedBranchName = computed(() => {
  return store.branches.find((b) => b.id === selectedBranch.value)?.name || selectedBranch.value
})

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

// Total stock in selected branch for the current variant
const branchStockForVariant = computed(() => {
  if (!currentVariant.value) return 0
  return store.branchStocks[selectedBranch.value]?.[currentVariant.value.id] || 0
})

// Quantity of this variant already staged in cart
const stagedQtyForVariant = computed(() => {
  if (!currentVariant.value) return 0
  return cartItems.value
    .filter((item) => item.variantId === currentVariant.value.id)
    .reduce((sum, item) => sum + item.quantity, 0)
})

// Remaining quantity available to stage without exceeding branch stock
const remainingAvailableStock = computed(() => {
  return Math.max(0, branchStockForVariant.value - stagedQtyForVariant.value)
})

// Add current variant to staged bulk cart
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
    })
  }

  // Reset add quantity to 1
  quantityToAdd.value = 1
}

// Cart Item Stepper Controls
function incrementCartItem(index) {
  errorMessage.value = ''
  const item = cartItems.value[index]
  if (!item) return
  const stock = store.branchStocks[selectedBranch.value]?.[item.variantId] || 0
  if (item.quantity + 1 > stock) {
    errorMessage.value = `Cannot exceed available branch stock of ${stock} ${item.unit} for ${item.sku}.`
    return
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

// Stock check across all items in cart (validates against currently selected branch)
const cartStockErrors = computed(() => {
  return cartItems.value.filter((item) => {
    const stock = store.branchStocks[selectedBranch.value]?.[item.variantId] || 0
    return item.quantity > stock
  })
})

const hasStockErrors = computed(() => {
  return cartStockErrors.value.length > 0
})

const totalCartUnits = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

// Subtotal & Financial Calculation
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

// Customer Profile Options
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

// Proceed to Confirmation Screen
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

// Return to Cart Builder
function backToCart() {
  errorMessage.value = ''
  activeStep.value = 'cart'
}

// Authorize and Complete Sale (Processes all staged cart items)
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

  try {
    // Process each cart item through the store
    cartItems.value.forEach((item, idx) => {
      // Update permanent customer discount profile on first item only
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
      })
    })

    const itemCount = cartItems.value.length
    const totalUnits = totalCartUnits.value
    const totalAmt = finalTotal.value.toFixed(2)

    successMessage.value = `Order ${orderRef} authorized: ${itemCount} items (${totalUnits} units, ₱${totalAmt}) processed and stock deducted.`

    if (customerMode.value === 'new') {
      const added = store.customers.find(
        (c) => c.name.toLowerCase() === newCustomerName.value.trim().toLowerCase(),
      )
      if (added) selectedCustomerId.value = added.id
      newCustomerName.value = ''
      customerMode.value = 'existing'
    }

    // Reset staged cart and transient inputs
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
</script>

<template>
  <div class="screen-wrapper">
    <div class="minimal-shell">
      <!-- 1. Streamlined Top Header Strip -->
      <header class="top-nav anim-top">
        <div class="nav-brand">
          <div class="header-meta-bar">
            <button type="button" class="back-btn" @click="goBackToCatalog">
              <ArrowLeft :size="13" stroke-width="2.5" />
              <span class="back-text-desktop">{{ SALES_UI.header.backText }}</span>
              <span class="back-text-mobile">Catalog</span>
            </button>
          </div>

          <h1 class="page-title">
            <span class="ghost-reserve" aria-hidden="true">{{ SALES_UI.header.title }}.</span>
            <span class="typing-active">
              {{ pageTitle }}
              <span v-if="!isTypingDone" class="typewriter-cursor" aria-hidden="true">|</span>
              <span v-else class="morph-period" aria-hidden="true">
                <span class="dot-shape"></span>
                <span class="heart-shape">♥</span>
              </span>
            </span>
          </h1>

          <p class="page-subtitle">{{ SALES_UI.header.subtitle }}</p>
        </div>

        <!-- Rendered strictly on desktop to avoid mobile cramming -->
        <div class="header-badges desktop-badge">
          <span class="session-badge">
            <ShoppingBag :size="13" stroke-width="2.2" />
            <span>{{ store.salesHistory?.length || 0 }} {{ SALES_UI.header.badgeSuffix }}</span>
          </span>
        </div>
      </header>

      <!-- Feedback Alerts -->
      <transition name="fade-alert">
        <div v-if="successMessage" class="alert alert-success">
          <CheckCircle2 :size="16" />
          <span>{{ successMessage }}</span>
        </div>
      </transition>
      <transition name="fade-alert">
        <div v-if="errorMessage" class="alert alert-error">
          <AlertCircle :size="16" />
          <span>{{ errorMessage }}</span>
        </div>
      </transition>

      <!-- Mobile Tab Switcher (Visible only <= 768px) -->
      <div class="mobile-segmented-bar anim-stagger">
        <button
          type="button"
          class="segment-choice"
          :class="{ active: mobileActiveTab === 'pos' }"
          @click="mobileActiveTab = 'pos'"
        >
          <CreditCard :size="14" />
          <span>Point of Sale</span>
        </button>
        <button
          type="button"
          class="segment-choice"
          :class="{ active: mobileActiveTab === 'ledger' }"
          @click="mobileActiveTab = 'ledger'"
        >
          <ListOrdered :size="14" />
          <span>Ledger ({{ store.salesHistory?.length || 0 }})</span>
        </button>
      </div>

      <!-- 2. Two-Column Workspace -->
      <div class="sales-workspace" :data-active-tab="mobileActiveTab">
        <!-- Left: Checkout Configurator Card (Multi-Step Bulk Flow) -->
        <section
          class="checkout-card anim-card"
          :class="{ 'mobile-hidden': mobileActiveTab !== 'pos' }"
        >
          <!-- Dynamic Card Header according to activeStep -->
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-title">
                {{ activeStep === 'cart' ? SALES_UI.form.title : SALES_UI.confirmation.title }}
              </span>
            </div>
            <span class="step-pill">
              {{ activeStep === 'cart' ? SALES_UI.form.stepBuilder : SALES_UI.form.stepConfirm }}
            </span>
          </div>

          <!-- STEP 1: ITEM BUILDER & BULK CART STAGING -->
          <div v-if="activeStep === 'cart'" class="sales-form">
            <!-- Branch Selection -->
            <div class="input-group">
              <label>{{ SALES_UI.form.branchLabel }}</label>
              <IosSelect
                v-model="selectedBranch"
                :options="branchOptions"
                title="Select Retail Branch"
                placeholder="Choose Branch"
              />
            </div>

            <!-- SKU Picker & Item Staging Box -->
            <div class="builder-box">
              <div class="input-group">
                <label>{{ SALES_UI.form.variantLabel }}</label>
                <IosSelect
                  v-model="selectedVariantId"
                  :options="variantOptions"
                  title="Select Catalog Product SKU"
                  placeholder="Choose Product Variant"
                  searchable
                />

                <!-- Selected Variant Info Banner -->
                <div v-if="currentVariant" class="selected-variant-preview">
                  <div class="preview-title">{{ currentVariant.fullName }}</div>
                  <div class="preview-meta">
                    <span class="preview-tag tag-mono">
                      ₱{{ currentVariant.baseCost.toFixed(2) }} / {{ currentVariant.uom.level1.unit }}
                    </span>
                    <span class="preview-tag">{{ currentVariant.category }}</span>
                    <span
                      class="preview-tag tag-stock"
                      :class="{ 'tag-out': remainingAvailableStock <= 0 }"
                    >
                      On-Hand: {{ branchStockForVariant }} {{ currentVariant.uom.level1.unit }}
                      <template v-if="stagedQtyForVariant > 0">
                        ({{ remainingAvailableStock }} avail to add)
                      </template>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Quantity Input + Add to Order Action -->
              <div class="add-action-row">
                <div class="qty-field-group">
                  <label for="pos-qty-input">{{ SALES_UI.form.qtyLabel }}</label>
                  <input
                    id="pos-qty-input"
                    v-model.number="quantityToAdd"
                    type="number"
                    min="1"
                    :max="remainingAvailableStock"
                    step="1"
                    inputmode="numeric"
                    class="form-control"
                    placeholder="1"
                  />
                </div>

                <button
                  type="button"
                  class="btn-add-item"
                  :disabled="remainingAvailableStock <= 0 || quantityToAdd <= 0 || quantityToAdd > remainingAvailableStock"
                  @click="handleAddToCart"
                >
                  <Plus :size="15" stroke-width="2.5" />
                  <span>{{ SALES_UI.form.addItemBtn }}</span>
                </button>
              </div>
            </div>

            <!-- STAGED BULK CART SECTION -->
            <div class="cart-section">
              <div class="cart-header">
                <div class="cart-title-group">
                  <ShoppingCart :size="15" class="cart-icon" />
                  <span class="cart-heading">{{ SALES_UI.cart.title }}</span>
                  <span v-if="cartItems.length > 0" class="cart-count-badge">
                    {{ SALES_UI.cart.itemsCount(cartItems.length, totalCartUnits) }}
                  </span>
                </div>

                <button
                  v-if="cartItems.length > 0"
                  type="button"
                  class="btn-clear-cart"
                  @click="clearCart"
                >
                  <RotateCcw :size="12" />
                  <span>{{ SALES_UI.cart.clearCart }}</span>
                </button>
              </div>

              <!-- Empty Cart State -->
              <div v-if="cartItems.length === 0" class="cart-empty-state">
                <ShoppingCart :size="24" stroke-width="1.5" class="cart-empty-icon" />
                <p class="empty-state-title">{{ SALES_UI.cart.emptyTitle }}</p>
                <p class="empty-state-sub">{{ SALES_UI.cart.emptySub }}</p>
              </div>

              <!-- Cart Item List -->
              <div v-else class="cart-items-list">
                <div
                  v-for="(item, idx) in cartItems"
                  :key="item.id"
                  class="cart-item-row"
                  :class="{ 'item-error': (store.branchStocks[selectedBranch]?.[item.variantId] || 0) < item.quantity }"
                >
                  <div class="cart-item-info">
                    <span class="cart-item-title">{{ item.fullName }}</span>
                    <div class="cart-item-submeta">
                      <span class="font-mono">₱{{ item.unitPrice.toFixed(2) }} / {{ item.unit }}</span>
                      <span class="meta-dot">·</span>
                      <span class="text-muted">{{ item.sku }}</span>
                    </div>

                    <!-- Insufficient stock badge for this specific item -->
                    <div
                      v-if="(store.branchStocks[selectedBranch]?.[item.variantId] || 0) < item.quantity"
                      class="stock-warning-badge"
                    >
                      <AlertCircle :size="11" />
                      <span>Exceeds on-hand stock ({{ store.branchStocks[selectedBranch]?.[item.variantId] || 0 }} available)</span>
                    </div>
                  </div>

                  <!-- Stepper Controls -->
                  <div class="cart-item-stepper">
                    <button
                      type="button"
                      class="btn-stepper"
                      title="Decrease Quantity"
                      @click="decrementCartItem(idx)"
                    >
                      <Minus :size="12" />
                    </button>
                    <span class="stepper-val font-mono">{{ item.quantity }}</span>
                    <button
                      type="button"
                      class="btn-stepper"
                      title="Increase Quantity"
                      :disabled="item.quantity >= (store.branchStocks[selectedBranch]?.[item.variantId] || 0)"
                      @click="incrementCartItem(idx)"
                    >
                      <Plus :size="12" />
                    </button>
                    <span class="stepper-unit">{{ item.unit }}</span>
                  </div>

                  <!-- Line Total & Delete Action -->
                  <div class="cart-item-actions">
                    <span class="cart-line-total font-mono">
                      ₱{{ (item.unitPrice * item.quantity).toFixed(2) }}
                    </span>
                    <button
                      type="button"
                      class="btn-item-delete"
                      title="Remove item from order"
                      @click="removeCartItem(idx)"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="section-divider"></div>

            <!-- Customer & Discount Section -->
            <div class="customer-section">
              <div class="section-header">
                <span class="section-label">{{ SALES_UI.form.dividerText }}</span>
                <div class="segmented-control">
                  <button
                    type="button"
                    :class="['segment-btn', { active: customerMode === 'existing' }]"
                    @click="customerMode = 'existing'"
                  >
                    {{ SALES_UI.form.modes.existing }}
                  </button>
                  <button
                    type="button"
                    :class="['segment-btn', { active: customerMode === 'new' }]"
                    @click="customerMode = 'new'"
                  >
                    {{ SALES_UI.form.modes.new }}
                  </button>
                </div>
              </div>

              <div v-if="customerMode === 'existing'" class="existing-picker">
                <div class="flex-1">
                  <IosSelect
                    v-model="selectedCustomerId"
                    :options="customerOptions"
                    title="Select Recurring Buyer Profile"
                    @change="onCustomerChange"
                  />
                </div>
                <button
                  type="button"
                  class="btn-delete"
                  title="Remove Saved Profile"
                  :disabled="selectedCustomerId === 'c-walkin'"
                  @click="handleRemoveCustomer"
                >
                  <Trash2 :size="15" />
                </button>
              </div>

              <input
                v-else
                v-model="newCustomerName"
                class="form-control"
                :placeholder="SALES_UI.form.newCustomerPlaceholder"
                required
              />

              <div class="form-grid-2 mt-3">
                <div class="input-group">
                  <label class="label-with-icon">
                    <Percent :size="12" />
                    <span>{{ SALES_UI.form.buyerDiscountLabel }}</span>
                  </label>
                  <input
                    v-model.number="buyerDiscount"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    inputmode="numeric"
                    class="form-control"
                  />
                  <div
                    v-if="customerMode === 'existing' && selectedCustomerId !== 'c-walkin'"
                    class="checkbox-row"
                  >
                    <label class="custom-checkbox-label">
                      <input type="checkbox" v-model="shouldUpdateProfileDiscount" />
                      <span>{{ SALES_UI.form.updateProfileLabel(buyerDiscount) }}</span>
                    </label>
                  </div>
                </div>

                <div class="input-group">
                  <label class="label-with-icon">
                    <Sparkles :size="12" />
                    <span>{{ SALES_UI.form.specialDiscountLabel }}</span>
                  </label>
                  <input
                    v-model.number="specialDiscount"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    inputmode="numeric"
                    class="form-control"
                  />
                </div>
              </div>

              <div v-if="specialDiscount > 0" class="input-group mt-3">
                <label>{{ SALES_UI.form.reasonLabel }}</label>
                <input
                  v-model="specialReason"
                  class="form-control"
                  :placeholder="SALES_UI.form.reasonPlaceholder"
                  required
                />
              </div>
            </div>

            <!-- Price Summary Callout -->
            <div class="price-summary-card">
              <div class="summary-row">
                <span class="text-muted">{{ SALES_UI.summary.subtotal }}</span>
                <span class="num-text font-mono">₱{{ cartSubtotal.toFixed(2) }}</span>
              </div>
              <div v-if="totalDiscountPercent > 0" class="summary-row text-discount">
                <span>{{ SALES_UI.summary.discount(totalDiscountPercent) }}</span>
                <span class="num-text font-mono">- ₱{{ totalDiscountAmount.toFixed(2) }}</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row total-row">
                <span>{{ SALES_UI.summary.finalPayable }}</span>
                <span class="total-price font-mono">₱{{ finalTotal.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Proceed to Confirmation Step Action -->
            <button
              type="button"
              class="btn-proceed"
              :disabled="cartItems.length === 0 || hasStockErrors"
              @click="goToConfirmation"
            >
              <span>{{ SALES_UI.form.proceedButton }}</span>
              <ArrowRight :size="16" />
            </button>
          </div>

          <!-- STEP 2: ORDER VERIFICATION & CONFIRMATION -->
          <div v-else class="sales-form confirm-panel">
            <p class="confirm-subtitle">{{ SALES_UI.confirmation.subtitle }}</p>

            <!-- Order Metadata Strip -->
            <div class="confirm-meta-grid">
              <div class="confirm-meta-card">
                <div class="meta-card-label">
                  <Store :size="13" />
                  <span>{{ SALES_UI.confirmation.branchHeader }}</span>
                </div>
                <div class="meta-card-val">{{ selectedBranchName }}</div>
              </div>

              <div class="confirm-meta-card">
                <div class="meta-card-label">
                  <UserCheck :size="13" />
                  <span>{{ SALES_UI.confirmation.buyerHeader }}</span>
                </div>
                <div class="meta-card-val">
                  {{ currentCustomerDisplayName }}
                  <span v-if="buyerDiscount > 0" class="meta-badge">
                    {{ buyerDiscount }}% Contract
                  </span>
                </div>
              </div>
            </div>

            <!-- Itemized Staged Products List -->
            <div class="confirm-items-box">
              <div class="confirm-items-header">
                <span>{{ SALES_UI.confirmation.stagedProducts }} ({{ cartItems.length }})</span>
                <span class="font-mono text-muted">{{ totalCartUnits }} total units</span>
              </div>

              <div class="confirm-table-wrapper">
                <table class="confirm-table">
                  <thead>
                    <tr>
                      <th class="th-prod">Product SKU</th>
                      <th class="th-qty">Quantity</th>
                      <th class="th-price">Unit Price</th>
                      <th class="th-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in cartItems" :key="item.id">
                      <td class="td-prod">
                        <div class="prod-cell-name">{{ item.fullName }}</div>
                        <div class="prod-cell-sku font-mono">{{ item.sku }}</div>
                      </td>
                      <td class="td-qty font-mono">{{ item.quantity }} {{ item.unit }}</td>
                      <td class="td-price font-mono">₱{{ item.unitPrice.toFixed(2) }}</td>
                      <td class="td-total font-mono">
                        ₱{{ (item.unitPrice * item.quantity).toFixed(2) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Detailed Confirmation Breakdown -->
            <div class="price-summary-card mt-3">
              <div class="summary-row">
                <span class="text-muted">Subtotal ({{ cartItems.length }} items)</span>
                <span class="font-mono">₱{{ cartSubtotal.toFixed(2) }}</span>
              </div>

              <div v-if="buyerDiscount > 0" class="summary-row text-discount">
                <span>Buyer Contract Discount ({{ buyerDiscount }}%)</span>
                <span class="font-mono">
                  - ₱{{ (cartSubtotal * (buyerDiscount / 100)).toFixed(2) }}
                </span>
              </div>

              <div v-if="specialDiscount > 0" class="summary-row text-discount">
                <span>
                  Occasion Discount ({{ specialDiscount }}%)
                  <template v-if="specialReason"> · {{ specialReason }}</template>
                </span>
                <span class="font-mono">
                  - ₱{{ (cartSubtotal * (specialDiscount / 100)).toFixed(2) }}
                </span>
              </div>

              <div v-if="totalDiscountPercent > 0" class="summary-row text-muted text-xs">
                <span>Total Combined Savings ({{ totalDiscountPercent }}%)</span>
                <span class="font-mono">- ₱{{ totalDiscountAmount.toFixed(2) }}</span>
              </div>

              <div class="summary-divider"></div>

              <div class="summary-row total-row">
                <span>Final Payable</span>
                <span class="total-price font-mono">₱{{ finalTotal.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Caution Audit Banner -->
            <div class="audit-warning-pill">
              <ShieldCheck :size="15" class="shield-icon" />
              <span>{{ SALES_UI.confirmation.warningNotice }}</span>
            </div>

            <!-- Dual Confirmation Actions -->
            <div class="confirm-actions-row">
              <button type="button" class="btn-back-cart" @click="backToCart">
                <ArrowLeft :size="15" />
                <span>{{ SALES_UI.form.backToCartButton }}</span>
              </button>

              <button type="button" class="btn-authorize" @click="handleAuthorizeSale">
                <CheckCircle2 :size="16" />
                <span>{{ SALES_UI.form.confirmSaleButton }}</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Right: Live Session Ledger Card -->
        <section
          class="ledger-card anim-card"
          :class="{ 'mobile-hidden': mobileActiveTab !== 'ledger' }"
        >
          <div class="card-header">
            <span class="card-title">{{ SALES_UI.ledger.title }}</span>
            <span class="counter-badge">
              {{ store.salesHistory?.length || 0 }} {{ SALES_UI.ledger.loggedSuffix }}
            </span>
          </div>

          <div class="scrollable-ledger">
            <div v-if="store.salesHistory?.length === 0" class="empty-ledger">
              <Receipt :size="32" class="empty-icon" stroke-width="1.5" />
              <p class="empty-title">{{ SALES_UI.ledger.emptyTitle }}</p>
              <p class="empty-sub">{{ SALES_UI.ledger.emptySub }}</p>
            </div>

            <div v-else class="receipt-stream">
              <article v-for="s in store.salesHistory" :key="s.id" class="receipt-node">
                <div class="receipt-top">
                  <div class="buyer-profile">
                    <UserCheck :size="14" class="buyer-icon" />
                    <span class="buyer-name">{{ s.customerName }}</span>
                  </div>
                  <span class="receipt-total font-mono">₱{{ s.finalTotal.toFixed(2) }}</span>
                </div>

                <div class="receipt-item-desc">
                  <span class="qty-badge">{{ s.quantity }} {{ s.unit }}</span>
                  <span class="item-name">{{ s.productName }}</span>
                </div>

                <div class="receipt-footer">
                  <span class="timestamp">{{ s.branchName }} · {{ s.date }}</span>
                  <div v-if="s.totalDiscountPercent > 0" class="discount-pill">
                    <Tag :size="11" stroke-width="2.2" />
                    <span>{{ s.totalDiscountPercent }}% Off</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped src="./SalesView.css"></style>
