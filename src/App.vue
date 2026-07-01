<script setup>
import Cookies from "js-cookie";
import DefaultLayout from "./components/layouts/DefaultLayout.vue";
import ConfirmModal from "./components/common/ConfirmModal.vue";

import { onMounted, ref } from "vue";
import { loadSSOScript, initSSOCheck, authSsoLogin, redirectToSSOLogin, forceSsoLogin } from "@/utils/sso";
import { useRoute, useRouter } from "vue-router";
import { showAlert } from "./utils/ui";
import { useModalStore } from "./stores/modalStore";

import { useDevice } from "@/composables/useDevice";

import { useHospitalStore } from "@/stores/hospitalStore";

import { getCookie, setCookieByParams, deleteCookie } from "@/utils/common";

const isMobile = useDevice();

const route = useRoute();
const router = useRouter();
const modalStore = useModalStore();
const hospitalStore = useHospitalStore();

const isAuthChecked = ref(false); // SSO 체크 완료 여부 (UI 렌더링 제어)

onMounted(async () => {
  const params = new URLSearchParams(location.search);
  
  if (new URLSearchParams(location.search).has("at")) {
    setCookieByParams();
  }

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
    }
  };

  try {
    console.log("스크립트 로드");
    await loadSSOScript(); // sso 스크립트 로드

    const at = getCookie("INTO_ACCESS") ?? params.get("at")?? "";
    const rt = getCookie("INTO_REFRESH") ?? params.get("rt")?? "";


    //이미 토큰값을 가지고 있다면 로그인진행, 없으면 리다이렉트로 인투링크의 토큰을 조회
    if (params.has("at") || (at && rt)) {

      if(params.has("at")){
        setCookieByParams();
      }
      
      const response = await authSsoLogin();

      if (response.status == 200) {
        hospitalStore.hospitalData = response.data.member;
        isAuthChecked.value = true;

        document.cookie = `biz_no=${response.data.member.biz_no};SameSite=None;Secure;path=/;}`;
        document.cookie = `cocode=${response.data.member.cocode};SameSite=None;Secure;path=/;}`;

        if (getCookie('biz_no') && getCookie('cocode')) {
          forceSsoLogin(getCookie('biz_no'), getCookie('cocode'));
        }
      }else{
        modalStore.confirmModal.openModal({
          text: `인증에 실패하였습니다. 다시 시도해주세요.\n [${response.message}]`,
          confirmText: "확인",
          noCancelBtn: true,
          onConfirm: () => {
             deleteCookie();
             redirectToSSOLogin();
          },
        });
      }

      initSSOCheck(handleAuthResult); // sso 로그인 체크
    } else {
       modalStore.confirmModal.openModal({
          text: `링크에 리다이렉트 해서 토큰 조회\n${JSON.stringify(Cookies.get())}`,
          confirmText: "확인",
          noCancelBtn: true,
          onConfirm: () => {
             deleteCookie();
             redirectToSSOLogin();
          },
        });
      //링크에 리다이렉트 해서 토큰 조회
      //window.location.href = `${import.meta.env.VITE_LINK_URL}/user/callBack?service=${import.meta.env.VITE_SSO_SERVICE_ID}&next=${window.location}`;
    }
  } catch (err) {
    console.error("SSO 프로세스 오류:", err);
    modalStore.confirmModal.openModal({
      text: "시스템 오류가 발생했습니다.",
      confirmText: "확인",
      noCancelBtn: true,
      onConfirm: () => {
        deleteCookie();
        window.close(); // 실패 시 창 닫기
      },
    });
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
  width: 100%;
  height: 100vh;
  @include flex-center;
  background-color: $gray-50;
}
</style>
