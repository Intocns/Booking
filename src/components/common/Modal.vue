<!-- 모달 틀 (content는 slot으로 사용) -->
<script setup>
import icBtnClose from '@/assets/icons/ic_btn_close_w.svg'
const props = defineProps({
    visible: Boolean,
    size: String,
    title: String,
})
const emit = defineEmits(["update:visible"])
const close = () => emit("update:visible", false)
</script>

<template>
    <teleport to="#app">
        <div v-if="visible" class="modal-backdrop" @click="close">
            <div class="modal-container" :class="`modal--${size}`" @click.stop>
                <!-- 모달 헤더 -->
                <div class="modal-header">
                    <p class="modal-header__title title-l">{{title }}</p>
                    <button class="modal-close" @click="close">
                        <img :src="icBtnClose" alt="닫기 버튼">
                    </button>
                </div>
                <div class="modal-contents">
                    <!-- 각 모달 별 콘텐츠 들어감 -->
                    <slot />  
                </div>
            </div>
        </div>
    </teleport>
</template>

<style lang="scss" scoped>
    .modal-backdrop {
        @include flex-center;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color:  rgba(12, 12, 13, 0.6);
        z-index: 100;
    }

    .modal-container {
        display: flex;
        flex-direction: column;
        min-width: 400px;
        // height: 100%;
        max-height: 840px;
        border-radius: 8px;
        box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.20);

        --modal-padding: 24px; // (기본값 s,xs 사이즈 모달의 패딩)
    }

    .modal--xl {
        min-width: 1080px;
        max-width: 1600px;
        --modal-padding: 40px;
    }

    .modal--l,
    .modal--m {
        min-width: 941px;
        max-width: 1080px;
        --modal-padding: 32px;
    }

    .modal--s,
    .modal--xs {
        min-width: 400px;
        max-width: 940px;
        --modal-padding: 24px;
    }

    .modal-header {
        height: 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 10px 0 var(--modal-padding);
        border-radius: 8px 8px 0 0;
        
        background-color: $primary-700;

        &__title {
            color: $gray-00;
        }
    }

    .modal-contents {
        width: 100%;
        height: 100%;
        padding: var(--modal-padding);
        border-radius: 0 0 8px 8px;

        background-color: $gray-00;
    }
</style>