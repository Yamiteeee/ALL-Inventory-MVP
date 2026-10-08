<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'
import { STOCK_IN_UI } from './stockInConfig'
import { usePageEntrance } from '@/animations/usePageEntrance'
import { useTypewriter } from '@/animations/useTypewriter'
import IosSelect from '@/components/ui/IosSelect.vue'

// Lucide Vue Next Icons
import {
  ArrowLeft,
  CheckCircle2,
  PackagePlus,
  Truck,
  Layers,
  Calendar,
  FileText,
  Boxes,
  ListOrdered,
} from 'lucide-vue-next'

const router = useRouter()
const store = useInventoryStore()

// 1. Run universal entrance animation
usePageEntrance()

// 2. Start typewriter right after the top bar settles (~350ms)
const { displayedText: pageTitle, isComplete: isTypingDone } = useTypewriter(
  STOCK_IN_UI.header.title,
  { speed: 28, delay: 350 },
)

const selectedBranch = ref(store.branches[0]?.id || '')
const selectedVariantId = ref(store.flatVariants[0]?.id || '')
const uomTier = ref('level2')
const quantity = ref(10)
const batchExpiry = ref('')
const supplierNote = ref('')
const successMessage = ref('')
const mobileActiveTab = ref('form') // 'form' | 'logs' for small viewports

function goBackToCatalog() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/inventory')
  }
}

const currentVariant = computed(() => {
  return store.flatVariants.find((v) => v.id === selectedVariantId.value)
})

// Normalized Options for IosSelect
const branchOptions = computed(() => {
  return store.branches.map((b) => ({
    value: b.id,
    label: b.name,
  }))
})

const variantOptions = computed(() => {
  return store.flatVariants.map((item) => ({
    value: item.id,
    label: `${item.brand ? item.brand + ' · ' : ''}${item.productName || item.autoName || item.fullName}`,
    sublabel: `[${item.sku}] ${item.category} · ${item.flavor || item.color || item.sizeCapacity || ''}`,
  }))
})

const tierOptions = computed(() => {
  if (!currentVariant.value) return []
  const v = currentVariant.value
  return [
    {
      value: 'level1',
      label: `Level 1: Primary Unit`,
      sublabel: `1 ${v.uom?.level1?.unit || 'unit'}`,
    },
    {
      value: 'level2',
      label: `Level 2: Master Carton / Box`,
      sublabel: `1 ${v.uom?.level2?.unit || 'Box'} = ${v.uom?.level2?.multiplier || 1} ${v.uom?.level1?.unit || 'units'}`,
    },
    {
      value: 'level3',
      label: `Level 3: Full Pallet Lot`,
      sublabel: `1 ${v.uom?.level3?.unit || 'Pallet'} = ${v.uom?.level3?.multiplier || 1} boxes`,
    },
  ]
})

const calculatedBaseUnits = computed(() => {
  if (!currentVariant.value) return 0
  const qty = Number(quantity.value) || 0
  if (uomTier.value === 'level1') return qty
  if (uomTier.value === 'level2') return qty * (currentVariant.value.uom.level2?.multiplier || 1)
  if (uomTier.value === 'level3') {
    return (
      qty *
      (currentVariant.value.uom.level2?.multiplier || 1) *
      (currentVariant.value.uom.level3?.multiplier || 1)
    )
  }
  return 0
})

function handleSubmitStockIn() {
  if (quantity.value <= 0 || !currentVariant.value) return

  store.receiveStock({
    branchId: selectedBranch.value,
    variantId: selectedVariantId.value,
    inputQty: quantity.value,
    uomTier: uomTier.value,
    supplierNote: supplierNote.value,
    batchExpiry: batchExpiry.value,
  })

  successMessage.value = `Logged delivery for ${currentVariant.value.fullName} (+${calculatedBaseUnits.value} ${currentVariant.value.uom.level1.unit})`
  supplierNote.value = ''
  batchExpiry.value = ''

  if (window.innerWidth <= 768) {
    mobileActiveTab.value = 'logs'
  }

  setTimeout(() => {
    successMessage.value = ''
  }, 3500)
}
</script>

