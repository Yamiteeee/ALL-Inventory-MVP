<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'

const store = useInventoryStore()

const selectedBranch = ref(store.branches[0]?.id || '')
const selectedVariantId = ref(store.flatVariants[0]?.id || '')
const uomTier = ref('level2')
const quantity = ref(10)
const batchExpiry = ref('')
const supplierNote = ref('')
const successMessage = ref('')

const currentVariant = computed(() => {
  return store.flatVariants.find((v) => v.id === selectedVariantId.value)
})

const calculatedBaseUnits = computed(() => {
  if (!currentVariant.value) return 0
  const qty = Number(quantity.value) || 0
  if (uomTier.value === 'level1') return qty
  if (uomTier.value === 'level2') return qty * (currentVariant.value.uom.level2?.multiplier || 1)
  if (uomTier.value === 'level3') {
    return (
      qty *
      (currentVariant.value.uom.level2?.multiplier || 1) *
      (currentVariant.value.uom.level3?.multiplier || 1)
    )
  }
  return 0
})

function handleSubmitStockIn() {
  if (quantity.value <= 0 || !currentVariant.value) return

  store.receiveStock({
    branchId: selectedBranch.value,
    variantId: selectedVariantId.value,
    inputQty: quantity.value,
    uomTier: uomTier.value,
    supplierNote: supplierNote.value,
    batchExpiry: batchExpiry.value,
  })

  successMessage.value = `Logged delivery for ${currentVariant.value.fullName} (+${calculatedBaseUnits.value} ${currentVariant.value.uom.level1.unit})!`
  supplierNote.value = ''
  batchExpiry.value = ''

  setTimeout(() => {
    successMessage.value = ''
  }, 3500)
}
</script>

<template>
  <div class="stock-container">
    <header class="header">
      <RouterLink to="/inventory" class="back-link">← Back to Master Catalog</RouterLink>
      <h2>PO Intake & Warehouse Stock In</h2>
      <p class="subtitle">Log arriving shipments directly into variant-level inventory batches.</p>
    </header>

    <div v-if="successMessage" class="alert-success">✅ {{ successMessage }}</div>

    <div class="grid-layout">
      <section class="card form-card">
        <h3>Intake Entry</h3>
        <form @submit.prevent="handleSubmitStockIn">
          <div class="form-group">
            <label>Destination Branch / Commissary</label>
            <select v-model="selectedBranch" required>
              <option v-for="b in store.branches" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Sub-Product / Variant</label>
            <select v-model="selectedVariantId" required>
              <option v-for="item in store.flatVariants" :key="item.id" :value="item.id">
                [{{ item.category }}] {{ item.fullName }}
              </option>
            </select>
          </div>

          <div class="form-group" v-if="currentVariant">
            <label>Packaging Tier (UOM)</label>
            <select v-model="uomTier">
              <option value="level1">
                Level 1: Primary (1 {{ currentVariant.uom.level1.unit }})
              </option>
              <option value="level2">
                Level 2: Box/Bundle (1 {{ currentVariant.uom.level2.unit }} =
                {{ currentVariant.uom.level2.multiplier }} {{ currentVariant.uom.level1.unit }})
              </option>
              <option value="level3">
                Level 3: Pallet (1 {{ currentVariant.uom.level3.unit }} =
                {{ currentVariant.uom.level3.multiplier }} boxes)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Quantity Received</label>
            <input v-model.number="quantity" type="number" min="1" required />
            <small style="color: #2563eb; font-weight: 600; margin-top: 0.25rem">
              Converts to: {{ calculatedBaseUnits }} base {{ currentVariant?.uom.level1.unit }}
            </small>
          </div>

          <div class="form-group" v-if="currentVariant?.isPerishable">
            <label>Batch Expiry Date (Perishable Item)</label>
            <input v-model="batchExpiry" type="date" required />
          </div>

          <div class="form-group">
            <label>Supplier / PO Reference</label>
            <input v-model="supplierNote" placeholder="e.g. PO #9910 - Golden Dragon" />
          </div>

          <button type="submit" class="btn btn-primary">+ Post Stock to Ledger</button>
        </form>
      </section>

      <section class="card log-card">
        <h3>Recent Receiving Logs</h3>
        <div v-if="store.stockInHistory?.length === 0" class="empty-note">
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
