<script setup>
import Cookies from 'js-cookie';
import DefaultLayout from './components/layouts/DefaultLayout.vue';
import ConfirmModal from './components/common/ConfirmModal.vue';

import { onMounted, ref } from 'vue';
import { loadSSOScript, initSSOCheck, forceSsoLogin } from '@/utils/sso';
import { useRoute, useRouter } from 'vue-router';
import { showAlert } from './utils/ui';
import { useModalStore } from './stores/modalStore';

import { useDevice } from '@/composables/useDevice';
    
const isMobile = useDevice();

const router = useRouter();
const modalStore = useModalStore();

const isAuthChecked = ref(false); // SSO 체크 완료 여부 (UI 렌더링 제어)

onMounted(async () => {    
    // 인증 결과에 따른 처리를 위한 공통 콜백 함수
    const handleAuthResult = (status) => {
        if (status === 'success') {
            isAuthChecked.value = true; // 인증 성공 시에만 레이아웃 노출
        } else if(status === 'cocode') {
            modalStore.confirmModal.openModal({
                text: "인투링크 예약 서비스를 이용 중인 병원만 접근할 수 있는 메뉴입니다.",
                confirmText: "확인",
                noCancelBtn: true,
                onConfirm: () => {
                    window.close(); // 실패 시 창 닫기
                }
            })
        } else {
            modalStore.confirmModal.openModal({
                text: "인증에 실패하였습니다. 다시 시도해주세요.",
                confirmText: "확인",
                noCancelBtn: true,
                onConfirm: () => {
                    window.close(); // 실패 시 창 닫기
                }
            })
        }
    };
    
    try {
        await loadSSOScript(); // sso 스크립트 로드

        initSSOCheck((handleAuthResult) => { // sso 로그인 체크
            if (handleAuthResult === 'success') {
                isAuthChecked.value = true;
            } else {
                forceSsoLogin(); // 실패시 강제 로그인
            }
        });

        // initSSOCheck(handleAuthResult); // sso 로그인 체크

    } catch (err) {
        console.error("SSO 프로세스 오류:", err);
        modalStore.confirmModal.openModal({
            text: "시스템 오류가 발생했습니다.",
            confirmText: "확인",
            noCancelBtn: true,
            onConfirm: () => {
                window.close(); // 실패 시 창 닫기
            }
        })
        // showAlert("시스템 오류가 발생했습니다.");
        // window.close();
    }
});
</script>

<template>
    <DefaultLayout v-if="isAuthChecked" />
    <div v-else class="auth-loading"></div>

    <ConfirmModal :is-mobile="isMobile" />
</template>

<style lang="scss" scoped>
.auth-loading {
    width:100%;
    height: 100vh;
    @include flex-center;
    background-color: $gray-50;
}
</style>
