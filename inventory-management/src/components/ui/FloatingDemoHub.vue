<script setup>
import { ref } from 'vue'
import { useInventoryStore } from '@/stores/inventoryStore'

// Lucide Vue Next Icons
import {
  Sparkles,
  ShoppingCart,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Truck,
  CheckCircle2,
} from 'lucide-vue-next'

const store = useInventoryStore()

// State: whether the floating demo box is expanded or collapsed
const isExpanded = ref(true)
const resetNotification = ref('')

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function handleResetStocks() {
  store.resetDemoStocks()
  resetNotification.value = 'Branch stocks reset to baseline!'
  setTimeout(() => {
    resetNotification.value = ''
  }, 3000)
}
</script>

<template>
  <aside class="floating-demo-hub" aria-label="Demo Sandbox Systems">
    <!-- 1. Collapsed Floating Pill Trigger -->
    <transition name="hub-fade">
      <button
        v-if="!isExpanded"
        type="button"
        class="hub-trigger-pill"
        title="Open External Demo Systems Hub"
        @click="toggleExpanded"
      >
        <span class="status-dot-pulse"></span>
        <Sparkles :size="14" class="hub-icon-sparkle" />
        <span class="hub-pill-label">Storefront POS Demo</span>
        <span class="hub-badge-count">Cashier</span>
        <ChevronUp :size="13" class="hub-chevron" />
      </button>
    </transition>

    <!-- 2. Expanded Floating Sandbox Box -->
    <transition name="hub-spring">
      <div v-if="isExpanded" class="hub-card">
        <!-- Header -->
        <div class="hub-card-header">
          <div class="hub-header-title-group">
            <div class="hub-icon-badge">
              <Sparkles :size="14" />
            </div>
            <div>
              <div class="hub-title">Storefront POS Demo</div>
              <div class="hub-subtitle">Retail checkout register & cashier demo</div>
            </div>
          </div>

          <button
            type="button"
            class="btn-hub-minimize"
            title="Minimize to floating pill"
            aria-label="Minimize"
            @click="toggleExpanded"
          >
            <ChevronDown :size="15" />
          </button>
        </div>

        <!-- Feedback Alert -->
        <transition name="hub-fade">
          <div v-if="resetNotification" class="hub-reset-toast">
            <CheckCircle2 :size="13" />
            <span>{{ resetNotification }}</span>
          </div>
        </transition>

        <!-- Feature List -->
        <div class="hub-feature-list">
          <!-- 1. Point of Sale (POS) -->
          <article class="hub-feature-item">
            <div class="feature-top-meta">
              <span class="feature-tag tag-pos">Storefront Cashier</span>
              <span class="feature-stat font-mono">
                {{ store.salesHistory?.length || 0 }} sales
              </span>
            </div>

            <div class="feature-main">
              <div class="feature-icon-wrap icon-pos">
                <ShoppingCart :size="16" />
              </div>
              <div class="feature-texts">
                <div class="feature-title">Point of Sale (POS)</div>
                <div class="feature-desc">
                  Bulk order staging, client loyalty rates & instant receipts.
                </div>
              </div>
            </div>

            <div class="feature-action-row">
              <RouterLink to="/sales" class="btn-launch-feature">
                <span>Launch POS Register</span>
                <ArrowRight :size="12" />
              </RouterLink>
            </div>
          </article>
        </div>

        <!-- Sandbox Quick Utilities Row -->
        <div class="hub-utilities-row">
          <button
            type="button"
            class="btn-util"
            title="Reset branch on-hand stocks to baseline"
            @click="handleResetStocks"
          >
            <RotateCcw :size="12" />
            <span>Reset Demo Stocks</span>
          </button>

          <RouterLink to="/transport" class="btn-util" title="Inspect unified logistics ledger">
            <Truck :size="12" />
            <span>Ledger Audit</span>
          </RouterLink>
        </div>

        <!-- Footer / Live Sync Status -->
        <div class="hub-card-footer">
          <span class="footer-sync-indicator">
            <span class="sync-dot"></span>
            <span>Live inventory sync active</span>
          </span>
          <button type="button" class="btn-hub-hide-text" @click="toggleExpanded">Hide</button>
        </div>
      </div>
    </transition>
  </aside>
</template>

