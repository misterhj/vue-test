import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProductsView from '../views/ProductsView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfileView from '../views/ProfileView.vue'
import ConfirmEmailView from '../views/ConfirmEmailView.vue'

const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: 'home',
		component: HomeView,
		meta: { requiresAuth: true }
	},
	{
		path: '/products',
		name: 'products',
		component: ProductsView,
		meta: { requiresAuth: true }
	},
	{
		path: '/login',
		name: 'login',
		component: LoginView,
		meta: { guestOnly: true }
	},
	{
		path: '/register',
		name: 'register',
		component: RegisterView,
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
  const token = localStorage.getItem('auth_token')

  if (to.meta.requiresAuth && !token) {
    return next({ name: 'login' })
  }

  if (to.meta.guestOnly && token) {
    return next({ name: 'home' })
  }
  next()
})

export default router