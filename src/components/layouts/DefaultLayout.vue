<script setup>
    import Sidebar from './Sidebar.vue';
    import Spinner from '../common/Spinner.vue';
    import ConfirmModal from '../common/ConfirmModal.vue';
    import Modal from '../common/Modal.vue';

    import { ref } from 'vue';
    import { api } from '@/api/axios';
    import { useModalStore } from '@/stores/modalStore';
    import { useRouter } from 'vue-router';
    import { PRODUCT_MODAL_DONT_SHOW_KEY } from '@/constants/naver';

    import icBtnCloseB from '@/assets/icons/ic_btn_close_b.svg';

    const modalStore = useModalStore();
    const router = useRouter();
    const productModalDontShowAgain = ref(false);

    function onGoToNaverAccount() {
        modalStore.naverConnectRequiredModal.closeModal();
        router.push('/place/account');
    }

    /** 상품 등록 필요 모달 > 닫기: 모달만 닫는다 */
    function closeProductRegistrationModal() {
        modalStore.productRegistrationModal.closeModal();
    }

    /** 상품 등록 필요 모달 > 상품 등록하기: 모달 닫고 상품 관리로 이동 */
    function goToProductRegistration() {
        modalStore.productRegistrationModal.closeModal();
        router.push('/place/product');
    }

    /** 상품 등록 필요 모달 > 다시 보지 않음 체크 시 localStorage 저장/해제 */
    function onProductModalDontShowChange(checked) {
        productModalDontShowAgain.value = !!checked;
        if (checked) localStorage.setItem(PRODUCT_MODAL_DONT_SHOW_KEY, '1');
        else localStorage.removeItem(PRODUCT_MODAL_DONT_SHOW_KEY);
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

    <!-- 상품 등록 필요 모달 (모든 화면 접근 시 상품 0개일 때 노출) -->
    <Modal
        v-if="modalStore.productRegistrationModal.isVisible"
        title="상품 등록 필요"
        size="xs"
        :modal-state="modalStore.productRegistrationModal"
    >
        <div class="modal-contents-inner">
            <p class="modal-contents-subTitle">현재 등록된 예약 상품이 없습니다.</p>
            <p class="modal-contents-body">네이버 예약 연동을 진행하기 위해서는 인투링크에 상품 등록이 필요합니다. 상품 등록을 완료한 후 다시 계정 연동을 진행해 주세요.</p>
            <span class="caption modal-contents-caption">※ 이미 네이버 예약을 사용 중이시라면 <span class="strong">별도 상품 등록 없이 연동을 진행</span>해주세요.</span>
        </div>
        <div class="modal-button-wrapper">
            <div class="check_section">
                <label class="checkbox">
                    <input
                        type="checkbox"
                        :checked="productModalDontShowAgain"
                        @change="onProductModalDontShowChange(($event.target).checked)"
                    />
                    <span class="box"></span>
                    <span class="label">다시 보지 않음</span>
                </label>
            </div>
            <div class="buttons">
                <button type="button" class="btn btn--size-24 btn--black-outline btn--c" @click="closeProductRegistrationModal">닫기</button>
                <button type="button" class="btn btn--size-24 btn--black" @click="goToProductRegistration">상품 등록하기</button>
            </div>
        </div>
    </Modal>

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