<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'

const store = useInventoryStore()

const selectedBranch = ref(store.branches[0].id)
const selectedProduct = ref(store.products[0].id)
const uomTier = ref('level2') // Default to Level 2 (e.g., Box / Carton)
const quantity = ref(10)
const batchExpiry = ref('')
const supplierNote = ref('')
const successMessage = ref('')

const currentItem = computed(() => {
  return store.products.find((p) => p.id === Number(selectedProduct.value))
})

// Conversion calculator preview
const calculatedBaseUnits = computed(() => {
  if (!currentItem.value) return 0
  const qty = Number(quantity.value) || 0
  if (uomTier.value === 'level1') return qty
  if (uomTier.value === 'level2') return qty * currentItem.value.uom.level2.multiplier
  if (uomTier.value === 'level3')
    return qty * currentItem.value.uom.level2.multiplier * currentItem.value.uom.level3.multiplier
  return 0
})

function handleSubmitStockIn() {
  if (quantity.value <= 0) return

  store.receiveStock({
    branchId: selectedBranch.value,
    productId: selectedProduct.value,
    inputQty: quantity.value,
    uomTier: uomTier.value,
    supplierNote: supplierNote.value,
    batchExpiry: batchExpiry.value,
  })

  successMessage.value = `Logged ${quantity.value} ${uomTier.value === 'level1' ? currentItem.value.uom.level1.unit : uomTier.value === 'level2' ? currentItem.value.uom.level2.unit : currentItem.value.uom.level3.unit} (Total: +${calculatedBaseUnits.value} ${currentItem.value.uom.level1.unit}) for ${currentItem.value.fullName}!`
  supplierNote.value = ''
  batchExpiry.value = ''

  setTimeout(() => {
    successMessage.value = ''
  }, 4500)
}
</script>

<template>
  <div class="stock-container">
    <header class="header">
      <RouterLink to="/inventory" class="back-link">← Back to Branch Overview</RouterLink>
      <h2>PO Intake & Warehouse Stock In</h2>
      <p class="subtitle">
        Multi-tier UOM receiving (Bottles · Boxes · Pallets) with batch tracking.
      </p>
    </header>

    <div v-if="successMessage" class="alert-success">✅ {{ successMessage }}</div>

    <div class="grid-layout">
      <!-- Intake Form -->
      <section class="card form-card">
        <h3>Intake Entry</h3>
        <form @submit.prevent="handleSubmitStockIn">
          <div class="form-group">
            <label>Destination Branch / Commissary</label>
            <select v-model="selectedBranch" required>
              <option v-for="b in store.branches" :key="b.id" :value="b.id">
                {{ b.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Master Item & Variant</label>
            <select v-model="selectedProduct" required>
              <option v-for="item in store.products" :key="item.id" :value="item.id">
                [{{ item.category }}] {{ item.fullName }}
              </option>
            </select>
          </div>

          <!-- UOM Tier Matrix Selector -->
          <div class="form-group" v-if="currentItem">
            <label>Select Unit of Measure (UOM Tier)</label>
            <select v-model="uomTier">
              <option value="level1">Level 1: Primary (1 {{ currentItem.uom.level1.unit }})</option>
              <option value="level2">
                Level 2: Secondary Bundle (1 {{ currentItem.uom.level2.unit }} =
                {{ currentItem.uom.level2.multiplier }} {{ currentItem.uom.level1.unit }})
              </option>
              <option value="level3">
                Level 3: Tertiary Pallet (1 {{ currentItem.uom.level3.unit }} =
                {{ currentItem.uom.level3.multiplier }} {{ currentItem.uom.level2.unit }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Received Quantity</label>
            <input v-model.number="quantity" type="number" min="1" required />
            <small style="color: #2563eb; font-weight: 600; margin-top: 0.25rem">
              Converts to: {{ calculatedBaseUnits }} base {{ currentItem?.uom.level1.unit }}
            </small>
          </div>

          <div class="form-group" v-if="currentItem?.isPerishable">
            <label>Batch Expiry Date (Perishable)</label>
            <input v-model="batchExpiry" type="date" required />
          </div>

          <div class="form-group">
            <label>Supplier / PO Reference</label>
            <input v-model="supplierNote" placeholder="e.g. PO #9910 - Taiwan Direct" />
          </div>

          <button type="submit" class="btn btn-primary">+ Post Stock to Ledger</button>
        </form>
      </section>

      <!-- Recent Shipments Log -->
      <section class="card log-card">
        <h3>Receiving Ledger History</h3>
        <div v-if="store.stockInHistory.length === 0" class="empty-note">
          No stock receipts logged yet in this session.
        </div>
        <ul v-else class="log-list">
          <li v-for="entry in store.stockInHistory" :key="entry.id" class="log-item">
            <div>
              <strong>+{{ entry.inputQty }} {{ entry.uomTierLabel }}</strong>
              <span style="color: #059669; font-weight: 600">
                (+{{ entry.totalBaseUnits }} {{ entry.baseUnit }})</span
              >
              <div style="font-weight: 500; margin: 0.15rem 0">{{ entry.productName }}</div>
              <div class="log-meta">
                {{ entry.branchName }} • {{ entry.note }} • Exp: {{ entry.expiry }}
              </div>
            </div>
            <span class="log-time">{{ entry.date }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped src="./StockInView.css"></style>
