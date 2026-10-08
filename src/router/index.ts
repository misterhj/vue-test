import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProductsView from '../views/ProductsView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import ConfirmEmailView from '../views/ConfirmEmailView.vue'
import { useAuthStore } from '@/stores/auth'

const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: 'home',
		component: HomeView,
		meta: { requiresAuth: true }
	},
	{
		path: '/users',
		name: 'users',
		component: () => import('@/views/users/UsersListView.vue'),
		meta: { 
			requiresAuth: true,
			requiredPermission: 'users:read' 
		}
	},
	{
		path: '/users/roles',
		name: 'user-roles',
		component: () => import('@/views/users/RolesListView.vue'),
		meta: { 
			requiresAuth: true,
			requiredPermission: 'roles:read' 
		}
	},
	{
		path: '/products',
		name: 'products',
		component: ProductsView,
		meta: { 
		requiresAuth: true,
		requiredPermission: 'products:read' // 👈 Renombrado y estandarizado
		},
	},
	{
		path: '/login',
		name: 'login',
		component: LoginView,
		meta: { guestOnly: true }
	},
	{
		path: '/profile',
		name: 'profile',
		component: ProfileView,
		meta: { requiresAuth: true }
	},
	{
		path: '/confirm-email',
		name: 'confirm-email',
		component: ConfirmEmailView,
	}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 1. Si la ruta requiere invitado (ej. /login) y ya inició sesión
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'home' })
  }

  // 2. Si la ruta requiere autenticación
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  // 3. Verificación de permisos específicos por Slug
  if (to.meta.requiredPermission) {
    const requiredSlug = to.meta.requiredPermission as string
    if (!authStore.hasPermission(requiredSlug)) {
      return next({ name: 'home' }) // Redirige a inicio si no tiene acceso
    }
  }

  next()
})

export default router