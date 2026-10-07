// src/views/auth/loginConfig.js

export const LOGIN_UI = {
  header: {
    badge: 'Enterprise Access',
    title: 'Employee Portal',
    subtitle: 'Sign in to manage warehouse inventory, stock transfers, and POS disbursements',
  },
  form: {
    employeeIdLabel: 'Employee ID / Badge Number',
    employeeIdPlaceholder: 'e.g. EMP-101',
    passwordLabel: 'Security Password',
    passwordPlaceholder: '••••••••',
    submitButton: 'Sign In to Dashboard',
  },
  errors: {
    invalidCredentials: 'Invalid Employee ID or password. Check demo credentials below.',
  },
  demoHelpers: {
    title: 'Demo Access Keys',
    accounts: [
      { role: 'Manager', id: 'EMP-101', pass: 'admin123' },
      { role: 'Staff', id: 'EMP-102', pass: 'staff123' },
    ],
  },
  footer: {
    backText: 'Return to Landing Page',
  },
}
