<script setup>
import BaseModal from '@/components/ui/BaseModal.vue'
import IosSelect from '@/components/ui/IosSelect.vue'
import { useWarehouseTransfer } from '@/composables/warehouse/useWarehouseTransfer'
import {
  ArrowRightLeft,
  Warehouse,
  FileText,
  AlertCircle,
  CheckCircle2,
  Truck,
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

const {
  store,
  activeTab,
  setActiveTab,
  activeHubId,
  hubOptions,
  selectedRequestId,
  dispatchManifestNo,
  dispatchCourierNotes,
  feedbackBanner,
  pendingRequestsForThisHub,
  inTransitRequests,
  activeRequest,
  activeRequestVariant,
  availableStockInHub,
  hasSufficientStockForRequest,
  calculatedCBM,
  getBranchName,
  handleDispatchActiveRequest,
} = useWarehouseTransfer(props, emit)
</script>

<template>
  <BaseModal
    :show="show"
    title="Hub-to-Hub Freight & Request Orders"
    eyebrow="Multi-Branch Relocation Engine"
    max-width="660px"
    @close="emit('close')"
  >
    <!-- Modal Navigation Pill Tabs (Streamlined to 2 Logistics Operations) -->
    <div class="transfer-tabs-bar">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'queue' }"
        @click="setActiveTab('queue')"
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
        :class="{ active: activeTab === 'transit' }"
        @click="setActiveTab('transit')"
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
        <p>
          All storefront order transfers have been fulfilled. Switch operating hubs above to view
          other queues.
        </p>
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
              <span class="m-sub">
                ({{ activeRequest.totalUnits }} {{ activeRequestVariant.uom?.level1?.unit }})
              </span>
            </div>
            <div class="metric-box">
              <span class="m-label">Hub Available Stock</span>
              <span class="m-val" :class="{ 'text-danger': !hasSufficientStockForRequest }">
                {{ availableStockInHub }} {{ activeRequestVariant.uom?.level1?.unit }}
              </span>
              <span class="m-sub">
                {{ hasSufficientStockForRequest ? 'Sufficient balance' : 'Shortage in hub' }}
              </span>
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
              <span>
                Cannot dispatch. Hub needs {{ activeRequest.totalUnits }}, but only
                {{ availableStockInHub }} available.
              </span>
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

    <!-- TAB 2: IN TRANSIT / ON THE ROAD -->
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

.btn-fulfill-submit {
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

.btn-fulfill-submit:hover:not(:disabled) {
  background-color: #27272a;
}

.btn-fulfill-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
