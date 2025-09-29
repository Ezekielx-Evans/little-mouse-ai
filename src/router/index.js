import { createMemoryHistory, createRouter } from 'vue-router'

import Layout from '@/views/layout/index.vue'
import Login from '@/views/login/index.vue'

const routes = [
    { path: '/', component: Layout },
    { path: '/login', component: Login },
]

const router = createRouter({
    history: createMemoryHistory(),
    routes,
})

export default router