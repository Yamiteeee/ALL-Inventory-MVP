<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { LOGIN_UI } from './loginConfig'
import { usePageEntrance } from '@/animations/usePageEntrance'
import { useTypewriter } from '@/animations/useTypewriter'

// Lucide Vue Next Icons
import {
  Lock,
  User,
  KeyRound,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-vue-next'

const router = useRouter()

const employeeId = ref('')
const password = ref('')
const errorMessage = ref('')

// 1. Run universal entrance animation
usePageEntrance()

// 2. Start typewriter right after the card spring settles (~380ms)
const { displayedText: portalTitle, isComplete: isTypingDone } = useTypewriter(
  LOGIN_UI.header.title,
  { speed: 30, delay: 380 },
)

// In-memory mock employee database
const employees = [
  { id: 'EMP-101', pass: 'admin123', name: 'Alex Rivera', role: 'Inventory Manager' },
  { id: 'EMP-102', pass: 'staff123', name: 'Sam Taylor', role: 'Warehouse Clerk' },
]

function fillCredentials(id, pass) {
  employeeId.value = id
  password.value = pass
  errorMessage.value = ''
}

function handleLogin() {
  errorMessage.value = ''

  const user = employees.find(
    (emp) =>
      emp.id.toLowerCase() === employeeId.value.trim().toLowerCase() && emp.pass === password.value,
  )

  if (user) {
    localStorage.setItem(
      'auth_employee',
      JSON.stringify({ name: user.name, role: user.role, id: user.id }),
    )

    router.push('/inventory')
  } else {
    errorMessage.value = LOGIN_UI.errors.invalidCredentials
  }
}
</script>

<template>
  <div class="login-viewport">
    <!-- Card springs in with authentic scale & position pop -->
    <div class="login-card anim-card">
      <!-- 1. Header (Staggers first) -->
      <div class="login-header anim-stagger">
        <div class="icon-disc">
          <Lock :size="20" stroke-width="2.2" />
        </div>
        <span class="eyebrow-pill">{{ LOGIN_UI.header.badge }}</span>

        <!-- Zero-shift layout lock: preserves card height while title writes out -->
        <h2 class="portal-title">
          <span class="ghost-reserve" aria-hidden="true">{{ LOGIN_UI.header.title }}</span>
          <span class="typing-active">
            {{ portalTitle }}
            <span class="typewriter-cursor" :class="{ hidden: isTypingDone }" aria-hidden="true"
              >|</span
            >
          </span>
        </h2>

        <p class="portal-subtitle">{{ LOGIN_UI.header.subtitle }}</p>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="error-banner anim-stagger">
        <AlertCircle :size="16" stroke-width="2.2" class="error-icon" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Auth Form (Inputs and button stagger sequentially) -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group anim-stagger">
          <label for="employeeId" class="label-with-icon">
            <User :size="13" stroke-width="2.2" />
            <span>{{ LOGIN_UI.form.employeeIdLabel }}</span>
          </label>
          <input
            id="employeeId"
            v-model="employeeId"
            type="text"
            class="form-control"
            :placeholder="LOGIN_UI.form.employeeIdPlaceholder"
            required
            autocomplete="username"
          />
        </div>

        <div class="input-group anim-stagger">
          <label for="password" class="label-with-icon">
            <KeyRound :size="13" stroke-width="2.2" />
            <span>{{ LOGIN_UI.form.passwordLabel }}</span>
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control"
            :placeholder="LOGIN_UI.form.passwordPlaceholder"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn-signin anim-stagger">
          <span>{{ LOGIN_UI.form.submitButton }}</span>
          <ArrowRight :size="15" stroke-width="2.2" class="btn-arrow" />
        </button>
      </form>

      <!-- Clickable Demo Credentials Pill Card -->
      <div class="demo-card anim-stagger">
        <div class="demo-title">
          <ShieldCheck :size="14" stroke-width="2.2" />
          <span>{{ LOGIN_UI.demoHelpers.title }}</span>
        </div>
        <div class="demo-list">
          <button
            v-for="acc in LOGIN_UI.demoHelpers.accounts"
            :key="acc.id"
            type="button"
            class="demo-chip"
            @click="fillCredentials(acc.id, acc.pass)"
          >
            <span class="chip-role">{{ acc.role }}:</span>
            <code class="chip-code">{{ acc.id }}</code>
            <span class="chip-sep">/</span>
            <code class="chip-code">{{ acc.pass }}</code>
          </button>
        </div>
      </div>

      <!-- Return Footer -->
      <div class="login-footer anim-footer">
        <RouterLink to="/" class="back-link">
          <ArrowLeft :size="13" stroke-width="2.2" />
          <span>{{ LOGIN_UI.footer.backText }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped src="./LoginView.css"></style>
