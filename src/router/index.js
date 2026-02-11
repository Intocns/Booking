import { showAlert } from "@/utils/ui";
import { createRouter, createWebHistory } from "vue-router";
import { usePlaceStore } from "@/stores/placeStore";
import { useModalStore } from "@/stores/modalStore";
import { useProductStore } from "@/stores/productStore";

/** useFlag 1일 때만 접근 가능한 네이버 플레이스 경로 (URL 직접 입력·새로고침 시 차단) */
const PLACE_PATHS_REQUIRE_LINK = ['/place/product', '/place/option', '/place/simple-reservation', '/place/settings'];
function isRestrictedPlacePath(path) {
    return PLACE_PATHS_REQUIRE_LINK.some((p) => path === p || path.startsWith(p + '/'));
}

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // '/' 경로 /dashboard 로 연결
        { 
            path: '/', 
            redirect: '/dashboard', 
            meta: { requiresAuth: true },
        },
        { path: '/dashboard', name: 'dashboard', component: () => import('@/views/Dashboard/Dashboard.vue'), meta: { requiresAuth: true } },
        { path: '/mylink/naverReserveCallBack', name: 'naverReserveCallBack', component: () => import('@/views/Place/NaverCallbackPage.vue'), meta: { requiresAuth: false } },
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
                { path: 'account', name: 'placeAccount', component: () => import('@/views/Place/PlaceAccountPage.vue') },
                { path: 'naver-callback', name: 'placeNaverCallback', component: () => import('@/views/Place/NaverCallbackPage.vue'), meta: { requiresAuth: false } },
                // 2. 상품 관리
                { 
                    path: 'product', 
                    name: 'placeProduct', 
                    component: () => import('@/views/Place/PlaceProductPage.vue') 
                },
                // 2. 상품 관리 > 등록
                { 
                    path: 'product/detail', 
                    name: 'placeProductDetail', 
                    component: () => import('@/views/Place/PlaceProductDetail.vue') 
                },
                // 2. 상품 관리 > 수정 
                { 
                    path: 'product/edit/:id', // id를 파라미터로 받음
                    name: 'placeProductEdit', 
                    component: () => import('@/views/Place/PlaceProductEdit.vue') 
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
                    component: () => import('@/views/Place/PlaceSettingsPage.vue'),
                }
            ]
        },
        // 인투펫 관리
        {
            path: '/intoPet',
            name: 'intoPet',
            meta: { requiresAuth: true },
            children: [
                // 1. 운영설정
                { 
                    path: 'settings', 
                    name: 'intoPetSettings', 
                    component: () => import('@/views/IntoPet/IntoPetSettingsPage.vue'),
                },
                // 2. 진료실 관리
                { 
                    path: 'clinic', 
                    name: 'intoPetClinic', 
                    component: () => import('@/views/IntoPet/IntoPetClinicPage.vue'),
                },
            ]
        },
    ],
})

router.beforeEach(async (to, from, next) => {
    if (to.matched.some(record => record.meta?.isWaiting) || to.meta?.isWaiting) {
        showAlert('서비스 준비 중입니다.');
        return next(false);
    }
    if (isRestrictedPlacePath(to.path)) {
        const placeStore = usePlaceStore();
        await placeStore.fetchNaverLinkUseFlag();
        if (placeStore.naverUseFlag !== 1) {
            const modalStore = useModalStore();
            modalStore.naverConnectRequiredModal.openModal();
            return next(false);
        }
    }



    // 접근하는 모든 화면에서 상품이 0개면 상품 등록 필요 모달 노출
    // 단,
    //  - 실제 상품 등록 화면(/place/product/detail)에서는 팝업을 띄우지 않는다.
    //  - 네이버 계정 연동(useFlag !== 1) 상태에서는 상품 여부 팝업을 띄우지 않는다.
    if (to.matched.some((r) => r.meta?.requiresAuth) && !to.path.startsWith('/place/product/detail')) {
        const placeStore = usePlaceStore();
        // 아직 연동되지 않은 경우에는 상품 여부 팝업 스킵
        if (placeStore.naverUseFlag !== 1) {
            return next();
        }
        try {
            const productStore = useProductStore();
            await productStore.getProductList();
            const list = productStore.productList ?? [];
            if (list.length === 0) {
                const modalStore = useModalStore();
                modalStore.productRegistrationModal.openModal();
            }
        } catch {
            // 상품 목록 조회 실패 시 모달은 띄우지 않음
        }
    }
    next();
})
export default router