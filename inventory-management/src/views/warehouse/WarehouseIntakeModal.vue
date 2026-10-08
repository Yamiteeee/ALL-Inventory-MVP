<script setup>
import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '../../stores/inventoryStore'
import { WAREHOUSE_UI } from './warehouseConfig'
import BaseModal from '@/components/ui/BaseModal.vue'
import { Truck, Layers, MapPin, Calendar, FileText, Store } from 'lucide-vue-next'

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
    :title="WAREHOUSE_UI.modal.title"
    :eyebrow="WAREHOUSE_UI.modal.eyebrow"
    max-width="580px"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="intake-form">
      <!-- Destination Branch Warehouse -->
      <div class="input-group">
        <label class="label-with-icon">
          <Store :size="12" />
          <span>Destination Branch Warehouse</span>
        </label>
        <div class="select-wrapper">
          <select v-model="intakeBranchId" class="form-control" required>
            <option v-for="b in branches" :key="b.id" :value="b.id">
              {{ b.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Variant Picker -->
      <div class="input-group">
        <label for="intake-variant">Master Product SKU</label>
        <div class="select-wrapper">
          <select id="intake-variant" v-model="intakeVariantId" class="form-control" required>
            <option v-for="item in variants" :key="item.id" :value="item.id">
              [{{ item.sku }}] {{ item.fullName }}
            </option>
          </select>
        </div>
      </div>

      <!-- Tier & Quantity -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <Layers :size="12" />
            <span>Freight Unit Tier</span>
          </label>
          <div class="select-wrapper">
            <select v-model="intakeTier" class="form-control">
              <option value="level3">Level 3: Full Pallet (Bulk Lot)</option>
              <option value="level2">Level 2: Master Carton/Box</option>
              <option value="level1">Level 1: Base Units</option>
            </select>
          </div>
        </div>

        <div class="input-group">
          <label for="intake-qty">Inbound Quantity</label>
          <input
            id="intake-qty"
            v-model.number="intakeQty"
            type="number"
            min="1"
            step="1"
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

      <button type="submit" class="btn-dock" :disabled="intakeQty <= 0">
        <Truck :size="16" />
        <span>{{ WAREHOUSE_UI.modal.submitButton }}</span>
      </button>
    </form>
  </BaseModal>
</template>

<style scoped>
.intake-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  width: 100%;
  box-sizing: border-box;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
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

.select-wrapper {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.select-wrapper select,
select.form-control {
  width: 100% !important;
  box-sizing: border-box !important;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 2.4rem !important;
  padding-left: 1.1rem !important;
  background-color: #ffffff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1.1rem center;
  background-size: 14px 14px;
  cursor: pointer;
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
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: #52525b;
}

.metric-val {
  font-weight: 700;
  color: #18181b;
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

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

@media (max-width: 640px) {
  .form-grid-2 {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>
