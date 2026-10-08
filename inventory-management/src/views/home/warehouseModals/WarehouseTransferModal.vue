<script setup>
import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '@/stores/inventoryStore'
import { CATALOG_UI } from '../catalogConfig'
import BaseModal from '@/components/ui/BaseModal.vue'
import IosSelect from '@/components/ui/IosSelect.vue'
import {
  ArrowRightLeft,
  Warehouse,
  Layers,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Truck,
} from 'lucide-vue-next'

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

// Origin Hub
const sourceWarehouseId = ref(
  props.currentBranchId && props.currentBranchId !== 'all'
    ? props.currentBranchId
    : store.branches[0]?.id || 'b-commissary',
)

// Destination Hub (defaults to first non-source warehouse)
const targetWarehouseId = ref(
  store.branches.find((b) => b.id !== sourceWarehouseId.value)?.id || store.branches[1]?.id || '',
)

const transferVariantId = ref('')
const transferTier = ref('level3') // Default to Level 3 (Full Pallet Lot for warehouse-to-warehouse)
const transferQty = ref(1)
const destBay = ref('RACK-D01')
const manifestNo = ref('')
const courierNotes = ref('')

// Synchronize if initial branch changes
watch(
  () => props.currentBranchId,
  (newId) => {
    if (newId && newId !== 'all') {
      sourceWarehouseId.value = newId
    }
  },
)

// Prevent source and destination warehouse from colliding
watch(
  () => sourceWarehouseId.value,
  (newSource) => {
    if (newSource === targetWarehouseId.value) {
      const alternate = props.branches.find((b) => b.id !== newSource)
      if (alternate) targetWarehouseId.value = alternate.id
    }
  },
)

// Default to first variant
watch(
  () => props.variants,
  (newVariants) => {
    if (newVariants.length && !transferVariantId.value) {
      transferVariantId.value = newVariants[0].id
    }
  },
  { immediate: true },
)

