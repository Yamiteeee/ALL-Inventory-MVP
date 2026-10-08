<script setup>
import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '../../stores/inventoryStore'
import BaseModal from '@/components/ui/BaseModal.vue'
import IosSelect from '@/components/ui/IosSelect.vue'
import { ArrowRightLeft, Store, Layers, FileText, AlertCircle, CheckCircle2 } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  variants: {
    type: Array,
    default: () => [],
  },
  branches: {
    type: Array,
    default: () => [],
  },
  currentBranchId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'confirm'])
const store = useInventoryStore()

// Origin Warehouse (defaults to current selection or commissary)
const sourceBranchId = ref(
  props.currentBranchId && props.currentBranchId !== 'all'
    ? props.currentBranchId
    : store.branches[0]?.id || 'b-commissary',
)

// Destination Store Branch (defaults to first non-source branch)
const targetBranchId = ref(
  store.branches.find((b) => b.id !== sourceBranchId.value)?.id || store.branches[1]?.id || '',
)

const dispatchVariantId = ref('')
const dispatchTier = ref('level2') // Default to Level 2 (Master Cartons)
const dispatchQty = ref(1)
const manifestNo = ref('')
const driverNotes = ref('')

watch(
  () => props.currentBranchId,
  (newId) => {
    if (newId && newId !== 'all') {
      sourceBranchId.value = newId
    }
  },
)

watch(
  () => sourceBranchId.value,
  (newSource) => {
    if (newSource === targetBranchId.value) {
      const alternate = props.branches.find((b) => b.id !== newSource)
      if (alternate) targetBranchId.value = alternate.id
    }
  },
)

