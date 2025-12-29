<script setup>
    import Sidebar from './Sidebar.vue';
    import Spinner from '../common/Spinner.vue';

    import { api } from '@/api/axios';
</script>

<template>
    <div class="default-layout">
        <Sidebar />

        <main class="content">
            <router-view :key="$route.fullPath" />
        </main>
    </div>

    <Spinner v-show="api.ing.value" />
</template>

<style lang="scss" scoped>
    .default-layout {
        display: flex;
    }
    .content {
        flex: 1;
        width: calc(100% - 220px);
        height: 100vh;
        display:flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        background-color: $gray-50;
        padding: 24px;
    }
</style>