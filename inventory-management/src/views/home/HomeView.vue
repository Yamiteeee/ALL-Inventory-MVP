<script setup>
import { RouterLink } from 'vue-router'
import { CATALOG_UI } from './catalogConfig'
import { usePageEntrance } from '@/animations/usePageEntrance'
import { useTypewriter } from '@/animations/useTypewriter'
import { useDropdownAnimation } from '@/animations/useDropdownAnimation'
import IosSelect from '@/components/ui/IosSelect.vue'
import FloatingDemoHub from '@/components/ui/FloatingDemoHub.vue'
import WarehouseIntakeModal from './warehouseModals/WarehouseIntakeModal.vue'
import WarehouseTransferModal from './warehouseModals/WarehouseTransferModal.vue'
import WarehousePoHistoryModal from './warehouseModals/WarehousePoHistoryModal.vue'
import { useCatalog } from '@/composables/home/useCatalog'

import {
  Search,
  X,
  ChevronDown,
  LogOut,
  Box,
  Clock,
  ShieldCheck,
  Cpu,
  Warehouse,
  Truck,
  PackagePlus,
  CheckCircle2,
} from 'lucide-vue-next'

// UI Animations
usePageEntrance()
const { displayedText: pageTitle, isComplete: isTypingDone } = useTypewriter(
  CATALOG_UI.header.title,
  { speed: 28, delay: 350 },
)
const { dropdownTransition } = useDropdownAnimation()

// Isolated Catalog Business Logic
const {
  store,
  showIntakeModal,
  showTransferModal,
  showPoHistoryModal,
  successBanner,
  selectedBranchId,
  searchQuery,
  expandedParents,
  pendingTransfersCount,
  incomingDeliveriesCount,
  branchOptions,
  filteredCatalog,
  totalCatalogVariants,
  totalBranchUnits,
  onIntakeConfirm,
  onTransferConfirm,
  toggleParent,
  expandAll,
  collapseAll,
  colLabel,
  logout,
} = useCatalog()

// Seamlessly transition from PO History to the Intake Dock
function openIntakeFromHistory() {
  showPoHistoryModal.value = false
  showIntakeModal.value = true
}
</script>

