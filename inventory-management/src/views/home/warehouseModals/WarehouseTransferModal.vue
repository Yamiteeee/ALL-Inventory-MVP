<script setup>
import { ref, computed, watch } from 'vue'
import { useInventoryStore } from '@/stores/inventoryStore'
import BaseModal from '@/components/ui/BaseModal.vue'
import IosSelect from '@/components/ui/IosSelect.vue'
import {
  ArrowRightLeft,
  Warehouse,
  FileText,
  AlertCircle,
  CheckCircle2,
  Truck,
  PlusCircle,
  Inbox,
  Send,
  Clock,
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

// Navigation Mode: 'queue' (Review & Dispatch Requests) | 'create' (New Request Order) | 'transit' (On the Road)
const activeTab = ref('queue')

// Origin / Fulfilling Hub context (defaults to current selection or commissary)
const activeHubId = ref(
  props.currentBranchId && props.currentBranchId !== 'all'
    ? props.currentBranchId
    : store.branches[0]?.id || 'b-commissary',
)

watch(
  () => props.currentBranchId,
  (newId) => {
    if (newId && newId !== 'all') {
      activeHubId.value = newId
    }
  },
)

// Dispatch Form Inputs for Active Selected Request
const selectedRequestId = ref('')
const dispatchManifestNo = ref('')
const dispatchCourierNotes = ref('')
const feedbackBanner = ref('')

// New Request Order Inputs
const newRequestingBranchId = ref(
  props.currentBranchId && props.currentBranchId !== 'all'
    ? props.currentBranchId
    : store.branches[1]?.id || 'b-downtown',
)
const newFulfillingBranchId = ref(store.branches[0]?.id || 'b-commissary')
const newVariantId = ref(store.flatVariants[0]?.id || '')
const newTier = ref('level2')
const newQty = ref(2)
const newNotes = ref('Storefront inventory shortage / Customer order demand')
const newHoldSale = ref(true)

// Reactive Filters & Lists
const hubOptions = computed(() => {
  return [
    { value: 'all', label: 'All Warehouses (Global View)' },
    ...props.branches.map((b) => ({
      value: b.id,
      label: `${b.name} Hub`,
    })),
  ]
})

// Pending requests where THIS hub is the fulfilling branch or requesting branch (or all pending if commissary or global)
const pendingRequestsForThisHub = computed(() => {
  return (store.transferRequests || []).filter((r) => {
    if (r.status !== 'pending') return false

    // If 'all' is selected, show every pending request in the system
    if (!activeHubId.value || activeHubId.value === 'all') return true

    // Show only requests directed to this hub to pack and fulfill
    return r.fulfillingBranchId === activeHubId.value
  })
})

// In-Transit requests involving this hub
const inTransitRequests = computed(() => {
  return (store.transferRequests || []).filter((r) => {
    if (r.status !== 'in_transit') return false
    if (!activeHubId.value || activeHubId.value === 'all') return true
    return r.fulfillingBranchId === activeHubId.value || r.requestingBranchId === activeHubId.value
  })
})

const activeRequest = computed(() => {
  if (selectedRequestId.value) {
    return pendingRequestsForThisHub.value.find((r) => r.id === selectedRequestId.value)
  }
  return pendingRequestsForThisHub.value[0] || null
})

// Auto-select first pending request when list changes
watch(
  () => pendingRequestsForThisHub.value,
  (list) => {
    if (
      list.length &&
      (!selectedRequestId.value || !list.some((r) => r.id === selectedRequestId.value))
    ) {
      selectedRequestId.value = list[0].id
      dispatchManifestNo.value = `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    }
  },
  { immediate: true },
)

const activeRequestVariant = computed(() => {
  if (!activeRequest.value) return null
  return props.variants.find((v) => v.id === activeRequest.value.variantId) || null
})

const availableStockInHub = computed(() => {
  if (!activeRequest.value || !activeRequestVariant.value) return 0
  const stocks = store.branchStocks?.[activeRequest.value.fulfillingBranchId] || {}
  return stocks[activeRequest.value.variantId] || 0
})

const hasSufficientStockForRequest = computed(() => {
  if (!activeRequest.value) return false
  return availableStockInHub.value >= activeRequest.value.totalUnits
})

const calculatedCBM = computed(() => {
  if (!activeRequestVariant.value || !activeRequest.value) return '0.00'
  const v = activeRequestVariant.value
  const cbmPerBox = store.calculateCBM ? store.calculateCBM(v.dimensions || {}) : 0.05
  const boxes =
    activeRequest.value.tier === 'level3'
      ? activeRequest.value.qty * (v.uom?.level3?.multiplier || 1)
      : activeRequest.value.tier === 'level2'
        ? activeRequest.value.qty
        : Math.ceil(activeRequest.value.totalUnits / (v.uom?.level2?.multiplier || 1))
  return (boxes * cbmPerBox).toFixed(2)
})

function getBranchName(branchId) {
  return props.branches.find((b) => b.id === branchId)?.name || branchId
}

// Action: Fulfill & Dispatch Request
function handleDispatchActiveRequest() {
  if (!activeRequest.value || !hasSufficientStockForRequest.value) return

  const req = activeRequest.value
  const variant = activeRequestVariant.value

  store.dispatchTransferRequest(req.id, {
    manifestNo:
      dispatchManifestNo.value ||
      `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    courierNotes: dispatchCourierNotes.value || 'Scheduled Logistics Delivery',
  })

  feedbackBanner.value = `Dispatched ${req.id} [${dispatchManifestNo.value}]! Stock deducted from ${getBranchName(req.fulfillingBranchId)} and is now in transit.`
  dispatchCourierNotes.value = ''
  selectedRequestId.value = ''

  emit('confirm', {
    fromWarehouseId: req.fulfillingBranchId,
    toWarehouseId: req.requestingBranchId,
    variant,
    totalUnits: req.totalUnits,
    manifestNo: dispatchManifestNo.value,
  })

  setTimeout(() => {
    feedbackBanner.value = ''
  }, 4500)
}

// Action: Create New Request Order
function handleCreateRequest() {
  if (!newVariantId.value || newQty.value <= 0) return

  const newReq = store.createTransferRequest({
    requestingBranchId: newRequestingBranchId.value,
    fulfillingBranchId: newFulfillingBranchId.value,
    variantId: newVariantId.value,
    qty: newQty.value,
    tier: newTier.value,
    notes: newNotes.value,
    holdSale: newHoldSale.value,
  })

  feedbackBanner.value = `Created Request Order ${newReq.id}! Waiting for ${getBranchName(newFulfillingBranchId.value)} to review and dispatch.`
  activeTab.value = 'queue'
  selectedRequestId.value = newReq.id

  setTimeout(() => {
    feedbackBanner.value = ''
  }, 4500)
}

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
  { value: 'level3', label: 'Level 3: Full Pallet Lot', sublabel: 'Bulk Pallet Shipment' },
  { value: 'level1', label: 'Level 1: Base Units / Pieces', sublabel: 'Emergency Loose Pack' },
])
</script>

