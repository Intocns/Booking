import { showAlert } from "@/utils/ui";
import { createRouter, createWebHistory } from "vue-router";
import { usePlaceStore } from "@/stores/placeStore";
import { useHospitalStore } from "@/stores/hospitalStore";
import { useModalStore } from "@/stores/modalStore";
import { useProductStore } from "@/stores/productStore";
import { PLACE_HAS_PRODUCTS_STORAGE_KEY } from "@/constants/naver";
import { useDevice } from '@/composables/useDevice';
const isMobile = useDevice();

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
            meta: { requiresAuth: true, onlyPC: true, },
        },
        
        // 대시보드
        { 
            path: '/dashboard', 
            name: 'dashboard', 
            component: () => import('@/views/Dashboard/Dashboard.vue'),
            meta: { requiresAuth: true, onlyPC: true, } 
        },

        { path: '/mylink/naverReserveCallBack', name: 'naverReserveCallBack', component: () => import('@/views/Place/NaverCallbackPage.vue'), meta: { requiresAuth: false } },

        // 예약 현황
        {
            path: '/reservation',
            name: 'reservation',
            meta: { requiresAuth: true },
            children: [
                { 
                    path: 'list', 
                    name: 'reservationList', 
                    component: isMobile
                        ? () => import('@/views/Mobile/Reservation/ReservationListPage.vue') 
                        : () => import('@/views/Reservation/ReservationListPage.vue') 
                },
                {
                    path: 'pending', 
                    name: 'pendingList', 
                    component: isMobile
                        ? () => import('@/views/Mobile/Reservation/PendingReservationPage.vue') 
                        : () => import('@/views/Reservation/PendingReservationPage.vue') 
                },
                { 
                    path: 'schedule', 
                    name: 'reservationShedule', 
                    component: isMobile
                        ? () => import('@/views/Mobile/Reservation/ReservationSchedulePage.vue') 
                        : () => import('@/views/Reservation/ReservationSchedulePage.vue') 
                },
                { 
                    path: 'sms-history', 
                    name: 'smsHistory', 
                    component: () => import('@/views/Reservation/SmsHistoryPage.vue'),
                    meta: {onlyPC: true} 
                }
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
                    component: () => import('@/views/Place/PlaceProductPage.vue'), 
                    meta: {onlyPC: true}
                },
                // 2. 상품 관리 > 등록
                { 
                    path: 'product/detail', 
                    name: 'placeProductDetail', 
                    component: () => import('@/views/Place/PlaceProductDetail.vue'), 
                    meta: {onlyPC: true}
                },
                // 2. 상품 관리 > 수정 
                { 
                    path: 'product/edit/:id', // id를 파라미터로 받음
                    name: 'placeProductEdit', 
                    component: () => import('@/views/Place/PlaceProductEdit.vue'),
                    meta: {onlyPC: true} 
                },
                
                // 3. 옵션 관리
                { 
                    path: 'option', 
                    name: 'placeOption', 
                    component: () => import('@/views/Place/PlaceOptionPage.vue') ,
                    meta: {onlyPC: true}
                },
                
                // 4. 간단 예약 관리
                { 
                    path: 'simple-reservation', 
                    name: 'placeSimpleReservation', 
                    component: () => import('@/views/Place/PlaceSimpleReservationPage.vue'),
                    meta: {onlyPC: true} 
                },
                
                // 5. 플레이스 설정
                { 
                    path: 'settings', 
                    name: 'placeSettings', 
                    component: () => import('@/views/Place/PlaceSettingsPage.vue'),
                    meta: {onlyPC: true},
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
                    meta: {onlyPC: true},
                },
                // 2. 진료실 관리
                { 
                    path: 'clinic', 
                    name: 'intoPetClinic', 
                    component: () => import('@/views/IntoPet/IntoPetClinicPage.vue'),
                    meta: {onlyPC: true},
                },
            ]
        },

        // 기타
        // 서비스 점검
        {
            path: '/maintenance',
            name: 'maintenance',
            component: () => import('@/views/MaintenanceView.vue'),
            meta: { isPublic: true }
        }
    ],
})