<template>
  <div class="screen-wrapper">
    <div class="minimal-shell">
      <!-- 1. Header Strip -->
      <header class="top-nav anim-top">
        <div class="nav-brand">
          <div class="header-meta-bar">
            <button type="button" class="back-btn" @click="goBackToCatalog">
              <ArrowLeft :size="13" stroke-width="2.5" />
              <span class="back-text-desktop">{{ STOCK_IN_UI.header.backText }}</span>
              <span class="back-text-mobile">Catalog</span>
            </button>
          </div>

          <h1 class="page-title">
            <span class="ghost-reserve" aria-hidden="true">{{ STOCK_IN_UI.header.title }}.</span>
            <span class="typing-active">
              {{ pageTitle }}
              <span v-if="!isTypingDone" class="typewriter-cursor" aria-hidden="true">|</span>
              <span v-else class="morph-period" aria-hidden="true">
                <span class="dot-shape"></span>
                <span class="heart-shape">♥</span>
              </span>
            </span>
          </h1>

          <p class="page-subtitle">{{ STOCK_IN_UI.header.subtitle }}</p>
        </div>

        <!-- Rendered strictly on desktop to avoid mobile cramming -->
        <div class="header-badges desktop-badge">
          <span class="session-badge">
            <Truck :size="13" stroke-width="2.2" />
            <span>
              {{ store.stockInHistory?.length || 0 }} {{ STOCK_IN_UI.header.badgeSuffix }}
            </span>
          </span>
        </div>
      </header>

      <!-- Feedback Alert -->
      <transition name="fade-alert">
        <div v-if="successMessage" class="alert alert-success">
          <CheckCircle2 :size="16" />
          <span>{{ successMessage }}</span>
        </div>
      </transition>

      <!-- Mobile Tab Switcher (Visible only <= 768px; already contains count) -->
      <div class="mobile-segmented-bar anim-stagger">
        <button
          type="button"
          class="segment-choice"
          :class="{ active: mobileActiveTab === 'form' }"
          @click="mobileActiveTab = 'form'"
        >
          <PackagePlus :size="14" />
          <span>Intake Form</span>
        </button>
        <button
          type="button"
          class="segment-choice"
          :class="{ active: mobileActiveTab === 'logs' }"
          @click="mobileActiveTab = 'logs'"
        >
          <ListOrdered :size="14" />
          <span>Recent Activity ({{ store.stockInHistory?.length || 0 }})</span>
        </button>
      </div>

      <!-- 2. Two-Column Workspace -->
      <div class="stockin-workspace" :data-active-tab="mobileActiveTab">
        <!-- Left Column: Intake Entry Form Card -->
        <section
          class="entry-card anim-card"
          :class="{ 'mobile-hidden': mobileActiveTab !== 'form' }"
        >
          <div class="card-header">
            <span class="card-title">{{ STOCK_IN_UI.form.title }}</span>
            <span class="step-pill">{{ STOCK_IN_UI.form.step }}</span>
          </div>

          <form @submit.prevent="handleSubmitStockIn" class="stock-form">
            <!-- Receiving Branch (IosSelect) -->
            <div class="input-group">
              <label>{{ STOCK_IN_UI.form.branchLabel }}</label>
              <IosSelect
                v-model="selectedBranch"
                :options="branchOptions"
                title="Select Receiving Branch"
                placeholder="Choose Branch"
              />
            </div>

            <!-- Product Variant (IosSelect with Live Search) -->
            <div class="input-group">
              <label>{{ STOCK_IN_UI.form.variantLabel }}</label>
              <IosSelect
                v-model="selectedVariantId"
                :options="variantOptions"
                title="Select Product SKU to Receive"
                placeholder="Choose Product Variant"
                searchable
              />

              <!-- Preview Card below select -->
              <div v-if="currentVariant" class="selected-variant-preview">
                <div class="preview-title">{{ currentVariant.fullName }}</div>
                <div class="preview-meta">
                  <span class="preview-tag tag-mono">{{ currentVariant.sku }}</span>
                  <span class="preview-tag">{{ currentVariant.category }}</span>
                  <span v-if="currentVariant.sizeCapacity" class="preview-tag">
                    {{ currentVariant.sizeCapacity }}
                  </span>
                  <span v-if="currentVariant.isPerishable" class="preview-tag tag-perishable">
                    Cold Chain / Perishable
                  </span>
                </div>
              </div>
            </div>

            <!-- Freight Tier (IosSelect) -->
            <div class="input-group" v-if="currentVariant">
              <label class="label-with-icon">
                <Layers :size="12" />
                <span>{{ STOCK_IN_UI.form.tierLabel }}</span>
              </label>
              <IosSelect
                v-model="uomTier"
                :options="tierOptions"
                title="Select Freight Intake Tier"
              />
            </div>

            <!-- Quantity with Conversion Pill -->
            <div class="input-group">
              <div class="label-row">
                <label for="stock-quantity-input">{{ STOCK_IN_UI.form.qtyLabel }}</label>
                <span v-if="currentVariant" class="conversion-pill">
                  {{
                    STOCK_IN_UI.form.conversionTag(
                      calculatedBaseUnits,
                      currentVariant.uom.level1.unit,
                    )
                  }}
                </span>
              </div>
              <input
                id="stock-quantity-input"
                v-model.number="quantity"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                class="form-control"
                required
              />
            </div>

            <div class="section-divider"></div>

            <!-- Expiry (Conditional for Perishables) -->
            <div v-if="currentVariant?.isPerishable" class="input-group">
              <label for="stock-expiry-input" class="label-with-icon">
                <Calendar :size="12" />
                <span>{{ STOCK_IN_UI.form.expiryLabel }}</span>
              </label>
              <input
                id="stock-expiry-input"
                v-model="batchExpiry"
                type="date"
                class="form-control"
                required
              />
            </div>

            <!-- PO Reference / Notes -->
            <div class="input-group">
              <label for="stock-note-input" class="label-with-icon">
                <FileText :size="12" />
                <span>{{ STOCK_IN_UI.form.poLabel }}</span>
              </label>
              <input
                id="stock-note-input"
                v-model="supplierNote"
                type="text"
                class="form-control"
                :placeholder="STOCK_IN_UI.form.poPlaceholder"
              />
            </div>

            <button type="submit" class="btn-intake" :disabled="quantity <= 0">
              <PackagePlus :size="16" />
              <span>{{ STOCK_IN_UI.form.submitButton }}</span>
            </button>
          </form>
        </section>

        <!-- Right Column: Receiving History Log Card -->
        <section
          class="logs-card anim-card"
          :class="{ 'mobile-hidden': mobileActiveTab !== 'logs' }"
        >
          <div class="card-header">
            <span class="card-title">{{ STOCK_IN_UI.logs.title }}</span>
            <span class="counter-badge">
              {{ store.stockInHistory?.length || 0 }} {{ STOCK_IN_UI.logs.loggedSuffix }}
            </span>
          </div>

          <div class="scrollable-logs">
            <div v-if="store.stockInHistory?.length === 0" class="empty-logs">
              <Boxes :size="32" class="empty-icon" stroke-width="1.5" />
              <p class="empty-title">{{ STOCK_IN_UI.logs.emptyTitle }}</p>
              <p class="empty-sub">{{ STOCK_IN_UI.logs.emptySub }}</p>
            </div>

            <div v-else class="log-stream">
              <article v-for="entry in store.stockInHistory" :key="entry.id" class="log-node">
                <div class="log-top">
                  <div class="qty-pill">
                    <span>+{{ entry.inputQty }} {{ entry.uomTierLabel }}</span>
                    <span class="base-units">
                      (+{{ entry.totalBaseUnits }} {{ entry.baseUnit }})
                    </span>
                  </div>
                  <span class="log-time">{{ entry.date }}</span>
                </div>

                <div class="log-item-desc">
                  <span class="product-title">{{ entry.productName }}</span>
                </div>

                <div class="log-footer">
                  <span class="branch-tag">{{ entry.branchName }}</span>
                  <span v-if="entry.note" class="note-tag">{{ entry.note }}</span>
                  <span v-if="entry.expiry && entry.expiry !== 'N/A'" class="expiry-tag">
                    Exp: {{ entry.expiry }}
                  </span>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped src="./StockInView.css"></style>
