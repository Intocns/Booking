<script setup>
import Cookies from "js-cookie";
import DefaultLayout from "./components/layouts/DefaultLayout.vue";
import ConfirmModal from "./components/common/ConfirmModal.vue";

import { onMounted, ref } from "vue";
import { loadSSOScript, initSSOCheck, forceSsoLogin } from "@/utils/sso";
import { useRoute, useRouter } from "vue-router";
import { showAlert } from "./utils/ui";
import { useModalStore } from "./stores/modalStore";

import { useDevice } from "@/composables/useDevice";

import { useHospitalStore } from "@/stores/hospitalStore";

const isMobile = useDevice();

const route = useRoute();
const router = useRouter();
const modalStore = useModalStore();

const isAuthChecked = ref(false); // SSO 체크 완료 여부 (UI 렌더링 제어)
function getCookie(name) {
  const value = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));

  return value ? decodeURIComponent(value[2]) : null;
}

onMounted(async () => {
  const params = new URLSearchParams(location.search);

  if (new URLSearchParams(location.search).has("at")) {
    const accessDate = new Date();
    accessDate.setDate(accessDate.getDate() + 3);

    const refreshDate = new Date();
    refreshDate.setDate(refreshDate.getDate() + 30);

    document.cookie = `INTO_ACCESS=${params.get("at")};SameSite=None;Secure;path=/;expires=${accessDate.toUTCString()}`;
    document.cookie = `INTO_REFRESH=${params.get("rt")};SameSite=None;Secure;path=/;expires=${refreshDate.toUTCString()}`;
    document.cookie = `at=${encodeURIComponent(params.get("at"))}; path=/;`;
    document.cookie = `rt=${encodeURIComponent(params.get("rt"))}; path=/;`;
  }

  const at = getCookie("at");
  const rt = getCookie("rt");

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
    } else {
    }
  };

  try {
    console.log("스크립트 로드");
    await loadSSOScript(); // sso 스크립트 로드

    if (params.has("at") || (at && rt)) {
      if (params.has("at")) {
        document.cookie = `INTO_ACCESS=${params.get("at")};path=/;`;
        document.cookie = `INTO_REFRESH=${params.get("rt")};path=/;`;
      }

      if (at && rt) {
        document.cookie = `INTO_ACCESS=${getCookie("at")};path=/;`;
        document.cookie = `INTO_REFRESH=${getCookie("rt")};path=/;`;
      }

      const response = await forceSsoLogin();
      if (response.status == 200) {
        const hospitalStore = useHospitalStore();
        hospitalStore.hospitalData = response.data.member;

        isAuthChecked.value = true;
        if (isAuthChecked.value && at && rt) {
          const expires = new Date();
          expires.setDate(expires.getDate() + 3); // 라이브러리 설정과 동일하게 3일
          // 라이브러리가 iframe 내부에서 하려던 토큰저장을 여기서 수행
          document.cookie = `INTO_ACCESS=${encodeURI(at)};SameSite=None;Secure;path=/;expires=${expires.toUTCString()}`;
          document.cookie = `INTO_REFRESH=${encodeURI(rt)};SameSite=None;Secure;path=/;expires=${new Date(new Date().getTime() + 27 * 24 * 60 * 60 * 1000).toUTCString()}`;
          window.localStorage.setItem("INTO_ACCESS", at);
          window.localStorage.setItem("INTO_REFRESH", rt);
        }
      }
    } else {
      window.location.href =
        "http://192.168.0.44:20080/user/ssoRedirect?service=intobooking&next=" +
        window.location;
    }

    // 현재 강제 로그인은 사용하지 않음. 260409
    // if (isAuthChecked.value && at && rt) {
    //   console.log("로그인 완료 후");
    //   isAuthChecked.value = true;
    //   // 강제로그인 시도 성공 후
    //   const expires = new Date();
    //   expires.setDate(expires.getDate() + 3); // 라이브러리 설정과 동일하게 3일
    //   // 라이브러리가 iframe 내부에서 하려던 토큰저장을 여기서 수행
    //   document.cookie = `INTO_ACCESS=${encodeURI(at)};SameSite=None;Secure;path=/;expires=${expires.toUTCString()}`;
    //   document.cookie = `INTO_REFRESH=${encodeURI(rt)};SameSite=None;Secure;path=/;expires=${new Date(new Date().getTime() + 27 * 24 * 60 * 60 * 1000).toUTCString()}`;
    //   window.localStorage.setItem("INTO_ACCESS", at);
    //   window.localStorage.setItem("INTO_REFRESH", rt);

    //   await router.replace({ path: window.location.pathname, query: {} });

    //   //  SSO 체크를 수행하여 정보를 받아옴
    //   console.log("로그인체크");
    //   initSSOCheck(handleAuthResult);
    //   return;
    // }

    // initSSOCheck((status) => {
    //     if (status === 'success') {
    //         isAuthChecked.value = true;
    //         // 쿼리 정리
    //         router.replace({ path: route.path })
    //     } else {
    //         // 기본 sso 로그인 체크 실패시 강제 로그인 시도
    //         if (bizNo && cocode) {
    //             forceSsoLogin(bizNo, cocode);
    //         } else {
    //             handleAuthResult(status);
    //         }
    //     }
    // });

    // if (bizNo && cocode) {
    //   // 강제로그인 사용하지 않음으로, 링크에서 보내주는 강제로그인에 필요한 쿼리값 지워줌
    //   await router.replace({
    //     path: window.location.pathname,
    //     query: {},
    //   });
    // }
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
  width: 100%;
  height: 100vh;
  @include flex-center;
  background-color: $gray-50;
}
</style>
