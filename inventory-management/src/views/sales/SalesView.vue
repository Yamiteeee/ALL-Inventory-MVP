<script setup>
import { SALES_UI } from './salesConfig'
import { usePageEntrance } from '@/animations/usePageEntrance'
import { useTypewriter } from '@/animations/useTypewriter'
import IosSelect from '@/components/ui/IosSelect.vue'
import { useSalesCheckout } from '@/composables/useSalesCheckout'

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
  Clock,
  PlusCircle,
  Truck,
} from 'lucide-vue-next'

// Entrance & Typewriter UI Animations
usePageEntrance()
const { displayedText: pageTitle, isComplete: isTypingDone } = useTypewriter(
  SALES_UI.header.title,
  { speed: 28, delay: 350 },
)

// Isolated checkout state & business logic
const {
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
} = useSalesCheckout()
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
          :class="{ active: mobileActiveTab === 'pos' && activeViewMode === 'direct' }"
          @click="setPosTab('direct')"
        >
          <CreditCard :size="14" />
          <span>Point of Sale</span>
        </button>

        <button
          type="button"
          class="segment-choice"
          :class="{ active: mobileActiveTab === 'pos' && activeViewMode === 'held' }"
          @click="setPosTab('held')"
        >
          <Clock :size="14" />
          <span>Held ({{ heldSalesForBranch.length }})</span>
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
          <!-- Dynamic Card Header according to activeStep & activeViewMode -->
          <div class="card-header">
            <div class="card-header-left">
              <span class="card-title">
                {{
                  activeViewMode === 'held'
                    ? 'Held Customer Orders Queue'
                    : activeStep === 'cart'
                      ? SALES_UI.form.title
                      : SALES_UI.confirmation.title
                }}
              </span>
            </div>
            <span v-if="activeViewMode === 'direct'" class="step-pill">
              {{ activeStep === 'cart' ? SALES_UI.form.stepBuilder : SALES_UI.form.stepConfirm }}
            </span>
            <span v-else class="step-pill" :class="{ 'pill-ready': readyHeldSalesCount > 0 }">
              {{ heldSalesForBranch.length }} On Hold
            </span>
          </div>

          <!-- Mode Switcher Tabs (Direct POS vs Held Orders) -->
          <div class="checkout-mode-tabs">
            <button
              type="button"
              class="mode-tab-btn"
              :class="{ active: activeViewMode === 'direct' }"
              @click="activeViewMode = 'direct'"
            >
              <CreditCard :size="14" />
              <span>Direct POS Register</span>
            </button>

            <button
              type="button"
              class="mode-tab-btn"
              :class="{ active: activeViewMode === 'held' }"
              @click="activeViewMode = 'held'"
            >
              <Clock :size="14" />
              <span>Held Orders</span>
              <span
                v-if="heldSalesForBranch.length > 0"
                class="mode-count-pill"
                :class="{ 'pill-ready': readyHeldSalesCount > 0 }"
              >
                {{ heldSalesForBranch.length }}
                <template v-if="readyHeldSalesCount > 0"
                  >· {{ readyHeldSalesCount }} Ready</template
                >
              </span>
            </button>
          </div>

          <!-- DIRECT POS REGISTER VIEW -->
          <template v-if="activeViewMode === 'direct'">
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
                        ₱{{ currentVariant.baseCost.toFixed(2) }} /
                        {{ currentVariant.uom.level1.unit }}
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
                      step="1"
                      inputmode="numeric"
                      class="form-control"
                      placeholder="1"
                    />
                  </div>

                  <button
                    type="button"
                    class="btn-add-item"
                    :disabled="
                      remainingAvailableStock <= 0 ||
                      quantityToAdd <= 0 ||
                      quantityToAdd > remainingAvailableStock
                    "
                    @click="handleAddToCart"
                  >
                    <Plus :size="15" stroke-width="2.5" />
                    <span>{{ SALES_UI.form.addItemBtn }}</span>
                  </button>
                </div>

                <!-- Shortage Detector & Inter-Branch Request Order Trigger -->
                <div
                  v-if="quantityToAdd > remainingAvailableStock && currentVariant"
                  class="shortage-trigger-card"
                >
                  <div class="shortage-header">
                    <div class="shortage-badge">
                      <AlertCircle :size="15" class="shortage-alert-icon" />
                      <span>
                        Stock Shortage (Need {{ quantityToAdd }}, Have
                        {{ remainingAvailableStock }})
                      </span>
                    </div>
                    <span class="deficit-pill">
                      -{{ quantityToAdd - remainingAvailableStock }}
                      {{ currentVariant.uom?.level1?.unit || 'units' }} deficit
                    </span>
                  </div>

                  <p class="shortage-details">
                    Your branch does not have enough on-hand inventory. Choose a branch/warehouse
                    with available stock to fulfill this deficit. Adding will create the transfer
                    request and keep the item staged in your cart. The full order will remain on
                    hold until shipment arrives.
                  </p>

                  <!-- Source Branch Selector with live stock availability -->
                  <div class="source-branch-picker">
                    <label class="picker-label">Pick Fulfilling Branch / Warehouse:</label>
                    <IosSelect
                      v-model="requestSourceBranch"
                      :options="sourceBranchOptions"
                      title="Select Source Branch"
                      placeholder="Choose Branch"
                    />
                    <div
                      class="source-stock-note"
                      :class="
                        selectedSourceBranchStock >= quantityToAdd - remainingAvailableStock
                          ? 'text-success-branch'
                          : 'text-warning-branch'
                      "
                    >
                      <template
                        v-if="selectedSourceBranchStock >= quantityToAdd - remainingAvailableStock"
                      >
                        ✓ {{ selectedSourceBranchName }} has {{ selectedSourceBranchStock }}
                        {{ currentVariant.uom?.level1?.unit || 'units' }} in stock (Sufficient)
                      </template>
                      <template v-else-if="selectedSourceBranchStock > 0">
                        ⚠ {{ selectedSourceBranchName }} only has {{ selectedSourceBranchStock }}
                        {{ currentVariant.uom?.level1?.unit || 'units' }} available
                      </template>
                      <template v-else>
                        ✕ {{ selectedSourceBranchName }} is out of stock (0 available)
                      </template>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="btn-trigger-request"
                    :disabled="!requestSourceBranch"
                    @click="handleCreateShortageRequest"
                  >
                    <PlusCircle :size="14" />
                    <span>Request from {{ selectedSourceBranchName }} & Add to Cart</span>
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
                  <!-- Entire Order Hold Banner -->
                  <div v-if="isEntireOrderOnHold" class="entire-order-hold-banner">
                    <Clock :size="16" class="hold-icon" />
                    <div>
                      <strong
                        >Entire Order Placed on Hold for {{ currentCustomerDisplayName }}</strong
                      >
                      <p>
                        This order contains {{ heldItemsCount }} item(s) awaiting delivery transfer
                        from another branch. All {{ cartItems.length }} staged items will be held
                        together until the delivery arrives at the PO Dock.
                      </p>
                    </div>
                  </div>

                  <div
                    v-for="(item, idx) in cartItems"
                    :key="item.id"
                    class="cart-item-row"
                    :class="{
                      'item-error':
                        !item.held &&
                        (store.branchStocks[selectedBranch]?.[item.variantId] || 0) < item.quantity,
                    }"
                  >
                    <div class="cart-item-info">
                      <span class="cart-item-title">{{ item.fullName }}</span>
                      <div class="cart-item-submeta">
                        <span class="font-mono"
                          >₱{{ item.unitPrice.toFixed(2) }} / {{ item.unit }}</span
                        >
                        <span class="meta-dot">·</span>
                        <span class="text-muted">{{ item.sku }}</span>
                      </div>

                      <!-- Insufficient stock badge for this specific item -->
                      <div
                        v-if="
                          !item.held &&
                          (store.branchStocks[selectedBranch]?.[item.variantId] || 0) <
                            item.quantity
                        "
                        class="stock-warning-badge"
                      >
                        <AlertCircle :size="11" />
                        <span>
                          Exceeds on-hand stock ({{
                            store.branchStocks[selectedBranch]?.[item.variantId] || 0
                          }}
                          available)
                        </span>
                      </div>

                      <!-- On-Hold Badge for transfer-backed shortage items -->
                      <div v-else-if="item.held" class="stock-held-badge">
                        <Clock :size="11" />
                        <span>
                          On Hold: Transfer [{{ item.requestId }}] ({{ item.deficit }} units from
                          {{ item.sourceBranchName || 'Hub' }})
                        </span>
                      </div>
                      <div v-else-if="isEntireOrderOnHold" class="stock-held-badge">
                        <Clock :size="11" />
                        <span>Held with Client Order Package</span>
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
                        :disabled="
                          !item.held &&
                          item.quantity >=
                            (store.branchStocks[selectedBranch]?.[item.variantId] || 0)
                        "
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
                    <span
                      v-if="isEntireOrderOnHold"
                      class="meta-badge"
                      style="background: #fef3c7; color: #b45309; border-color: #fde68a"
                    >
                      Package On Hold
                    </span>
                    <span v-else-if="buyerDiscount > 0" class="meta-badge">
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
                          <div class="prod-cell-sku font-mono">
                            {{ item.sku }}
                            <span
                              v-if="item.held"
                              class="text-xs"
                              style="color: #b45309; font-weight: 700; margin-left: 6px"
                            >
                              [Transfer {{ item.requestId }} · {{ item.deficit }} deficit]
                            </span>
                          </div>
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

              <!-- Caution Audit Banner / Hold Alert -->
              <div v-if="isEntireOrderOnHold" class="audit-hold-banner">
                <Clock :size="16" class="shield-icon" />
                <div>
                  <strong>Entire Client Order Placed on Hold (Awaiting Transfer Delivery)</strong>
                  <p>
                    This entire order for <strong>{{ currentCustomerDisplayName }}</strong> will be
                    authorized and recorded ON HOLD because {{ heldItemsCount }} item(s) require an
                    inter-branch transfer. Confirm delivery in the PO Dock once the truck arrives to
                    release all items to the client.
                  </p>
                </div>
              </div>
              <div v-else class="audit-warning-pill">
                <ShieldCheck :size="15" class="shield-icon" />
                <span>{{ SALES_UI.confirmation.warningNotice }}</span>
              </div>

              <!-- Dual Confirmation Actions -->
              <div class="confirm-actions-row">
                <button type="button" class="btn-back-cart" @click="backToCart">
                  <ArrowLeft :size="15" />
                  <span>{{ SALES_UI.form.backToCartButton }}</span>
                </button>

                <button
                  type="button"
                  class="btn-authorize"
                  :class="{ 'btn-authorize-hold': isEntireOrderOnHold }"
                  @click="handleAuthorizeSale"
                >
                  <CheckCircle2 v-if="!isEntireOrderOnHold" :size="16" />
                  <Clock v-else :size="16" />
                  <span>
                    {{
                      isEntireOrderOnHold
                        ? `Authorize & Place Entire Order on Hold for ${currentCustomerDisplayName}`
                        : SALES_UI.form.confirmSaleButton
                    }}
                  </span>
                </button>
              </div>
            </div>
          </template>

          <!-- HELD ORDERS QUEUE VIEW -->
          <template v-else>
            <div class="held-orders-panel">
              <div class="input-group">
                <label>{{ SALES_UI.form.branchLabel }}</label>
                <IosSelect
                  v-model="selectedBranch"
                  :options="branchOptions"
                  title="Filter by Branch"
                  placeholder="Choose Branch"
                />
              </div>

              <!-- Empty State -->
              <div v-if="heldSalesForBranch.length === 0" class="held-empty-state">
                <Clock :size="32" stroke-width="1.5" />
                <p>No customer orders currently on hold for {{ selectedBranchName }}.</p>
                <span class="text-muted text-xs mt-1">
                  When items exceed store stock and are requested from another warehouse, they are
                  placed on hold here until delivery arrives.
                </span>
              </div>

              <!-- Held Orders List -->
              <div v-else class="held-orders-list">
                <div
                  v-for="hold in heldSalesForBranch"
                  :key="hold.id"
                  class="held-order-card"
                  :class="{ 'card-ready': isHeldOrderReady(hold) }"
                >
                  <div class="held-card-top">
                    <div>
                      <div class="held-client-name">{{ hold.customerName }}</div>
                      <div class="held-order-meta">
                        <span class="font-mono font-bold">{{ hold.orderRef }}</span>
                        <span>·</span>
                        <span>{{ hold.createdAt }}</span>
                        <span>·</span>
                        <span>From: {{ hold.sourceBranchName }}</span>
                      </div>
                    </div>

                    <!-- Real-time Transfer Lifecycle Status Badge -->
                    <div v-if="isHeldOrderReady(hold)" class="held-status-badge badge-ready">
                      <CheckCircle2 :size="12" />
                      <span>Stock Arrived · Ready to Complete!</span>
                    </div>
                    <div
                      v-else-if="getTransferStatus(hold.requestId)?.status === 'in_transit'"
                      class="held-status-badge badge-transit"
                    >
                      <Truck :size="12" />
                      <span>
                        In Transit [{{
                          getTransferStatus(hold.requestId)?.manifestNo || 'Logistics'
                        }}]
                      </span>
                    </div>
                    <div v-else class="held-status-badge badge-pending">
                      <Clock :size="12" />
                      <span>Pending Hub Dispatch [{{ hold.requestId }}]</span>
                    </div>
                  </div>

                  <!-- Items Preview -->
                  <div class="held-items-preview">
                    <div
                      v-for="it in hold.items"
                      :key="it.id || it.variantId"
                      class="held-item-row"
                    >
                      <div>
                        <span class="held-item-name"
                          >{{ it.quantity }} {{ it.unit }} · {{ it.fullName }}</span
                        >
                        <div v-if="it.held" class="held-item-deficit">
                          Requested {{ it.deficit }} units from {{ hold.sourceBranchName }}
                        </div>
                      </div>
                      <span class="font-mono font-bold"
                        >₱{{ (it.unitPrice * it.quantity).toFixed(2) }}</span
                      >
                    </div>
                  </div>

                  <!-- Footer with Financials & Action -->
                  <div class="held-card-footer">
                    <div>
                      <div class="held-total-label">Total Payable</div>
                      <div class="held-total-val font-mono">₱{{ hold.totalAmount.toFixed(2) }}</div>
                    </div>

                    <div class="held-actions-group">
                      <button
                        v-if="isHeldOrderReady(hold)"
                        type="button"
                        class="btn-complete-hold"
                        title="Deliver items to client and complete transaction"
                        @click="handleCompleteHeldOrder(hold.id)"
                      >
                        <CheckCircle2 :size="15" />
                        <span>Confirm & Complete Sale</span>
                      </button>
                      <button
                        v-else
                        type="button"
                        class="btn-hold-waiting"
                        disabled
                        :title="
                          getTransferStatus(hold.requestId)?.status === 'in_transit'
                            ? 'Confirm delivery arrival in PO Dock first'
                            : 'Waiting for dispatch from ' + hold.sourceBranchName
                        "
                      >
                        <Clock :size="14" />
                        <span>
                          {{
                            getTransferStatus(hold.requestId)?.status === 'in_transit'
                              ? 'In Transit · Confirm in PO Dock'
                              : 'Awaiting Hub Dispatch'
                          }}
                        </span>
                      </button>

                      <button
                        type="button"
                        class="btn-cancel-hold"
                        title="Cancel this held order reservation"
                        @click="handleCancelHeldOrder(hold.id)"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
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
                  <div v-if="s.isHeld" class="receipt-held-tag">
                    <Clock :size="10" />
                    <span>On Hold</span>
                  </div>
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
