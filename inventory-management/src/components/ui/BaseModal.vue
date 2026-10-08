<script setup>
import { watch, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  eyebrow: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: '580px',
  },
})

const emit = defineEmits(['close'])

function handleKeyDown(e) {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

// Lock background scrolling and attach Esc key handler
watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <!-- Teleport to body escapes parent container overflow:hidden -->
  <Teleport to="body">
    <transition name="fade-modal">
      <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-card" :style="{ maxWidth }">
          <!-- Modal Header -->
          <header class="modal-header">
            <slot name="header">
              <div class="modal-title-group">
                <span v-if="eyebrow" class="modal-eyebrow">{{ eyebrow }}</span>
                <h2 v-if="title" class="modal-title">{{ title }}</h2>
              </div>
            </slot>
            <button
              type="button"
              class="modal-close-btn"
              aria-label="Close modal"
              @click="emit('close')"
            >
              <X :size="18" />
            </button>
          </header>

          <!-- Modal Scrollable Content -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- Optional Modal Footer -->
          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
/* Backdrop with blur */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(24, 24, 27, 0.42);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1.5rem;
  box-sizing: border-box;
}

/* Modal Surface with spring entrance */
.modal-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 26px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.16);
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  animation: modalSpring 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalSpring {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(12px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.4rem 1.8rem;
  border-bottom: 1px solid #f4f4f5;
  background: #ffffff;
  flex-shrink: 0;
}

.modal-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #71717a;
  background: #f4f4f5;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  display: inline-block;
  margin-bottom: 0.35rem;
}

.modal-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: #18181b;
}

.modal-close-btn {
  background: #f4f4f5;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #71717a;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.modal-close-btn:hover {
  background: #18181b;
  color: #ffffff;
}

/* Body */
.modal-body {
  padding: 1.5rem 1.8rem;
  overflow-y: auto;
  box-sizing: border-box;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #e4e4e7;
  border-radius: 9999px;
}

/* Footer (if provided) */
.modal-footer {
  padding: 1.1rem 1.8rem;
  border-top: 1px solid #f4f4f5;
  background: #fafafc;
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-shrink: 0;
}

/* Backdrop Transition */
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .modal-card {
    max-height: 94vh;
    border-radius: 20px;
  }
  .modal-header,
  .modal-body {
    padding: 1.2rem;
  }
}
</style>
