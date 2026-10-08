<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '@/stores/inventoryStore'
import { usePageEntrance, animateTableTransition } from '@/animations/usePageEntrance'
import { useTypewriter } from '@/animations/useTypewriter'
import { TRANSPORT_UI, DEFAULT_TRANSPORT_RECORDS } from './transportConfig'
import IosSelect from '@/components/ui/IosSelect.vue'

import {
  ArrowLeft,
  Truck,
  Boxes,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-vue-next'

const router = useRouter()
const store = useInventoryStore()

// 1. Universal Page Entrance Animations
usePageEntrance()

// 2. Typewriter Effect
const { displayedText: pageTitle, isComplete: isTypingDone } = useTypewriter(
  TRANSPORT_UI.header.title,
  TRANSPORT_UI.header.typewriter,
)

function goBackToCatalog() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/inventory')
  }
}

// Local storage backup for transports (seeded by DEFAULT_TRANSPORT_RECORDS)
const localTransports = ref(
  JSON.parse(localStorage.getItem('app_transport_history') || 'null') ||
    DEFAULT_TRANSPORT_RECORDS,
)

// Active filter state
const selectedCategory = ref('ALL') // 'ALL' | 'WW' | 'WS' | 'SALES' | 'INTAKE'
const selectedLocation = ref('all') // 'all' | branchId
const searchQuery = ref('')

// 3. Trigger Spring Cascade animation on row updates
watch([selectedCategory, selectedLocation, searchQuery], async () => {
  await nextTick()
  animateTableTransition('.anim-row')
})

const categoryFilters = TRANSPORT_UI.categories

// Normalized Location Filter Options (L of W and S)
const locationFilterOptions = computed(() => [
  { value: 'all', label: TRANSPORT_UI.toolbar.allLocationsLabel },
  ...store.branches.map((b) => ({
    value: b.id,
    label: `${b.name} (${b.id.includes('commissary') || b.id.includes('wh') ? 'Warehouse' : 'Storefront'})`,
  })),
])

