<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useInventoryStore } from '../../stores/inventoryStore'

const store = useInventoryStore()

const selectedBranch = ref(store.branches[0]?.id || '')
const selectedVariantId = ref(store.flatVariants[0]?.id || '')
const quantity = ref(1)

const customerMode = ref('existing')
const selectedCustomerId = ref(store.customers[0]?.id || '')
const newCustomerName = ref('')
const buyerDiscount = ref(store.customers[0]?.defaultDiscount || 0)

const specialDiscount = ref(0)
const specialReason = ref('')

const successMessage = ref('')
const errorMessage = ref('')

function onCustomerChange() {
  const cust = store.customers.find((c) => c.id === selectedCustomerId.value)
  if (cust) {
    buyerDiscount.value = cust.defaultDiscount
  }
}

function handleRemoveCustomer() {
  if (selectedCustomerId.value === 'c-walkin') return
  const cust = store.customers.find((c) => c.id === selectedCustomerId.value)
  if (!cust) return

  if (window.confirm(`Remove "${cust.name}" from recurring buyers?`)) {
    store.removeCustomer(selectedCustomerId.value)
    selectedCustomerId.value = store.customers[0]?.id || ''
    onCustomerChange()
  }
}

const availableStock = computed(() => {
  return store.branchStocks[selectedBranch.value]?.[selectedVariantId.value] || 0
})

const currentVariant = computed(() => {
  return store.flatVariants.find((v) => v.id === selectedVariantId.value)
})

const subtotal = computed(() => {
  return (currentVariant.value?.baseCost || 0) * (Number(quantity.value) || 0)
})

const totalDiscountPercent = computed(() => {
  return Math.min(100, Number(buyerDiscount.value || 0) + Number(specialDiscount.value || 0))
})

const totalDiscountAmount = computed(() => {
  return subtotal.value * (totalDiscountPercent.value / 100)
})

const finalTotal = computed(() => {
  return Math.max(0, subtotal.value - totalDiscountAmount.value)
})

function handleCompleteSale() {
  errorMessage.value = ''
  successMessage.value = ''

  if (quantity.value > availableStock.value) {
    errorMessage.value = `Cannot complete sale. Only ${availableStock.value} ${currentVariant.value?.uom.level1.unit} available in this branch!`
    return
  }

  const custName =
    customerMode.value === 'new'
      ? newCustomerName.value
      : store.customers.find((c) => c.id === selectedCustomerId.value)?.name ||
        'Walk-in Retail Buyer'

  try {
    store.recordSale({
      branchId: selectedBranch.value,
      variantId: selectedVariantId.value,
      quantity: quantity.value,
      customerName: custName,
      buyerDiscountPercent: buyerDiscount.value,
      specialDiscountPercent: specialDiscount.value,
      specialReason: specialReason.value,
    })

    successMessage.value = `Sale completed! ₱${finalTotal.value.toFixed(2)} billed. Stock deducted.`

    if (customerMode.value === 'new') {
      const added = store.customers.find(
        (c) => c.name.toLowerCase() === newCustomerName.value.trim().toLowerCase(),
      )
      if (added) selectedCustomerId.value = added.id
      newCustomerName.value = ''
      customerMode.value = 'existing'
    }

    quantity.value = 1
    specialDiscount.value = 0
    specialReason.value = ''
  } catch (err) {
    errorMessage.value = err.message
  }
}
</script>