router.beforeEach(async (to, from, next) => {
    const modalStore = useModalStore();
    // 점검중일때 해당 값 true로
    const isMaintenance = false;
    // 점검중일때 페이지 이동 처리
    if (isMaintenance) {
        // 이동하려는 페이지가 점검 페이지가 아니라면 무조건 점검 페이지로 리다이렉트
        if (to.name !== 'maintenance') {
            return next({ name: 'maintenance' });
        }
    } else {
        // 점검 중이 아닌데 점검 페이지로 접속하려고 하면 메인으로 튕겨내기
        if (to.name === 'maintenance') {
            return next({ name: 'dashboard' }); 
        }
    }

    const isMobile = useDevice();
    if (isMobile && to.matched.some(record => record.meta.onlyPC)) {
        modalStore.confirmModal.openModal({
            text: '이 페이지는 PC 환경에서만 사용 가능합니다.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => {
                modalStore.confirmModal.closeModal();
                router.push({ name: 'reservationList' }); // 전체예약리스트화면으로
            }
        })
        return next(false);
    }
    const hospitalStore = useHospitalStore(); // SSO 데이터가 담기는 스토어

    if (to.matched.some(record => record.meta?.isWaiting) || to.meta?.isWaiting) {
        showAlert('서비스 준비 중입니다.');
        return next(false);
    }
    if (isRestrictedPlacePath(to.path)) {
        const placeStore = usePlaceStore();

        // hospitalData가 없으면(sso 로그인 인증 전) API 호출을 하지 않도록
        if (!hospitalStore.hospitalData?.cocode) {
             return next(); // App.vue가 처리할 수 있게 길을 열어줌
        }

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
    //  - 이전에 상품 1개 이상으로 확인된 경우(PLACE_HAS_PRODUCTS_STORAGE_KEY)에는 갯수 체크 생략
    if (to.matched.some((r) => r.meta?.requiresAuth) && !to.path.startsWith('/place/product/detail')) {
        const placeStore = usePlaceStore();
        // 아직 연동되지 않은 경우에는 상품 여부 팝업 스킵
        if (placeStore.naverUseFlag !== 1) {
            return next();
        }
        const hasProductsCached = localStorage.getItem(PLACE_HAS_PRODUCTS_STORAGE_KEY) === '1';
        if (hasProductsCached) {
            return next();
        }
        try {
            const productStore = useProductStore();
            await productStore.getProductList();
            const list = productStore.productList ?? [];
            if (list.length === 0) {
                const modalStore = useModalStore();
                modalStore.productRegistrationModal.openModal();
            } else {
                localStorage.setItem(PLACE_HAS_PRODUCTS_STORAGE_KEY, '1');
            }
        } catch {
            // 상품 목록 조회 실패 시 모달은 띄우지 않음
        }
    }
    next();
})

// 파일 로드 실패 시 에러 핸들링
router.onError((error, to) => {
    // 브라우저가 동적 임포트(Lazy Loading)에 실패했을 때 발생하는 에러 메시지들
    const errors = [
        'Failed to fetch dynamically imported module',
        'Loading chunk',
        'Error: Cannot find module'
    ];

    const isChunkError = errors.some(msg => error.message.includes(msg));

    if (isChunkError) {
        // alert('새 버전이 업데이트되어 페이지를 새로고침합니다.');

        const hasReloaded = window.sessionStorage.getItem('chunk-error-reloaded');

        if(!hasReloaded) {
            window.sessionStorage.setItem('chunk-error-reloaded', 'true');
            window.location.href = to.fullPath; 
        } else {
            console.error('파일을 불러오지 못함');
            window.sessionStorage.removeItem('chunk-error-reloaded');

            showAlert('업데이트 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')
        }

    }
});

export default router