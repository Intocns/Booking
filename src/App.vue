<script setup>
import Cookies from 'js-cookie';
import DefaultLayout from './components/layouts/DefaultLayout.vue';
import ConfirmModal from './components/common/ConfirmModal.vue';

import { onMounted, ref } from 'vue';
import { loadSSOScript, initSSOCheck, forceSsoLogin } from '@/utils/sso';
import { useRoute, useRouter } from 'vue-router';
import { showAlert } from './utils/ui';

const router = useRouter();

const isAuthChecked = ref(false); // SSO 체크 완료 여부 (UI 렌더링 제어)

onMounted(async () => {
    // 강제 로그인 후 리턴 url에 at,rt값 포함하여 옴
    const urlParams = new URLSearchParams(window.location.search);
    const at = urlParams.get('at'); // 해당 값 저장 후
    const rt = urlParams.get('rt');
    
    // 인증 결과에 따른 처리를 위한 공통 콜백 함수
    const handleAuthResult = (status) => {
        if (status === 'success') {
            isAuthChecked.value = true; // 인증 성공 시에만 레이아웃 노출
        } else {
            showAlert("인증에 실패하였습니다.");
            window.close(); // 실패 시 창 닫기
        }
    };
    
    try {
        await loadSSOScript(); // sso 스크립트 로드

        if(at && rt) { // 강제 로그인 후 
            await router.replace({ query: {} }); // url에 남아있는 토큰 비워줌
            initSSOCheck(handleAuthResult); // sso 로그인 체크

        } else {  // 로그인 되어있지 않음
            initSSOCheck((status) => {
                if (status === 'success') {
                    isAuthChecked.value = true;
                } else {
                    // 강제 로그인
                    forceSsoLogin();
                }
            });
        }
    } catch (err) {
        console.error("SSO 프로세스 오류:", err);
        showAlert("시스템 오류가 발생했습니다.");
        window.close();
    }
});
</script>

<template>
    <DefaultLayout v-if="isAuthChecked" />
    <div v-else class="auth-loading"></div>

    <ConfirmModal />
</template>

<style lang="scss" scoped>
.auth-loading {
    width:100%;
    height: 100vh;
    @include flex-center;
    background-color: $gray-50;
}
</style>