<template>
  <div class="screen-wrapper">
    <div class="minimal-shell">
      <!-- 1. Top Navigation with Direct Logistics Actions -->
      <header class="top-nav anim-top">
        <div class="nav-brand">
          <div class="header-eyebrow-row">
            <span class="eyebrow">{{ CATALOG_UI.header.badge }}</span>
          </div>

          <h1 class="page-title">
            <span class="ghost-reserve" aria-hidden="true">{{ CATALOG_UI.header.title }}.</span>
            <span class="typing-active">
              {{ pageTitle }}
              <span v-if="!isTypingDone" class="typewriter-cursor" aria-hidden="true">|</span>
              <span v-else class="morph-period" aria-hidden="true">
                <span class="dot-shape"></span>
                <span class="heart-shape">♥</span>
              </span>
            </span>
          </h1>

          <p class="page-subtitle">{{ CATALOG_UI.header.subtitle }}</p>
        </div>

        <!-- Navigation Controls -->
        <div class="nav-controls">
          <!-- 1. Top Button opens the DEFAULT Intake Modal directly -->
          <button
            type="button"
            class="btn btn-action-primary"
            title="Receive Supplier PO & Accept Incoming Deliveries"
            @click="showIntakeModal = true"
          >
            <PackagePlus :size="14" stroke-width="2.2" />
            <span class="btn-label">{{ CATALOG_UI.header.receiveButton }}</span>
            <span v-if="incomingDeliveriesCount > 0" class="btn-nav-badge badge-blue">
              {{ incomingDeliveriesCount }}
            </span>
          </button>

          <!-- 2. Hub Transfer & Dispatch Queue -->
          <button
            type="button"
            class="btn btn-secondary"
            title="Inter-Warehouse Transfer & Dispatch Queue"
            @click="showTransferModal = true"
          >
            <Warehouse :size="14" stroke-width="2.2" />
            <span class="btn-label">{{ CATALOG_UI.header.transferButton }}</span>
            <span v-if="pendingTransfersCount > 0" class="btn-nav-badge badge-amber">
              {{ pendingTransfersCount }}
            </span>
          </button>

          <!-- 3. Goods Transport Ledger -->
          <RouterLink to="/transport" class="btn btn-secondary" title="Goods Transportation Ledger">
            <Truck :size="14" stroke-width="2.2" />
            <span class="btn-label">{{ CATALOG_UI.header.transportButton }}</span>
          </RouterLink>

          <!-- 4. Sign Out -->
          <button
            class="btn btn-secondary btn-signout"
            title="Sign Out"
            aria-label="Sign Out"
            @click="logout"
          >
            <LogOut :size="14" stroke-width="2.2" />
            <span class="btn-label signout-text">Sign Out</span>
          </button>
        </div>
      </header>

      <!-- Feedback Alert Banner -->
      <transition name="fade-alert">
        <div v-if="successBanner" class="alert alert-success">
          <CheckCircle2 :size="16" />
          <span>{{ successBanner }}</span>
        </div>
      </transition>

      <!-- 2. Overview Bar with IosSelect -->
      <section class="overview-bar anim-stagger flip-surface">
        <div class="selector-field branch-selector-field">
          <span class="selector-tag">Store Branch</span>
          <div class="branch-ios-select-wrap">
            <IosSelect
              v-model="selectedBranchId"
              :options="branchOptions"
              title="Select Store Branch"
              placeholder="Choose Branch"
            />
          </div>
        </div>

        <!-- Storefront KPIs -->
        <div class="kpi-group">
          <div class="kpi-item">
            <span class="kpi-label">{{ CATALOG_UI.kpiLabels.parents }}</span>
            <span class="kpi-num">{{ store.catalog.length }}</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">{{ CATALOG_UI.kpiLabels.variants }}</span>
            <span class="kpi-num">{{ totalCatalogVariants }}</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">{{ CATALOG_UI.kpiLabels.onHand }}</span>
            <span class="kpi-num emphasized">{{ totalBranchUnits }}</span>
          </div>
          <div class="kpi-divider"></div>

          <!-- Bottom KPI Bar Item: Click here to open the PO History Summary Modal -->
          <div
            class="kpi-item kpi-link"
            role="button"
            tabindex="0"
            title="View Inbound PO Receiving History"
            @click="showPoHistoryModal = true"
          >
            <span class="kpi-label">{{ CATALOG_UI.kpiLabels.poCount }}</span>
            <span class="kpi-num po-num">{{ store.stockInHistory?.length || 0 }}</span>
          </div>
        </div>
      </section>

      <!-- 3. Filter Bar -->
      <section class="filter-bar anim-stagger">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="CATALOG_UI.toolbar.searchPlaceholder"
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

        <div class="segmented-control">
          <button type="button" class="segment-btn" @click="expandAll">
            {{ CATALOG_UI.toolbar.expandAll }}
          </button>
          <button type="button" class="segment-btn" @click="collapseAll">
            {{ CATALOG_UI.toolbar.collapseAll }}
          </button>
        </div>
      </section>

      <!-- 4. Scrollable Catalog -->
      <div class="scrollable-catalog-viewport flip-surface">
        <main class="tree-container">
          <article
            v-for="parent in filteredCatalog"
            :key="parent.parentId"
            class="parent-node anim-stagger"
          >
            <!-- Parent Header -->
            <header
              class="node-header"
              role="button"
              tabindex="0"
              :aria-expanded="!!expandedParents[parent.parentId]"
              @click="toggleParent(parent.parentId)"
              @keydown.enter.prevent="toggleParent(parent.parentId)"
              @keydown.space.prevent="toggleParent(parent.parentId)"
            >
              <div class="node-lead">
                <div class="chevron-wrap">
                  <ChevronDown
                    :size="16"
                    stroke-width="2.5"
                    class="node-chevron"
                    :class="{ 'is-collapsed': !expandedParents[parent.parentId] }"
                  />
                </div>
                <div class="node-meta">
                  <span class="node-title">{{ parent.parentName }}</span>
                  <div class="tag-row">
                    <span class="tag tag-mono">{{ parent.brand }}</span>
                    <span class="tag">{{ parent.category }} · {{ parent.subCategory }}</span>
                    <span v-if="parent.isPerishable" class="tag tag-muted">
                      <Clock :size="11" />
                      Perishable
                    </span>
                    <span v-else class="tag tag-muted">
                      <ShieldCheck :size="11" />
                      Standard
                    </span>
                  </div>
                </div>
              </div>

              <div class="node-trail">
                <span class="vendor-label">
                  Vendor: <strong>{{ parent.supplier }}</strong>
                </span>
                <span class="unit-badge"> {{ parent.totalUnits }} units </span>
              </div>
            </header>

            <!-- Nested Variants Dropdown -->
            <Transition v-bind="dropdownTransition">
              <div v-show="expandedParents[parent.parentId]" class="node-body">
                <div class="table-container">
                  <table class="minimal-table">
                    <thead>
                      <tr>
                        <th
                          v-for="header in CATALOG_UI.tableHeaders"
                          :key="header.key"
                          :style="{ width: header.width }"
                        >
                          {{ header.label }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="variant in parent.variants" :key="variant.id">
                        <!-- SKU & Location -->
                        <td :data-label="colLabel(0)" class="td-sku">
                          <div>
                            <div class="sku-cell">{{ variant.sku }}</div>
                            <div class="ref-sub">{{ variant.supplierItemNo }}</div>
                          </div>
                        </td>

                        <!-- Specs -->
                        <td :data-label="colLabel(1)" class="td-specs">
                          <div>
                            <div class="title-cell">{{ variant.autoName }}</div>
                            <div class="desc-sub">
                              <span v-if="variant.flavor">{{ variant.flavor }} · </span>
                              <span v-if="variant.color">{{ variant.color }} · </span>
                              <span>{{ variant.sizeCapacity }}</span>
                              <span v-if="variant.shelfLifeDays">
                                · {{ variant.shelfLifeDays }}d shelf
                              </span>
                            </div>
                            <div v-if="variant.warranty" class="hardware-note">
                              <Cpu :size="12" />
                              <span>{{ variant.machineSpecs }} ({{ variant.warranty }})</span>
                            </div>
                          </div>
                        </td>

                        <!-- Volume & Weight -->
                        <td :data-label="colLabel(2)" class="td-cbm">
                          <div>
                            <div class="cbm-cell">{{ variant.cbm }} m³ / unit</div>
                            <div class="ref-sub">{{ variant.dimensions.weightKg }} kg</div>
                          </div>
                        </td>

                        <!-- Packaging Multiplier -->
                        <td :data-label="colLabel(3)" class="td-matrix">
                          <div>
                            <div class="uom-row">
                              <span class="lvl">L1</span> 1 {{ variant.uom.level1.unit }}
                              <span v-if="variant.uom.level1.pcsPerUnit > 1" class="text-tertiary">
                                ({{ variant.uom.level1.pcsPerUnit }} pcs)
                              </span>
                            </div>
                            <div class="uom-row">
                              <span class="lvl">L2</span> 1 {{ variant.uom.level2.unit }} =
                              {{ variant.uom.level2.multiplier }} L1
                            </div>
                            <div class="uom-row">
                              <span class="lvl">L3</span> 1 {{ variant.uom.level3.unit }} =
                              {{ variant.uom.level3.multiplier }} L2
                            </div>
                            <div v-if="variant.uom.bundle?.enabled" class="bundle-note">
                              <Box :size="11" />
                              <span>
                                {{ variant.uom.bundle.label }} ({{ variant.uom.bundle.qtyOfLvl1 }}
                                units)
                              </span>
                            </div>
                          </div>
                        </td>

                        <!-- Unit Cost -->
                        <td :data-label="colLabel(4)" class="cost-cell td-cost">
                          ₱{{ variant.baseCost.toFixed(2) }}
                        </td>

                        <!-- Stock Counts -->
                        <td :data-label="colLabel(5)" class="td-stock">
                          <div>
                            <div class="stock-primary">
                              {{ variant.stock }} {{ variant.uom.level1.unit }}
                            </div>
                            <div class="ref-sub">
                              ~{{ variant.boxes }} boxes · ~{{ variant.pallets }} plt
                            </div>
                          </div>
                        </td>

                        <!-- Status -->
                        <td :data-label="colLabel(6)" class="td-status">
                          <div>
                            <span
                              v-if="variant.stock === 0"
                              class="status-indicator status-depleted"
                            >
                              {{ CATALOG_UI.statusLabels.out }}
                            </span>
                            <span
                              v-else-if="variant.stock <= 10"
                              class="status-indicator status-warning"
                            >
                              {{ CATALOG_UI.statusLabels.low }}
                            </span>
                            <span v-else class="status-indicator status-nominal">
                              {{ CATALOG_UI.statusLabels.healthy }}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Transition>
          </article>

          <div v-if="filteredCatalog.length === 0" class="empty-state">
            <p>No catalog items match "{{ searchQuery }}"</p>
            <button class="btn btn-secondary" @click="searchQuery = ''">
              {{ CATALOG_UI.toolbar.resetSearch }}
            </button>
          </div>
        </main>
      </div>
    </div>

    <!-- PO History Modal: Opened strictly from the bottom KPI counter -->
    <WarehousePoHistoryModal
      :show="showPoHistoryModal"
      :initial-branch-id="selectedBranchId !== 'all' ? selectedBranchId : 'all'"
      @close="showPoHistoryModal = false"
      @create-new="openIntakeFromHistory"
    />

    <!-- Default Intake Modal: Opened from top nav button (includes Incoming Deliveries tab) -->
    <WarehouseIntakeModal
      :show="showIntakeModal"
      :variants="store.flatVariants"
      :branches="store.branches"
      :initial-branch-id="selectedBranchId !== 'all' ? selectedBranchId : store.branches[0]?.id"
      @close="showIntakeModal = false"
      @confirm="onIntakeConfirm"
    />

    <!-- Hub Transfer Modal -->
    <WarehouseTransferModal
      :show="showTransferModal"
      :variants="store.flatVariants"
      :branches="store.branches"
      :current-branch-id="selectedBranchId !== 'all' ? selectedBranchId : store.branches[0]?.id"
      @close="showTransferModal = false"
      @confirm="onTransferConfirm"
    />

    <!-- Floating Demo Sandbox Hub -->
    <FloatingDemoHub />
  </div>
</template>

<style scoped src="./HomeView.css"></style>
