<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'
import { usePageEntrance, animateTableTransition } from '@/animations/usePageEntrance'
import { useTypewriter } from '@/animations/useTypewriter'
import { WAREHOUSE_UI } from './warehouseConfig'
import WarehouseIntakeModal from './warehouseLogic/WarehouseIntakeModal.vue'
import WarehouseDispatchModal from './warehouseLogic/WarehouseDispatchModal.vue'
import WarehouseTransferModal from './warehouseLogic/WarehouseTransferModal.vue'
import IosSelect from '@/components/ui/IosSelect.vue'

import {
  ArrowLeft,
  Search,
  X,
  Boxes,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRightLeft,
  Cpu,
  Box,
  Truck,
  CheckCircle2,
  Store,
  Warehouse,
} from 'lucide-vue-next'

const router = useRouter()
const store = useInventoryStore()

// Modal Visibility Controls
const showIntakeModal = ref(false)
const showTransferModal = ref(false)
const showDispatchModal = ref(false)

// 1. Universal Entrance Physics
usePageEntrance()

// 2. Typewriter Header Title
const { displayedText: pageTitle, isComplete: isTypingDone } = useTypewriter(
  WAREHOUSE_UI.header.title,
  { speed: 26, delay: 320 },
)

// Active branch warehouse selection ('all' or specific branch ID)
const selectedBranchId = ref(store.branches[0]?.id || 'b-commissary')

const searchQuery = ref('')
const selectedZone = ref('all')
const statusFilter = ref('all')
const successBanner = ref('')

// 3. Trigger Spring Cascade on Status Filter, Zone, and Branch Switches
watch([statusFilter, selectedZone, selectedBranchId], async () => {
  await nextTick()
  animateTableTransition('.anim-row')
})

const currentBranch = computed(() => {
  return store.branches.find((b) => b.id === selectedBranchId.value)
})

// Normalized Branch Options for IosSelect from config
const branchOptions = computed(() => [
  ...store.branches.map((b) => ({
    value: b.id,
    label: `${b.name} ${WAREHOUSE_UI.overview.warehouseSuffix}`,
  })),
  {
    value: 'all',
    label: WAREHOUSE_UI.overview.allWarehousesLabel,
  },
])

function goToStorefront() {
  router.push('/inventory')
}

function resetFilters() {
  searchQuery.value = ''
  selectedZone.value = 'all'
  statusFilter.value = 'all'
}

// Resilient variant source
const rawVariants = computed(() => {
  if (store.flatVariants && store.flatVariants.length) {
    return store.flatVariants
  }
  return (store.catalog || []).flatMap((parent) =>
    (parent.variants || []).map((v) => ({
      ...v,
      parentName: parent.parentName,
      brand: parent.brand,
      category: parent.category,
      isPerishable: parent.isPerishable,
      supplierItemNo: v.supplierItemNo || parent.supplier || '',
      fullName: `${parent.brand} ${parent.parentName} · ${v.flavor || v.color || v.sizeCapacity || v.sku}`,
    })),
  )
})

// Compute warehouse inventory for the selected branch
const warehouseInventory = computed(() => {
  const branchStocks = store.branchStocks || {}

  return rawVariants.value.map((item, index) => {
    const totalUnits =
      selectedBranchId.value === 'all'
        ? Object.values(branchStocks).reduce((sum, branch) => sum + (branch?.[item.id] || 0), 0)
        : branchStocks[selectedBranchId.value]?.[item.id] || 0

    const boxMultiplier = item.uom?.level2?.multiplier || 1
    const palletMultiplier = item.uom?.level3?.multiplier || 1

    const boxes = Math.floor(totalUnits / boxMultiplier)
    const pallets = (totalUnits / (boxMultiplier * palletMultiplier)).toFixed(1)

    const cbmPerBox = store.calculateCBM ? store.calculateCBM(item.dimensions || {}) : 0.05
    const occupiedCBM = (boxes * cbmPerBox).toFixed(2)

    const isCold = !!item.isPerishable
    const zoneType = isCold ? 'cold' : 'dry'
    const bayId = isCold ? `BAY-C0${(index % 4) + 1}` : `RACK-D0${(index % 6) + 1}`
    const lotNumber = `LOT-${2026}${String(index + 101).padStart(4, '0')}`

    return {
      ...item,
      totalUnits,
      boxes,
      pallets,
      cbmPerBox,
      occupiedCBM,
      zoneType,
      bayId,
      lotNumber,
    }
  })
})

