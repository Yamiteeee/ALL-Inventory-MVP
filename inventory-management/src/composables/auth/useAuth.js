import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LOGIN_UI } from '@/views/login/loginConfig'

export function useAuth() {
  const router = useRouter()

  const employeeId = ref('')
  const password = ref('')
  const errorMessage = ref('')

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

    const cleanId = employeeId.value.trim().toLowerCase()
    const user = employees.find(
      (emp) => emp.id.toLowerCase() === cleanId && emp.pass === password.value,
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

  return {
    employeeId,
    password,
    errorMessage,
    fillCredentials,
    handleLogin,
  }
}
