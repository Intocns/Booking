// 모달창 상태 관리 스토어
import { defineStore } from "pinia";
import { ref, readonly } from "vue"; // 가독성 및 안전성을 위해 readonly 추가 고려

export const useModalStore = defineStore("modalStore", () => {
    //  공통 모달 상태 생성 
    const createModalState = (initialTitle = '', initialVisibility = false) => {
        // isVisible은 내부에서만 변경되도록 ref 사용
        const isVisible = ref(initialVisibility); 
        const title = ref(initialTitle);
        
        return {
            // isVisible을 외부에서는 읽기 전용으로 노출
            isVisible: readonly(isVisible), 
            title,
            // 모달을 열고 닫는 메서드
            openModal() {
                isVisible.value = true;
            },
            closeModal() {
                isVisible.value = false;
            },
            setTitle(newTitle) { title.value = newTitle; }, // 타이틀 변경 메서드
        }
    }

    // 개별 모달 상태 생성 (정의)
    // createModalState를 사용하여 각 모달을 초기화
    const smsModal = createModalState(); // sms,알림톡 발송 
    const confirmModal = createModalState(); 
    const reserveInfoModal = createModalState(); // 예약 정보
    const searchCustomerModal = createModalState(); // 예약 정보 > 고객검색
    const categorySettingModal = createModalState('카테고리 관리'); // 옵션관리 > 카테고리 관리 
    const optionSettingModal = createModalState('옵션 등록'); // 옵션 관리 > 옵션 등록,수정,복사
    const optionDeleteModal = createModalState('옵션 삭제'); // 옵션 관리 > 옵션삭제
    const productVisibleUpdateModal = createModalState(); // 상품 관리 > 상품 일괄 설정
    const productOrderUpdateModal = createModalState(); // 상품 관리 > 순서 변경

    return {
        smsModal,
        confirmModal,
        reserveInfoModal,
        searchCustomerModal,
        categorySettingModal,
        optionSettingModal,
        optionDeleteModal,
        productVisibleUpdateModal,
        productOrderUpdateModal
    }
})