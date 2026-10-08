<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useInventoryStore } from '@/stores/inventoryStore'
import { CATALOG_UI } from '../catalogConfig'
import BaseModal from '@/components/ui/BaseModal.vue'
import IosSelect from '@/components/ui/IosSelect.vue'
import {
  Layers,
  MapPin,
  Calendar,
  FileText,
  Store,
  PackagePlus,
  ExternalLink,
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
  initialBranchId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'confirm'])
const store = useInventoryStore()

const intakeBranchId = ref(props.initialBranchId || store.branches[0]?.id || '')
const intakeVariantId = ref('')
const intakeTier = ref('level3') // Default to Level 3 Pallets
const intakeQty = ref(1)
const intakeBay = ref('RACK-D01')
const intakeLot = ref('LOT-2026-0101')
const intakeExpiry = ref('')
const intakePoCode = ref('')

watch(
  () => props.initialBranchId,
  (newId) => {
    if (newId) intakeBranchId.value = newId
  },
)

watch(
  () => props.variants,
  (newVariants) => {
    if (newVariants.length && !intakeVariantId.value) {
      intakeVariantId.value = newVariants[0].id
    }
  },
  { immediate: true },
)

const activeVariant = computed(() => {
  return props.variants.find((v) => v.id === intakeVariantId.value) || props.variants[0]
})

