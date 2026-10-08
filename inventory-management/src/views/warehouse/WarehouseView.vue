<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'
import { usePageEntrance } from '@/animations/usePageEntrance'
import { useTypewriter } from '@/animations/useTypewriter'
import { WAREHOUSE_UI } from './warehouseConfig'
import WarehouseIntakeModal from './WarehouseIntakeModal.vue'
import WarehouseDispatchModal from './WarehouseDispatchModal.vue'

import {
  ArrowLeft,
  Search,
  X,
  Boxes,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRightLeft,
  LogOut,
  Cpu,
  Box,
  Truck,
  CheckCircle2,
  Store,
  Warehouse,
} from 'lucide-vue-next'

const router = useRouter()
const store = useInventoryStore()

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

// Modal Visibility Controls
const showIntakeModal = ref(false)
const showDispatchModal = ref(false)

const currentBranch = computed(() => {
  return store.branches.find((b) => b.id === selectedBranchId.value)
})

function goToStorefront() {
  router.push('/inventory')
}

function logout() {
  localStorage.clear()
  router.push('/login')
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

// Intake Event Handler - credits the chosen branch warehouse
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

  successBanner.value = `Docked ${qty} ${tier === 'level3' ? 'pallets' : 'boxes'} of ${variant.fullName} (+${totalUnits} ${variant.uom?.level1?.unit}) into ${branchName} (${bay})!`
  showIntakeModal.value = false

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

    // Deduct from origin warehouse
    const originStock = store.branchStocks[fromBranchId][variant.id] || 0
    store.branchStocks[fromBranchId][variant.id] = Math.max(0, originStock - totalUnits)

    // Credit to destination branch store
    const destStock = store.branchStocks[toBranchId][variant.id] || 0
    store.branchStocks[toBranchId][variant.id] = destStock + totalUnits
  }

  successBanner.value = `Dispatched ${qty} ${tier === 'level3' ? 'pallets' : 'boxes'} (${totalUnits} ${variant.uom?.level1?.unit}) from ${originName} → ${destName}! [${manifestNo}]`
  showDispatchModal.value = false

  setTimeout(() => {
    successBanner.value = ''
  }, 4500)
}
</script>

