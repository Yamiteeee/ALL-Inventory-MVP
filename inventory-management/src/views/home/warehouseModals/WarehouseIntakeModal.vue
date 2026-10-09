<script setup>
import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '@/stores/inventoryStore'
import BaseModal from '@/components/ui/BaseModal.vue'
import IosSelect from '@/components/ui/IosSelect.vue'
import {
  Layers,
  MapPin,
  Calendar,
  FileText,
  Store,
  PackagePlus,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  ArrowRightLeft,
  ShieldCheck,
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

// Top Navigation Mode: 'supplier' (PO Freight) | 'incoming' (Transfers to Accept) | 'request' (Order from Branch)
const activeMode = ref('supplier')

const intakeBranchId = ref(props.initialBranchId || store.branches[0]?.id || '')
const intakeVariantId = ref('')
const intakeTier = ref('level3') // Default to Level 3 Pallets
const intakeQty = ref(1)
const intakeBay = ref('RACK-D01')
const intakeLot = ref('LOT-2026-0101')
const intakeExpiry = ref('')
const intakePoCode = ref('')
const intakeFeedback = ref('')

// Quick Restock Request Inputs
const requestSourceBranchId = ref(store.branches[0]?.id || 'b-commissary')
const requestVariantId = ref(store.flatVariants[0]?.id || '')
const requestQty = ref(2)
const requestTier = ref('level2')
const requestNotes = ref('Storefront stock shortage / Customer request')
const requestHoldSale = ref(true)

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
    if (newVariants.length && !requestVariantId.value) {
      requestVariantId.value = newVariants[0].id
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
    label: `${b.name} Branch`,
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

function getBranchName(branchId) {
  return props.branches.find((b) => b.id === branchId)?.name || branchId
}

// Incoming in-transit shipments targeting this branch
const incomingTransfersForBranch = computed(() => {
  return (store.transferRequests || []).filter(
    (r) =>
      r.requestingBranchId === intakeBranchId.value &&
      (r.status === 'in_transit' || r.status === 'completed'),
  )
})

const inTransitCount = computed(() => {
  return incomingTransfersForBranch.value.filter((r) => r.status === 'in_transit').length
})

// Action: Direct Supplier PO Confirm
function handleSupplierSubmit() {
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

// Action: Accept Incoming In-Transit Delivery
// Action: Accept Incoming In-Transit Delivery
function handleAcceptDelivery(requestId) {
  try {
    let updated
    if (typeof store.receiveTransferRequest === 'function') {
      updated = store.receiveTransferRequest(requestId)
    } else {
      // Direct store mutation fallback
      const req = (store.transferRequests || []).find((r) => r.id === requestId)
      if (req) {
        req.status = 'completed'
        req.receivedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        // Credit units into the receiving branch inventory
        if (!store.branchStocks[req.requestingBranchId]) {
          store.branchStocks[req.requestingBranchId] = {}
        }
        const currentStock = store.branchStocks[req.requestingBranchId][req.variantId] || 0
        store.branchStocks[req.requestingBranchId][req.variantId] = currentStock + req.totalUnits

        localStorage.setItem('inventory_transfer_requests', JSON.stringify(store.transferRequests))
        localStorage.setItem('inventory_branch_stocks', JSON.stringify(store.branchStocks))
        updated = req
      }
    }

    intakeFeedback.value = `Delivery Accepted! Credited ${updated?.totalUnits || 0} units to ${getBranchName(updated?.requestingBranchId)}. Customer sale hold is now unlocked in POS!`
    setTimeout(() => {
      intakeFeedback.value = ''
    }, 4500)
  } catch (err) {
    intakeFeedback.value = err.message
  }
}

// Action: Create Restock Request Order from PO Modal
function handleCreateBranchRequest() {
  if (!requestVariantId.value || requestQty.value <= 0) return

  const req = store.createTransferRequest({
    requestingBranchId: intakeBranchId.value,
    fulfillingBranchId: requestSourceBranchId.value,
    variantId: requestVariantId.value,
    qty: requestQty.value,
    tier: requestTier.value,
    notes: requestNotes.value,
    holdSale: requestHoldSale.value,
  })

  intakeFeedback.value = `Request ${req.id} sent to ${getBranchName(requestSourceBranchId.value)}! Waiting for dispatch.`
  activeMode.value = 'incoming'

  setTimeout(() => {
    intakeFeedback.value = ''
  }, 4500)
}
</script>

<template>
  <BaseModal
    :show="show"
    title="Inbound PO Dock & Branch Deliveries"
    eyebrow="Direct Receiving & Inward Logistics"
    max-width="620px"
    @close="emit('close')"
  >
    <!-- Modal Navigation Pill Tabs -->
    <div class="po-tabs-bar">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeMode === 'supplier' }"
        @click="activeMode = 'supplier'"
      >
        <PackagePlus :size="14" />
        <span>Supplier PO Dock</span>
      </button>

      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeMode === 'incoming' }"
        @click="activeMode = 'incoming'"
      >
        <Truck :size="14" />
        <span>Incoming Deliveries</span>
        <span v-if="inTransitCount > 0" class="badge-count-blue">{{ inTransitCount }}</span>
      </button>

      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeMode === 'request' }"
        @click="activeMode = 'request'"
      >
        <PlusCircle :size="14" />
        <span>Request Branch Restock</span>
      </button>
    </div>

    <!-- Active Receiving Branch Context -->
    <div class="branch-context-strip">
      <div class="context-label">
        <Store :size="12" />
        <span>Receiving at Branch:</span>
      </div>
      <div class="context-select-wrap">
        <IosSelect
          v-model="intakeBranchId"
          :options="branchOptions"
          title="Select Inward Receiving Branch"
        />
      </div>
    </div>

    <!-- Alert Feedback -->
    <div v-if="intakeFeedback" class="intake-alert-banner">
      <CheckCircle2 :size="15" />
      <span>{{ intakeFeedback }}</span>
    </div>

    <!-- 1. DIRECT SUPPLIER PO FORM -->
    <form
      v-if="activeMode === 'supplier'"
      @submit.prevent="handleSupplierSubmit"
      class="intake-form"
    >
      <!-- Variant Picker -->
      <div class="input-group">
        <label>Master Product SKU</label>
        <IosSelect
          v-model="intakeVariantId"
          :options="variantOptions"
          title="Select Product SKU to Receive"
          searchable
        />

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
              <Clock :size="10" /> Perishable ({{ activeVariant.shelfLifeDays }}d)
            </span>
          </div>
        </div>
      </div>

      <!-- Tier & Quantity -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <Layers :size="12" />
            <span>Packaging Matrix Tier</span>
          </label>
          <IosSelect v-model="intakeTier" :options="tierOptions" title="Select Packaging Tier" />
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

      <!-- Bay & Lot -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <MapPin :size="12" />
            <span>Storage Bay / Bin</span>
          </label>
          <input
            v-model="intakeBay"
            type="text"
            class="form-control font-mono"
            placeholder="e.g. BAY-A01"
            required
          />
        </div>

        <div class="input-group">
          <label class="label-with-icon">
            <FileText :size="12" />
            <span>Batch / Lot #</span>
          </label>
          <input
            v-model="intakeLot"
            type="text"
            class="form-control font-mono"
            placeholder="e.g. LOT-2026-9041"
            required
          />
        </div>
      </div>

      <!-- Expiry & PO Code -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <Calendar :size="12" />
            <span>Expiry Date (FEFO)</span>
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
            <span>Purchase Order Reference</span>
          </label>
          <input
            v-model="intakePoCode"
            type="text"
            class="form-control font-mono"
            placeholder="e.g. PO-MANILA-8821"
          />
        </div>
      </div>

      <!-- Metrics Card -->
      <div class="intake-metrics-card">
        <div class="metric-row">
          <span class="metric-label">Total Credited Units:</span>
          <span class="metric-val text-credit">
            +{{ calculatedUnits }} {{ activeVariant?.uom?.level1?.unit }}
          </span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Carton Equivalent:</span>
          <span class="metric-val">~{{ calculatedBoxes }} boxes</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-row bold-row">
          <span class="metric-label">Estimated Inbound Volume:</span>
          <span class="metric-val font-mono">{{ calculatedCBM }} m³</span>
        </div>
      </div>

      <button type="submit" class="btn-dock" :disabled="intakeQty <= 0 || !activeVariant">
        <PackagePlus :size="16" />
        <span>Confirm & Receive Freight into Inventory</span>
      </button>
    </form>

    <!-- 2. INCOMING BRANCH DELIVERIES & TRANSFERS -->
    <div v-else-if="activeMode === 'incoming'" class="deliveries-pane">
      <div v-if="incomingTransfersForBranch.length === 0" class="empty-state-box">
        <Truck :size="28" />
        <h4>No Incoming Shipments for this Branch</h4>
        <p>
          Transfers dispatched by the central commissary or other branches will appear here to
          accept.
        </p>
        <button type="button" class="btn btn-secondary btn-sm" @click="activeMode = 'request'">
          <PlusCircle :size="14" />
          <span>Request Stock from Commissary</span>
        </button>
      </div>

      <div v-else class="deliveries-list">
        <div
          v-for="item in incomingTransfersForBranch"
          :key="item.id"
          class="delivery-card"
          :class="{
            'card-in-transit': item.status === 'in_transit',
            'card-received': item.status === 'completed',
          }"
        >
          <div class="delivery-header">
            <div class="d-manifest font-mono">{{ item.manifestNo || item.id }}</div>
            <span v-if="item.status === 'in_transit'" class="badge-status-transit"
              >🚚 In Transit</span
            >
            <span v-else class="badge-status-completed">✅ Received & In Stock</span>
          </div>

          <div class="delivery-body">
            <div class="d-route">
              <strong>{{ getBranchName(item.fulfillingBranchId) }}</strong>
              <ArrowRightLeft :size="12" />
              <span>This Branch ({{ getBranchName(item.requestingBranchId) }})</span>
            </div>
            <div class="d-product">
              <strong>{{
                store.flatVariants.find((v) => v.id === item.variantId)?.fullName
              }}</strong>
              <div class="d-qty-note">
                Shipment: {{ item.qty }} {{ item.tier }} (+{{ item.totalUnits }} units)
              </div>
            </div>
            <div v-if="item.courierNotes" class="d-driver">
              Courier Note: {{ item.courierNotes }}
            </div>
            <div v-if="item.holdSale" class="d-hold-alert">
              <Clock :size="12" />
              <span>Linked Customer Sale is ON HOLD pending this delivery</span>
            </div>
          </div>

          <div class="delivery-actions">
            <button
              v-if="item.status === 'in_transit'"
              type="button"
              class="btn-accept-delivery"
              @click="handleAcceptDelivery(item.id)"
            >
              <CheckCircle2 :size="15" />
              <span>Accept & Confirm Delivery (+{{ item.totalUnits }} units)</span>
            </button>
            <div v-else class="received-stamp">
              <ShieldCheck :size="14" />
              <span>Received at {{ item.receivedAt || 'Today' }} · Stock Credited</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. CREATE URGENT RESTOCK REQUEST -->
    <div v-else-if="activeMode === 'request'" class="request-pane">
      <form @submit.prevent="handleCreateBranchRequest" class="intake-form">
        <div class="shortage-notice-box">
          <AlertCircle :size="16" />
          <span
            >If current stock cannot fulfill customer orders, trigger an emergency replenishment
            request to the Central Commissary.</span
          >
        </div>

        <div class="input-group">
          <label>Fulfill From (Source Warehouse / Commissary)</label>
          <IosSelect
            v-model="requestSourceBranchId"
            :options="branchOptions"
            title="Select Source Hub"
          />
        </div>

        <div class="input-group">
          <label>Product Variant Needed</label>
          <IosSelect
            v-model="requestVariantId"
            :options="variantOptions"
            title="Select SKU Needed"
            searchable
          />
        </div>

        <div class="form-grid-2">
          <div class="input-group">
            <label>Packaging Tier</label>
            <IosSelect v-model="requestTier" :options="tierOptions" title="Select Tier" />
          </div>

          <div class="input-group">
            <label>Quantity to Order</label>
            <input
              v-model.number="requestQty"
              type="number"
              min="1"
              step="1"
              class="form-control"
              required
            />
          </div>
        </div>

        <div class="input-group">
          <label>Demand / Order Reason</label>
          <input
            v-model="requestNotes"
            type="text"
            class="form-control"
            placeholder="e.g. Customer wants 12 units, store only has 10 on hand"
            required
          />
        </div>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input v-model="requestHoldSale" type="checkbox" />
            <span>Hold customer sale until this delivery arrives and is confirmed in PO dock</span>
          </label>
        </div>

        <button type="submit" class="btn-dock">
          <PlusCircle :size="16" />
          <span>Submit Request to Hub</span>
        </button>
      </form>
    </div>
  </BaseModal>
