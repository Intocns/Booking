/**
 * 전역 알림(Alert) 함수
 */
import { useModalStore } from "@/stores/modalStore";

export const showAlert = (message, config = {}) => {
    // 요청 객체에 skipAlert가 설정되어 있다면 알럿을 띄우지 않음
    if (config.skipAlert) return;
    
    const modalStore = useModalStore();

    modalStore.confirmModal.openModal({
        text: message,
        noCancelBtn: true,
    })
};