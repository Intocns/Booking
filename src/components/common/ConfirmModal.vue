<!-- 확인 모달 (단순텍스트 + 취소,확인 버튼) -->
<script setup>
import icBtnCloseB from '@/assets/icons/ic_btn_close_b.svg'
import { useModalStore } from '@/stores/modalStore';

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
        <div class="modal-backdrop" @click="modal.closeModal()">
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
                        <button class="btn btn--size-40 btn--black" @click="modal.closeModal()">취소</button>
                        <button class="btn btn--size-40 btn--blue" @click="handleConfirm">{{ modal.data?.confirmBtnText }}</button>
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<style lang="scss" scoped>
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