</template>

<style scoped>
.po-tabs-bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: #f4f4f5;
  padding: 0.3rem;
  border-radius: 9999px;
  margin-bottom: 0.85rem;
}

.tab-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.45rem 0.65rem;
  border: none;
  background: transparent;
  color: #71717a;
  font-size: 0.74rem;
  font-weight: 700;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.tab-btn.active {
  background: #ffffff;
  color: #18181b;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.badge-count-blue {
  background: #2563eb;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
}

.branch-context-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: #fafafa;
  border: 1px solid #e4e4e7;
  padding: 0.45rem 0.85rem;
  border-radius: 12px;
  margin-bottom: 0.85rem;
}

.context-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  font-weight: 700;
  color: #52525b;
}

.context-select-wrap {
  min-width: 200px;
}

.intake-alert-banner {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 0.95rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.85rem;
}

.intake-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.input-group label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
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
  padding: 0.6rem 0.95rem;
  border: 1.5px solid #e4e4e7;
  border-radius: 9999px;
  font-size: 0.85rem;
  color: #18181b;
  outline: none;
}

.font-mono {
  font-family: ui-monospace, monospace;
}

.selected-variant-preview {
  margin-top: 0.35rem;
  padding: 0.55rem 0.75rem;
  background: #f8f8fa;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
}

