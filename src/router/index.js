import {createRouter, createWebHistory} from 'vue-router'

import Layout from '@/views/layout/index.vue'
import Login from '@/views/login/index.vue'
import Home from "@/views/layout/Home.vue";
import RequestHistory from "@/views/layout/RequestHistory.vue";
import BotManagement from "@/views/layout/BotManagement.vue";
import ModelManagement from "@/views/layout/ModelManagement.vue";
import Settings from "@/views/layout/Settings.vue";

const routes = [
    {
        path: '/', component: Layout, children: [
            {path: '', component: Home},
            {path: '/requests', component: RequestHistory},
            {path: '/bots', component: BotManagement},
            {path: '/models', component: ModelManagement},
            {path: '/settings', component: Settings},
        ]
    },
    {path: '/login', component: Login},
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router