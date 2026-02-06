<!-- sideBar -->
<script setup>
import { menus } from '@/data/sidebarMenus'
import { onMounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";

import sidebarLogo from '@/assets/images/sidebar_logo.svg'
// 아이콘
import icDashboard from '@/assets/icons/ic_lnb_dashboard.svg'
import icReservation from '@/assets/icons/ic_lnb_reservation.svg'
import icNaver from '@/assets/icons/ic_lnb_naver.svg'
import icIntoPet from '@/assets/icons/ic_lnb_intoPet.svg'
import icHospital from '@/assets/icons/ic_lnb_hospital.svg'
import icArrowDown from '@/assets/icons/ic_arrow_down.svg'
import ic2depth from '@/assets/icons/ic_res_lnb_2depth.svg'
import icCs from '@/assets/icons/ic_lnb_cs.svg'
import icLogout from '@/assets/icons/ic_lnb_logout.svg'
// 스토어
import { useHospitalStore } from '@/stores/hospitalStore';
import { usePlaceStore } from '@/stores/placeStore';
import { useModalStore } from '@/stores/modalStore';

const hospitalStore = useHospitalStore();
const placeStore = usePlaceStore();
const modalStore = useModalStore();

const router = useRouter();
const route = useRoute();
const openMenu = ref(null); // 열려있는 1뎁스 메뉴 index 저장

/** useFlag 1일 때만 접근 가능한 네이버 플레이스 하위 경로 */
const PLACE_MENUS_REQUIRE_LINK = ['/place/product', '/place/option', '/place/simple-reservation', '/place/settings'];

const icons = {
    icDashboard,
    icReservation,
    icNaver,
    icIntoPet,
    icHospital,
}

// 1뎁스 클릭 핸들러
const onClickMenu = (menu, index) => {
    if (menu.isExternal) {
        window.open(menu.path, '_blank'); // 새 탭에서 열기
        return;
    }

    if (!menu.children?.length) {
        router.push(menu.path);
        openMenu.value = index;
        return;
    }

    // 2뎁스 있는 메뉴 > 열기/닫기 toggle
    openMenu.value = openMenu.value === index ? null : index;
};

// 2뎁스 클릭 핸들러
const onClickChild = (child) => {
    const path = child.path || '';
    const requiresLink = PLACE_MENUS_REQUIRE_LINK.some((p) => path === p || path.startsWith(p + '/'));
    if (requiresLink && placeStore.naverUseFlag !== 1) {
        modalStore.naverConnectRequiredModal.openModal();
        return;
    }
    router.push(child.path);
};

const isActiveMenu = (menu, index) => {
    // 현재 클릭해서 열려있는 메뉴가 있다면, 그 인덱스만 활성화함
    if (openMenu.value !== null) {
        return openMenu.value === index;
    }

    // 클릭해서 열린 메뉴가 없을 때만(처음 로드 등) 현재 경로를 기준으로 활성화
    const isRouteActive = (menu.path && route.path === menu.path) || 
                         (menu.children?.some(child => child.path === route.path));
    
    return isRouteActive;
};

const isActiveChild = (child) => {
    return route.path === child.path;
};

const goToCsCenter = () => {
    window.open('https://intolink.co.kr/cscenter/notice')
}

onMounted(() => {
    hospitalStore.getHospitalInfo();
    placeStore.fetchNaverLinkUseFlag();
})
</script>

<template>
    <aside class="sidebar">
        <!-- top -->
        <div class="top-menu">
            <!-- top영역 -->
            <div class="top">
                <div class="title">
                    <div class="title-wrapper">
                        <div>
                            <img :src="sidebarLogo" alt="인투링크">
                        </div>
                        <div class="line"></div>
                    </div>
                </div>
                <div class="profile">
                    <div class="hospital-info">
                        <div class="hospital-onOff on">
                            <span class="title-xs">병원예약 - </span>
                            <!-- <span class="title-xs">ON</span> -->
                        </div>
                        <div class="hospital-name-box">
                            <span class="hospital-name heading-s">{{ hospitalStore.hospitalInfo.name }}</span>
                            <!-- <span class="heading-s">병원</span> -->
                        </div>
                    </div>
                    <div class="client-info">
                        <span class="title-m"></span>
                        <span class="title-m">님</span>
                    </div>
                </div>
            </div>

            <!-- lnb menu -->
            <ul class="lnb">
                <li 
                    v-for="(menu, index) in menus"
                    :key="index"
                    class="menu-wrapper"
                    @click="onClickMenu(menu, index)"
                >
                    <div class="menu" :class="{'menu--active': isActiveMenu(menu, index)}" >
                        <div class="menu-name-wrapper">
                            <div class="menu-name title-m">
                                <img :src="icons[menu.icon]" alt="메뉴 아이콘">
                                {{ menu.name }}
                            </div>
        
                            <div class="drop-down" :class="{ open: openMenu === index }" v-if="menu.children?.length">
                                <img :src="icArrowDown" />
                            </div>
                        </div>
                    </div>

                    <!-- 2뎁스 메뉴 -->
                    <ul v-if="menu.children?.length && openMenu === index" class="submenu">
                        <li
                            v-for="(child, cIndex) in menu.children"
                            :key="cIndex"
                            class="submenu-item"
                            :class="{
                                'submenu-item--active': isActiveChild(child),
                                'title-s': isActiveChild(child),
                                'body-m' : !isActiveChild(child),
                            }"
                            @click.stop="onClickChild(child)" 
                        >
                            <img :src="ic2depth" alt="">
                            {{ child.name }}
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
        <!-- footer -->
        <div class="footer-menu">
            <button class="footer-btn body-xs" @click="goToCsCenter">
                <img :src="icCs" alt="고객센터 아이콘">
                고객센터
            </button>
            <button class="footer-btn body-xs">
                <img :src="icLogout" alt="로그아웃 아이콘">
                로그아웃
            </button>
        </div>
    </aside>
