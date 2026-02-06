<script setup>
    import Sidebar from './Sidebar.vue';
    import Spinner from '../common/Spinner.vue';
    import ConfirmModal from '../common/ConfirmModal.vue';

    import { api } from '@/api/axios';
    import { useModalStore } from '@/stores/modalStore';
    import { useRouter } from 'vue-router';

    import icBtnCloseB from '@/assets/icons/ic_btn_close_b.svg';

    const modalStore = useModalStore();
    const router = useRouter();

    function onGoToNaverAccount() {
        modalStore.naverConnectRequiredModal.closeModal();
        router.push('/place/account');
    }
</script>

<template>
    <div class="default-layout">
        <Sidebar />

        <main class="content">
            <router-view :key="$route.fullPath" />
        </main>
    </div>

    <Spinner v-show="api.ing.value" />

    <ConfirmModal />

    <!-- 네이버 연동 필요: 1번사진처럼 전체 흰색 모달 (파란 헤더 없음) -->
    <Teleport to="#app">
        <div
            v-if="modalStore.naverConnectRequiredModal.isVisible"
            class="modal-backdrop"
            @click="modalStore.naverConnectRequiredModal.closeModal()"
        >
            <div class="naver-connect-required-modal" @click.stop>
                <div class="naver-connect-required-modal__top">
                    <h2 class="naver-connect-required-modal__title">네이버 연동 필요</h2>
                    <button
                        type="button"
                        class="naver-connect-required-modal__close"
                        aria-label="닫기"
                        @click="modalStore.naverConnectRequiredModal.closeModal()"
                    >
                        <img :src="icBtnCloseB" alt="">
                    </button>
                </div>
                <div class="naver-connect-required-modal__body">
                    <p class="naver-connect-required-modal__desc body-m">
                        현재 네이버 계정이 연동되어 있지 않아<br/>
                        네이버 예약 및 상품 관리 기능을 사용할 수 없습니다.
                    </p>
                    <p class="naver-connect-required-modal__guide body-m">
                        연동 설정 완료 후 이용해 주세요.
                    </p>
                </div>
                <div class="naver-connect-required-modal__buttons">
                    <button
                        type="button"
                        class="btn btn--size-40 btn--black-outline"
                        @click="modalStore.naverConnectRequiredModal.closeModal()"
                    >
                        닫기
                    </button>
                    <button
                        type="button"
                        class="btn btn--size-40 btn--blue"
                        @click="onGoToNaverAccount"
                    >
                        네이버 계정 연동하기
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
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

    /* 네이버 연동 필요 모달: 1번사진 스타일 (전체 흰색, 파란 헤더 없음) */
    .naver-connect-required-modal {
        width: 100%;
        max-width: 400px;
        background: $gray-00;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .naver-connect-required-modal__top {
        position: relative;
        padding: 20px 20px 0;
    }

    .naver-connect-required-modal__title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: $gray-900;
        line-height: 1.3;
        text-align: center;
    }

    .naver-connect-required-modal__close {
        position: absolute;
        top: 20px;
        right: 20px;
        padding: 4px;
        border: none;
        background: none;
        cursor: pointer;
        color: $gray-700;
        & img {
            display: block;
            width: 24px;
            height: 24px;
        }
    }

    .naver-connect-required-modal__body {
        padding: 24px 24px 28px;
    }

    .naver-connect-required-modal__desc,
    .naver-connect-required-modal__guide {
        text-align: center;
        margin: 0 0 8px;
        line-height: 1.6;
        color: $gray-800;
    }

    .naver-connect-required-modal__guide {
        margin-bottom: 0;
    }

    .naver-connect-required-modal__buttons {
        display: flex;
        justify-content: center;
        gap: 12px;
        padding: 0 24px 24px;
    }
</style>