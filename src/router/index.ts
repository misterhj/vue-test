import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../Views/HomeView.vue'
import ProductsView from '../Views/ProductsView.vue'
import LoginView from '../Views/LoginView.vue'
import RegisterView from '../Views/RegisterView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/products',
    name: 'products',
    component: ProductsView
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')
  if (to.meta.guestOnly && token) {
    return next({ name: 'products' })
  }
  next()
})

export default router