// Auto-adjust default Bay & Lot code when variant changes
watch(
  () => activeVariant.value,
  (variant) => {
    if (!variant) return
    intakeBay.value = variant.isPerishable ? 'BAY-C01' : 'RACK-D01'
    intakeLot.value = `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  },
  { immediate: true },
)

// Normalized options for IosSelect
const branchOptions = computed(() => {
  return props.branches.map((b) => ({
    value: b.id,
    label: `${b.name} Warehouse`,
  }))
})

const variantOptions = computed(() => {
  return props.variants.map((item) => ({
    value: item.id,
    label: `${item.brand ? item.brand + ' · ' : ''}${item.parentName || item.fullName}`,
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
      label: 'Level 3: Full Pallet (Bulk Lot)',
      sublabel: `1 ${l3Unit} = ${l3Mult} ${l2Unit} (${l3Mult * l2Mult} ${l1Unit})`,
    },
    {
      value: 'level2',
      label: 'Level 2: Master Carton / Box',
      sublabel: `1 ${l2Unit} = ${l2Mult} ${l1Unit}`,
    },
    {
      value: 'level1',
      label: 'Level 1: Base Units',
      sublabel: `1 ${l1Unit}`,
    },
  ]
})

const calculatedUnits = computed(() => {
  const v = activeVariant.value
  if (!v) return 0
  const qty = Number(intakeQty.value) || 0
  const l2Mult = v.uom?.level2?.multiplier || 1
  const l3Mult = v.uom?.level3?.multiplier || 1

  if (intakeTier.value === 'level3') return qty * l2Mult * l3Mult
  if (intakeTier.value === 'level2') return qty * l2Mult
  return qty
})

const calculatedBoxes = computed(() => {
  const v = activeVariant.value
  if (!v) return 0
  const qty = Number(intakeQty.value) || 0
  const l3Mult = v.uom?.level3?.multiplier || 1

  if (intakeTier.value === 'level3') return qty * l3Mult
  if (intakeTier.value === 'level2') return qty
  return Math.floor(qty / (v.uom?.level2?.multiplier || 1))
})

const calculatedCBM = computed(() => {
  const v = activeVariant.value
  if (!v) return '0.00'
  const cbmPerBox = store.calculateCBM ? store.calculateCBM(v.dimensions || {}) : 0.05
  return (calculatedBoxes.value * cbmPerBox).toFixed(2)
})

function handleSubmit() {
  if (intakeQty.value <= 0 || !activeVariant.value) return

  emit('confirm', {
    branchId: intakeBranchId.value,
    variant: activeVariant.value,
    qty: intakeQty.value,
    tier: intakeTier.value,
    bay: intakeBay.value,
    lot: intakeLot.value,
    expiry: intakeExpiry.value,
    poCode: intakePoCode.value,
    totalUnits: calculatedUnits.value,
  })

  intakeQty.value = 1
  intakePoCode.value = ''
  intakeExpiry.value = ''
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="CATALOG_UI.warehouseModals?.intake?.title || 'Inbound Pallet & Lot Intake'"
    :eyebrow="CATALOG_UI.warehouseModals?.intake?.eyebrow || 'Direct Warehouse PO'"
    max-width="580px"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="intake-form">
      <!-- Destination Branch Warehouse (IosSelect) -->
      <div class="input-group">
        <label class="label-with-icon">
          <Store :size="12" />
          <span>Destination Branch Warehouse</span>
        </label>
        <IosSelect
          v-model="intakeBranchId"
          :options="branchOptions"
          title="Select Destination Warehouse"
          placeholder="Choose Warehouse"
        />
      </div>

      <!-- Variant Picker (IosSelect with Live Search) -->
      <div class="input-group">
        <label>Master Product SKU</label>
        <IosSelect
          v-model="intakeVariantId"
          :options="variantOptions"
          title="Select Product SKU to Receive"
          placeholder="Choose Product Variant"
          searchable
        />

        <!-- Selected Variant Preview Glance -->
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
              Cold Chain
            </span>
          </div>
        </div>
      </div>

      <!-- Tier & Quantity -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <Layers :size="12" />
            <span>UOM</span>
          </label>
          <IosSelect
            v-model="intakeTier"
            :options="tierOptions"
            title="Select Freight Intake Tier"
          />
        </div>

        <div class="input-group">
          <label for="intake-qty">Inbound Quantity</label>
          <input
            id="intake-qty"
            v-model.number="intakeQty"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            class="form-control"
            required
          />
        </div>
      </div>

      <!-- Bay & Lot Designation -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <MapPin :size="12" />
            <span>Assigned Storage Bay</span>
          </label>
          <input
            v-model="intakeBay"
            type="text"
            class="form-control font-mono"
            placeholder="e.g. BAY-C01 or RACK-D01"
            required
          />
        </div>

        <div class="input-group">
          <label>Tracking Lot Code</label>
          <input
            v-model="intakeLot"
            type="text"
            class="form-control font-mono"
            placeholder="e.g. LOT-2026-9021"
            required
          />
        </div>
      </div>

      <!-- Expiry & PO Ref -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <Calendar :size="12" />
            <span>Batch Expiry Date</span>
          </label>
          <input
            v-model="intakeExpiry"
            type="date"
            class="form-control"
            :required="activeVariant?.isPerishable"
          />
        </div>

        <div class="input-group">
          <label class="label-with-icon">
            <FileText :size="12" />
            <span>Inbound PO / Reference</span>
          </label>
          <input
            v-model="intakePoCode"
            type="text"
            class="form-control"
            placeholder="e.g. PO-WH-8891"
          />
        </div>
      </div>

      <!-- Volumetric Calculation Card -->
      <div class="intake-metrics-card">
        <div class="metric-row">
          <span class="metric-label">Total Units Credited:</span>
          <span class="metric-val">
            +{{ calculatedUnits }} {{ activeVariant?.uom?.level1?.unit }}
          </span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Master Boxes:</span>
          <span class="metric-val">{{ calculatedBoxes }} boxes</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-row bold-row">
          <span class="metric-label">Estimated Occupied Space:</span>
          <span class="metric-val font-mono">+{{ calculatedCBM }} m³</span>
        </div>
      </div>

      <div class="intake-footer-row">
        <button type="submit" class="btn-dock" :disabled="intakeQty <= 0">
          <PackagePlus :size="16" />
          <span>{{
            CATALOG_UI.warehouseModals?.intake?.submitButton ||
            'Confirm & Receive Freight into Inventory'
          }}</span>
        </button>

        <RouterLink to="/stock-in" class="btn-full-dock-link" @click="emit('close')">
          <span>Open Full PO Inward Receiving Dock</span>
          <ExternalLink :size="12" />
        </RouterLink>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
.intake-form {
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
  padding: 0.72rem 1.1rem;
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

.intake-metrics-card {
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

.btn-dock {
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
  touch-action: manipulation;
}

.btn-dock:hover:not(:disabled) {
  background-color: #27272a !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
}

.btn-dock:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.intake-footer-row {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  align-items: center;
  margin-top: 0.35rem;
}

.btn-full-dock-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: #71717a;
  text-decoration: none;
  transition: color 0.15s ease;
}

.btn-full-dock-link:hover {
  color: #18181b;
  text-decoration: underline;
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
