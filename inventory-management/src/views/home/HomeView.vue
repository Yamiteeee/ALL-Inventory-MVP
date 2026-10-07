<!-- Inside src/views/home/HomeView.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'

const router = useRouter()
const store = useInventoryStore()

const selectedBranchId = ref(store.branches[0].id)
const searchQuery = ref('')

const branchInventory = computed(() => {
  const currentStocks = store.branchStocks[selectedBranchId.value] || {}
  return store.products.map((product) => ({
    ...product,
    stock: currentStocks[product.id] || 0,
    boxCount: Math.floor((currentStocks[product.id] || 0) / product.uom.level2.multiplier),
  }))
})

const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return branchInventory.value
  return branchInventory.value.filter(
    (p) =>
      p.fullName.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q),
  )
})

const totalUnits = computed(() => branchInventory.value.reduce((sum, item) => sum + item.stock, 0))
const lowStockCount = computed(
  () => branchInventory.value.filter((i) => i.stock > 0 && i.stock <= 10).length,
)
const outOfStockCount = computed(() => branchInventory.value.filter((i) => i.stock === 0).length)

function logout() {
  localStorage.clear()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard">
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
          <h1 style="margin: 0">🧋 BobaSupply Reseller Hub</h1>
          <p style="margin: 0.25rem 0 0 0; color: #6b7280">Multi-Branch Inventory & Logistics</p>
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
          <option v-for="b in store.branches" :key="b.id" :value="b.id">
            {{ b.name }}
          </option>
        </select>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <span class="label">Catalog Variants</span>
          <span class="value">{{ store.products.length }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Units on Hand</span>
          <span class="value">{{ totalUnits }}</span>
        </div>
        <div class="stat-card warning">
          <span class="label">Low Stock (≤10)</span>
          <span class="value">{{ lowStockCount }}</span>
        </div>
        <div class="stat-card danger">
          <span class="label">Out of Stock</span>
          <span class="value">{{ outOfStockCount }}</span>
        </div>
      </div>
    </header>

    <section class="card">
      <div class="table-toolbar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by brand, parent, flavor, SKU, or category..."
          class="search-input"
        />
      </div>

      <table class="inventory-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Item & Variant Details</th>
            <th>Category / Brand</th>
            <th>UOM Matrix</th>
            <th>Base Cost</th>
            <th>Available (L1 / L2)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredProducts" :key="item.id">
            <td class="font-mono">{{ item.sku }}</td>
            <td>
              <strong>{{ item.fullName }}</strong>
              <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.2rem">
                {{ item.subtitle }} • {{ item.sizeCapacity }}
                <span v-if="item.isPerishable" style="color: #b45309">
                  • ⏳ {{ item.shelfLifeDays }}d Shelf Life</span
                >
              </div>
            </td>
            <td>
              <div>{{ item.category }}</div>
              <small style="color: #6b7280">{{ item.brand }}</small>
            </td>
            <td>
              <div style="font-size: 0.8rem">
                1 {{ item.uom.level2.unit }} = {{ item.uom.level2.multiplier }}
                {{ item.uom.level1.unit }}
              </div>
            </td>
            <td>₱{{ item.baseCost.toFixed(2) }}</td>
            <td>
              <strong>{{ item.stock }} {{ item.uom.level1.unit }}</strong>
              <div style="font-size: 0.75rem; color: #6b7280">
                (~{{ item.boxCount }} {{ item.uom.level2.unit }})
              </div>
            </td>
            <td>
              <span v-if="item.stock === 0" class="badge badge-out">Depleted</span>
              <span v-else-if="item.stock <= 10" class="badge badge-low">Low Stock</span>
              <span v-else class="badge badge-in">Healthy</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped src="./HomeView.css"></style>
