<script setup></script>

<template>
    <div id="overlay">
        <div class="spinner-wrapper">
            <div class="spinner"></div>
            <span class="body-l">Loading...</span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    /* 로딩스피너 */
    #overlay {
        @include flex-center;
        position: fixed;
        height: 100%;
        width: 100%;
        z-index: 5000;
        top: 0;
        left: 0;

        color: $primary-700;

        background-color: rgba(255, 255, 255, 0.05);
    }

    .spinner-wrapper {
        width: 200px;
        height: 200px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
        justify-content: center;

        background: rgba(255, 255, 255, 0.8);
        padding: 30px 40px;
        border-radius: 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .spinner {
        height: 54px;
        width: 54px;
        animation: rotate 0.8s infinite linear;
        border: 4px solid $gray-100;
        border-top-color: $primary-700; 
        border-radius: 50%;
    }

    @keyframes rotate {
        0% {
            transform: rotate(0deg);
        }

        100% {
            transform: rotate(360deg);
        }
    }
</style>