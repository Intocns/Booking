<script setup>
import { RouterLink, useRouter, useRoute } from 'vue-router';

import icBottomTab1B from '@/assets/icons/mobile/ic_bottom_tab_1_b.svg'
import icBottomTab2B from '@/assets/icons/mobile/ic_bottom_tab_2_b.svg'
import icBottomTab3B from '@/assets/icons/mobile/ic_bottom_tab_3_b.svg' 
import icBottomTab1 from '@/assets/icons/mobile/ic_bottom_tab_1.svg'
import icBottomTab2 from '@/assets/icons/mobile/ic_bottom_tab_2.svg'
import icBottomTab3 from '@/assets/icons/mobile/ic_bottom_tab_3.svg'

const route = useRoute();

const isActive = (path) => route.path === path;
</script>

<template>
    <nav class="mobile-bottom-tab">
        <RouterLink to="/reservation/list" class="tab-item" active-class="active">
            <img :src="isActive('/reservation/list') ? icBottomTab1B : icBottomTab1" alt="전체예약조회">
            전체 예약 조회
        </RouterLink>
        <RouterLink to="/reservation/pending" class="tab-item" active-class="active">
            <img :src="isActive('/reservation/pending') ? icBottomTab2B : icBottomTab2" alt="대기예약내역">
            대기 예약 내역
        </RouterLink>
        <RouterLink to="/reservation/schedule" class="tab-item" active-class="active">
            <img :src="isActive('/reservation/schedule') ? icBottomTab3B : icBottomTab3" alt="예약일정확인">
            예약 일정 확인
        </RouterLink>
    </nav>
</template>

<style lang="scss" scoped>
.mobile-bottom-tab {
    position: fixed;
    bottom: 0;
    left:0;
    width: 100%;
    height: 80px;
    display: flex;
    z-index: 100;
    padding: 20px 0;

    background-color: $gray-00;
    border-top: 1px solid $gray-200;

    .tab-item {
        @include flex-center;
        flex-direction: column;
        gap:4px;
        flex:1;

        color: $gray-500;
        @include typo($body-s-mobile-size, $body-s-mobile-weight, $body-s-mobile-spacing, $body-s-mobile-line);
        
        &.active {
            color: $primary-700;
            @include typo($title-s-mobile-size, $title-s-mobile-weight, $title-s-mobile-spacing, $title-s-mobile-line);
        }
    }
}
</style>