<template>
  <div class="screen-wrapper">
    <div class="minimal-shell">
      <!-- 1. Top Navigation Bar with View Switcher Pill -->
      <header class="top-nav anim-top">
        <div class="nav-brand">
          <div class="header-eyebrow-row">
            <button type="button" class="back-btn" @click="goToStorefront">
              <ArrowLeft :size="13" stroke-width="2.5" />
              <span>{{ WAREHOUSE_UI.header.backButton }}</span>
            </button>

            <!-- Mode Switcher Pill -->
            <div class="view-mode-pill">
              <button type="button" class="mode-pill-btn" @click="goToStorefront">
                <Store :size="13" />
                <span>Storefront</span>
              </button>
              <button type="button" class="mode-pill-btn active">
                <Warehouse :size="13" />
                <span>Warehouse Hub</span>
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
            <span v-if="selectedBranchId !== 'all'">{{ currentBranch?.name }} Warehouse</span>
            <span v-else>All Branch Warehouses (Consolidated)</span>
            · Inbound Lots, Pallet Multipliers & Cubic Volume Allocations
          </p>
        </div>

        <div class="nav-controls">
          <!-- Dock Inbound Freight Modal Trigger -->
          <button type="button" class="btn btn-action-primary" @click="showIntakeModal = true">
            <Truck :size="15" stroke-width="2.2" />
            <span class="btn-label">{{ WAREHOUSE_UI.header.dockButton }}</span>
          </button>

          <!-- Branch Dispatch Modal Trigger -->
          <button type="button" class="btn btn-secondary" @click="showDispatchModal = true">
            <ArrowRightLeft :size="15" stroke-width="2.2" />
            <span class="btn-label">{{
              WAREHOUSE_UI.header.dispatchButton || 'Dispatch to Branch'
            }}</span>
          </button>

          <button class="btn btn-icon" title="Sign Out" aria-label="Sign Out" @click="logout">
            <LogOut :size="15" stroke-width="2.2" />
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
          <div class="selector-field">
            <span class="selector-tag">Branch</span>
            <div class="select-wrapper">
              <select v-model="selectedBranchId" class="minimal-select">
                <option v-for="b in store.branches" :key="b.id" :value="b.id">
                  {{ b.name }}
                </option>
                <option value="all">All Warehouses (Combined)</option>
              </select>
            </div>
          </div>

          <!-- Storage Zone -->
          <div class="selector-field">
            <span class="selector-tag">Zone</span>
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
            <span class="kpi-num emphasized">{{ totalPallets }} plt</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">{{ WAREHOUSE_UI.kpis.cartons }}</span>
            <span class="kpi-num">{{ totalBoxes }} bx</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">{{ WAREHOUSE_UI.kpis.volume }}</span>
            <span class="kpi-num">{{ totalCBM }} m³</span>
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

      <!-- 3. Search & Filter Bar -->
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

      <!-- 4. Scrollable Warehouse Item Ledger Table -->
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
                <tr v-for="item in filteredItems" :key="item.id">
                  <td data-label="Bay & Lot" class="td-bay">
                    <div>
                      <div class="bay-badge" :class="`bay-${item.zoneType}`">
                        <MapPin :size="11" />
                        <span>{{ item.bayId }}</span>
                      </div>
                      <div class="lot-sub font-mono">{{ item.lotNumber }}</div>
                    </div>
                  </td>

                  <td data-label="Master SKU" class="td-sku">
                    <div>
                      <div class="sku-cell">{{ item.sku }}</div>
                      <div class="ref-sub">{{ item.supplierItemNo || 'N/A' }}</div>
                    </div>
                  </td>

                  <td data-label="Product Specs" class="td-specs">
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
                          Cold Chain
                        </span>
                        <span v-else class="tag tag-muted">
                          <ShieldCheck :size="10" />
                          Dry Ambient
                        </span>
                        <span v-if="item.machineSpecs" class="tag tag-muted">
                          <Cpu :size="10" />
                          {{ item.machineSpecs }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td data-label="Occupancy (m³)" class="td-cbm">
                    <div>
                      <div class="cbm-cell">{{ item.occupiedCBM }} m³</div>
                      <div class="ref-sub">
                        {{ item.cbmPerBox }} m³/box · {{ item.dimensions?.weightKg || 0 }}kg
                      </div>
                    </div>
                  </td>

                  <td data-label="Matrix Breakdown" class="td-matrix">
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

                  <td data-label="Bulk Balance" class="td-stock">
                    <div>
                      <div class="stock-primary font-mono">{{ item.pallets }} plt</div>
                      <div class="ref-sub">
                        ~{{ item.boxes }} boxes · {{ item.totalUnits }} {{ item.uom?.level1?.unit }}
                      </div>
                    </div>
                  </td>

                  <td data-label="Status" class="td-status">
                    <div>
                      <span v-if="item.totalUnits === 0" class="status-indicator status-depleted">
                        Depleted
                      </span>
                      <span
                        v-else-if="item.totalUnits <= 15"
                        class="status-indicator status-warning"
                      >
                        Low Stock
                      </span>
                      <span v-else class="status-indicator status-nominal">Nominal</span>
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

    <!-- 1. Decoupled Warehouse Inbound Intake Modal -->
    <WarehouseIntakeModal
      :show="showIntakeModal"
      :variants="rawVariants"
      :branches="store.branches"
      :initial-branch-id="selectedBranchId !== 'all' ? selectedBranchId : store.branches[0]?.id"
      @close="showIntakeModal = false"
      @confirm="onIntakeConfirm"
    />

    <!-- 2. Decoupled Warehouse Branch Dispatch Modal -->
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
