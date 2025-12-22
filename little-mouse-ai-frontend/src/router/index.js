import {createRouter, createWebHistory} from 'vue-router'

import Layout from '@/views/layout/index.vue'
import Login from '@/views/login/index.vue'
import Home from "@/views/layout/Home.vue";
import RequestHistory from "@/views/layout/RequestHistory.vue";
import BotManagement from "@/views/layout/BotManagement.vue";
import ModelManagement from "@/views/layout/ModelManagement.vue";
import Settings from "@/views/layout/Settings.vue";
import ProcessManagement from "@/views/layout/ProcessManagement.vue";
import {verifyLoginSession} from "@/api/loginApi.js";

const routes = [
    {
        path: '/', component: Layout, children: [
            {path: '', component: Home},
            {path: '/requests', component: RequestHistory},
            {path: '/bots', component: BotManagement},
            {path: '/models', component: ModelManagement},
            {path: '/processes', component: ProcessManagement},
            {path: '/settings', component: Settings},
        ]
    },
    {path: '/login', component: Login},
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to, from) => {
    if (
        // 检查用户是否已登录
        !verifyLoginSession &&
        // 避免无限重定向
        to.name !== 'Login'
    ) {
        // 将用户重定向到登录页面
        return {name: 'Login'}
    }
})

export default router