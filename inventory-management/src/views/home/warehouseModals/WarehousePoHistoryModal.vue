<script setup>
import BaseModal from '@/components/ui/BaseModal.vue'
import IosSelect from '@/components/ui/IosSelect.vue'
import { usePoHistory } from '@/composables/warehouse/usePoHistory'
import {
  Boxes,
  PackagePlus,
  Search,
  Calendar,
  FileText,
  MapPin,
  CheckCircle2,
  X,
} from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  initialBranchId: {
    type: String,
    default: 'all',
  },
})

const emit = defineEmits(['close', 'create-new'])

const {
  searchQuery,
  selectedBranchFilter,
  branchFilterOptions,
  filteredHistory,
  totalDockedUnits,
  totalPalletsEstimate,
} = usePoHistory(props)
</script>

<template>
  <BaseModal
    :show="show"
    title="Inbound PO Dock Receiving History"
    eyebrow="Supplier Freight & Receiving Logs"
    max-width="660px"
    @close="emit('close')"
  >
    <!-- Top Summary Banner & New PO Button -->
    <div class="po-history-top-bar">
      <div class="po-stats-group">
        <div class="po-stat-pill">
          <span class="stat-label">Total Receipts:</span>
          <span class="stat-val font-mono">{{ filteredHistory.length }}</span>
        </div>
        <div class="po-stat-pill">
          <span class="stat-label">Credited Units:</span>
          <span class="stat-val text-green font-mono"
            >+{{ totalDockedUnits.toLocaleString() }}</span
          >
        </div>
        <div v-if="totalPalletsEstimate > 0" class="po-stat-pill">
          <span class="stat-label">Bulk Pallets:</span>
          <span class="stat-val font-mono">{{ totalPalletsEstimate }} plt</span>
        </div>
      </div>

      <button
        type="button"
        class="btn-action-dock"
        title="Dock New Freight"
        @click="emit('create-new')"
      >
        <PackagePlus :size="14" stroke-width="2.2" />
        <span>Receive New PO</span>
      </button>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="history-toolbar">
      <div class="search-box">
        <Search :size="14" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search PO #, Lot, Bay, or Product..."
          class="minimal-input"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="clear-btn"
          aria-label="Clear Search"
          @click="searchQuery = ''"
        >
          <X :size="13" />
        </button>
      </div>

      <div class="branch-filter-wrap">
        <IosSelect
          v-model="selectedBranchFilter"
          :options="branchFilterOptions"
          title="Filter by Branch"
        />
      </div>
    </div>

    <!-- Scrollable Receiving Logs Stream -->
    <div class="history-list-viewport">
      <div v-if="filteredHistory.length === 0" class="empty-po-box">
        <Boxes :size="32" stroke-width="1.5" class="empty-icon" />
        <h4>No PO Receipts Found</h4>
        <p>No inward deliveries match your current branch or search criteria.</p>
        <button type="button" class="btn btn-secondary btn-sm" @click="emit('create-new')">
          <PackagePlus :size="13" />
          <span>Dock First Delivery</span>
        </button>
      </div>

      <div v-else class="po-stream">
        <article v-for="entry in filteredHistory" :key="entry.id" class="po-log-card">
          <!-- Top Row: Quantity Pill + Timestamp -->
          <div class="log-top">
            <div class="qty-badge-group">
              <span class="qty-pill"> +{{ entry.inputQty }} {{ entry.uomTierLabel }} </span>
              <span class="units-sub"> (+{{ entry.totalBaseUnits }} {{ entry.baseUnit }}) </span>
            </div>
            <span class="log-date">{{ entry.date }}</span>
          </div>

          <!-- Product Details -->
          <div class="product-title-row">
            <h4 class="product-name">{{ entry.productName }}</h4>
          </div>

          <!-- Location & PO Metadata Badges -->
          <div class="log-meta-row">
            <span class="meta-tag branch-tag">
              <MapPin :size="11" />
              <span>{{ entry.branchName }}</span>
            </span>

            <span v-if="entry.note" class="meta-tag po-note-tag font-mono">
              <FileText :size="11" />
              <span>{{ entry.note }}</span>
            </span>

            <span
              v-if="entry.expiry && entry.expiry !== 'N/A'"
              class="meta-tag expiry-tag font-mono"
            >
              <Calendar :size="11" />
              <span>Exp: {{ entry.expiry }}</span>
            </span>

            <span class="meta-tag status-tag">
              <CheckCircle2 :size="11" />
              <span>In Stock</span>
            </span>
          </div>
        </article>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.po-history-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: #f4f4f5;
  border-radius: 14px;
  padding: 0.55rem 0.85rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.po-stats-group {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.po-stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  color: #52525b;
}

.stat-label {
  font-weight: 600;
}

.stat-val {
  font-weight: 700;
  color: #18181b;
}

.text-green {
  color: #16a34a !important;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.btn-action-dock {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  background: #18181b;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action-dock:hover {
  background: #27272a;
}

.history-toolbar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.75rem;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: #fafafa;
  border: 1px solid #e4e4e7;
  border-radius: 9999px;
  padding: 0.45rem 0.85rem;
  transition: border-color 0.15s;
}

.search-box:focus-within {
  border-color: #a1a1aa;
  background: #ffffff;
}

.search-icon {
  color: #a1a1aa;
}

.minimal-input {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.78rem;
  color: #18181b;
}

.clear-btn {
  border: none;
  background: transparent;
  color: #a1a1aa;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.branch-filter-wrap {
  min-width: 210px;
}

.history-list-viewport {
  max-height: 440px;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.empty-po-box {
  text-align: center;
  padding: 3rem 1.5rem;
  background: #fafafa;
  border: 1.5px dashed #e4e4e7;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
}

.empty-icon {
  color: #a1a1aa;
}

.empty-po-box h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #18181b;
}

.empty-po-box p {
  margin: 0;
  font-size: 0.76rem;
  color: #71717a;
}

.po-stream {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.po-log-card {
  border: 1px solid #e4e4e7;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  transition: border-color 0.15s ease;
}

.po-log-card:hover {
  border-color: #d4d4d8;
  background: #fdfdfd;
}

.log-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.qty-badge-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.qty-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #166534;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
}

.units-sub {
  font-size: 0.72rem;
  color: #52525b;
}

.log-date {
  font-size: 0.68rem;
  color: #a1a1aa;
}

.product-title-row {
  margin: 0.1rem 0;
}

.product-name {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #18181b;
}

.log-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.67rem;
  font-weight: 600;
  padding: 0.14rem 0.5rem;
  border-radius: 6px;
}

.branch-tag {
  background: #f4f4f5;
  color: #3f3f46;
  border: 1px solid #e4e4e7;
}

.po-note-tag {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #dbeafe;
}

.expiry-tag {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.status-tag {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}
</style>
