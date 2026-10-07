<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'
import { STOCK_IN_UI } from './stockInConfig'

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
} from 'lucide-vue-next'

const router = useRouter()
const store = useInventoryStore()

const selectedBranch = ref(store.branches[0]?.id || '')
const selectedVariantId = ref(store.flatVariants[0]?.id || '')
const uomTier = ref('level2')
const quantity = ref(10)
const batchExpiry = ref('')
const supplierNote = ref('')
const successMessage = ref('')

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

  setTimeout(() => {
    successMessage.value = ''
  }, 3500)
}
</script>

<template>
  <div class="screen-wrapper">
    <div class="minimal-shell">
      <!-- Fixed Header Strip -->
      <header class="top-nav">
        <div class="nav-brand">
          <button type="button" class="back-btn" @click="goBackToCatalog">
            <ArrowLeft :size="14" stroke-width="2.5" />
            <span>{{ STOCK_IN_UI.header.backText }}</span>
          </button>
          <h1 class="page-title">{{ STOCK_IN_UI.header.title }}</h1>
          <p class="page-subtitle">{{ STOCK_IN_UI.header.subtitle }}</p>
        </div>

        <div class="header-badges">
          <span class="session-badge">
            <Truck :size="13" stroke-width="2.2" />
            <span
              >{{ store.stockInHistory?.length || 0 }} {{ STOCK_IN_UI.header.badgeSuffix }}</span
            >
          </span>
        </div>
      </header>

      <!-- Feedback Alert -->
      <div v-if="successMessage" class="alert alert-success">
        <CheckCircle2 :size="16" />
        <span>{{ successMessage }}</span>
      </div>

      <!-- Main Two-Column Viewport -->
      <div class="stockin-workspace">
        <!-- Left Column: Intake Entry Form -->
        <section class="entry-card">
          <div class="card-header">
            <span class="card-title">{{ STOCK_IN_UI.form.title }}</span>
            <span class="step-pill">{{ STOCK_IN_UI.form.step }}</span>
          </div>

          <form @submit.prevent="handleSubmitStockIn" class="stock-form">
            <div class="input-group">
              <label>{{ STOCK_IN_UI.form.branchLabel }}</label>
              <div class="select-wrapper">
                <select v-model="selectedBranch" class="form-control" required>
                  <option v-for="b in store.branches" :key="b.id" :value="b.id">
                    {{ b.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="input-group">
              <label>{{ STOCK_IN_UI.form.variantLabel }}</label>
              <div class="select-wrapper">
                <select v-model="selectedVariantId" class="form-control" required>
                  <option v-for="item in store.flatVariants" :key="item.id" :value="item.id">
                    [{{ item.category }}] {{ item.fullName }}
                  </option>
                </select>
              </div>
            </div>

            <div class="input-group" v-if="currentVariant">
              <label class="label-with-icon">
                <Layers :size="12" />
                <span>{{ STOCK_IN_UI.form.tierLabel }}</span>
              </label>
              <div class="select-wrapper">
                <select v-model="uomTier" class="form-control">
                  <option value="level1">
                    Level 1: Primary Unit (1 {{ currentVariant.uom.level1.unit }})
                  </option>
                  <option value="level2">
                    Level 2: Case/Box (1 {{ currentVariant.uom.level2.unit }} =
                    {{ currentVariant.uom.level2.multiplier }} {{ currentVariant.uom.level1.unit }})
                  </option>
                  <option value="level3">
                    Level 3: Pallet (1 {{ currentVariant.uom.level3.unit }} =
                    {{ currentVariant.uom.level3.multiplier }} boxes)
                  </option>
                </select>
              </div>
            </div>

            <div class="input-group">
              <div class="label-row">
                <label>{{ STOCK_IN_UI.form.qtyLabel }}</label>
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
                v-model.number="quantity"
                type="number"
                min="1"
                class="form-control"
                required
              />
            </div>

            <div class="section-divider"></div>

            <div v-if="currentVariant?.isPerishable" class="input-group">
              <label class="label-with-icon">
                <Calendar :size="12" />
                <span>{{ STOCK_IN_UI.form.expiryLabel }}</span>
              </label>
              <input v-model="batchExpiry" type="date" class="form-control" required />
            </div>

            <div class="input-group">
              <label class="label-with-icon">
                <FileText :size="12" />
                <span>{{ STOCK_IN_UI.form.poLabel }}</span>
              </label>
              <input
                v-model="supplierNote"
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

        <!-- Right Column: Receiving History Log -->
        <section class="logs-card">
          <div class="card-header">
            <span class="card-title">{{ STOCK_IN_UI.logs.title }}</span>
            <span class="counter-badge"
              >{{ store.stockInHistory?.length || 0 }} {{ STOCK_IN_UI.logs.loggedSuffix }}</span
            >
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
                    <span class="base-units"
                      >(+{{ entry.totalBaseUnits }} {{ entry.baseUnit }})</span
                    >
                  </div>
                  <span class="log-time">{{ entry.date }}</span>
                </div>

                <div class="log-item-desc">
                  <span class="product-title">{{ entry.productName }}</span>
                </div>

                <div class="log-footer">
                  <span class="branch-tag">{{ entry.branchName }}</span>
                  <span class="note-tag">{{ entry.note }}</span>
                  <span v-if="entry.expiry !== 'N/A'" class="expiry-tag"
                    >Exp: {{ entry.expiry }}</span
                  >
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
