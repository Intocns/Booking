<script setup>
import Cookies from "js-cookie";
import DefaultLayout from "./components/layouts/DefaultLayout.vue";
import ConfirmModal from "./components/common/ConfirmModal.vue";

import { onMounted, ref } from "vue";
import { loadSSOScript, initSSOCheck, authSsoLogin } from "@/utils/sso";
import { useRoute, useRouter } from "vue-router";
import { showAlert } from "./utils/ui";
import { useModalStore } from "./stores/modalStore";

import { useDevice } from "@/composables/useDevice";

import { useHospitalStore } from "@/stores/hospitalStore";

import { getCookie, getAccessDate, getRefreshDate , setCookieByParams, setCookieByAtRt } from "@/utils/common";

const isMobile = useDevice();

const route = useRoute();
const router = useRouter();
const modalStore = useModalStore();

const isAuthChecked = ref(false); // SSO 체크 완료 여부 (UI 렌더링 제어)

onMounted(async () => {
  const params = new URLSearchParams(location.search);

  const at = getCookie("at") ?? getCookie("INTO_ACCESS") ?? null;
  const rt = getCookie("rt") ?? getCookie("INTO_REFRESH") ?? null;


  if (new URLSearchParams(location.search).has("at")) {
    setCookieByParams();
  }

  

  // 인증 결과에 따른 처리를 위한 공통 콜백 함수
  const handleAuthResult = async (status) => {
    if (status === "cocode") {
      modalStore.confirmModal.openModal({
        text: "인투링크 예약 서비스를 이용 중인 병원만 접근할 수 있는 메뉴입니다.",
        confirmText: "확인",
        noCancelBtn: true,
        onConfirm: () => {
          window.close(); // 실패 시 창 닫기
        },
      });
    }
  }

  try {
    console.log("스크립트 로드");
    await loadSSOScript(); // sso 스크립트 로드

    if (params.has("at") || (at && rt)) {
      if (params.has("at")) {
        setCookieByParams();
      }

      if (at && rt) {
        setCookieByAtRt();
      }

      const response = await authSsoLogin();

      if (response.status == 200) {
        const hospitalStore = useHospitalStore();
        hospitalStore.hospitalData = response.data.member;
        isAuthChecked.value = true;

        document.cookie = `INTO_ACCESS=${encodeURI(at)};SameSite=None;Secure;path=/;expires=${getAccessDate().toUTCString()}`;
        document.cookie = `INTO_REFRESH=${encodeURI(rt)};SameSite=None;Secure;path=/;expires=${getRefreshDate().toUTCString()}`;
        window.localStorage.setItem("INTO_ACCESS", at);
        window.localStorage.setItem("INTO_REFRESH", rt);
      }
    } else {
      alert("리다이렉트 로그인 시도");
      window.location.href =
        "http://localhost:20080/user/ssoRedirect?service=intobooking&next=" +
        window.location;
    }
    initSSOCheck(handleAuthResult); // sso 로그인 체크/
  } catch (err) {
    console.error("SSO 프로세스 오류:", err);
    modalStore.confirmModal.openModal({
      text: "시스템 오류가 발생했습니다.",
      confirmText: "확인",
      noCancelBtn: true,
      onConfirm: () => {
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
