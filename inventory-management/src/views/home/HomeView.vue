<script setup>
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'
import { CATALOG_UI } from './catalogConfig'

// Lucide Vue Next Icons
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  PackagePlus,
  LogOut,
  Box,
  Clock,
  ShieldCheck,
  Cpu,
} from 'lucide-vue-next'

const router = useRouter()
const store = useInventoryStore()

const selectedBranchId = ref(store.branches[0]?.id || '')
const searchQuery = ref('')
const expandedParents = ref({ 'P-100': true, 'P-200': true, 'P-300': true })

function toggleParent(parentId) {
  expandedParents.value[parentId] = !expandedParents.value[parentId]
}

function expandAll() {
  store.catalog.forEach((p) => {
    expandedParents.value[p.parentId] = true
  })
}

function collapseAll() {
  expandedParents.value = {}
}

const computedCatalog = computed(() => {
  const currentStocks = store.branchStocks[selectedBranchId.value] || {}

  return store.catalog.map((parent) => {
    const variantsWithStock = parent.variants.map((v) => {
      const stock = currentStocks[v.id] || 0
      const boxes = Math.floor(stock / v.uom.level2.multiplier)
      const pallets = (stock / (v.uom.level2.multiplier * v.uom.level3.multiplier)).toFixed(1)
      return {
        ...v,
        stock,
        boxes,
        pallets,
        autoName: store.generateVariantName(parent, v),
        cbm: store.calculateCBM(v.dimensions),
      }
    })

    const parentTotalUnits = variantsWithStock.reduce((acc, curr) => acc + curr.stock, 0)

    return {
      ...parent,
      totalUnits: parentTotalUnits,
      variants: variantsWithStock,
    }
  })
})

const filteredCatalog = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return computedCatalog.value

  return computedCatalog.value
    .map((parent) => {
      const parentMatches =
        parent.parentName.toLowerCase().includes(q) ||
        parent.brand.toLowerCase().includes(q) ||
        parent.category.toLowerCase().includes(q)

      const matchedVariants = parent.variants.filter(
        (v) =>
          v.autoName.toLowerCase().includes(q) ||
          v.sku.toLowerCase().includes(q) ||
          (v.flavor && v.flavor.toLowerCase().includes(q)) ||
          v.supplierItemNo.toLowerCase().includes(q),
      )

      if (parentMatches) return parent
      if (matchedVariants.length > 0) return { ...parent, variants: matchedVariants }
      return null
    })
    .filter(Boolean)
})

const totalCatalogVariants = computed(() =>
  store.catalog.reduce((acc, p) => acc + p.variants.length, 0),
)
const totalBranchUnits = computed(() => {
  const stocks = store.branchStocks[selectedBranchId.value] || {}
  return Object.values(stocks).reduce((a, b) => a + b, 0)
})

function logout() {
  localStorage.clear()
  router.push('/login')
}
</script>

<template>
  <div class="screen-wrapper">
    <div class="minimal-shell">
      <!-- Fixed Header Strip -->
      <header class="top-nav">
        <div class="nav-brand">
          <span class="eyebrow">{{ CATALOG_UI.header.badge }}</span>
          <h1 class="page-title">{{ CATALOG_UI.header.title }}</h1>
          <p class="page-subtitle">{{ CATALOG_UI.header.subtitle }}</p>
        </div>

        <div class="nav-controls">
          <RouterLink to="/sales" class="btn btn-secondary">
            <ShoppingCart :size="15" stroke-width="2.2" />
            <span>Point of Sale</span>
          </RouterLink>
          <RouterLink to="/stock-in" class="btn btn-action-primary">
            <PackagePlus :size="15" stroke-width="2.2" />
            <span>Receive PO</span>
          </RouterLink>
          <button class="btn btn-icon" title="Sign Out" @click="logout">
            <LogOut :size="15" stroke-width="2.2" />
          </button>
        </div>
      </header>

      <!-- Overview Controls -->
      <section class="overview-bar">
        <div class="selector-field">
          <span class="selector-tag">Location</span>
          <div class="select-wrapper">
            <select v-model="selectedBranchId" class="minimal-select">
              <option v-for="b in store.branches" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
        </div>

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
        </div>
      </section>

      <!-- Search & Controls -->
      <section class="filter-bar">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="CATALOG_UI.toolbar.searchPlaceholder"
            class="minimal-input"
          />
          <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
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

      <!-- Internal Scrollable Catalog Container -->
      <div class="scrollable-catalog-viewport">
        <main class="tree-container">
          <article v-for="parent in filteredCatalog" :key="parent.parentId" class="parent-node">
            <!-- Parent Header -->
            <header class="node-header" @click="toggleParent(parent.parentId)">
              <div class="node-lead">
                <div class="chevron-wrap">
                  <ChevronDown
                    v-if="expandedParents[parent.parentId]"
                    :size="16"
                    stroke-width="2.5"
                  />
                  <ChevronRight v-else :size="16" stroke-width="2.5" />
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
                <span class="vendor-label"
                  >Vendor: <strong>{{ parent.supplier }}</strong></span
                >
                <span class="unit-badge">{{ parent.totalUnits }} units</span>
              </div>
            </header>

            <!-- Nested Variants -->
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
                      <!-- SKU -->
                      <td>
                        <div class="sku-cell">{{ variant.sku }}</div>
                        <div class="ref-sub">{{ variant.supplierItemNo }}</div>
                      </td>

                      <!-- Specs -->
                      <td>
                        <div class="title-cell">{{ variant.autoName }}</div>
                        <div class="desc-sub">
                          <span v-if="variant.flavor">{{ variant.flavor }} · </span>
                          <span v-if="variant.color">{{ variant.color }} · </span>
                          <span>{{ variant.sizeCapacity }}</span>
                          <span v-if="variant.shelfLifeDays">
                            · {{ variant.shelfLifeDays }}d shelf</span
                          >
                        </div>
                        <div v-if="variant.warranty" class="hardware-note">
                          <Cpu :size="12" />
                          <span>{{ variant.machineSpecs }} ({{ variant.warranty }})</span>
                        </div>
                      </td>

                      <!-- CBM -->
                      <td>
                        <div class="cbm-cell">{{ variant.cbm }} m³</div>
                        <div class="ref-sub">{{ variant.dimensions.weightKg }} kg</div>
                      </td>

                      <!-- Packaging Matrix -->
                      <td>
                        <div class="uom-row">
                          <span class="lvl">L1</span> 1 {{ variant.uom.level1.unit }}
                          <span v-if="variant.uom.level1.pcsPerUnit > 1" class="text-tertiary"
                            >({{ variant.uom.level1.pcsPerUnit }} pcs)</span
                          >
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
                          <span
                            >{{ variant.uom.bundle.label }} ({{
                              variant.uom.bundle.qtyOfLvl1
                            }}
                            units)</span
                          >
                        </div>
                      </td>

                      <!-- Unit Cost -->
                      <td class="cost-cell">₱{{ variant.baseCost.toFixed(2) }}</td>

                      <!-- Stock Counts -->
                      <td>
                        <div class="stock-primary">
                          {{ variant.stock }} {{ variant.uom.level1.unit }}
                        </div>
                        <div class="ref-sub">
                          ~{{ variant.boxes }} {{ variant.uom.level2.unit }} · ~{{
                            variant.pallets
                          }}
                          plt
                        </div>
                      </td>

                      <!-- State Status -->
                      <td>
                        <span v-if="variant.stock === 0" class="status-indicator status-depleted">
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
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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
  </div>
</template>

<style scoped src="./HomeView.css"></style>