<style scoped>
.floating-demo-hub {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 999;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

/* 1. Collapsed Floating Pill */
.hub-trigger-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  background: rgba(24, 24, 27, 0.94);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.22),
    0 2px 6px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  touch-action: manipulation;
  user-select: none;
}

.hub-trigger-pill:hover {
  background: #000000;
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
}

.status-dot-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.7);
  animation: pulseGreen 2s infinite ease-in-out;
}

@keyframes pulseGreen {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.6;
  }
}

.hub-icon-sparkle {
  color: #facc15;
}

.hub-pill-label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.hub-badge-count {
  font-size: 0.68rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.16);
  padding: 0.12rem 0.45rem;
  border-radius: 9999px;
  color: #f4f4f5;
}

.hub-chevron {
  color: #a1a1aa;
}

/* 2. Expanded Floating Sandbox Card */
.hub-card {
  width: 340px;
  max-width: calc(100vw - 2rem);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(228, 228, 231, 0.95);
  border-radius: 22px;
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.12),
    0 2px 10px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  box-sizing: border-box;
  color: #18181b;
}

.hub-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #f4f4f5;
}

.hub-header-title-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.hub-icon-badge {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: #18181b;
  color: #facc15;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hub-title {
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #18181b;
  line-height: 1.2;
}

.hub-subtitle {
  font-size: 0.68rem;
  color: #71717a;
  line-height: 1.2;
}

.btn-hub-minimize {
  background: #f4f4f5;
  border: none;
  color: #71717a;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  touch-action: manipulation;
}

.btn-hub-minimize:hover {
  background: #e4e4e7;
  color: #18181b;
}

/* Reset Toast Notification */
.hub-reset-toast {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  color: #166534;
  font-size: 0.72rem;
  font-weight: 700;
}

/* Feature List */
.hub-feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.hub-feature-item {
  background: #fafafc;
  border: 1px solid #e4e4e7;
  border-radius: 16px;
  padding: 0.75rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: all 0.16s ease;
}

.hub-feature-item:hover {
  background: #ffffff;
  border-color: #d4d4d8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.feature-top-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feature-tag {
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
}

.tag-pos {
  background: #eff6ff;
  color: #1d4ed8;
}

.tag-po {
  background: #fdf2f8;
  color: #be185d;
}

.feature-stat {
  font-size: 0.68rem;
  color: #71717a;
  font-weight: 600;
}

.feature-main {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.feature-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-pos {
  background: #dbeafe;
  color: #1e40af;
}

.icon-po {
  background: #fce7f3;
  color: #9d174d;
}

.feature-texts {
  min-width: 0;
  flex: 1;
}

.feature-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 0.1rem;
}

.feature-desc {
  font-size: 0.68rem;
  color: #52525b;
  line-height: 1.35;
}

.feature-action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.15rem;
}

.btn-launch-feature {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: #18181b;
  color: #ffffff;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
  touch-action: manipulation;
}

.btn-launch-feature:hover {
  background: #27272a;
  transform: translateY(-1px);
}

/* Utilities Row */
.hub-utilities-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding-top: 0.45rem;
  border-top: 1px solid #f4f4f5;
}

.btn-util {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.45rem 0.65rem;
  background: #f4f4f5;
  color: #52525b;
  border: 1px solid #e4e4e7;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-util:hover {
  background: #e4e4e7;
  color: #18181b;
}

/* Card Footer */
.hub-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.25rem;
  font-size: 0.66rem;
  color: #71717a;
}

.footer-sync-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.sync-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #22c55e;
}

.btn-hub-hide-text {
  background: transparent;
  border: none;
  color: #a1a1aa;
  cursor: pointer;
  font-size: 0.66rem;
  text-decoration: underline;
  padding: 0;
}

.btn-hub-hide-text:hover {
  color: #18181b;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* Spring Popup & Fade Transitions */
.hub-spring-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.hub-spring-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.hub-spring-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}
.hub-spring-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

.hub-fade-enter-active,
.hub-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.hub-fade-enter-from,
.hub-fade-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

/* Mobile Screens */
@media (max-width: 768px) {
  .floating-demo-hub {
    bottom: 1rem;
    right: 1rem;
  }

  .hub-card {
    width: 320px;
    max-height: 85dvh;
    overflow-y: auto;
    border-radius: 18px;
    padding: 1rem;
  }
}
</style>
