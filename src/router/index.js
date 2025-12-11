import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // '/' 경로 /dashboard 로 연결
        { 
            path: '/', 
            redirect: '/dashboard', 
            meta: { requiresAuth: true },
        },
        // 대시보드
        { 
            path: '/dashboard', 
            name: 'dashboard', 
            component: () => import('@/views/Dashboard/Dashboard.vue'), 
            meta: { requiresAuth: true },
        },
        // 예약 현황
        {
            path: '/reservation',
            name: 'reservation',
            children: [
                { path: 'list', component: () => import('@/views/Reservation/ReservationListPage.vue') },
                { path: 'pending', component: () => import('@/views/Reservation/PendingReservationPage.vue') },
                { path: 'schedule', component: () => import('@/views/Reservation/ReservationSchedulePage.vue') },
                { path: 'sms-history', component: () => import('@/views/Reservation/SmsHistoryPage.vue') }
            ]
        }
    ],
})

export default router