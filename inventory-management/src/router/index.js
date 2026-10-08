import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/landing/LandingView.vue'
import LoginView from '../views/login/LoginView.vue'
import HomeView from '../views/home/HomeView.vue'
import StockInView from '../views/stock-in/StockInView.vue'
import SalesView from '../views/sales/SalesView.vue'
import WarehouseView from '../views/warehouse/WarehouseView.vue'

const routes = [
  { path: '/', name: 'landing', component: LandingView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/inventory', name: 'inventory', component: HomeView, meta: { requiresAuth: true } },
  { path: '/warehouse', name: 'warehouse', component: WarehouseView, meta: { requiresAuth: true } },
  { path: '/stock-in', name: 'stock-in', component: StockInView, meta: { requiresAuth: true } },
  { path: '/sales', name: 'sales', component: SalesView, meta: { requiresAuth: true } },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const loggedInUser = localStorage.getItem('auth_employee')
  if (to.meta.requiresAuth && !loggedInUser) {
    next({ name: 'login' })
  } else if (to.name === 'login' && loggedInUser) {
    next({ name: 'inventory' })
  } else {
    next()
  }
})

export default router