// Generate a unique transfer manifest number whenever modal opens
watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      manifestNo.value = `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    }
  },
)

const activeVariant = computed(() => {
  return props.variants.find((v) => v.id === transferVariantId.value) || props.variants[0]
})

// Auto-adjust default destination bay if product is perishable
watch(
  () => activeVariant.value,
  (variant) => {
    if (!variant) return
    destBay.value = variant.isPerishable ? 'BAY-C01' : 'RACK-D01'
  },
  { immediate: true },
)

// Normalized IosSelect options
const sourceWarehouseOptions = computed(() => {
  return props.branches.map((b) => ({
    value: b.id,
    label: `${b.name} Hub`,
    sublabel: 'Source Warehouse',
  }))
})

const targetWarehouseOptions = computed(() => {
  return props.branches
    .filter((b) => b.id !== sourceWarehouseId.value)
    .map((b) => ({
      value: b.id,
      label: `${b.name} Hub`,
      sublabel: 'Receiving Warehouse',
    }))
})

const variantOptions = computed(() => {
  return props.variants.map((item) => ({
    value: item.id,
    label: `${item.brand ? item.brand + ' · ' : ''}${item.parentName || item.productName || item.fullName}`,
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
      label: 'Level 3: Full Pallet Lot',
      sublabel: `1 ${l3Unit} = ${l3Mult} ${l2Unit} (${l3Mult * l2Mult} ${l1Unit})`,
    },
    {
      value: 'level2',
      label: 'Level 2: Master Cartons / Boxes',
      sublabel: `1 ${l2Unit} = ${l2Mult} ${l1Unit}`,
    },
    {
      value: 'level1',
      label: 'Level 1: Base Units',
      sublabel: `1 ${l1Unit}`,
    },
  ]
})

// Available inventory at origin warehouse
const availableBaseStock = computed(() => {
  if (!activeVariant.value) return 0
  const stocks = store.branchStocks?.[sourceWarehouseId.value] || {}
  return stocks[activeVariant.value.id] || 0
})

const calculatedUnits = computed(() => {
  const v = activeVariant.value
  if (!v) return 0
  const qty = Number(transferQty.value) || 0
  const l2Mult = v.uom?.level2?.multiplier || 1
  const l3Mult = v.uom?.level3?.multiplier || 1

  if (transferTier.value === 'level3') return qty * l2Mult * l3Mult
  if (transferTier.value === 'level2') return qty * l2Mult
  return qty
})

const calculatedBoxes = computed(() => {
  const v = activeVariant.value
  if (!v) return 0
  const qty = Number(transferQty.value) || 0
  const l3Mult = v.uom?.level3?.multiplier || 1

  if (transferTier.value === 'level3') return qty * l3Mult
  if (transferTier.value === 'level2') return qty
  return Math.floor(qty / (v.uom?.level2?.multiplier || 1))
})

const calculatedCBM = computed(() => {
  const v = activeVariant.value
  if (!v) return '0.00'
  const cbmPerBox = store.calculateCBM ? store.calculateCBM(v.dimensions || {}) : 0.05
  return (calculatedBoxes.value * cbmPerBox).toFixed(2)
})

const hasSufficientStock = computed(() => {
  return availableBaseStock.value >= calculatedUnits.value
})

function handleSubmit() {
  if (transferQty.value <= 0 || !activeVariant.value || !hasSufficientStock.value) return
  if (sourceWarehouseId.value === targetWarehouseId.value) return

  emit('confirm', {
    fromWarehouseId: sourceWarehouseId.value,
    toWarehouseId: targetWarehouseId.value,
    variant: activeVariant.value,
    qty: transferQty.value,
    tier: transferTier.value,
    destBay: destBay.value,
    totalUnits: calculatedUnits.value,
    boxes: calculatedBoxes.value,
    cbm: calculatedCBM.value,
    manifestNo: manifestNo.value,
    notes: courierNotes.value,
  })

  transferQty.value = 1
  courierNotes.value = ''
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="CATALOG_UI.warehouseModals?.transfer?.title || 'Inter-Warehouse Freight Transfer'"
    :eyebrow="CATALOG_UI.warehouseModals?.transfer?.eyebrow || 'Hub-to-Hub Relocation Manifest'"
    max-width="600px"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="transfer-form">
      <!-- Hub Routing: Source to Target -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <Warehouse :size="12" />
            <span>Origin Warehouse Hub</span>
          </label>
          <IosSelect
            v-model="sourceWarehouseId"
            :options="sourceWarehouseOptions"
            title="Select Origin Hub"
            placeholder="Choose Origin"
          />
        </div>

        <div class="input-group">
          <label class="label-with-icon">
            <Warehouse :size="12" />
            <span>Destination Hub</span>
          </label>
          <IosSelect
            v-model="targetWarehouseId"
            :options="targetWarehouseOptions"
            title="Select Receiving Hub"
            placeholder="Choose Destination"
          />
        </div>
      </div>

      <!-- Variant Picker with Stock Pill -->
      <div class="input-group">
        <div class="label-row-split">
          <label>Freight SKU to Relocate</label>
          <span class="stock-pill" :class="{ 'stock-pill-empty': availableBaseStock === 0 }">
            Origin Stock: <strong>{{ availableBaseStock }}</strong>
            {{ activeVariant?.uom?.level1?.unit }}
          </span>
        </div>
        <IosSelect
          v-model="transferVariantId"
          :options="variantOptions"
          title="Select SKU for Relocation"
          placeholder="Choose Product SKU"
          searchable
        />

        <!-- Active SKU Preview Glance -->
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
            <span v-if="activeVariant.isPerishable" class="preview-tag tag-perishable">
              Cold Chain Logistics
            </span>
          </div>
        </div>
      </div>

      <!-- Freight Tier & Transfer Quantity -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <Layers :size="12" />
            <span>Freight Unit Tier</span>
          </label>
          <IosSelect v-model="transferTier" :options="tierOptions" title="Select Transfer Tier" />
        </div>

        <div class="input-group">
          <label for="transfer-qty">Transfer Quantity</label>
          <input
            id="transfer-qty"
            v-model.number="transferQty"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            class="form-control"
            required
          />
        </div>
      </div>

      <!-- Target Storage Bay & Manifest Number -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <MapPin :size="12" />
            <span>Receiving Bay Allocation</span>
          </label>
          <input
            v-model="destBay"
            type="text"
            class="form-control font-mono"
            placeholder="e.g. BAY-C01 or RACK-D01"
            required
          />
        </div>

        <div class="input-group">
          <label class="label-with-icon">
            <FileText :size="12" />
            <span>Transfer Manifest #</span>
          </label>
          <input
            v-model="manifestNo"
            type="text"
            class="form-control font-mono"
            placeholder="e.g. TRF-2026-4029"
            required
          />
        </div>
      </div>

      <!-- Courier / Inter-hub Logistics Notes -->
      <div class="input-group">
        <label class="label-with-icon">
          <Truck :size="12" />
          <span>Inter-Hub Logistics & Vehicle Notes</span>
        </label>
        <input
          v-model="courierNotes"
          type="text"
          class="form-control"
          placeholder="e.g. Truck 04 · Scheduled Afternoon Shuttle"
        />
      </div>

      <!-- Live Calculation & Deficit Warning Card -->
      <div class="transfer-metrics-card">
        <div class="metric-row">
          <span class="metric-label">Deducting from Origin Hub:</span>
          <span class="metric-val text-deduct">
            -{{ calculatedUnits }} {{ activeVariant?.uom?.level1?.unit }}
          </span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Crediting to Destination Hub:</span>
          <span class="metric-val">+{{ calculatedBoxes }} master boxes</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-row bold-row">
          <span class="metric-label">Estimated Transit Volume:</span>
          <span class="metric-val font-mono">{{ calculatedCBM }} m³</span>
        </div>

        <div v-if="!hasSufficientStock" class="stock-deficit-warning">
          <AlertCircle :size="14" />
          <span
            >Insufficient origin stock. Needs {{ calculatedUnits }}, but only
            {{ availableBaseStock }} available.</span
          >
        </div>
        <div v-else class="stock-sufficient-note">
          <CheckCircle2 :size="14" />
          <span
            >Origin stock verified. Remaining after transfer:
            {{ availableBaseStock - calculatedUnits }} {{ activeVariant?.uom?.level1?.unit }}.</span
          >
        </div>
      </div>

      <button
        type="submit"
        class="btn-transfer"
        :disabled="
          transferQty <= 0 || !hasSufficientStock || sourceWarehouseId === targetWarehouseId
        "
      >
        <ArrowRightLeft :size="16" />
        <span>{{ CATALOG_UI.warehouseModals?.transfer?.submitButton || 'Authorize Hub-to-Hub Relocation' }}</span>
      </button>
    </form>
  </BaseModal>
</template>

<style scoped>
.transfer-form {
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

.preview-tag.tag-perishable {
  color: #1e40af;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.transfer-metrics-card {
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

.btn-transfer {
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

.btn-transfer:hover:not(:disabled) {
  background-color: #27272a !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
}

.btn-transfer:disabled {
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