// Filtered Warehouse Items
const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()

  return warehouseInventory.value.filter((item) => {
    if (selectedZone.value !== 'all' && item.zoneType !== selectedZone.value) {
      return false
    }

    if (statusFilter.value === 'depleted' && item.totalUnits > 0) return false
    if (statusFilter.value === 'low' && (item.totalUnits <= 0 || item.totalUnits > 15)) return false
    if (statusFilter.value === 'nominal' && item.totalUnits <= 15) return false

    if (!q) return true
    return (
      (item.fullName || '').toLowerCase().includes(q) ||
      (item.sku || '').toLowerCase().includes(q) ||
      (item.lotNumber || '').toLowerCase().includes(q) ||
      (item.bayId || '').toLowerCase().includes(q) ||
      (item.brand || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    )
  })
})

// Branch Warehouse KPIs
const totalPallets = computed(() => {
  return warehouseInventory.value
    .reduce((sum, item) => sum + Number(item.pallets || 0), 0)
    .toFixed(1)
})

const totalBoxes = computed(() => {
  return warehouseInventory.value.reduce((sum, item) => sum + (item.boxes || 0), 0)
})

const totalCBM = computed(() => {
  return warehouseInventory.value
    .reduce((sum, item) => sum + Number(item.occupiedCBM || 0), 0)
    .toFixed(1)
})

const depletedCount = computed(() => {
  return warehouseInventory.value.filter((i) => i.totalUnits === 0).length
})

// Intake Event Handler
function onIntakeConfirm({ branchId, variant, qty, tier, bay, lot, expiry, poCode, totalUnits }) {
  const targetBranchId =
    branchId || (selectedBranchId.value === 'all' ? 'b-commissary' : selectedBranchId.value)
  const branchName = store.branches.find((b) => b.id === targetBranchId)?.name || 'Warehouse'
  const poNote = `[${bay} | ${lot}] ${poCode || 'Pallet Dock Delivery'}`

  store.receiveStock({
    branchId: targetBranchId,
    variantId: variant.id,
    inputQty: qty,
    uomTier: tier,
    supplierNote: poNote,
    batchExpiry: expiry,
  })

  const tierLabel = tier === 'level3' ? 'pallets' : 'boxes'
  const unit = variant.uom?.level1?.unit || 'units'
  successBanner.value = WAREHOUSE_UI.banners.intake(
    qty,
    tierLabel,
    variant.fullName,
    totalUnits,
    unit,
    branchName,
    bay,
  )
  showIntakeModal.value = false

  setTimeout(() => {
    successBanner.value = ''
  }, 4500)
}

// Inter-Warehouse Transfer Event Handler
function onTransferConfirm({ fromWarehouseId, toWarehouseId, variant, totalUnits, manifestNo }) {
  if (!store.branchStocks[fromWarehouseId]) store.branchStocks[fromWarehouseId] = {}
  if (!store.branchStocks[toWarehouseId]) store.branchStocks[toWarehouseId] = {}

  store.branchStocks[fromWarehouseId][variant.id] = Math.max(
    0,
    (store.branchStocks[fromWarehouseId][variant.id] || 0) - totalUnits,
  )
  store.branchStocks[toWarehouseId][variant.id] =
    (store.branchStocks[toWarehouseId][variant.id] || 0) + totalUnits

  const fromName = store.branches.find((b) => b.id === fromWarehouseId)?.name || fromWarehouseId
  const toName = store.branches.find((b) => b.id === toWarehouseId)?.name || toWarehouseId
  const unit = variant.uom?.level1?.unit || 'units'

  successBanner.value = WAREHOUSE_UI.banners.transfer(
    totalUnits,
    unit,
    variant.fullName,
    fromName,
    toName,
    manifestNo,
  )
  showTransferModal.value = false

  setTimeout(() => {
    successBanner.value = ''
  }, 4500)
}

