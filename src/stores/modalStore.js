// 모달창 상태 관리 스토어
import { defineStore } from "pinia";
import { ref, readonly } from "vue"; // 가독성 및 안전성을 위해 readonly 추가 고려

export const useModalStore = defineStore("modalStore", () => {
    //  공통 모달 상태 생성 
    const createModalState = (initialVisibility = false) => {
        // isVisible은 내부에서만 변경되도록 ref 사용
        const isVisible = ref(initialVisibility); 
        
        return {
            // isVisible을 외부에서는 읽기 전용으로 노출
            isVisible: readonly(isVisible), 
            
            // 모달을 열고 닫는 메서드
            openModal() {
                isVisible.value = true;
            },
            closeModal() {
                isVisible.value = false;
            }
        }
    }

    // 개별 모달 상태 생성 (정의)
    // createModalState를 사용하여 각 모달을 초기화
    const smsModal = createModalState();
    const confirmModal = createModalState();
    const reserveInfoModal = createModalState();

    return {
        smsModal,
        confirmModal,
        reserveInfoModal,
    }
})