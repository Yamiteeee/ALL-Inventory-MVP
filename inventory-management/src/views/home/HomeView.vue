<script setup>
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'

const router = useRouter()
const store = useInventoryStore()

const selectedBranchId = ref(store.branches[0].id)
const searchQuery = ref('')
const expandedParents = ref({ 'P-100': true, 'P-200': true, 'P-300': true }) // default expanded

function toggleParent(parentId) {
  expandedParents.value[parentId] = !expandedParents.value[parentId]
}

// Compute catalog variants merged with branch-specific stock
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

// Search query matches parent info, flavor, brand, or SKU
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

// High-level metrics
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
  <div class="dashboard">
    <!-- Header with Branch Selector -->
    <header class="header">
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        "
      >
        <div>
          <h1 style="margin: 0">🧋 BobaSupply Enterprise Master Catalog</h1>
          <p style="margin: 0.25rem 0 0 0; color: #6b7280">
            Parent Catalog · Sub-Product Variants · Multi-Tier UOM
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem">
          <RouterLink
            to="/sales"
            class="btn"
            style="background: #059669; color: #fff; text-decoration: none"
          >
            🛒 POS / Stock Out
          </RouterLink>
          <RouterLink to="/stock-in" class="btn btn-primary" style="text-decoration: none">
            + PO Stock Intake
          </RouterLink>
          <button class="btn btn-danger" @click="logout">Sign Out</button>
        </div>
      </div>

      <div class="branch-selector-bar">
        <label><strong>Viewing Stock for:</strong></label>
        <select v-model="selectedBranchId" class="branch-dropdown">
          <option v-for="b in store.branches" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
      </div>

      <!-- Quick Metrics -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="label">Parent Families</span>
          <span class="value">{{ store.catalog.length }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Sub-Product Variants</span>
          <span class="value">{{ totalCatalogVariants }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Base Units On Hand</span>
          <span class="value">{{ totalBranchUnits }}</span>
        </div>
      </div>
    </header>

    <!-- Master Catalog Hierarchy Table -->
    <section class="card">
      <div class="table-toolbar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter by Parent, Sub-Product flavor, SKU, Brand, or Box #..."
          class="search-input"
        />
      </div>

      <div class="parent-catalog-container">
        <div v-for="parent in filteredCatalog" :key="parent.parentId" class="parent-block">
          <!-- Parent Row Header -->
          <div class="parent-header" @click="toggleParent(parent.parentId)">
            <div style="display: flex; align-items: center; gap: 0.75rem">
              <span class="toggle-icon">{{ expandedParents[parent.parentId] ? '▼' : '▶' }}</span>
              <div>
                <strong class="parent-title">{{ parent.parentName }}</strong>
                <span class="parent-brand-tag">Brand: {{ parent.brand }}</span>
                <span class="parent-cat-tag">{{ parent.category }} / {{ parent.subCategory }}</span>
                <span v-if="parent.isPerishable" class="tag-perishable">⏳ Perishable Batches</span>
                <span v-else class="tag-nonperishable">🛡️ Non-Perishable</span>
              </div>
            </div>
            <div class="parent-summary">
              <span
                >Supplier: <strong>{{ parent.supplier }}</strong></span
              >
              <span class="parent-units-badge">{{ parent.totalUnits }} total units in branch</span>
            </div>
          </div>

          <!-- Sub-Products (Variants) Child Table -->
          <div v-if="expandedParents[parent.parentId]" class="child-variant-wrapper">
            <table class="variant-table">
              <thead>
                <tr>
                  <th>SKU / Supplier #</th>
                  <th>Automated Variant Name & Specs</th>
                  <th>CBM / Dim</th>
                  <th>3-Tier UOM Packaging Matrix</th>
                  <th>Unit Cost</th>
                  <th>Stock on Hand</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="variant in parent.variants" :key="variant.id">
                  <td>
                    <div class="font-mono">{{ variant.sku }}</div>
                    <small class="text-muted">Box #: {{ variant.supplierItemNo }}</small>
                  </td>
                  <td>
                    <strong style="color: #1e293b">{{ variant.autoName }}</strong>
                    <div class="variant-attributes">
                      <span v-if="variant.flavor"
                        >Flavor: <strong>{{ variant.flavor }}</strong> •
                      </span>
                      <span v-if="variant.color">Color: {{ variant.color }} • </span>
                      <span>Cap: {{ variant.sizeCapacity }}</span>
                      <span v-if="variant.shelfLifeDays">
                        • Shelf: {{ variant.shelfLifeDays }}d</span
                      >
                    </div>
                    <!-- Machine Hardware Specs -->
                    <div v-if="variant.warranty" class="hardware-badge">
                      ⚙️ Specs: {{ variant.machineSpecs }} | 🛡️ Warranty: {{ variant.warranty }}
                    </div>
                  </td>
                  <td>
                    <div style="font-size: 0.85rem; font-weight: 600">{{ variant.cbm }} m³</div>
                    <small class="text-muted">{{ variant.dimensions.weightKg }} kg</small>
                  </td>
                  <td>
                    <div class="uom-pill">
                      <strong>L1 (Base):</strong> 1 {{ variant.uom.level1.unit }}
                      <span v-if="variant.uom.level1.pcsPerUnit > 1"
                        >({{ variant.uom.level1.pcsPerUnit }} pcs)</span
                      >
                    </div>
                    <div class="uom-pill">
                      <strong>L2 (Box):</strong> 1 {{ variant.uom.level2.unit }} =
                      {{ variant.uom.level2.multiplier }} {{ variant.uom.level1.unit }}
                    </div>
                    <div class="uom-pill">
                      <strong>L3 (Pallet):</strong> 1 {{ variant.uom.level3.unit }} =
                      {{ variant.uom.level3.multiplier }} boxes
                    </div>
                    <div v-if="variant.uom.bundle?.enabled" class="bundle-pill">
                      🎁 Bundle: {{ variant.uom.bundle.label }} ({{
                        variant.uom.bundle.qtyOfLvl1
                      }}
                      L1 units)
                    </div>
                  </td>
                  <td>₱{{ variant.baseCost.toFixed(2) }}</td>
                  <td>
                    <strong style="font-size: 1.05rem"
                      >{{ variant.stock }} {{ variant.uom.level1.unit }}</strong
                    >
                    <div class="text-muted" style="font-size: 0.75rem">
                      (~{{ variant.boxes }} {{ variant.uom.level2.unit }} | ~{{
                        variant.pallets
                      }}
                      plt)
                    </div>
                  </td>
                  <td>
                    <span v-if="variant.stock === 0" class="badge badge-out">Out of Stock</span>
                    <span v-else-if="variant.stock <= 10" class="badge badge-low">Low Stock</span>
                    <span v-else class="badge badge-in">Healthy</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="filteredCatalog.length === 0" class="empty-state">
          No parent categories or sub-products match "{{ searchQuery }}".
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped src="./HomeView.css"></style>
