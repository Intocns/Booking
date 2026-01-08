// 모달창 상태 관리 스토어
import { defineStore } from "pinia";
import { ref, readonly } from "vue"; // 가독성 및 안전성을 위해 readonly 추가 고려

export const useModalStore = defineStore("modalStore", () => {
    //  공통 모달 상태 생성 
    const createModalState = (initialTitle = '', initialVisibility = false) => {
        // isVisible은 내부에서만 변경되도록 ref 사용
        const isVisible = ref(initialVisibility); 
        const title = ref(initialTitle);
        const data = ref(null);
        return {
            // isVisible을 외부에서는 읽기 전용으로 노출
            isVisible: readonly(isVisible), 
            title,
            data: readonly(data),
            // 모달을 열고 닫는 메서드
            openModal(payload = null) {
                isVisible.value = true;
                data.value = payload || null;
            },
            closeModal() {
                isVisible.value = false;
                data.value = null;
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

    // 네이버 연동 계정 관리
    const productRegistrationModal = createModalState(); // 상품 등록 필요 모달
    const naverConnectNoticeModal = createModalState(); // 계정 연동 완료 모달

    // 플레이스 설정
    const bookingGuideModal = createModalState(); // 운영 설정 > 예약 받기 > 자세히 설명 모달
    const bookingGuideTextModal = createModalState(); // 알림 설정 > 안내 문구 추가
    const addRequestModal = createModalState(); //  예약자 정보 요청 > 질문 추가

    // 상품 관리
    const productVisibleUpdateModal = createModalState(); // 상품 관리 > 상품 일괄 설정
    const productOrderUpdateModal = createModalState(); // 상품 관리 > 순서 변경
    const productInfoUpdateAllModal = createModalState(); // 상품 관리 > 정보 일괄 변경
    const intoPetImportModal = createModalState(); // 상품 관리 > 인투펫 불러오기
    const productCopyModal = createModalState(); // 상품 관리 > 상품 복사
    // 상품 관리 > 상품 수정
    const holidaySettingModal = createModalState() // 상품 수정 > 예약 정보 > 휴무일 수정
    const setDateSettingModal = createModalState() // 상품 수정 > 예약 정보 > 캘린더 운영/미운영 블록 클릭시
    const setOperationRuleModal = createModalState() // 상품 수정 > 예약 정보 > 운영 설정 모달 > 진료 가능 동물 수, 운영시간 변경하기

    return {
        smsModal,
        confirmModal,
        reserveInfoModal,
        searchCustomerModal,
        categorySettingModal,
        optionSettingModal,
        optionDeleteModal,
        // 네이버 연동 계정 관리
        productRegistrationModal,
        naverConnectNoticeModal,
        // 플레이스 설정
        bookingGuideModal,
        bookingGuideTextModal,
        addRequestModal,
        // 상품 관리
        productVisibleUpdateModal,
        productOrderUpdateModal,
        productInfoUpdateAllModal,
        intoPetImportModal,
        productCopyModal,
        // 상품 관리 > 상품 수정
        holidaySettingModal,
        setDateSettingModal,
        setOperationRuleModal,
    }
})