// Unified transaction feed merging Transport, Sales, and Stock-In
const unifiedTransactions = computed(() => {
  const feed = []

  // 1. Transportation Logs (WW & WS)
  const transports =
    store.transportHistory && store.transportHistory.length
      ? store.transportHistory
      : localTransports.value

  transports.forEach((t) => {
    feed.push({
      id: `trp-${t.id}`,
      refNo: t.manifestNo,
      category: t.category || 'WS',
      typeLabel: t.category === 'WW' ? 'Warehouse Transfer' : 'Store Restock',
      timestamp: t.fullDate ? `${t.fullDate} ${t.date}` : t.date,
      origin: { name: t.fromName, type: t.originType || 'W', branchId: t.fromBranchId },
      destination: {
        name: t.toName,
        type: t.destType || (t.category === 'WW' ? 'W' : 'S'),
        branchId: t.toBranchId,
      },
      productName: t.productName,
      sku: t.sku || '',
      qtyDisplay: `${t.totalUnits} ${t.unit || 'units'} (${t.qty} ${t.tierLabel})`,
      partyLabel: 'Carrier',
      partyValue: t.driver ? `${t.driver} · ${t.vehicle}` : t.vehicle || 'Fleet Van',
      status: t.status || 'In Transit',
      notes: t.notes || '',
      amount: null,
      rawTime: Number(t.id) || Date.now(),
    })
  })

  // 2. POS Storefront Sales
  ;(store.salesHistory || []).forEach((s) => {
    feed.push({
      id: `sale-${s.id}`,
      refNo: `POS-${String(s.id).slice(-6)}`,
      category: 'SALES',
      typeLabel: 'Retail Storefront Sale',
      timestamp: s.date,
      origin: { name: s.branchName, type: 'S', branchId: s.branchId || '' },
      destination: { name: s.customerName || 'Retail Customer', type: 'C', branchId: '' },
      productName: s.productName,
      sku: '',
      qtyDisplay: `${s.quantity} ${s.unit || 'units'}`,
      partyLabel: 'Buyer',
      partyValue: s.customerName || 'Walk-in Retail Buyer',
      status: 'Completed',
      notes: s.specialReason || 'Storefront Sale',
      amount: s.finalTotal
        ? `₱${Number(s.finalTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : null,
      rawTime: Number(s.id) || Date.now(),
    })
  })

  // 3. Warehouse PO Intake
  ;(store.stockInHistory || []).forEach((stk) => {
    feed.push({
      id: `stk-${stk.id}`,
      refNo: `RCV-${String(stk.id).slice(-6)}`,
      category: 'INTAKE',
      typeLabel: 'Inward PO Delivery',
      timestamp: stk.date,
      origin: { name: 'Supplier / Vendor', type: 'V', branchId: '' },
      destination: { name: stk.branchName, type: 'W', branchId: stk.branchId || '' },
      productName: stk.productName,
      sku: '',
      qtyDisplay: `+${stk.totalBaseUnits} ${stk.baseUnit || 'units'} (${stk.inputQty} ${stk.uomTierLabel})`,
      partyLabel: 'Vendor Note',
      partyValue: stk.note || 'Standard PO Delivery',
      status: 'Received',
      notes: stk.expiry && stk.expiry !== 'N/A' ? `Exp: ${stk.expiry}` : '',
      amount: null,
      rawTime: Number(stk.id) || Date.now(),
    })
  })

  return feed.sort((a, b) => b.rawTime - a.rawTime)
})

// Filtered Transactions
const filteredLedger = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()

  return unifiedTransactions.value.filter((row) => {
    // 1. Category Filter
    if (selectedCategory.value !== 'ALL' && row.category !== selectedCategory.value) {
      return false
    }

    // 2. Location Filter
    if (selectedLocation.value !== 'all') {
      const targetBranch = store.branches.find((b) => b.id === selectedLocation.value)
      const targetName = targetBranch ? targetBranch.name.toLowerCase() : ''
      const originMatch =
        row.origin.branchId === selectedLocation.value ||
        row.origin.name.toLowerCase().includes(targetName)
      const destMatch =
        row.destination.branchId === selectedLocation.value ||
        row.destination.name.toLowerCase().includes(targetName)

      if (!originMatch && !destMatch) return false
    }

    // 3. Search Query
    if (!q) return true
    return (
      row.refNo?.toLowerCase().includes(q) ||
      row.productName?.toLowerCase().includes(q) ||
      row.sku?.toLowerCase().includes(q) ||
      row.origin.name?.toLowerCase().includes(q) ||
      row.destination.name?.toLowerCase().includes(q) ||
      row.partyValue?.toLowerCase().includes(q) ||
      row.notes?.toLowerCase().includes(q)
    )
  })
})

// KPI Metrics
const totalEvents = computed(() => unifiedTransactions.value.length)
const countWW = computed(() => unifiedTransactions.value.filter((r) => r.category === 'WW').length)
const countWS = computed(() => unifiedTransactions.value.filter((r) => r.category === 'WS').length)
const countSales = computed(
  () => unifiedTransactions.value.filter((r) => r.category === 'SALES').length,
)
const countIntake = computed(
  () => unifiedTransactions.value.filter((r) => r.category === 'INTAKE').length,
)

function resetFilters() {
  selectedCategory.value = 'ALL'
  selectedLocation.value = 'all'
  searchQuery.value = ''
}
</script>

<template>
  <div class="screen-wrapper">
    <div class="minimal-shell">
      <!-- 1. Header Navigation -->
      <header class="top-nav anim-top">
        <div class="nav-brand">
          <div class="header-meta-bar">
            <button type="button" class="back-btn" @click="goBackToCatalog">
              <ArrowLeft :size="13" />
              <span>{{ TRANSPORT_UI.header.backText }}</span>
            </button>
          </div>

          <h1 class="page-title">
            <span class="ghost-reserve" aria-hidden="true"
              >{{ TRANSPORT_UI.header.title }}.</span
            >
            <span class="typing-active">
              {{ pageTitle }}
              <span v-if="!isTypingDone" class="typewriter-cursor">|</span>
              <span v-else class="morph-period">
                <span class="dot-shape"></span>
              </span>
            </span>
          </h1>

          <p class="page-subtitle">{{ TRANSPORT_UI.header.subtitle }}</p>
        </div>

        <div class="header-badges desktop-badge">
          <span class="session-badge">
            <Truck :size="14" stroke-width="2.2" />
            <span>{{ totalEvents }} {{ TRANSPORT_UI.header.badgeSuffix }}</span>
          </span>
        </div>
      </header>

      <!-- 2. KPI Summary Bar -->
      <section class="kpi-strip anim-stagger">
        <div class="kpi-card">
          <span class="kpi-sub">{{ TRANSPORT_UI.kpis.total }}</span>
          <span class="kpi-val">{{ totalEvents }}</span>
        </div>
        <div class="kpi-divider"></div>

        <div class="kpi-card">
          <span class="kpi-sub">{{ TRANSPORT_UI.kpis.ww }}</span>
          <span class="kpi-val">{{ countWW }}</span>
        </div>
        <div class="kpi-divider"></div>

        <div class="kpi-card">
          <span class="kpi-sub">{{ TRANSPORT_UI.kpis.ws }}</span>
          <span class="kpi-val">{{ countWS }}</span>
        </div>
        <div class="kpi-divider"></div>

        <div class="kpi-card">
          <span class="kpi-sub">{{ TRANSPORT_UI.kpis.sales }}</span>
          <span class="kpi-val">{{ countSales }}</span>
        </div>
        <div class="kpi-divider"></div>

        <div class="kpi-card">
          <span class="kpi-sub">{{ TRANSPORT_UI.kpis.intake }}</span>
          <span class="kpi-val">{{ countIntake }}</span>
        </div>
      </section>

      <!-- 3. Categorization & Filters Toolbar -->
      <section class="toolbar-card anim-stagger">
        <!-- Category Pills (ALL, WW, WS, SALES, INTAKE) -->
        <div class="category-pills">
          <button
            v-for="cat in categoryFilters"
            :key="cat.key"
            type="button"
            class="cat-pill"
            :class="{ active: selectedCategory === cat.key }"
            @click="selectedCategory = cat.key"
          >
            <span class="pill-title">{{ cat.label }}</span>
            <span v-if="cat.sublabel" class="pill-desc">{{ cat.sublabel }}</span>
          </button>
        </div>

        <!-- Filter Dropdown & Search -->
        <div class="filters-row">
          <div class="search-wrap">
            <Search :size="15" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="TRANSPORT_UI.toolbar.searchPlaceholder"
              class="search-input"
            />
          </div>

          <div class="location-select-wrap">
            <IosSelect
              v-model="selectedLocation"
              :options="locationFilterOptions"
              :title="TRANSPORT_UI.toolbar.locationSelectTitle"
              :placeholder="TRANSPORT_UI.toolbar.locationSelectPlaceholder"
            />
          </div>

          <button
            v-if="selectedCategory !== 'ALL' || selectedLocation !== 'all' || searchQuery"
            type="button"
            class="btn-reset"
            :title="TRANSPORT_UI.toolbar.resetButton"
            @click="resetFilters"
          >
            <RefreshCw :size="13" />
            <span>{{ TRANSPORT_UI.toolbar.resetButton }}</span>
          </button>
        </div>
      </section>

      <!-- 4. Read-Only Ledger Table -->
      <section class="ledger-container anim-card">
        <div v-if="filteredLedger.length === 0" class="empty-state">
          <Boxes :size="36" class="empty-icon" stroke-width="1.4" />
          <p class="empty-title">{{ TRANSPORT_UI.emptyState.title }}</p>
          <p class="empty-sub">{{ TRANSPORT_UI.emptyState.subtitle }}</p>
        </div>

        <div v-else class="table-scroll-wrap">
          <table class="ledger-table">
            <thead>
              <tr>
                <th v-for="header in TRANSPORT_UI.tableHeaders" :key="header.key">
                  {{ header.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in filteredLedger" :key="entry.id" class="ledger-row anim-row">
                <!-- Reference & Activity -->
                <td :data-label="TRANSPORT_UI.tableHeaders[0].label" class="td-ref">
                  <div class="manifest-col">
                    <div class="manifest-top">
                      <span class="manifest-no">{{ entry.refNo }}</span>
                      <span
                        class="category-tag"
                        :class="{
                          'tag-ww': entry.category === 'WW',
                          'tag-ws': entry.category === 'WS',
                          'tag-sales': entry.category === 'SALES',
                          'tag-intake': entry.category === 'INTAKE',
                        }"
                      >
                        {{ entry.category }} · {{ entry.typeLabel }}
                      </span>
                    </div>
                    <span class="entry-date">{{ entry.timestamp }}</span>
                  </div>
                </td>

                <!-- Route: Origin ➔ Destination -->
                <td :data-label="TRANSPORT_UI.tableHeaders[1].label" class="td-route">
                  <div class="route-col">
                    <div class="route-item">
                      <span
                        class="facility-badge"
                        :class="{
                          'badge-w': entry.origin.type === 'W',
                          'badge-s': entry.origin.type === 'S',
                          'badge-v': entry.origin.type === 'V',
                        }"
                      >
                        {{ entry.origin.type }}
                      </span>
                      <span class="facility-name">{{ entry.origin.name }}</span>
                    </div>
                    <span class="arrow-indicator">➔</span>
                    <div class="route-item">
                      <span
                        class="facility-badge"
                        :class="{
                          'badge-w': entry.destination.type === 'W',
                          'badge-s': entry.destination.type === 'S',
                          'badge-c': entry.destination.type === 'C',
                        }"
                      >
                        {{ entry.destination.type }}
                      </span>
                      <span class="facility-name">{{ entry.destination.name }}</span>
                    </div>
                  </div>
                </td>

                <!-- Product & Details -->
                <td :data-label="TRANSPORT_UI.tableHeaders[2].label" class="td-product">
                  <div class="cargo-col">
                    <div class="cargo-name">{{ entry.productName }}</div>
                    <div v-if="entry.sku" class="sku-tag">{{ entry.sku }}</div>
                    <div v-if="entry.notes" class="cargo-notes">{{ entry.notes }}</div>
                  </div>
                </td>

                <!-- Quantity -->
                <td :data-label="TRANSPORT_UI.tableHeaders[3].label" class="td-qty">
                  <div class="qty-col">
                    <span class="primary-units">{{ entry.qtyDisplay }}</span>
                  </div>
                </td>

                <!-- Handler / Party -->
                <td :data-label="TRANSPORT_UI.tableHeaders[4].label" class="td-carrier">
                  <div class="carrier-col">
                    <span class="party-label">{{ entry.partyLabel }}</span>
                    <span class="party-value">{{ entry.partyValue }}</span>
                  </div>
                </td>

                <!-- Status & Amount -->
                <td :data-label="TRANSPORT_UI.tableHeaders[5].label" class="td-status">
                  <div class="status-col">
                    <span
                      class="status-pill"
                      :class="{
                        'status-received':
                          entry.status === 'Received' || entry.status === 'Completed',
                        'status-transit': entry.status === 'In Transit',
                      }"
                    >
                      <CheckCircle2
                        v-if="entry.status === 'Received' || entry.status === 'Completed'"
                        :size="12"
                      />
                      <Clock v-else :size="12" />
                      <span>{{ entry.status }}</span>
                    </span>
                    <span v-if="entry.amount" class="amount-badge">{{ entry.amount }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped src="./TransportView.css"></style>
