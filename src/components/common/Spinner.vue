<script setup></script>

<template>
    <div id="overlay">
        <div>
            <div class="spinner"></div>
            <span>Loading...</span>
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

        background-color: $gray-00;
        opacity: .80;
        color: #666666;

        div {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
    }

    .spinner {
        margin: 0 auto;
        height: 64px;
        width: 64px;
        animation: rotate 0.8s infinite linear;
        border: 5px solid #322f2f;
        border-right-color: transparent;
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