<template>
  <BaseModal
    :show="show"
    title="Hub-to-Hub Freight & Request Orders"
    eyebrow="Multi-Branch Relocation Engine"
    max-width="660px"
    @close="emit('close')"
  >
    <!-- Modal Navigation Pill Tabs -->
    <div class="transfer-tabs-bar">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'queue' }"
        @click="activeTab = 'queue'"
      >
        <Inbox :size="14" />
        <span>Fulfillment Queue</span>
        <span v-if="pendingRequestsForThisHub.length" class="badge-count">
          {{ pendingRequestsForThisHub.length }}
        </span>
      </button>

      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'create' }"
        @click="activeTab = 'create'"
      >
        <PlusCircle :size="14" />
        <span>New Request Order</span>
      </button>

      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'transit' }"
        @click="activeTab = 'transit'"
      >
        <Truck :size="14" />
        <span>In Transit ({{ inTransitRequests.length }})</span>
      </button>
    </div>

    <!-- Active Hub Switcher -->
    <div class="hub-context-strip">
      <div class="context-label">
        <Warehouse :size="12" />
        <span>Operating as Fulfilling Hub:</span>
      </div>
      <div class="context-select-wrap">
        <IosSelect v-model="activeHubId" :options="hubOptions" title="Switch Operating Hub" />
      </div>
    </div>

    <!-- Success Feedback Notification -->
    <div v-if="feedbackBanner" class="transfer-alert-banner">
      <CheckCircle2 :size="15" />
      <span>{{ feedbackBanner }}</span>
    </div>

    <!-- TAB 1: REVIEW & DISPATCH PENDING REQUESTS -->
    <div v-if="activeTab === 'queue'" class="tab-pane">
      <div v-if="pendingRequestsForThisHub.length === 0" class="empty-requests-state">
        <div class="empty-icon-wrap">
          <CheckCircle2 :size="28" />
        </div>
        <h4>No Pending Requests for this Hub</h4>
        <p>All branch orders are fulfilled. You can create a new request or switch hubs above.</p>
        <button type="button" class="btn btn-secondary btn-sm" @click="activeTab = 'create'">
          <PlusCircle :size="14" />
          <span>Create Branch Request Order</span>
        </button>
      </div>

      <div v-else class="queue-layout">
        <!-- Request Selector Pills -->
        <div class="requests-selector-list">
          <button
            v-for="req in pendingRequestsForThisHub"
            :key="req.id"
            type="button"
            class="request-pill-card"
            :class="{ active: req.id === activeRequest?.id }"
            @click="selectedRequestId = req.id"
          >
            <div class="pill-header">
              <span class="req-id">{{ req.id }}</span>
              <span class="req-status-pill">Pending</span>
            </div>
            <div class="pill-body">
              <strong>{{ getBranchName(req.requestingBranchId) }}</strong>
              <div class="pill-meta">
                Needs {{ req.qty }} {{ req.tier }} ({{ req.totalUnits }} units)
              </div>
            </div>
            <div v-if="req.holdSale" class="pill-tag-hold">
              <Clock :size="11" />
              <span>Customer Sale on Hold</span>
            </div>
          </button>
        </div>

        <!-- Active Request Fulfillment Card -->
        <div v-if="activeRequest && activeRequestVariant" class="fulfillment-card">
          <div class="fulfillment-header">
            <div>
              <span class="eyebrow-mini">Request Order Details</span>
              <h3 class="req-title">{{ activeRequestVariant.fullName }}</h3>
            </div>
            <div class="req-routing-badge">
              <span>{{ getBranchName(activeRequest.fulfillingBranchId) }}</span>
              <ArrowRightLeft :size="12" />
              <span>{{ getBranchName(activeRequest.requestingBranchId) }}</span>
            </div>
          </div>

          <!-- Note / Shortage Details -->
          <div v-if="activeRequest.notes" class="request-reason-box">
            <span class="reason-label">Order Note:</span>
            <span class="reason-text">{{ activeRequest.notes }}</span>
            <span v-if="activeRequest.heldCustomerName" class="reason-client">
              (Client: {{ activeRequest.heldCustomerName }})
            </span>
          </div>

          <!-- Metrics Matrix -->
          <div class="metrics-grid">
            <div class="metric-box">
              <span class="m-label">Requested Quantity</span>
              <span class="m-val">{{ activeRequest.qty }} {{ activeRequest.tier }}</span>
              <span class="m-sub"
                >({{ activeRequest.totalUnits }} {{ activeRequestVariant.uom?.level1?.unit }})</span
              >
            </div>
            <div class="metric-box">
              <span class="m-label">Hub Available Stock</span>
              <span class="m-val" :class="{ 'text-danger': !hasSufficientStockForRequest }">
                {{ availableStockInHub }} {{ activeRequestVariant.uom?.level1?.unit }}
              </span>
              <span class="m-sub">{{
                hasSufficientStockForRequest ? 'Sufficient balance' : 'Shortage in hub'
              }}</span>
            </div>
            <div class="metric-box">
              <span class="m-label">Transit Volume</span>
              <span class="m-val">{{ calculatedCBM }} m³</span>
              <span class="m-sub">Freight payload</span>
            </div>
          </div>

          <!-- Dispatch Authorize Form -->
          <form @submit.prevent="handleDispatchActiveRequest" class="dispatch-form-section">
            <div class="form-grid-2">
              <div class="input-group">
                <label class="label-with-icon">
                  <FileText :size="12" />
                  <span>Transfer Manifest #</span>
                </label>
                <input
                  v-model="dispatchManifestNo"
                  type="text"
                  class="form-control font-mono"
                  placeholder="e.g. TRF-2026-1049"
                  required
                />
              </div>

              <div class="input-group">
                <label class="label-with-icon">
                  <Truck :size="12" />
                  <span>Courier / Driver Notes</span>
                </label>
                <input
                  v-model="dispatchCourierNotes"
                  type="text"
                  class="form-control"
                  placeholder="e.g. L300 Van #2 · Restock Run"
                />
              </div>
            </div>

            <div v-if="!hasSufficientStockForRequest" class="stock-deficit-warning">
              <AlertCircle :size="14" />
              <span
                >Cannot dispatch. Hub needs {{ activeRequest.totalUnits }}, but only
                {{ availableStockInHub }} available.</span
              >
            </div>

            <button
              type="submit"
              class="btn-fulfill-submit"
              :disabled="!hasSufficientStockForRequest"
            >
              <Send :size="16" />
              <span>Accept Request & Dispatch Stock</span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- TAB 2: CREATE NEW REQUEST ORDER -->
    <div v-else-if="activeTab === 'create'" class="tab-pane">
      <form @submit.prevent="handleCreateRequest" class="create-request-form">
        <div class="form-grid-2">
          <div class="input-group">
            <label>Requesting Branch (Who Needs Stock)</label>
            <IosSelect
              v-model="newRequestingBranchId"
              :options="hubOptions"
              title="Select Requesting Branch"
            />
          </div>

          <div class="input-group">
            <label>Fulfilling Hub (Source of Goods)</label>
            <IosSelect
              v-model="newFulfillingBranchId"
              :options="hubOptions"
              title="Select Fulfilling Hub"
            />
          </div>
        </div>

        <div class="input-group">
          <label>Product Variant to Request</label>
          <IosSelect
            v-model="newVariantId"
            :options="variantOptions"
            title="Select SKU to Request"
            searchable
          />
        </div>

        <div class="form-grid-2">
          <div class="input-group">
            <label>Packaging Tier</label>
            <IosSelect v-model="newTier" :options="tierOptions" title="Select Packaging Tier" />
          </div>

          <div class="input-group">
            <label>Quantity to Request</label>
            <input
              v-model.number="newQty"
              type="number"
              min="1"
              step="1"
              class="form-control"
              required
            />
          </div>
        </div>

        <div class="input-group">
          <label>Reason / Demand Notes</label>
          <input
            v-model="newNotes"
            type="text"
            class="form-control"
            placeholder="e.g. Walk-in customer order shortage / Weekly store replenishment"
            required
          />
        </div>

        <div class="checkbox-group">
          <label class="checkbox-label">
            <input v-model="newHoldSale" type="checkbox" />
            <span>Mark associated customer sale on hold until this delivery arrives</span>
          </label>
        </div>

        <button type="submit" class="btn-create-submit">
          <PlusCircle :size="16" />
          <span>Submit Inter-Branch Request Order</span>
        </button>
      </form>
    </div>

    <!-- TAB 3: IN TRANSIT / ON THE ROAD -->
    <div v-else-if="activeTab === 'transit'" class="tab-pane">
      <div v-if="inTransitRequests.length === 0" class="empty-requests-state">
        <Truck :size="28" />
        <h4>No Shipments Currently in Transit</h4>
        <p>Dispatched orders en route to storefronts will appear here.</p>
      </div>

      <div v-else class="transit-list">
        <div v-for="t in inTransitRequests" :key="t.id" class="transit-card">
          <div class="transit-header">
            <div class="t-manifest font-mono">{{ t.manifestNo || 'TRF-IN-TRANSIT' }}</div>
            <span class="status-pill-transit">🚚 In Transit</span>
          </div>
          <div class="transit-body">
            <div class="t-route">
              <strong>{{ getBranchName(t.fulfillingBranchId) }}</strong>
              <ArrowRightLeft :size="12" />
              <strong>{{ getBranchName(t.requestingBranchId) }}</strong>
            </div>
            <div class="t-qty">
              {{ t.qty }} {{ t.tier }} ({{ t.totalUnits }} units) ·
              {{ store.flatVariants.find((v) => v.id === t.variantId)?.fullName }}
            </div>
            <div v-if="t.courierNotes" class="t-courier">Driver Note: {{ t.courierNotes }}</div>
            <div v-if="t.holdSale" class="pill-tag-hold">
              <Clock :size="11" />
              <span>Customer Sale On Hold</span>
            </div>
          </div>
          <div class="transit-footer">
            <span class="t-time">Dispatched: {{ t.dispatchedAt || 'Today' }}</span>
            <span class="t-note">Awaiting Inward Confirmation in PO Dock</span>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.transfer-tabs-bar {
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
  font-size: 0.76rem;
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

.badge-count {
  background: #ef4444;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
}

.hub-context-strip {
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

.transfer-alert-banner {
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

.queue-layout {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.requests-selector-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.65rem;
}

.request-pill-card {
  text-align: left;
  border: 1.5px solid #e4e4e7;
  background: #ffffff;
  border-radius: 14px;
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  transition: all 0.16s ease;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.request-pill-card:hover {
  border-color: #a1a1aa;
}

.request-pill-card.active {
  border-color: #18181b;
  background: #fafafa;
  box-shadow: 0 0 0 1px #18181b;
}

.pill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.req-id {
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  font-weight: 700;
  color: #18181b;
}

.req-status-pill {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 9999px;
}

.pill-body strong {
  font-size: 0.78rem;
  color: #18181b;
  display: block;
}

.pill-meta {
  font-size: 0.72rem;
  color: #71717a;
}

.pill-tag-hold {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #b45309;
  background: #fffbeb;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  width: fit-content;
}

.fulfillment-card {
  border: 1.5px solid #e4e4e7;
  border-radius: 16px;
  padding: 1rem 1.15rem;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.fulfillment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.eyebrow-mini {
  font-size: 0.68rem;
  font-weight: 700;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.req-title {
  margin: 0.15rem 0 0 0;
  font-size: 0.95rem;
  color: #18181b;
}

.req-routing-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #18181b;
}

.request-reason-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  font-size: 0.76rem;
  color: #334155;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.reason-label {
  font-weight: 700;
  color: #0f172a;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.55rem;
  background: #f8f8fa;
  padding: 0.75rem;
  border-radius: 12px;
}

.metric-box {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.m-label {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #71717a;
}

.m-val {
  font-size: 0.92rem;
  font-weight: 800;
  color: #18181b;
}

.m-sub {
  font-size: 0.66rem;
  color: #71717a;
}

.text-danger {
  color: #dc2626 !important;
}

.dispatch-form-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.25rem;
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

.stock-deficit-warning {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  font-weight: 600;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
}

.btn-fulfill-submit,
.btn-create-submit {
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
}

.btn-fulfill-submit:hover:not(:disabled),
.btn-create-submit:hover:not(:disabled) {
  background-color: #27272a;
}

.btn-fulfill-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.create-request-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
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

.empty-requests-state {
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

.empty-icon-wrap {
  color: #16a34a;
}

.empty-requests-state h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #18181b;
}

.empty-requests-state p {
  margin: 0;
  font-size: 0.78rem;
  color: #71717a;
  max-width: 340px;
}

.transit-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transit-card {
  border: 1.5px solid #e4e4e7;
  background: #ffffff;
  border-radius: 14px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.transit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.t-manifest {
  font-size: 0.82rem;
  font-weight: 800;
  color: #18181b;
}

.status-pill-transit {
  font-size: 0.68rem;
  font-weight: 700;
  color: #1e40af;
  background: #dbeafe;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
}

.t-route {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #18181b;
}

.t-qty {
  font-size: 0.74rem;
  color: #52525b;
}

.t-courier {
  font-size: 0.72rem;
  color: #71717a;
  font-style: italic;
}

.transit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f4f4f5;
  padding-top: 0.45rem;
  font-size: 0.68rem;
  color: #71717a;
  flex-wrap: wrap;
  gap: 0.25rem;
}

@media (max-width: 640px) {
  .form-grid-2 {
    grid-template-columns: 1fr !important;
    gap: 0.65rem !important;
  }
  .metrics-grid {
    grid-template-columns: 1fr !important;
  }
  .hub-context-strip {
    flex-direction: column;
    align-items: stretch;
  }
  .context-select-wrap {
    width: 100%;
  }
}
</style>
