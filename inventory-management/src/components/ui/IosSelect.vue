<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronDown, Check, X, Search } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
    // Expected item: { value: string|number, label: string, sublabel?: string, badge?: string } or primitive
  },
  placeholder: {
    type: String,
    default: 'Select an option',
  },
  title: {
    type: String,
    default: 'Select Option',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  searchable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const searchQuery = ref('')
const triggerRef = ref(null)
const popoverPosition = ref({ top: '0px', left: '0px', width: '280px' })
const isMobile = ref(false)

function checkMobile() {
  isMobile.value = typeof window !== 'undefined' && window.innerWidth <= 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const normalizedOptions = computed(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? opt.id ?? '',
        label: opt.label ?? opt.name ?? opt.fullName ?? String(opt.value),
        sublabel: opt.sublabel ?? opt.category ?? opt.sku ?? '',
        badge: opt.badge ?? '',
      }
    }
    return { value: opt, label: String(opt), sublabel: '', badge: '' }
  })
})

const selectedOption = computed(() => {
  return normalizedOptions.value.find((o) => o.value === props.modelValue)
})

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) return normalizedOptions.value
  const q = searchQuery.value.toLowerCase()
  return normalizedOptions.value.filter(
    (o) => o.label.toLowerCase().includes(q) || o.sublabel.toLowerCase().includes(q),
  )
})

async function openDropdown() {
  if (props.disabled) return
  searchQuery.value = ''
  checkMobile()

  if (!isMobile.value && triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect()
    popoverPosition.value = {
      top: `${rect.bottom + 6}px`,
      left: `${rect.left}px`,
      width: `${Math.max(rect.width, 280)}px`,
    }
  }

  isOpen.value = true
  await nextTick()
}

function closeDropdown() {
  isOpen.value = false
}

function selectOption(opt) {
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  closeDropdown()
}
</script>

<template>
  <div class="ios-select-root" :class="{ disabled }">
    <!-- Trigger Pill -->
    <button
      ref="triggerRef"
      type="button"
      class="ios-select-trigger"
      :class="{ 'is-open': isOpen }"
      :disabled="disabled"
      @click="openDropdown"
    >
      <span class="trigger-label" :class="{ 'is-placeholder': !selectedOption }">
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>
      <ChevronDown :size="14" class="trigger-chevron" :class="{ rotated: isOpen }" />
    </button>

    <!-- Teleported iOS Action Sheet / Popover -->
    <Teleport to="body">
      <div v-if="isOpen" class="ios-picker-overlay" @click.self="closeDropdown">
        <!-- Desktop Popover -->
        <div v-if="!isMobile" class="ios-desktop-popover" :style="popoverPosition">
          <div v-if="searchable" class="popover-search">
            <Search :size="14" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="search-input"
              autofocus
            />
          </div>
          <div class="popover-list">
            <button
              v-for="opt in filteredOptions"
              :key="opt.value"
              type="button"
              class="popover-item"
              :class="{ selected: opt.value === modelValue }"
              @click="selectOption(opt)"
            >
              <div class="item-text">
                <span class="item-label">{{ opt.label }}</span>
                <span v-if="opt.sublabel" class="item-sub">{{ opt.sublabel }}</span>
              </div>
              <Check v-if="opt.value === modelValue" :size="14" class="item-check" />
            </button>
          </div>
        </div>

        <!-- Mobile Bottom Sheet (iOS Style) -->
        <div v-else class="ios-bottom-sheet" @click.stop>
          <div class="sheet-grabber-bar">
            <div class="sheet-grabber"></div>
          </div>

          <div class="sheet-header">
            <span class="sheet-title">{{ title }}</span>
            <button type="button" class="sheet-close-btn" @click="closeDropdown">
              <X :size="16" />
            </button>
          </div>

          <div v-if="searchable" class="sheet-search">
            <Search :size="14" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search options..."
              class="search-input"
            />
          </div>

          <div class="sheet-options-list">
            <button
              v-for="opt in filteredOptions"
              :key="opt.value"
              type="button"
              class="sheet-row"
              :class="{ 'row-active': opt.value === modelValue }"
              @click="selectOption(opt)"
            >
              <div class="row-content">
                <span class="row-label">{{ opt.label }}</span>
                <span v-if="opt.sublabel" class="row-sublabel">{{ opt.sublabel }}</span>
              </div>
              <div v-if="opt.badge" class="row-badge">{{ opt.badge }}</div>
              <div v-if="opt.value === modelValue" class="row-check">
                <Check :size="16" stroke-width="2.5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.ios-select-root {
  width: 100%;
  min-width: 0;
  position: relative;
  box-sizing: border-box;
}

