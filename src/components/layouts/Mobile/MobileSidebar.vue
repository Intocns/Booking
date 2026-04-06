<script setup>
import icClose from '@/assets/icons/mobile/ic_close_b.svg'
import icChart from '@/assets/icons/mobile/ic_SNB_chart_m.svg'
import icPending from '@/assets/icons/mobile/ic_SNB_pending_m.svg'
import icPayment from '@/assets/icons/mobile/ic_SNB_payment_m.svg'
import icCotons from '@/assets/icons/mobile/ic_SNB_list_cotons_m.svg'
import icBooking from '@/assets/icons/mobile/ic_SNB_booking_m.svg'
import icNotice from '@/assets/icons/mobile/ic_SNB_notice_m.svg'
import icOpen from '@/assets/icons/mobile/ic_SNB_open.svg'
import icClosed from '@/assets/icons/mobile/ic_SNB_closed.svg'

import { ref, watch, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'

import { useHospitalStore } from '@/stores/hospitalStore';
import Cookies from 'js-cookie'
import { EXTERNAL_LINKS } from '@/constants'

const route = useRoute();
const router = useRouter();
const hospitalStore = useHospitalStore();

// 부모로부터 상태를 전달받음
const props = defineProps({
    isActive: Boolean
});
// 닫기 요청을 위한 emit 정의
const emit = defineEmits(['close']);

const isBookingPage = computed(() => {
    return route.path.includes('/reservation'); 
});

watch(() => props.isActive, (val) => {
    if (val && isBookingPage.value) {
        isBookingOpen.value = true;
    }
}, { immediate: true });

// 서브메뉴 열림 상태 제어
const isBookingOpen = ref(false);

const toggleBooking = () => {
    isBookingOpen.value = !isBookingOpen.value;
};

//wd 클릭 이벤트 => 이동
const openWd = () => {
    const at = Cookies.get('INTO_ACCESS');
    const rt = Cookies.get('INTO_REFRESH');

    window.open(`${EXTERNAL_LINKS.WD_SSO}?at=${at}&rt=${rt}`);
}
//오늘의 예약 현황 클릭 이벤트 => 이동
const openLinkMain = () => {
    window.open(EXTERNAL_LINKS.RESERVE_MAIN);
}
//수납완료 클릭 이벤트 => 이동
const openLinkReceiptComp = () => {
    window.open(EXTERNAL_LINKS.RECEIPT_COMP);
}
//진료대기/입원호텔 클릭 이벤트 => 이동
const openLinkWaitList = () => {
    window.open(EXTERNAL_LINKS.WAIT_LIST);
}
//우리병원차트 클릭 이벤트 => 이동
const openLinkChart = () => {
    window.open(EXTERNAL_LINKS.CHART_MAIN);
}
//공지사항 클릭 이벤트 => 이동
const openNotice = () => {
    window.open(EXTERNAL_LINKS.NOTICE);
}

// 배경 스크롤 방지 로직
watch(() => props.isActive, (val) => {
    if (val) {
        // 사이드바가 열리면 배경 스크롤 고정
        document.body.style.overflow = 'hidden';
    } else {
        // 사이드바가 닫히면 배경 스크롤 해제
        document.body.style.overflow = '';
    }
}, { immediate: true });

onMounted(() => {
    hospitalStore.getHospitalInfo(); // 병원정보 들고오기
})
</script>

<template>
    <div class="sidebar" :class="{ active: isActive }">
        <div class="top">
            <div class="d-flex justify-between">
                <div class="badge">병원진료</div>
                <div @click="$emit('close')"><img :src="icClose" alt="닫기" width="22"></div>
            </div>

            <div>
                <span class="hospital-name">{{ hospitalStore.hospitalData?.company_name }}</span>
            </div>

            <div class="user-name">
                <span>{{ hospitalStore.hospitalData?.user_name }}</span>
                <span>님</span>
            </div>
        </div>

        <div class="bottom">
            <nav>
                <div>
                    <div class="menu-title">인투플러스</div>
                    <ul class="menu">
                        <li @click="openLinkChart">
                            <div class="menu-name">
                                <img :src="icChart" alt="메뉴아이콘">
                                <span>우리병원차트</span>
                            </div>
                        </li>
                        <li @click="openLinkWaitList">
                            <div class="menu-name">
                                <img :src="icPending" alt="메뉴아이콘">
                                <span>진료대기 / 입원·호텔</span>
                            </div>
                        </li>
                        <li @click="openLinkReceiptComp">
                            <div class="menu-name">
                                <img :src="icPayment" alt="메뉴아이콘">
                                <span>수납완료</span>
                            </div>
                        </li>
                        <li @click="openWd">
                            <div class="menu-name">
                                <img :src="icCotons" alt="메뉴아이콘">
                                <span>Wearable Device</span>
                            </div>
                        </li>
                    </ul>
                </div>
                <div>
                    <div class="menu-title">예약관리자센터</div>
                    <ul class="menu">
                        <li @click="toggleBooking" :class="{ 'is-active': isBookingPage }">
                            <div class="menu-name">
                                <img :src="icBooking" alt="메뉴아이콘">
                                <span>예약 현황</span>
                            </div>

                            <span>
                                <img :src="isBookingOpen ? icClosed : icOpen" 
                                    alt="토글" 
                                    :class="{ 'is-rotated': isBookingOpen }">
                            </span>
                        </li>
                    </ul>
                    <div class="sub-menu-wrapper" :class="{ 'is-open': isBookingOpen }">
                        <div class="sub-menu" >
                            <div class="sub-menu__li" @click="openLinkMain">오늘의 예약 현황</div>
                            <RouterLink to="/reservation/list" class="sub-menu__li" active-class="active-text" @click="$emit('close')">
                                전체 예약 조회
                            </RouterLink>
                            <RouterLink to="/reservation/pending" class="sub-menu__li" active-class="active-text" @click="$emit('close')">
                                대기 예약 관리
                            </RouterLink>
                            <RouterLink to="/reservation/schedule" class="sub-menu__li" active-class="active-text" @click="$emit('close')">
                                예약 일정 확인
                            </RouterLink>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="menu-title">고객센터</div>
                    <ul class="menu">
                        <li @click="openNotice">
                            <div class="menu-name">
                                <img :src="icNotice" alt="메뉴아이콘">
                                <span>공지사항</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    </div>

    <!-- <div class="sidebar-overlay" :class="{ active: isActive }" @click="$emit('close')"></div> -->
</template>

<style lang="scss" scoped>
.sidebar {
    position:fixed;
    top: 0;
    right: 0;
    width: 100%;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    gap:20px;
    background-color: $gray-00;
    z-index: 1000;

    transform:  translateX(100%);
    // transition: transform 0.3s ease;

    &.active {transform: translateX(0);}

    .top {
        display: flex;
        flex-direction: column;
        gap:8px;
        padding: 26px 30px;
        background-color: #F8F8F8;
        border-bottom: 3px solid $gray-100;

        .badge {
            @include flex-center;
            height: 22px;
            padding: 0 6px;
            border-radius: 4px;
            background-color: $gray-900;;
            color: $gray-00;

            font-size: 11px;
            font-weight: 500;
            line-height: normal;
            letter-spacing: -0.3px;
        }

        .hospital-name {
            font-size: 20px;
            color: #111;
            font-weight: 600;
            line-height: normal;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            letter-spacing: -0.5px;
        }

        .user-name {
            font-size:15px;
            font-weight: 400;
            line-height: normal;
            color: #737373;
        }
    }

    .bottom {
        flex: 1;
        min-height: 0;
        overflow-y: auto;

        nav {
            display:flex;
            flex-direction: column;
            gap:20px;
        }
        .menu-title {
            padding: 7px 30px;
            color: #737373;
            font-size: 13px;
            font-weight: 500;
            line-height: normal;
        }
        
        .menu {
            li {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 30px;
                border-bottom: 1px solid $gray-100;
                color: #111;
                font-size: 16px;
                font-weight: 500;
                line-height: normal;

                &.is-active {
                    background-color: #F4F3FF;
                }
                .menu-name {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
            }
        }

        .sub-menu-wrapper {
            max-height: 0;
            overflow: hidden;
            // transition: max-height 0.3s ease-out;
            &.is-open {
                max-height: 300px; // 서브메뉴가 다 보일만큼 넉넉한 값
            }
        }

        .sub-menu {
            display: flex;
            flex-direction: column;
            &__li {
                padding: 16px 40px;
                border-bottom: 1px solid $gray-100;

                color: #737373;
                font-size: 14px;
                font-weight: 500;
                line-height: normal;

                &.active-text {
                    background-color: #F4F3FF;
                }
            }
        }
    }
}

// .sidebar-overlay {
//     position: fixed;
//     top: 0;
//     left: 0;
//     width: 100%;
//     height: 100%;
//     background-color: rgba(0, 0, 0, 0.5);
//     z-index: 999;

//     display: none;

//     &.active {display: block;}
// }
</style>