watch(
  () => props.variants,
  (newVariants) => {
    if (newVariants.length && !dispatchVariantId.value) {
      dispatchVariantId.value = newVariants[0].id
    }
  },
  { immediate: true },
)

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      manifestNo.value = `DSP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    }
  },
)

const activeVariant = computed(() => {
  return props.variants.find((v) => v.id === dispatchVariantId.value) || props.variants[0]
})

// Normalized Option Lists for IosSelect
const sourceBranchOptions = computed(() => {
  return props.branches.map((b) => ({
    value: b.id,
    label: `${b.name} Warehouse`,
  }))
})

const targetBranchOptions = computed(() => {
  return props.branches
    .filter((b) => b.id !== sourceBranchId.value)
    .map((b) => ({
      value: b.id,
      label: `${b.name} Store`,
    }))
})

const variantOptions = computed(() => {
  return props.variants.map((item) => ({
    value: item.id,
    label: `${item.brand ? item.brand + ' · ' : ''}${item.parentName || item.productName || item.fullName}`,
    sublabel: `[${item.sku}] ${item.category || ''} · ${item.flavor || item.color || item.sizeCapacity || ''}`,
  }))
})

const tierOptions = computed(() => [
  {
    value: 'level2',
    label: 'Level 2: Master Cartons / Boxes',
    sublabel: 'Standard Branch Restock',
  },
  {
    value: 'level3',
    label: 'Level 3: Full Pallet Lots',
    sublabel: 'Bulk Warehouse Pallet Lot',
  },
  {
    value: 'level1',
    label: 'Level 1: Base Units',
    sublabel: 'Loose Pieces / Break-Bulk',
  },
])

// Current available stock in the selected origin warehouse
const availableBaseStock = computed(() => {
  if (!activeVariant.value) return 0
  const stocks = store.branchStocks?.[sourceBranchId.value] || {}
  return stocks[activeVariant.value.id] || 0
})

const calculatedUnits = computed(() => {
  const v = activeVariant.value
  if (!v) return 0
  const qty = Number(dispatchQty.value) || 0
  const l2Mult = v.uom?.level2?.multiplier || 1
  const l3Mult = v.uom?.level3?.multiplier || 1

  if (dispatchTier.value === 'level3') return qty * l2Mult * l3Mult
  if (dispatchTier.value === 'level2') return qty * l2Mult
  return qty
})

const calculatedBoxes = computed(() => {
  const v = activeVariant.value
  if (!v) return 0
  const qty = Number(dispatchQty.value) || 0
  const l3Mult = v.uom?.level3?.multiplier || 1

  if (dispatchTier.value === 'level3') return qty * l3Mult
  if (dispatchTier.value === 'level2') return qty
  return Math.floor(qty / (v.uom?.level2?.multiplier || 1))
})

const calculatedCBM = computed(() => {
  const v = activeVariant.value
  if (!v) return '0.00'
  const cbmPerBox = store.calculateCBM ? store.calculateCBM(v.dimensions || {}) : 0.05
  return (calculatedBoxes.value * cbmPerBox).toFixed(2)
})

// Source warehouse inventory validation
const hasSufficientStock = computed(() => {
  return availableBaseStock.value >= calculatedUnits.value
})

function handleSubmit() {
  if (dispatchQty.value <= 0 || !activeVariant.value || !hasSufficientStock.value) return
  if (sourceBranchId.value === targetBranchId.value) return

  emit('confirm', {
    fromBranchId: sourceBranchId.value,
    toBranchId: targetBranchId.value,
    variant: activeVariant.value,
    qty: dispatchQty.value,
    tier: dispatchTier.value,
    totalUnits: calculatedUnits.value,
    manifestNo: manifestNo.value,
    notes: driverNotes.value,
  })

  dispatchQty.value = 1
  driverNotes.value = ''
}
</script>

<template>
  <BaseModal
    :show="show"
    title="Dispatch Freight to Branch"
    eyebrow="Outbound Restock Manifest"
    max-width="600px"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="dispatch-form">
      <!-- Routing: Origin to Destination (IosSelect) -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <Store :size="12" />
            <span>Origin Warehouse</span>
          </label>
          <IosSelect
            v-model="sourceBranchId"
            :options="sourceBranchOptions"
            title="Select Origin Warehouse"
            placeholder="Choose Warehouse"
          />
        </div>

        <div class="input-group">
          <label class="label-with-icon">
            <Store :size="12" />
            <span>Destination Branch</span>
          </label>
          <IosSelect
            v-model="targetBranchId"
            :options="targetBranchOptions"
            title="Select Destination Branch Store"
            placeholder="Choose Branch"
          />
        </div>
      </div>

      <!-- Variant Picker (IosSelect with Live Search) -->
      <div class="input-group">
        <div class="label-row-split">
          <label>Product SKU to Dispatch</label>
          <span class="stock-pill" :class="{ 'stock-pill-empty': availableBaseStock === 0 }">
            Available: <strong>{{ availableBaseStock }}</strong>
            {{ activeVariant?.uom?.level1?.unit }}
          </span>
        </div>
        <IosSelect
          v-model="dispatchVariantId"
          :options="variantOptions"
          title="Select SKU to Dispatch"
          placeholder="Choose Product Variant"
          searchable
        />

        <!-- Mobile-first Variant Glance Card -->
        <div v-if="activeVariant" class="selected-variant-preview">
          <div class="preview-title">{{ activeVariant.fullName }}</div>
          <div class="preview-meta">
            <span class="preview-tag tag-mono">{{ activeVariant.sku }}</span>
            <span v-if="activeVariant.category" class="preview-tag">{{
              activeVariant.category
            }}</span>
            <span v-if="activeVariant.sizeCapacity" class="preview-tag">{{
              activeVariant.sizeCapacity
            }}</span>
            <span class="preview-tag">
              Origin Balance: {{ availableBaseStock }} {{ activeVariant.uom?.level1?.unit }}
            </span>
          </div>
        </div>
      </div>

      <!-- Dispatch Tier & Quantity -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <Layers :size="12" />
            <span>Dispatch Tier</span>
          </label>
          <IosSelect
            v-model="dispatchTier"
            :options="tierOptions"
            title="Select Freight Dispatch Tier"
          />
        </div>

        <div class="input-group">
          <label for="dispatch-qty">Dispatch Quantity</label>
          <input
            id="dispatch-qty"
            v-model.number="dispatchQty"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            class="form-control"
            required
          />
        </div>
      </div>

      <!-- Manifest Code & Notes -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <FileText :size="12" />
            <span>Transfer Manifest #</span>
          </label>
          <input
            v-model="manifestNo"
            type="text"
            class="form-control font-mono"
            placeholder="e.g. DSP-2026-1049"
            required
          />
        </div>

        <div class="input-group">
          <label>Driver / Courier Notes</label>
          <input
            v-model="driverNotes"
            type="text"
            class="form-control"
            placeholder="e.g. Route A · Morning Restock"
          />
        </div>
      </div>

      <!-- Live Calculation Card -->
      <div class="dispatch-metrics-card">
        <div class="metric-row">
          <span class="metric-label">Deducting from Origin Warehouse:</span>
          <span class="metric-val text-deduct">
            -{{ calculatedUnits }} {{ activeVariant?.uom?.level1?.unit }}
          </span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Crediting to Destination Branch:</span>
          <span class="metric-val">+{{ calculatedBoxes }} boxes</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-row bold-row">
          <span class="metric-label">Estimated Transit Volume:</span>
          <span class="metric-val font-mono">{{ calculatedCBM }} m³</span>
        </div>

        <div v-if="!hasSufficientStock" class="stock-deficit-warning">
          <AlertCircle :size="14" />
          <span
            >Insufficient stock. Needs {{ calculatedUnits }}, but only
            {{ availableBaseStock }} left.</span
          >
        </div>
        <div v-else class="stock-sufficient-note">
          <CheckCircle2 :size="14" />
          <span
            >Stock verified. Remaining after transfer: {{ availableBaseStock - calculatedUnits }}
            {{ activeVariant?.uom?.level1?.unit }}.</span
          >
        </div>
      </div>

      <button
        type="submit"
        class="btn-dispatch"
        :disabled="dispatchQty <= 0 || !hasSufficientStock || sourceBranchId === targetBranchId"
      >
        <ArrowRightLeft :size="16" />
        <span>Authorize & Dispatch to Branch</span>
      </button>
    </form>
  </BaseModal>
</template>

<style scoped>
.dispatch-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.85rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.input-group label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #71717a;
}

.label-row-split {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.stock-pill {
  font-size: 0.68rem;
  color: #166534;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  white-space: nowrap;
}

.stock-pill-empty {
  color: #991b1b;
  background: #fef2f2;
  border-color: #fecaca;
}

.label-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.form-control {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  padding: 0.68rem 1.1rem;
  border: 1.5px solid #e4e4e7;
  border-radius: 9999px;
  font-size: 0.88rem;
  color: #18181b;
  background: #ffffff;
  outline: none;
  transition: all 0.15s ease;
}

.form-control:focus {
  border-color: #18181b;
  box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.08);
}

.selected-variant-preview {
  margin-top: 0.45rem;
  padding: 0.65rem 0.85rem;
  background: #f8f8fa;
  border: 1px solid #e4e4e7;
  border-radius: 14px;
  box-sizing: border-box;
  width: 100%;
}

.preview-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #18181b;
  line-height: 1.35;
  margin-bottom: 0.35rem;
  word-break: break-word;
}

.preview-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.preview-tag {
  font-size: 0.68rem;
  font-weight: 600;
  color: #52525b;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  padding: 0.12rem 0.5rem;
  border-radius: 9999px;
}

.preview-tag.tag-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 700;
  color: #18181b;
}

.dispatch-metrics-card {
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 18px;
  padding: 1rem 1.25rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: #52525b;
  gap: 0.5rem;
}

.metric-label {
  overflow-wrap: break-word;
  min-width: 0;
}

.metric-val {
  font-weight: 700;
  color: #18181b;
  white-space: nowrap;
}

.text-deduct {
  color: #dc2626 !important;
}

.metric-divider {
  height: 1px;
  background: #e4e4e7;
  margin: 0.35rem 0;
}

.bold-row {
  font-size: 0.9rem;
  font-weight: 800;
  color: #18181b;
}

.bold-row .metric-val {
  font-size: 1.05rem;
}

.stock-deficit-warning {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  font-weight: 600;
  color: #dc2626;
  margin-top: 0.3rem;
  padding-top: 0.35rem;
  border-top: 1px dashed #fca5a5;
}

.stock-sufficient-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  font-weight: 600;
  color: #166534;
  margin-top: 0.3rem;
  padding-top: 0.35rem;
  border-top: 1px dashed #bbf7d0;
}

.btn-dispatch {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.4rem;
  background-color: #18181b !important;
  color: #ffffff !important;
  border: 1px solid #18181b;
  border-radius: 9999px;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  margin-top: 0.4rem;
  box-sizing: border-box;
}

.btn-dispatch:hover:not(:disabled) {
  background-color: #27272a !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
}

.btn-dispatch:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

@media (max-width: 640px) {
  .form-grid-2 {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.75rem !important;
  }

  /* iOS virtual keyboard auto-zoom prevention */
  .form-control {
    font-size: 16px !important;
    min-height: 44px;
  }

  .label-row-split {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .metric-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
  }

  .metric-val {
    align-self: flex-start;
  }
}
</style>
