<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'
import { SALES_UI } from './salesConfig'

// Lucide Vue Next Icons
import {
  ArrowLeft,
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
} from 'lucide-vue-next'

const router = useRouter()
const store = useInventoryStore()

const selectedBranch = ref(store.branches[0]?.id || '')
const selectedVariantId = ref(store.flatVariants[0]?.id || '')
const quantity = ref(1)

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

// Viewport tracking for responsive dropdown string formatting
const isMobile = ref(false)

function handleResize() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function goBackToCatalog() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/inventory')
  }
}

const selectedCustomer = computed(() => {
  return store.customers.find((c) => c.id === selectedCustomerId.value)
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

const availableStock = computed(() => {
  return store.branchStocks[selectedBranch.value]?.[selectedVariantId.value] || 0
})

const currentVariant = computed(() => {
  return store.flatVariants.find((v) => v.id === selectedVariantId.value)
})

const subtotal = computed(() => {
  return (currentVariant.value?.baseCost || 0) * (Number(quantity.value) || 0)
})

const totalDiscountPercent = computed(() => {
  return Math.min(100, Number(buyerDiscount.value || 0) + Number(specialDiscount.value || 0))
})

const totalDiscountAmount = computed(() => {
  return subtotal.value * (totalDiscountPercent.value / 100)
})

const finalTotal = computed(() => {
  return Math.max(0, subtotal.value - totalDiscountAmount.value)
})

/**
 * Returns full format on desktop, truncated concise format on mobile
 */
function formatVariantOptionLabel(p) {
  // Desktop: original complete label
  if (!isMobile.value) {
    return `${p.fullName} — ₱${p.baseCost.toFixed(2)} / ${p.uom.level1.unit}`
  }

  // Mobile: concise label to keep native picker within screen width
  const brand = p.brand ? `${p.brand} · ` : ''
  const spec = p.flavor || p.color || p.sizeCapacity || ''
  const baseName = p.productName || p.autoName || p.fullName || ''
  const label = spec ? `${brand}${baseName} (${spec})` : `${brand}${baseName}`

  return label.length > 36 ? `${label.slice(0, 34)}…` : label
}

function handleCompleteSale() {
  errorMessage.value = ''
  successMessage.value = ''

  if (quantity.value > availableStock.value) {
    errorMessage.value = `Cannot complete sale. Only ${availableStock.value} ${currentVariant.value?.uom.level1.unit} available in this branch!`
    return
  }

  const custName =
    customerMode.value === 'new'
      ? newCustomerName.value
      : selectedCustomer.value?.name || 'Walk-in Retail Buyer'

  try {
    store.recordSale({
      branchId: selectedBranch.value,
      variantId: selectedVariantId.value,
      quantity: quantity.value,
      customerName: custName,
      buyerDiscountPercent: buyerDiscount.value,
      specialDiscountPercent: specialDiscount.value,
      specialReason: specialReason.value,
      updateDefaultDiscount: shouldUpdateProfileDiscount.value,
    })

    successMessage.value = `Sale complete: ₱${finalTotal.value.toFixed(2)} processed and stock deducted.`

    if (customerMode.value === 'new') {
      const added = store.customers.find(
        (c) => c.name.toLowerCase() === newCustomerName.value.trim().toLowerCase(),
      )
      if (added) selectedCustomerId.value = added.id
      newCustomerName.value = ''
      customerMode.value = 'existing'
    }

    quantity.value = 1
    specialDiscount.value = 0
    specialReason.value = ''
    shouldUpdateProfileDiscount.value = false

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
      <!-- Top Header Strip -->
      <header class="top-nav">
        <div class="nav-brand">
          <button type="button" class="back-btn" @click="goBackToCatalog">
            <ArrowLeft :size="14" stroke-width="2.5" />
            <span>{{ SALES_UI.header.backText }}</span>
          </button>
          <h1 class="page-title">{{ SALES_UI.header.title }}</h1>
          <p class="page-subtitle">{{ SALES_UI.header.subtitle }}</p>
        </div>

        <div class="header-badges">
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
      <div class="mobile-segmented-bar">
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

      <!-- Main Viewport Workspace -->
      <div class="sales-workspace" :data-active-tab="mobileActiveTab">
        <!-- Left: Checkout Configurator Form -->
        <section class="checkout-card" :class="{ 'mobile-hidden': mobileActiveTab !== 'pos' }">
          <div class="card-header">
            <span class="card-title">{{ SALES_UI.form.title }}</span>
            <span class="step-pill">{{ SALES_UI.form.step }}</span>
          </div>

          <form @submit.prevent="handleCompleteSale" class="sales-form">
            <div class="form-grid-2">
              <div class="input-group">
                <label for="pos-branch-select">{{ SALES_UI.form.branchLabel }}</label>
                <div class="select-wrapper">
                  <select id="pos-branch-select" v-model="selectedBranch" class="form-control">
                    <option v-for="b in store.branches" :key="b.id" :value="b.id">
                      {{ b.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="input-group">
                <label>{{ SALES_UI.form.stockLabel }}</label>
                <input
                  class="form-control readonly-stock"
                  :value="`${availableStock} ${currentVariant?.uom.level1.unit || ''}`"
                  disabled
                  readonly
                />
              </div>
            </div>

            <div class="input-group">
              <label for="pos-variant-select">{{ SALES_UI.form.variantLabel }}</label>
              <div class="select-wrapper">
                <select id="pos-variant-select" v-model="selectedVariantId" class="form-control">
                  <option v-for="p in store.flatVariants" :key="p.id" :value="p.id">
                    {{ formatVariantOptionLabel(p) }}
                  </option>
                </select>
              </div>

              <!-- Only displayed on mobile via CSS -->
              <div v-if="currentVariant" class="selected-variant-preview mobile-only">
                <div class="preview-title">{{ currentVariant.fullName }}</div>
                <div class="preview-meta">
                  <span class="preview-tag tag-mono"
                    >₱{{ currentVariant.baseCost.toFixed(2) }} /
                    {{ currentVariant.uom.level1.unit }}</span
                  >
                  <span class="preview-tag">{{ currentVariant.category }}</span>
                  <span v-if="currentVariant.sizeCapacity" class="preview-tag">{{
                    currentVariant.sizeCapacity
                  }}</span>
                </div>
              </div>
            </div>

            <div class="input-group">
              <label for="pos-qty-input">
                {{ SALES_UI.form.qtyLabel }} ({{ currentVariant?.uom.level1.unit || 'units' }})
              </label>
              <input
                id="pos-qty-input"
                v-model.number="quantity"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                :max="availableStock"
                class="form-control"
                required
              />
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
                <div class="select-wrapper flex-1">
                  <select
                    v-model="selectedCustomerId"
                    @change="onCustomerChange"
                    class="form-control"
                  >
                    <option v-for="c in store.customers" :key="c.id" :value="c.id">
                      {{ c.name }} ({{ c.tier }} · {{ c.defaultDiscount }}%)
                    </option>
                  </select>
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
                <span class="num-text font-mono">₱{{ subtotal.toFixed(2) }}</span>
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

            <button type="submit" class="btn-checkout" :disabled="availableStock <= 0">
              <CreditCard :size="16" />
              <span>{{ SALES_UI.form.submitButton }}</span>
            </button>
          </form>
        </section>

        <!-- Right: Live Session Ledger -->
        <section class="ledger-card" :class="{ 'mobile-hidden': mobileActiveTab !== 'ledger' }">
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
                    🏷️ {{ s.totalDiscountPercent }}% Off
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
