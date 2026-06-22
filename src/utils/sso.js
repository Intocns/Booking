import axios from "axios"; // 인터셉터 없는 순수 axios (헤더 없이 보내기용)
import { AesCbc } from "./crypto";
import { useHospitalStore } from "@/stores/hospitalStore";
import { showAlert } from "./ui";
import { useModalStore } from "@/stores/modalStore";

// 스크립트 로드
export const loadSSOScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById("into-sso-script")) return resolve();
    const script = document.createElement("script");
    script.id = "into-sso-script";
    script.src = `${import.meta.env.VITE_SSO_URL}js/into_sso_v2.1.js?v=${new Date().getTime()}`;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
};

function getCookie(name) {
  const value = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));

  return value ? decodeURIComponent(value[2]) : null;
}

// 현재 강제 로그인은 사용하지 않음. 260409
// sso 강제 로그인
// 인투링크에서 예약 관리자 센터 접속시 도메인이 달라 sso로그인 실패하는 경우 강제로그인 처리함
export const forceSsoLogin = async (_businessNo = null, next_url = null) => {
  const modalStore = useModalStore();
  const nextUrl = window.location.origin + window.location.pathname;

  const urlParams = new URLSearchParams(window.location.search);
  const isLocal = import.meta.env.VITE_IS_LOCAL === "true";
  const at = urlParams.get("at") ?? getCookie("at") ?? getCookie("INTO_ACCESS");

  const rt =
    urlParams.get("rt") ?? getCookie("rt") ?? getCookie("INTO_REFRESH");

  const tokens = {
    at: at,
    rt: rt,
    service_id: "intobooking",
  };

  const requestData = JSON.stringify(tokens);
  // const decryptData = AesCbc.decrypt(encryptedData,import.meta.env.VITE_SSO_KEY, import.meta.env.VITE_SSO_IV )
  // console.log(decryptData)

  try {
    // 강제 로그인 시도
    const response = await axios.post(
      "https://sso.intolink.co.kr/internalAuth",
      {
        at: tokens.at,
        rt: tokens.rt,
        service_id: "intobooking",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (response.data.data) {
      return response.data;
    } else {
      console.log(response);
      modalStore.confirmModal.openModal({
        // TODO: 강제로그인 로직 확인 후 추후 삭제
        text: "현재 예약 서비스 개편 작업이 진행중 입니다.\n4월 중 더 나은 모습으로 찾아뵙겠습니다.\n\n이용을 원하시는 경우 웹에서 확인해 주시기 바랍니다.",
        confirmText: "확인",
        noCancelBtn: true,
        onConfirm: () => {
          window.close(); // 실패 시 창 닫기
        },
      });
      // modalStore.confirmModal.openModal({
      //     text: "인증에 실패하였습니다. 다시 시도해주세요.",
      //     confirmText: "확인",
      //     noCancelBtn: true,
      //     onConfirm: () => {
      //         window.close(); // 실패 시 창 닫기
      //     }
      // })
    }
  } catch (err) {
    modalStore.confirmModal.openModal({
      // TODO: 강제로그인 로직 확인 후 추후 삭제
      text: "현재 예약 서비스 개편 작업이 진행중 입니다.\n4월 중 더 나은 모습으로 찾아뵙겠습니다.\n\n이용을 원하시는 경우 웹에서 확인해 주시기 바랍니다.",
      confirmText: "확인",
      noCancelBtn: true,
      onConfirm: () => {
        window.close(); // 실패 시 창 닫기
      },
    });
    // modalStore.confirmModal.openModal({
    //     text: "인증에 실패하였습니다. 다시 시도해주세요.",
    //     confirmText: "확인",
    //     noCancelBtn: true,
    //     onConfirm: () => {
    //         window.close(); // 실패 시 창 닫기
    //     }
    // })
    console.error("SSO 로그인 실패:", err);
  }
};

// SSO 초기화 및 로직
export const initSSOCheck = (onResult) => {
  const isSession = false; // 현재 사이트 자체 세션 유무
  const isTest = import.meta.env.VITE_IS_TEST === "false";

  const sso = new INTOSSO("intobooking", false, isTest); // test일경우 마지막 인자값 true, live일 경우 false

  window.addEventListener("message", (e) => {
    console.log("MESSAGE", e.data);
  });

  // 토큰 없는 경우, 보내는 메세지 받아서 alert띄우도록 처리함
  const failMethods = ["resetIntoCookie", "removeIntoSSOToken"];
  // 메시지 핸들러
  const messageHandler = (event) => {
    console.log("MESSAGE", event.data);
    const data = event.data;

    // iframe에서 보내는 'resetIntoCookie' method > 토큰 없는경우
    if (failMethods.includes(data.method)) {
      // console.log('resetIntoCookie message', data.method);
      window.removeEventListener("message", messageHandler);

      cleanup(); // 리스너 즉시 제거
      if (onResult) onResult("fail");
    }
  };

  // 리스너 등록
  window.addEventListener("message", messageHandler);

  const cleanup = () => {
    // 리스너 해제
    window.removeEventListener("message", messageHandler);
  };

  const callback = function (data) {
    window.removeEventListener("message", messageHandler);

    // cocode 만번대 계정의 경우 차트를 사용하지 않음으로 로그인 막아둠
    // TODO: 인투펫 예약은 사용할 수 있으므로 주석처리 => 예약 승인 시 cocode 체크 후 매칭없이 확정하도록 코드는 작성해뒀고 주석처리해둠
    if (Number(data.cocode) >= 10000) {
      if (onResult) onResult("cocode");
      return;
    }

    const hospitalStore = useHospitalStore();
    hospitalStore.hospitalData = data;
    if (onResult) onResult("success");
  };

  const logout = function () {
    window.removeEventListener("message", messageHandler);

    // TODO : 로그아웃 로직
    // console.log('sso logout');
    if (onResult) onResult("fail");
  };

  try {
    sso.init(callback, logout, isSession);
  } catch (err) {
    window.removeEventListener("message", messageHandler);
    if (onResult) onResult("error");
  }
};
