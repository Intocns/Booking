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
            meta: { requiresAuth: true },
            children: [
                { path: 'list', name: 'reservationList', component: () => import('@/views/Reservation/ReservationListPage.vue') },
                { path: 'pending', name: 'pendingList', component: () => import('@/views/Reservation/PendingReservationPage.vue') },
                { path: 'schedule', name: 'reservationShedule', component: () => import('@/views/Reservation/ReservationSchedulePage.vue') },
                { path: 'sms-history', name: 'smsHistory', component: () => import('@/views/Reservation/SmsHistoryPage.vue') }
            ]
        },
        // 네이버 플레이스 관리
        {
            path: '/place',
            name: 'place',
            meta: { requiresAuth: true },
            children: [
                // 1. 네이버 연동 계정 관리
                { 
                    path: 'account', 
                    name: 'placeAccount', 
                    component: () => import('@/views/Place/PlaceAccountPage.vue') 
                },
                
                // 2. 상품 관리
                { 
                    path: 'product', 
                    name: 'placeProduct', 
                    component: () => import('@/views/Place/PlaceProductPage.vue') 
                },
                
                // 3. 옵션 관리
                { 
                    path: 'option', 
                    name: 'placeOption', 
                    component: () => import('@/views/Place/PlaceOptionPage.vue') 
                },
                
                // 4. 간단 예약 관리
                { 
                    path: 'simple-reservation', 
                    name: 'placeSimpleReservation', 
                    component: () => import('@/views/Place/PlaceSimpleReservationPage.vue') 
                },
                
                // 5. 플레이스 설정
                { 
                    path: 'settings', 
                    name: 'placeSettings', 
                    component: () => import('@/views/Place/PlaceSettingsPage.vue') 
                }
            ]
        },
    ],
})

export default router