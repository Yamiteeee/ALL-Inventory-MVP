<script setup>
import { watch, nextTick } from 'vue'
import { TRANSPORT_UI } from './transportConfig'
import { usePageEntrance, animateTableTransition } from '@/animations/usePageEntrance'
import { useTypewriter } from '@/animations/useTypewriter'
import IosSelect from '@/components/ui/IosSelect.vue'
import { useTransportLedger } from '@/composables/transport/useTransportLedger'

import { ArrowLeft, Truck, Boxes, Search, CheckCircle2, Clock, RefreshCw } from 'lucide-vue-next'

// Animations
usePageEntrance()
const { displayedText: pageTitle, isComplete: isTypingDone } = useTypewriter(
  TRANSPORT_UI.header.title,
  TRANSPORT_UI.header.typewriter,
)

// Ledger Composable
const {
  selectedCategory,
  selectedLocation,
  searchQuery,
  categoryFilters,
  locationFilterOptions,
  filteredLedger,
  totalEvents,
  countTransfers,
  countSales,
  countInTransit,
  resetFilters,
  goBackToCatalog,
} = useTransportLedger()

// Row animation on filter change
watch([selectedCategory, selectedLocation, searchQuery], async () => {
  await nextTick()
  animateTableTransition('.anim-row')
})
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
            <span class="ghost-reserve" aria-hidden="true">{{ TRANSPORT_UI.header.title }}.</span>
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

      <!-- 2. Clean KPI Strip -->
      <section class="kpi-strip anim-stagger">
        <div class="kpi-card">
          <span class="kpi-sub">{{ TRANSPORT_UI.kpis.total }}</span>
          <span class="kpi-val">{{ totalEvents }}</span>
        </div>
        <div class="kpi-divider"></div>

        <div class="kpi-card">
          <span class="kpi-sub">{{ TRANSPORT_UI.kpis.transfers }}</span>
          <span class="kpi-val">{{ countTransfers }}</span>
        </div>
        <div class="kpi-divider"></div>

        <div class="kpi-card">
          <span class="kpi-sub">{{ TRANSPORT_UI.kpis.sales }}</span>
          <span class="kpi-val">{{ countSales }}</span>
        </div>
        <div class="kpi-divider"></div>

        <div class="kpi-card">
          <span class="kpi-sub">{{ TRANSPORT_UI.kpis.inTransit }}</span>
          <span class="kpi-val emphasized">{{ countInTransit }}</span>
        </div>
      </section>

      <!-- 3. Category & Filter Toolbar -->
      <section class="toolbar-card anim-stagger">
        <!-- Category Pills (ALL, TRANSFERS, SALES) -->
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

      <!-- 4. Unified Ledger Table -->
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
                      <span class="manifest-no font-mono">{{ entry.refNo }}</span>
                      <span
                        class="category-tag"
                        :class="{
                          'tag-transfer': entry.category === 'TRANSFERS',
                          'tag-sale': entry.category === 'SALES',
                        }"
                      >
                        {{ entry.typeLabel }}
                      </span>
                    </div>
                    <span class="entry-date">{{ entry.timestamp }}</span>
                  </div>
                </td>

                <!-- Movement Flow (Origin ➔ Destination) -->
                <td :data-label="TRANSPORT_UI.tableHeaders[1].label" class="td-route">
                  <div class="route-col">
                    <div class="route-item">
                      <span
                        class="facility-badge"
                        :class="{
                          'badge-hub': entry.origin.type === 'HUB',
                          'badge-branch': entry.origin.type === 'BRANCH',
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
                          'badge-branch': entry.destination.type === 'BRANCH',
                          'badge-client': entry.destination.type === 'CLIENT',
                        }"
                      >
                        {{ entry.destination.type }}
                      </span>
                      <span class="facility-name">{{ entry.destination.name }}</span>
                    </div>
                  </div>
                </td>

                <!-- Product Details -->
                <td :data-label="TRANSPORT_UI.tableHeaders[2].label" class="td-product">
                  <div class="cargo-col">
                    <div class="cargo-name">{{ entry.productName }}</div>
                    <div v-if="entry.sku" class="sku-tag font-mono">{{ entry.sku }}</div>
                    <div v-if="entry.notes" class="cargo-notes">{{ entry.notes }}</div>
                  </div>
                </td>

                <!-- Quantity -->
                <td :data-label="TRANSPORT_UI.tableHeaders[3].label" class="td-qty">
                  <div class="qty-col">
                    <span class="primary-units">{{ entry.qtyDisplay }}</span>
                  </div>
                </td>

                <!-- Operator / Courier -->
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
                        'status-completed':
                          entry.status === 'Completed' || entry.status === 'Delivered',
                        'status-transit': entry.status === 'In Transit',
                        'status-pending': entry.status === 'Pending Dispatch',
                      }"
                    >
                      <CheckCircle2
                        v-if="entry.status === 'Completed' || entry.status === 'Delivered'"
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
