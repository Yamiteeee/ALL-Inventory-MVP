<script setup>
import BaseModal from '@/components/ui/BaseModal.vue'
import IosSelect from '@/components/ui/IosSelect.vue'
import { useWarehouseIntake } from '@/composables/warehouse/useWarehouseIntake'
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

const {
  store,
  activeMode,
  setActiveMode,
  intakeBranchId,
  intakeVariantId,
  intakeTier,
  intakeQty,
  intakeBay,
  intakeLot,
  intakeExpiry,
  intakePoCode,
  intakeFeedback,
  activeVariant,
  branchOptions,
  variantOptions,
  tierOptions,
  calculatedUnits,
  calculatedBoxes,
  calculatedCBM,
  incomingTransfersForBranch,
  inTransitCount,
  getBranchName,
  handleSupplierSubmit,
  handleAcceptDelivery,
} = useWarehouseIntake(props, emit)
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
        @click="setActiveMode('supplier')"
      >
        <PackagePlus :size="14" stroke-width="2.2" />
        <span>Supplier PO Dock</span>
      </button>

      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeMode === 'incoming' }"
        @click="setActiveMode('incoming')"
      >
        <Truck :size="14" stroke-width="2.2" />
        <span>Incoming Deliveries</span>
        <span v-if="inTransitCount > 0" class="badge-count-blue">{{ inTransitCount }}</span>
      </button>
    </div>

    <!-- Active Receiving Branch Context -->
    <div class="branch-context-strip">
      <div class="context-label">
        <Store :size="13" stroke-width="2.2" />
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
      <CheckCircle2 :size="15" stroke-width="2.2" />
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
            <span v-if="activeVariant.category" class="preview-tag">
              {{ activeVariant.category }}
            </span>
            <span v-if="activeVariant.sizeCapacity" class="preview-tag">
              {{ activeVariant.sizeCapacity }}
            </span>
            <span v-if="activeVariant.isPerishable" class="preview-tag tag-perishable">
              <Clock :size="10" stroke-width="2.2" />
              <span>Perishable ({{ activeVariant.shelfLifeDays }}d)</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Tier & Quantity -->
      <div class="form-grid-2">
        <div class="input-group">
          <label class="label-with-icon">
            <Layers :size="12" stroke-width="2.2" />
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
            <MapPin :size="12" stroke-width="2.2" />
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
            <FileText :size="12" stroke-width="2.2" />
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
            <Calendar :size="12" stroke-width="2.2" />
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
            <FileText :size="12" stroke-width="2.2" />
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
          <span class="metric-val text-credit font-mono">
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
        <PackagePlus :size="16" stroke-width="2.2" />
        <span>Confirm & Receive Freight into Inventory</span>
      </button>
    </form>

    <!-- 2. INCOMING BRANCH DELIVERIES & TRANSFERS -->
    <div v-else-if="activeMode === 'incoming'" class="deliveries-pane">
      <div v-if="incomingTransfersForBranch.length === 0" class="empty-state-box">
        <Truck :size="32" stroke-width="1.8" class="empty-icon" />
        <h4>No Incoming Shipments</h4>
        <p>
          Transfers dispatched by the central commissary or neighboring hubs en route to this
          storefront will appear here to inspect and accept.
        </p>
      </div>

      <div v-else class="deliveries-list">
        <article
          v-for="item in incomingTransfersForBranch"
          :key="item.id"
          class="delivery-card"
          :class="{
            'card-in-transit': item.status === 'in_transit',
            'card-received': item.status === 'completed',
          }"
        >
          <!-- Card Header: Manifest & Professional Status Badge -->
          <div class="delivery-header">
            <div class="d-manifest-group">
              <span class="d-label">Manifest</span>
              <span class="d-manifest font-mono">{{ item.manifestNo || item.id }}</span>
            </div>

            <span v-if="item.status === 'in_transit'" class="badge-status-transit">
              <Truck :size="12" stroke-width="2.2" />
              <span>In Transit</span>
            </span>
            <span v-else class="badge-status-completed">
              <CheckCircle2 :size="12" stroke-width="2.2" />
              <span>Received & Stocked</span>
            </span>
          </div>

          <!-- Card Body: Route, Cargo Details, Driver Note, POS Hold Alert -->
          <div class="delivery-body">
            <div class="d-route">
              <span class="route-hub">{{ getBranchName(item.fulfillingBranchId) }}</span>
              <ArrowRightLeft :size="12" stroke-width="2.2" class="route-arrow" />
              <span class="route-dest">{{ getBranchName(item.requestingBranchId) }}</span>
            </div>

            <div class="d-product">
              <div class="d-product-title">
                {{ store.flatVariants.find((v) => v.id === item.variantId)?.fullName }}
              </div>
              <div class="d-qty-note">
                Payload: <strong>{{ item.qty }} {{ item.tier }}</strong>
                <span class="d-units-sub font-mono">(+{{ item.totalUnits }} units)</span>
              </div>
            </div>

            <div v-if="item.courierNotes" class="d-driver">
              <FileText :size="11" stroke-width="2.2" />
              <span>Logistics Note: {{ item.courierNotes }}</span>
            </div>

            <div v-if="item.holdSale" class="d-hold-alert">
              <Clock :size="12" stroke-width="2.2" />
              <span>Linked POS customer sale is on hold pending this delivery</span>
            </div>
          </div>

          <!-- Card Footer Action -->
          <div class="delivery-actions">
            <button
              v-if="item.status === 'in_transit'"
              type="button"
              class="btn-accept-delivery"
              @click="handleAcceptDelivery(item.id)"
            >
              <CheckCircle2 :size="14" stroke-width="2.2" />
              <span>Accept & Verify Inbound Stock (+{{ item.totalUnits }} units)</span>
            </button>

            <div v-else class="received-stamp">
              <ShieldCheck :size="14" stroke-width="2.2" />
              <span
                >Received at {{ item.receivedAt || 'Today' }} · Stock Credited to Storefront</span
              >
            </div>
          </div>
        </article>
      </div>
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
  gap: 0.4rem;
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
  padding: 3rem 1.5rem;
  background: #fafafa;
  border: 1.5px dashed #e4e4e7;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
}