.ios-select-trigger {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.68rem 1.1rem;
  border: 1.5px solid #e4e4e7;
  border-radius: 9999px;
  background: #ffffff;
  color: #18181b;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.16s ease;
  min-width: 0;
  outline: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.ios-select-trigger:focus,
.ios-select-trigger.is-open {
  border-color: #18181b;
  box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.08);
}

.trigger-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  text-align: left;
  flex: 1;
  font-weight: 500;
}

.trigger-label.is-placeholder {
  color: #a1a1aa;
}

.trigger-chevron {
  color: #71717a;
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.trigger-chevron.rotated {
  transform: rotate(180deg);
}

/* Teleported Overlay */
.ios-picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.36);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: overlayFade 0.2s ease;
}

@keyframes overlayFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Desktop Popover */
.ios-desktop-popover {
  position: fixed;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 18px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  max-height: 320px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10000;
  animation: popoverSpring 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popoverSpring {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.popover-search {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.85rem;
  border-bottom: 1px solid #f4f4f5;
  gap: 0.5rem;
}

.search-icon {
  color: #71717a;
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.84rem;
  width: 100%;
  color: #18181b;
}

.popover-list {
  overflow-y: auto;
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.popover-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.85rem;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.12s ease;
}

.popover-item:hover {
  background: #f4f4f5;
}

.popover-item.selected {
  background: #f4f4f5;
  font-weight: 700;
}

.item-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.item-label {
  font-size: 0.84rem;
  color: #18181b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-sub {
  font-size: 0.72rem;
  color: #71717a;
}

.item-check {
  color: #18181b;
  flex-shrink: 0;
}

/* Mobile Bottom Sheet (iOS Card Style) */
.ios-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-top-left-radius: 26px;
  border-top-right-radius: 26px;
  padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
  max-height: 80dvh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.16);
  animation: sheetSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  z-index: 10000;
}

@keyframes sheetSlideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.sheet-grabber-bar {
  display: flex;
  justify-content: center;
  padding-top: 0.65rem;
}

.sheet-grabber {
  width: 36px;
  height: 4px;
  background: #d4d4d8;
  border-radius: 9999px;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem 0.5rem;
  border-bottom: 1px solid #f4f4f5;
}

.sheet-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #18181b;
}

.sheet-close-btn {
  background: #f4f4f5;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #71717a;
  cursor: pointer;
  touch-action: manipulation;
}

.sheet-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.65rem 1.1rem;
  padding: 0.6rem 0.9rem;
  background: #f4f4f5;
  border-radius: 9999px;
}

.sheet-options-list {
  overflow-y: auto;
  max-height: 60dvh;
  padding: 0.4rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  -webkit-overflow-scrolling: touch;
}

.sheet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.12s ease;
}

.sheet-row:active {
  background: #f4f4f5;
}

.sheet-row.row-active {
  background: #f4f4f5;
}

.row-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1;
}

.row-label {
  font-size: 0.92rem;
  color: #18181b;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-row.row-active .row-label {
  font-weight: 800;
}

.row-sublabel {
  font-size: 0.76rem;
  color: #71717a;
}

.row-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #18181b;
  background: #e4e4e7;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.row-check {
  color: #18181b;
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
  flex-shrink: 0;
}
</style>
