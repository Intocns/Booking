<script setup>
import TopHeaderLogo from '@/assets/icons/mobile/top_header_logo.svg'
import icMenu from '@/assets/icons/mobile/ic_menu.svg'
</script>

<template>
    <div class="mobile-header">
        <div>
            <img :src="TopHeaderLogo" alt="인투링크예약관리자센터">
        </div>

        <div @click="$emit('toggle')">
            <img :src="icMenu" alt="메뉴">
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .mobile-header {
        position: fixed;
        top: 0;
        left:0;
        width: 100%;
        height: 56px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        background-color: $primary-700;
        padding: 20px;
        color: $gray-00;
        z-index: 100;
    }
</style>