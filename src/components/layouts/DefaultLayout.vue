<script setup>
    import Sidebar from './Sidebar.vue';
</script>

<template>
    <div class="default-layout">
        <Sidebar />

        <main class="content">
            <router-view />
        </main>
    </div>
</template>

<style lang="scss" scoped>
    .default-layout {
        display: flex;
    }
    .content {
        flex: 1;
        height: 100vh;
        display:flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 24px;
        background-color: $gray-50;
        padding: 24px;
    }
</style>