// Dispatch to Branch Event Handler
function onDispatchConfirm({
  fromBranchId,
  toBranchId,
  variant,
  qty,
  tier,
  totalUnits,
  manifestNo,
}) {
  const originName = store.branches.find((b) => b.id === fromBranchId)?.name || fromBranchId
  const destName = store.branches.find((b) => b.id === toBranchId)?.name || toBranchId

  if (store.dispatchStock) {
    store.dispatchStock({
      fromBranchId,
      toBranchId,
      variantId: variant.id,
      totalUnits,
      manifestNo,
    })
  } else {
    if (!store.branchStocks[fromBranchId]) store.branchStocks[fromBranchId] = {}
    if (!store.branchStocks[toBranchId]) store.branchStocks[toBranchId] = {}

    const originStock = store.branchStocks[fromBranchId][variant.id] || 0
    store.branchStocks[fromBranchId][variant.id] = Math.max(0, originStock - totalUnits)

    const destStock = store.branchStocks[toBranchId][variant.id] || 0
    store.branchStocks[toBranchId][variant.id] = destStock + totalUnits
  }

  const tierLabel = tier === 'level3' ? 'pallets' : 'boxes'
  const unit = variant.uom?.level1?.unit || 'units'
  successBanner.value = WAREHOUSE_UI.banners.dispatch(
    qty,
    tierLabel,
    totalUnits,
    unit,
    variant.fullName,
    originName,
    destName,
    manifestNo,
  )
  showDispatchModal.value = false

  setTimeout(() => {
    successBanner.value = ''
  }, 4500)
}
</script>

