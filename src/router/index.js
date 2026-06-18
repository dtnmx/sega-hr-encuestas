import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Rutas del .md §2. Por ahora las vistas son stubs de Fase 1.
// El guard de auth para /admin/* se conecta en la Fase 1 (stores/auth.js).
const routes = [
  {
    path: '/',
    name: 'survey',
    component: () => import('../views/PublicSurveyView.vue'),
  },
  {
    path: '/gracias',
    name: 'thank-you',
    component: () => import('../views/ThankYouView.vue'),
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../views/AdminLoginView.vue'),
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import('../views/AdminDashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/comentarios',
    name: 'admin-comments',
    component: () => import('../views/AdminCommentsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/plan',
    name: 'admin-plan',
    component: () => import('../views/AdminPlanView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/password',
    name: 'admin-password',
    component: () => import('../views/AdminChangePasswordView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard de acceso al panel admin.
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'admin-login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'admin-login' && auth.isAuthenticated) {
    return { name: 'admin-dashboard' }
  }
})

export default router
