<script setup>
    import Sidebar from './Sidebar.vue';
    import Spinner from '../common/Spinner.vue';
    import ConfirmModal from '../common/ConfirmModal.vue';
    import Modal from '../common/Modal.vue';

    import { api } from '@/api/axios';
    import { useModalStore } from '@/stores/modalStore';
    import { useRouter, useRoute } from 'vue-router';
    import { ref } from 'vue';

    import icBtnCloseB from '@/assets/icons/ic_btn_close_b.svg';
    import placeConnectButtonAlert from '@/assets/images/place_connect_button_alert.png';

    import { PRODUCT_REGISTRATION_COMPLETE_DONT_SHOW_KEY } from '@/constants/naver';

    const modalStore = useModalStore();
    const router = useRouter();
    const route = useRoute();

    function onGoToNaverAccount() {
        modalStore.naverConnectRequiredModal.closeModal();
        router.push('/place/account');
    }

    /** 상품 등록 필요 모달 > 닫기: 모달만 닫는다 */
    function closeProductRegistrationModal() {
        modalStore.productRegistrationModal.closeModal();
    }

    /** 상품 등록 필요 모달 > 상품 등록하기: 모달 닫고 상품 등록 화면으로 이동 */
    function goToProductRegistration() {
        modalStore.productRegistrationModal.closeModal();
        router.push('/place/product/detail');
    }

    /** 상품 등록 완료 모달 > 확인: 다시 보지 않음이 체크되면 저장 후 모달 닫기 */
    const closeProductRegistrationCompleteModal = () => {
        if (modalStore.productRegistrationCompleteDontShow) {
            localStorage.setItem(PRODUCT_REGISTRATION_COMPLETE_DONT_SHOW_KEY, '1');
        }
        modalStore.productRegistrationCompleteModal.closeModal();
    };

</script>

<template>
    <div class="default-layout">
        <Sidebar v-if="route.name !== 'maintenance'" />

        <main class="main">
            <!-- <router-view :key="$route.fullPath" /> -->
            <router-view v-slot="{ Component }" :key="$route.fullPath">
                <transition name="fade" mode="out-in">
                    <div class="content">
                        <component :is="Component" />
                    </div>
                </transition>
            </router-view>
        </main>
    </div>

    <Spinner v-show="api.ing.value" />

    <!-- <ConfirmModal /> -->

    <!-- 상품 등록 필요 모달 (모든 화면 접근 시 상품 0개일 때 노출) -->
    <Modal
        v-if="modalStore.productRegistrationModal.isVisible"
        title="상품 등록 필요"
        size="xs"
        :hide-header-close="true"
        :modal-state="modalStore.productRegistrationModal"
    >
        <div class="modal-contents-inner">
            <p class="modal-contents-subTitle">현재 등록된 예약 상품이 없습니다.</p>
            <p class="modal-contents-body">네이버 예약 연동을 진행하기 위해서는 인투링크에 상품 등록이 필요합니다. 상품 등록을 완료한 후 다시 계정 연동을 진행해 주세요.</p>
            <span class="caption modal-contents-caption">※ 이미 네이버 예약을 사용 중이시라면 <span class="strong">별도 상품 등록 없이 연동을 진행</span>해주세요.</span>
        </div>
        <div class="modal-button-wrapper">
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
                        class="btn btn--size-40 btn--blue"
                        style="width: 100px;"
                        @click="modalStore.naverConnectRequiredModal.closeModal()"
                    >
                        확인
                    </button>
                    <!-- <button
                        type="button"
                        class="btn btn--size-40 btn--blue"
                        @click="onGoToNaverAccount"
                    >
                        네이버 계정 연동하기
                    </button> -->
                </div>
            </div>
        </div>
    </Teleport>

    <!-- 상품 등록 완료 모달 (상품 1개 이상 시 플레이스 연결 안내) -->
    <Modal
        v-if="modalStore.productRegistrationCompleteModal.isVisible"
        title="상품 등록 완료"
        size="xs"
        :modal-state="modalStore.productRegistrationCompleteModal"
    >
        <div class="modal-contents-inner">
            <p class="modal-contents-subTitle">상품이 정상적으로 등록되었습니다.</p>
            <p class="modal-contents-body">
                마지막으로 원활한 예약 관리를 위해 네이버 스마트 플레이스로 이동하여 <span class="strong">[플레이스 연결하기]</span>를 진행해주세요.
            </p>
            <p class="modal-contents-body caption">
                버튼 위치: 네이버 스마트플레이스 접속 &gt; 솔루션 메뉴 &gt;
                <br/>사용중인 솔루션 &gt; '네이버 예약' 항목의 <span class="place-connect-btn-label">플레이스 연결하기</span> 버튼 클릭
            </p>
            <div class="product-registration-complete-modal__image-wrap">
                <img :src="placeConnectButtonAlert" alt="플레이스 연결하기 버튼 위치 안내" class="product-registration-complete-modal__image">
            </div>
        </div>
        <div class="modal-button-wrapper">
            <div class="check_section">
                <label class="checkbox">
                    <input
                        type="checkbox"
                        v-model="modalStore.productRegistrationCompleteDontShow"
                    />
                    <span class="box"></span>
                    <span class="label">다시 보지 않음</span>
                </label>
            </div>
            <div class="buttons">
                <button type="button" class="btn btn--size-24 btn--blue btn--c" @click="closeProductRegistrationCompleteModal">확인</button>
            </div>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
    .default-layout {
        display: flex;
    }
    .main {
        flex: 1;
        width: calc(100% - 220px);
        height: 100vh;
    }
    .content {
        width: 100%;
        height: 100%;
        display:flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        background-color: $gray-50;
        padding: 24px;
        
    }

    .fade-enter-active, .fade-leave-active {
        transition: opacity 0.2s ease;
    }
    .fade-enter-from, .fade-leave-to {
        opacity: 0;
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

    .product-registration-complete-modal__image-wrap {
        margin-top: 12px;
    }
    .product-registration-complete-modal__image {
        max-width: 100%;
        height: auto;
        display: block;
        border-radius: 4px;
    }
    .place-connect-btn-label {
        display: inline-block;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: 600;
        color: $gray-800;
        background: #fff;
        border: 1px solid $gray-300;
        border-radius: 4px;
        vertical-align: middle;
    } 
</style>