<template>
  <div class="sales-container">
    <header class="header">
      <RouterLink to="/inventory" class="back-link">← Back to Master Catalog</RouterLink>
      <h2>Point of Sale & Stock Out</h2>
      <p class="subtitle">
        Record supply sales, apply buyer loyalty discounts, and liquidate near-expiry stock.
      </p>
    </header>

    <div v-if="successMessage" class="alert-success">✅ {{ successMessage }}</div>
    <div v-if="errorMessage" class="alert-error">⚠️ {{ errorMessage }}</div>

    <div class="sales-grid">
      <section class="card">
        <h3>New Sale Order</h3>
        <form @submit.prevent="handleCompleteSale">
          <div class="form-row">
            <div class="form-group">
              <label>Branch Source</label>
              <select v-model="selectedBranch">
                <option v-for="b in store.branches" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Available Stock</label>
              <input
                :value="`${availableStock} ${currentVariant?.uom.level1.unit || ''}`"
                disabled
                readonly
              />
            </div>
          </div>

          <div class="form-group">
            <label>Sub-Product / Variant Item</label>
            <select v-model="selectedVariantId">
              <option v-for="p in store.flatVariants" :key="p.id" :value="p.id">
                {{ p.fullName }} — ₱{{ p.baseCost.toFixed(2) }} / {{ p.uom.level1.unit }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Quantity to Sell</label>
            <input v-model.number="quantity" type="number" min="1" :max="availableStock" required />
          </div>

          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 1.25rem 0" />

          <h3>Customer Loyalty & Discounts</h3>
          <div class="form-group">
            <label>Customer Selection</label>
            <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem; font-size: 0.85rem">
              <label
                ><input type="radio" value="existing" v-model="customerMode" /> Saved Buyer</label
              >
              <label
                ><input type="radio" value="new" v-model="customerMode" /> + New Recurring
                Buyer</label
              >
            </div>

            <div
              v-if="customerMode === 'existing'"
              style="display: flex; gap: 0.5rem; align-items: center"
            >
              <select v-model="selectedCustomerId" @change="onCustomerChange" style="flex: 1">
                <option v-for="c in store.customers" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.tier }} - {{ c.defaultDiscount }}% off)
                </option>
              </select>
              <button
                type="button"
                @click="handleRemoveCustomer"
                :disabled="selectedCustomerId === 'c-walkin'"
                style="
                  padding: 0.65rem 0.9rem;
                  background: #fee2e2;
                  color: #dc2626;
                  border: 1px solid #fca5a5;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 600;
                "
              >
                🗑️
              </button>
            </div>

            <input
              v-else
              v-model="newCustomerName"
              placeholder="Enter Client / Cafe Name"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Buyer Discount (%)</label>
              <input v-model.number="buyerDiscount" type="number" min="0" max="100" />
            </div>

            <div class="form-group">
              <label>Special / Expiry Discount (%)</label>
              <input v-model.number="specialDiscount" type="number" min="0" max="100" />
            </div>
          </div>

          <div class="form-group" v-if="specialDiscount > 0">
            <label>Discount Reason</label>
            <input
              v-model="specialReason"
              placeholder="e.g. Near-Expiry Clearance, Promo Event"
              required
            />
          </div>

          <div class="price-summary">
            <div class="summary-line">
              <span>Subtotal:</span>
              <span>₱{{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="summary-line discount" v-if="totalDiscountPercent > 0">
              <span>Discount ({{ totalDiscountPercent }}%):</span>
              <span>- ₱{{ totalDiscountAmount.toFixed(2) }}</span>
            </div>
            <div class="summary-line total">
              <span>Final Bill Amount:</span>
              <span>₱{{ finalTotal.toFixed(2) }}</span>
            </div>
          </div>

          <button type="submit" class="btn-sale" :disabled="availableStock <= 0">
            ✓ Process Sale & Deduct Stock
          </button>
        </form>
      </section>

      <section class="card">
        <h3>Recent Sales Activity</h3>
        <div v-if="store.salesHistory?.length === 0" class="empty-note">
          No sales orders completed yet this session.
        </div>
        <ul v-else class="receipt-list">
          <li v-for="s in store.salesHistory" :key="s.id" class="receipt-item">
            <div class="receipt-header">
              <strong>{{ s.customerName }}</strong>
              <span class="receipt-total">₱{{ s.finalTotal.toFixed(2) }}</span>
            </div>
            <div>-{{ s.quantity }} {{ s.unit }} of {{ s.productName }}</div>
            <div class="receipt-sub">{{ s.branchName }} • {{ s.date }}</div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped src="./SalesView.css"></style>