.empty-icon {
  color: #a1a1aa;
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
  max-height: 440px;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.delivery-card {
  border: 1px solid #e4e4e7;
  background: #ffffff;
  border-radius: 16px;
  padding: 0.95rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.card-in-transit {
  border-color: #bfdbfe;
  background: #fafcff;
}

.card-in-transit:hover {
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.06);
}

.card-received {
  border-color: #bbf7d0;
  background: #fdfdfd;
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.d-manifest-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.d-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #71717a;
}

.d-manifest {
  font-size: 0.82rem;
  font-weight: 700;
  color: #18181b;
}

.badge-status-transit {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 0.18rem 0.55rem;
  border-radius: 9999px;
}

.badge-status-completed {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #15803d;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.18rem 0.55rem;
  border-radius: 9999px;
}

.delivery-body {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.d-route {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #f4f4f5;
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
  width: fit-content;
  font-size: 0.74rem;
}

.route-hub {
  font-weight: 700;
  color: #18181b;
}

.route-arrow {
  color: #71717a;
}

.route-dest {
  color: #52525b;
}

.d-product {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.d-product-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #18181b;
}

.d-qty-note {
  font-size: 0.76rem;
  color: #52525b;
}

.d-units-sub {
  color: #16a34a;
  font-weight: 700;
  margin-left: 0.25rem;
}

.d-driver {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: #71717a;
  background: #fafafa;
  border: 1px solid #e4e4e7;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  width: fit-content;
}

.d-hold-alert {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
  width: fit-content;
}

.delivery-actions {
  margin-top: 0.2rem;
}

.btn-accept-delivery {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
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
