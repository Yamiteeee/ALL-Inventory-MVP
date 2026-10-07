<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'

const router = useRouter()

const employeeId = ref('')
const password = ref('')
const errorMessage = ref('')

// In-memory mock employee database
const employees = [
  { id: 'EMP-101', pass: 'admin123', name: 'Alex Rivera', role: 'Inventory Manager' },
  { id: 'EMP-102', pass: 'staff123', name: 'Sam Taylor', role: 'Warehouse Clerk' },
]

function handleLogin() {
  errorMessage.value = ''

  const user = employees.find(
    (emp) =>
      emp.id.toLowerCase() === employeeId.value.trim().toLowerCase() && emp.pass === password.value,
  )

  if (user) {
    // Store user session in memory / localStorage for MVP persistence
    localStorage.setItem(
      'auth_employee',
      JSON.stringify({ name: user.name, role: user.role, id: user.id }),
    )

    // Redirect straight to inventory dashboard
    router.push('/inventory')
  } else {
    errorMessage.value = 'Invalid Employee ID or password. Check demo credentials below.'
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <span class="logo-badge">📦</span>
        <h2>Employee Portal</h2>
        <p>Sign in to manage warehouse stock & orders</p>
      </div>

      <div v-if="errorMessage" class="error-banner">
        <span>⚠️ {{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="employeeId">Employee ID / Badge Number</label>
          <input
            id="employeeId"
            v-model="employeeId"
            type="text"
            placeholder="e.g. EMP-101"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn-submit">Sign In to Dashboard</button>
      </form>

      <!-- Mock Helpers for fast testing -->
      <div class="demo-credentials">
        <strong>Demo Login Accounts:</strong>
        <div>Manager: <code>EMP-101</code> / <code>admin123</code></div>
        <div>Staff: <code>EMP-102</code> / <code>staff123</code></div>
      </div>

      <RouterLink to="/" class="back-link">← Return to Landing Page</RouterLink>
    </div>
  </div>
</template>

<style scoped src="./LoginView.css"></style>