.preview-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 0.25rem;
}

.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.preview-tag {
  font-size: 0.66rem;
  font-weight: 600;
  color: #52525b;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
}

.tag-perishable {
  color: #b45309;
  background: #fffbeb;
  border-color: #fde68a;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.intake-metrics-card {
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 16px;
  padding: 0.85rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
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

.text-credit {
  color: #16a34a !important;
}

.metric-divider {
  height: 1px;
  background: #e4e4e7;
  margin: 0.25rem 0;
}

.bold-row {
  font-size: 0.88rem;
  font-weight: 800;
  color: #18181b;
}

.btn-dock {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.4rem;
  background-color: #18181b;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
  margin-top: 0.25rem;
}

.btn-dock:hover:not(:disabled) {
  background-color: #27272a;
}

.btn-dock:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Incoming Deliveries Pane */
.deliveries-pane {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-state-box {
  text-align: center;
  padding: 2.5rem 1.5rem;
  background: #fafafa;
  border: 1.5px dashed #e4e4e7;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
}

.empty-state-box h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #18181b;
}

.empty-state-box p {
  margin: 0;
  font-size: 0.78rem;
  color: #71717a;
  max-width: 320px;
}

.deliveries-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.delivery-card {
  border: 1.5px solid #e4e4e7;
  background: #ffffff;
  border-radius: 14px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-in-transit {
  border-color: #93c5fd;
  background: #f0f7ff;
}

.card-received {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.d-manifest {
  font-size: 0.85rem;
  font-weight: 800;
  color: #18181b;
}

.badge-status-transit {
  font-size: 0.68rem;
  font-weight: 700;
  color: #1d4ed8;
  background: #dbeafe;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
}

.badge-status-completed {
  font-size: 0.68rem;
  font-weight: 700;
  color: #15803d;
  background: #dcfce7;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
}

.d-route {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: #18181b;
}

.d-product strong {
  font-size: 0.82rem;
  color: #18181b;
}

.d-qty-note {
  font-size: 0.74rem;
  color: #52525b;
}

.d-driver {
  font-size: 0.72rem;
  color: #71717a;
  font-style: italic;
}

.d-hold-alert {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #b45309;
  background: #fef3c7;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  width: fit-content;
}

.btn-accept-delivery {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  background: #18181b;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}

.btn-accept-delivery:hover {
  background: #27272a;
}

.received-stamp {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  font-weight: 700;
  color: #166534;
}

.shortage-notice-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 12px;
  font-size: 0.76rem;
  font-weight: 600;
}

.checkbox-group {
  margin: 0.2rem 0;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #3f3f46;
  cursor: pointer;
}

@media (max-width: 640px) {
  .form-grid-2 {
    grid-template-columns: 1fr !important;
    gap: 0.65rem !important;
  }
  .branch-context-strip {
    flex-direction: column;
    align-items: stretch;
  }
  .context-select-wrap {
    width: 100%;
  }
}
</style>