<template>
  <div class="screen-wrapper">
    <div class="minimal-shell">
      <!-- 1. Top Navigation Bar -->
      <header class="top-nav anim-top">
        <div class="nav-brand">
          <div class="header-eyebrow-row">
            <button type="button" class="back-btn" @click="goToStorefront">
              <ArrowLeft :size="13" stroke-width="2.5" />
              <span class="back-text-desktop">{{ WAREHOUSE_UI.header.backButton }}</span>
              <span class="back-text-mobile">{{ WAREHOUSE_UI.header.backButtonMobile }}</span>
            </button>

            <!-- Mode Switcher Pill -->
            <div class="view-mode-pill">
              <button type="button" class="mode-pill-btn" @click="goToStorefront">
                <Store :size="13" />
                <span>{{ WAREHOUSE_UI.header.modeStorefront }}</span>
              </button>
              <button type="button" class="mode-pill-btn active">
                <Warehouse :size="13" />
                <span>{{ WAREHOUSE_UI.header.modeWarehouse }}</span>
              </button>
            </div>
          </div>

          <h1 class="page-title">
            <span class="ghost-reserve" aria-hidden="true">{{ WAREHOUSE_UI.header.title }}.</span>
            <span class="typing-active">
              {{ pageTitle }}
              <span v-if="!isTypingDone" class="typewriter-cursor" aria-hidden="true">|</span>
              <span v-else class="morph-period" aria-hidden="true">
                <span class="dot-shape"></span>
                <span class="heart-shape">♥</span>
              </span>
            </span>
          </h1>

          <p class="page-subtitle">
            <span v-if="selectedBranchId !== 'all'">{{ currentBranch?.name }} {{ WAREHOUSE_UI.overview.warehouseSuffix }}</span>
            <span v-else>{{ WAREHOUSE_UI.header.subtitleAll }}</span>
            · {{ WAREHOUSE_UI.header.subtitleSuffix }}
          </p>
        </div>

        <!-- Action Controls: 3 Workflows -->
        <div class="nav-controls">
          <!-- 1. Dock Inbound Freight -->
          <button type="button" class="btn btn-action-primary" @click="showIntakeModal = true">
            <Truck :size="14" stroke-width="2.2" />
            <span class="btn-label">{{ WAREHOUSE_UI.header.dockButton }}</span>
          </button>

          <!-- 2. Inter-Warehouse Transfer -->
          <button type="button" class="btn btn-secondary" @click="showTransferModal = true">
            <Warehouse :size="14" stroke-width="2.2" />
            <span class="btn-label">{{ WAREHOUSE_UI.header.transferButton }}</span>
          </button>

          <!-- 3. Dispatch to Store Branch -->
          <button type="button" class="btn btn-secondary" @click="showDispatchModal = true">
            <ArrowRightLeft :size="14" stroke-width="2.2" />
            <span class="btn-label">{{ WAREHOUSE_UI.header.dispatchButton }}</span>
          </button>
        </div>
      </header>

      <!-- Feedback Alert -->
      <transition name="fade-alert">
        <div v-if="successBanner" class="alert alert-success">
          <CheckCircle2 :size="16" />
          <span>{{ successBanner }}</span>
        </div>
      </transition>

      <!-- 2. Overview Bar -->
      <section class="overview-bar anim-stagger">
        <div class="overview-controls-cluster">
          <!-- Branch Selector -->
          <div class="selector-field branch-selector-field">
            <span class="selector-tag">{{ WAREHOUSE_UI.overview.branchLabel }}</span>
            <div class="branch-ios-select-wrap">
              <IosSelect
                v-model="selectedBranchId"
                :options="branchOptions"
                :title="WAREHOUSE_UI.overview.branchSelectTitle"
                :placeholder="WAREHOUSE_UI.overview.branchSelectPlaceholder"
              />
            </div>
          </div>

          <!-- Storage Zone -->
          <div class="selector-field">
            <span class="selector-tag">{{ WAREHOUSE_UI.overview.zoneLabel }}</span>
            <div class="segmented-control zone-segmented">
              <button
                v-for="zone in WAREHOUSE_UI.zones"
                :key="zone.key"
                type="button"
                class="segment-btn"
                :class="{ active: selectedZone === zone.key }"
                @click="selectedZone = zone.key"
              >
                {{ zone.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Branch-Scoped KPIs -->
        <div class="kpi-group">
          <div class="kpi-item">
            <span class="kpi-label">{{ WAREHOUSE_UI.kpis.pallets }}</span>
            <span class="kpi-num emphasized">{{ totalPallets }} {{ WAREHOUSE_UI.kpiUnits.pallets }}</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">{{ WAREHOUSE_UI.kpis.cartons }}</span>
            <span class="kpi-num">{{ totalBoxes }} {{ WAREHOUSE_UI.kpiUnits.cartons }}</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">{{ WAREHOUSE_UI.kpis.volume }}</span>
            <span class="kpi-num">{{ totalCBM }} {{ WAREHOUSE_UI.kpiUnits.volume }}</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">{{ WAREHOUSE_UI.kpis.depleted }}</span>
            <span class="kpi-num" :class="{ 'text-danger': depletedCount > 0 }">
              {{ depletedCount }}
            </span>
          </div>
        </div>
      </section>

      <!-- 3. Search & Status Filter Bar -->
      <section class="filter-bar anim-stagger">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="WAREHOUSE_UI.searchPlaceholder"
            class="minimal-input"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="clear-btn"
            aria-label="Clear search"
            @click="searchQuery = ''"
          >
            <X :size="14" />
          </button>
        </div>

        <!-- Status Filter Segmented Control -->
        <div class="segmented-control status-segmented">
          <button
            v-for="status in WAREHOUSE_UI.statusFilters"
            :key="status.key"
            type="button"
            class="segment-btn"
            :class="{ active: statusFilter === status.key }"
            @click="statusFilter = status.key"
          >
            {{ status.label }}
          </button>
        </div>
      </section>

      <!-- 4. Scrollable Ledger Table -->
      <div class="scrollable-warehouse-viewport">
        <main class="ledger-container anim-card">
          <div class="table-container">
            <table class="minimal-table">
              <thead>
                <tr>
                  <th
                    v-for="header in WAREHOUSE_UI.tableHeaders"
                    :key="header.key"
                    :style="{ width: header.width }"
                  >
                    {{ header.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredItems" :key="item.id" class="anim-row">
                  <td :data-label="WAREHOUSE_UI.tableHeaders[0].label" class="td-bay">
                    <div>
                      <div class="bay-badge" :class="`bay-${item.zoneType}`">
                        <MapPin :size="11" />
                        <span>{{ item.bayId }}</span>
                      </div>
                      <div class="lot-sub font-mono">{{ item.lotNumber }}</div>
                    </div>
                  </td>

                  <td :data-label="WAREHOUSE_UI.tableHeaders[1].label" class="td-sku">
                    <div>
                      <div class="sku-cell">{{ item.sku }}</div>
                      <div class="ref-sub">{{ item.supplierItemNo || 'N/A' }}</div>
                    </div>
                  </td>

                  <td :data-label="WAREHOUSE_UI.tableHeaders[2].label" class="td-specs">
                    <div>
                      <div class="title-cell">{{ item.fullName }}</div>
                      <div class="desc-sub">
                        <span v-if="item.brand">{{ item.brand }} · </span>
                        <span>{{ item.category }}</span>
                        <span v-if="item.sizeCapacity"> · {{ item.sizeCapacity }}</span>
                      </div>
                      <div class="tag-row mt-1">
                        <span v-if="item.isPerishable" class="tag tag-muted">
                          <Clock :size="10" />
                          {{ WAREHOUSE_UI.tags.coldChain }}
                        </span>
                        <span v-else class="tag tag-muted">
                          <ShieldCheck :size="10" />
                          {{ WAREHOUSE_UI.tags.dryAmbient }}
                        </span>
                        <span v-if="item.machineSpecs" class="tag tag-muted">
                          <Cpu :size="10" />
                          {{ item.machineSpecs }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td :data-label="WAREHOUSE_UI.tableHeaders[3].label" class="td-cbm">
                    <div>
                      <div class="cbm-cell">{{ item.occupiedCBM }} {{ WAREHOUSE_UI.kpiUnits.volume }}</div>
                      <div class="ref-sub">
                        {{ item.cbmPerBox }} {{ WAREHOUSE_UI.kpiUnits.volume }}/box · {{ item.dimensions?.weightKg || 0 }}kg
                      </div>
                    </div>
                  </td>

                  <td :data-label="WAREHOUSE_UI.tableHeaders[4].label" class="td-matrix">
                    <div>
                      <div class="uom-row">
                        <span class="lvl">L3</span> 1 Plt =
                        {{ item.uom?.level3?.multiplier || 1 }} Bx
                      </div>
                      <div class="uom-row">
                        <span class="lvl">L2</span> 1 Bx = {{ item.uom?.level2?.multiplier || 1 }}
                        {{ item.uom?.level1?.unit }}
                      </div>
                      <div v-if="item.uom?.bundle?.enabled" class="bundle-note">
                        <Box :size="10" />
                        <span>{{ item.uom.bundle.label }} ({{ item.uom.bundle.qtyOfLvl1 }})</span>
                      </div>
                    </div>
                  </td>

                  <td :data-label="WAREHOUSE_UI.tableHeaders[5].label" class="td-stock">
                    <div>
                      <div class="stock-primary font-mono">{{ item.pallets }} {{ WAREHOUSE_UI.kpiUnits.pallets }}</div>
                      <div class="ref-sub">
                        ~{{ item.boxes }} boxes · {{ item.totalUnits }} {{ item.uom?.level1?.unit }}
                      </div>
                    </div>
                  </td>

                  <td :data-label="WAREHOUSE_UI.tableHeaders[6].label" class="td-status">
                    <div>
                      <span v-if="item.totalUnits === 0" class="status-indicator status-depleted">
                        {{ WAREHOUSE_UI.statusLabels.depleted }}
                      </span>
                      <span
                        v-else-if="item.totalUnits <= 15"
                        class="status-indicator status-warning"
                      >
                        {{ WAREHOUSE_UI.statusLabels.low }}
                      </span>
                      <span v-else class="status-indicator status-nominal">
                        {{ WAREHOUSE_UI.statusLabels.nominal }}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="filteredItems.length === 0" class="empty-state">
            <Boxes :size="32" class="empty-icon" stroke-width="1.5" />
            <p>{{ WAREHOUSE_UI.emptyState.text }}</p>
            <button class="btn btn-secondary" @click="resetFilters">
              {{ WAREHOUSE_UI.emptyState.resetButton }}
            </button>
          </div>
        </main>
      </div>
    </div>

    <!-- Modals -->
    <WarehouseIntakeModal
      :show="showIntakeModal"
      :variants="rawVariants"
      :branches="store.branches"
      :initial-branch-id="selectedBranchId !== 'all' ? selectedBranchId : store.branches[0]?.id"
      @close="showIntakeModal = false"
      @confirm="onIntakeConfirm"
    />

    <WarehouseTransferModal
      :show="showTransferModal"
      :variants="rawVariants"
      :branches="store.branches"
      :current-branch-id="selectedBranchId !== 'all' ? selectedBranchId : store.branches[0]?.id"
      @close="showTransferModal = false"
      @confirm="onTransferConfirm"
    />

    <WarehouseDispatchModal
      :show="showDispatchModal"
      :variants="rawVariants"
      :branches="store.branches"
      :current-branch-id="selectedBranchId !== 'all' ? selectedBranchId : store.branches[0]?.id"
      @close="showDispatchModal = false"
      @confirm="onDispatchConfirm"
    />
  </div>
</template>

<style scoped src="./WarehouseView.css"></style>