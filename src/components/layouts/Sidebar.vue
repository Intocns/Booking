<!-- sideBar -->
<script setup>
import { menus } from '@/data/sidebarMenus'
import { computed, onMounted } from "vue";
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
import icGuide from '@/assets/icons/ic_lnb_guide.svg'
// import icLogout from '@/assets/icons/ic_lnb_logout.svg'
// 스토어
import { useHospitalStore } from '@/stores/hospitalStore';
import { usePlaceStore } from '@/stores/placeStore';
import { useModalStore } from '@/stores/modalStore';

const hospitalStore = useHospitalStore();
const placeStore = usePlaceStore();
const modalStore = useModalStore();

const router = useRouter();
const route = useRoute();

/** URL 기준으로 펼쳐질 1뎁스 (2depth도 열리도록) */
const openMenu = computed(() => {
    const path = route.path;
    const index = menus.findIndex((m) => {
        // 1뎁스 
        if (m.path && path.startsWith(m.path)) return true;
        // 2뎁스 > 하위 메뉴
        return m.children?.some((c) => path.startsWith(c.path));
    });
    if (index !== -1 && menus[index].children?.length) return index;
    return null;
});

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
        return;
    }

    // 2뎁스 있는 메뉴: 열려 있으면 대시보드로(접기), 아니면 첫 하위로 이동(펼치기)
    if (openMenu.value === index) {
        router.push({ name: 'dashboard' });
    } else {
        router.push(menu.children[0].path);
    }
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
    const isRouteActive = (menu.path && route.path.startsWith(menu.path)) || 
                         (menu.children?.some(child => route.path.startsWith(child.path)));
    
    return isRouteActive;
};

const isActiveChild = (child) => {
    return route.path.startsWith(child.path);
};

const goToCsCenter = () => {
    window.open('https://intolink.co.kr/cscenter/notice')
}

const goToUserGuide = () => {
    //TODO: 이용 가이드 링크 수정
    window.open('https://intolink.co.kr/cscenter/guide', '_blank')
}

const goToDashboard = () => {
    router.push({ name: 'dashboard' });
};

onMounted(() => {
    hospitalStore.getHospitalInfo();
    placeStore.fetchNaverLinkUseFlag();
})
</script>

<template>
    <aside class="sidebar">
        <!-- top -->
        <div class="top-menu">
            <!-- top영역: 위(로고) / 아래(병원·사용자명) 분리 -->
            <div class="top">
                <button type="button" class="top-header" @click="goToDashboard">
                    <div class="title-wrapper">
                        <img :src="sidebarLogo" alt="인투링크">
                        <div class="line"></div>
                    </div>
                </button>
                <div class="top-profile">
                    <div class="hospital-info">
                        <div class="hospital-name-box">
                            <span class="hospital-name heading-s">{{ hospitalStore.hospitalData?.company_name }}</span>
                        </div>
                    </div>
                    <div class="client-info">
                        <span class="title-m">{{ hospitalStore.hospitalData?.user_name }}</span>
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
            <button class="footer-btn body-xs" @click="goToUserGuide">
                <img :src="icGuide" alt="이용가이드 아이콘">
                이용가이드
            </button>
            <!-- <button class="footer-btn body-xs">
                <img :src="icLogout" alt="로그아웃 아이콘">
                로그아웃
            </button> -->
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
    padding: 0 24px 40px;
    display: flex;
    flex-direction: column;
    gap: 40px;
    background-color: #328bff;
}

/* 위: 로고 영역 전체 균일 클릭 (위쪽 여백까지 버튼에 포함) */
.top-header {
    display: block;
    width: 100%;
    margin: 0;
    padding: 30px 0 0;
    border: none;
    background: none;
    cursor: pointer;
    text-align: center;
    -webkit-tap-highlight-color: transparent;

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
}

/* 아래: 병원명·사용자명 (클릭 없음) */
.top-profile {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
    width: 100%;
}

.hospital-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;

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
        max-height: 70px;
        width: 100%;
        
        .hospital-name {
            min-width: 0;
            flex: 1;
            text-align: center;

            // 여러 줄 말줄임 설정
            display: -webkit-box;
            -webkit-line-clamp: 2;    // 보여줄 줄 수 (2줄)
            -webkit-box-orient: vertical;
            line-clamp: 2;

            overflow: hidden;
            text-overflow: ellipsis;  // 생략 표시
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
        flex: 1 1 auto;
        min-width: 0;
        padding: 12px 13px;
        border-radius: 5px;
        background-color: $primary-800;
        color: $gray-00;
        display: flex;
        align-items: center;
        gap: 4px;
        justify-content: center;
        white-space: nowrap;
    }
}
</style>