</template>

<style lang="scss" scoped>
.sidebar {
    width: 220px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: $primary-700;

    // 상단 전체 스크롤 가능 영역
    .top-menu {
        flex: 1;               // 남은 영역 모두 차지
        overflow-y: auto;      // 스크롤 활성화
        // padding-bottom: 16px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        align-self: stretch;
    }
}

/* -----------------------------
    TOP 영역
----------------------------- */
.top {
    width: 100%;
    padding: 30px 24px 40px;
    display: flex;
    flex-direction: column;
    gap: 40px;
    background-color: #328bff;
}

.title-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;

    .line {
        width: 100%;
        height: 1px;
        background-color: $primary-50;
        opacity: 0.2;
    }
}

/* -----------------------------
    Profile 영역
----------------------------- */

.profile {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
}

.hospital-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .hospital-onOff {
        display: flex;
        align-items: center;
        height: 24px;
        padding: 3px 8px;
        background-color: $gray-00;
        color: $primary-700;
        border-radius: 5px;

        &.off {
        color: $gray-400;
        }
    }

    .hospital-name-box {
        display: flex;
        gap: 4px;
        color: $gray-00;

        .hospital-name {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        min-width: 0;
        text-align: center;
        }
    }
}

.client-info {
    color: $primary-100;
    display: flex;
    gap: 4px;
}

/* -----------------------------
    메뉴(LNB)
----------------------------- */

.lnb {
    width: 100%;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.menu-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .menu {
        padding: 14px 10px;
        border-radius: 5px;
        color: $gray-00;
        background-color: $primary-700;
        cursor: pointer;
        &--active {
            background-color: $primary-1000;
        }
    }

    .menu-name-wrapper {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        .menu-name {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .drop-down {
            transition: transform .3s;
            &.open {
                transform: rotate(180deg);
            }
        }
    }
}

.submenu {
    display: flex;
    flex-direction: column;
    padding: 8px 0;
    border-radius: 5px;
    background: #0364E4;

    .submenu-item {
        width: 100%;
        padding: 8px 20px;
        display: flex;
        color: $primary-50;
        cursor: pointer;
        &--active {
            color: $gray-00;
        }
    }
}

/* -----------------------------
    Footer 영역
----------------------------- */

.footer-menu {
    padding: 20px 16px 32px;
    display: flex;
    gap: 4px;

    .footer-btn {
        height: 34px;
        flex: 1 0 0;
        padding: 12px 13px;
        border-radius: 5px;
        background-color: $primary-800;
        color: $gray-00;
        display: flex;
        align-items: center;
        gap: 4px;
        justify-content: center;
    }
}
</style>
