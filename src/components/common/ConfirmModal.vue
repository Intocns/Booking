<!-- 확인 모달 (단순텍스트 + 취소,확인 버튼) -->
<script setup>
import icBtnCloseB from '@/assets/icons/ic_btn_close_b.svg'
import { useModalStore } from '@/stores/modalStore';
import { Transition } from 'vue';

const modalStore = useModalStore();
const modal = modalStore.confirmModal;

const handleConfirm = () => {
    // store 데이터에 담긴 onConfirm 함수 실행
    if (modal.data?.onConfirm) {
        modal.data.onConfirm();
    }
    // 실행 후 모달 닫기
    modal.closeModal();
};
</script>

<template>
    <teleport to='#app'>
        <Transition name="modal">
            <div v-if="modalStore.confirmModal.isVisible" class="modal-backdrop" @click="modal.closeModal()" style="z-index: 999;">
                <div class="modal-container confirm-modal"  @click.stop>
                    <!-- 모달 헤더 -->
                    <div class="modal-header">
                        <p class="modal-header__title heading-s">{{ modal.data?.title }}</p>
                        <button class="modal-close" @click="modal.closeModal()">
                            <img :src="icBtnCloseB" alt="닫기 버튼">
                        </button>
                    </div>
                    <div class="modal-contents">
                        <!-- 각 모달 별 콘텐츠 들어감 -->
                        <div class="contents-inner">
                            {{ modal.data?.text }}
                            <span v-if="modal.data?.subText" class="body-xs confirm-subText">{{ modal.data?.subText }}</span>
                        </div>
    
                        <!-- 버튼 -->
                        <div class="modal-footer">
                            <button v-if="!modal.data?.noCancelBtn" class="btn btn--size-40 btn--black" @click="modal.closeModal()">취소</button>
                            <button class="btn btn--size-40 btn--blue" @click="handleConfirm">{{ modal.data?.confirmBtnText }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </teleport>
</template>

<style lang="scss" scoped>
    /* Transition 효과 */

    // 1. 나타날 때와 사라질 때의 상태
    .modal-enter-from,
    .modal-leave-to {
        opacity: 0;

        .modal-container {
            transform: scale(0.95) translateY(-20px); // 살짝 작아지고 위로 올라간 상태
        }
    }

    // 2. 애니메이션 진행 중 (속도, 곡선)
    .modal-enter-active,
    .modal-leave-active {
        transition: opacity 0.3s ease;

        .modal-container {
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); // 탄력 있는 효과
        }
    }

    // 3. 완전히 나타났을 때의 상태 (생략 가능하지만 명시적)
    .modal-enter-to,
    .modal-leave-from {
        opacity: 1;

        .modal-container {
            transform: scale(1) translateY(0);
        }
    }
    .confirm-modal {
        min-width: 400px;
        max-width: 500px;
    }

    .modal-header {
        display: flex;

        background-color: $gray-00;
        padding: 20px 20px 0;

        &__title {
            flex: 1;
            text-align: center;

            color: $gray-900;
            @include typo($heading-s-size, $heading-s-weight, $heading-s-spacing, $heading-s-line); 
        }
    }
    
    .modal-contents {
        padding: 0px;
    }

    .contents-inner {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 50px 40px 70px;
        text-align: center;
        color: $gray-800;
        @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line); 
        line-height: 140%;
        white-space: pre-wrap;
    }

    .confirm-subText {
        color: #737373;
    }
    
    .modal-footer {
        width: 100%;
        display: flex;
        padding: 0 10px 10px;
        gap: 8px;
        
        .btn {
            flex: 1;
        }
    }
</style>