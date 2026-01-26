<!-- 고객 예약 정보 -->
<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { PET_GENDER_MAP, RESERVE_ROUTE_MAP, RESERVE_STATUS_MAP, RESERVE_STATUS_CLASS_MAP } from '@/utils/reservation';
import { toggleCustomerMatch as toggleCustomerMatchUtil } from '@/utils/customer';
import { formatDate, formatTime, formatDateTime, formatTimeToMinutes, formatDateTimeForAPI, formatDateDot } from '@/utils/dateFormatter';

import InputTextBox from '@/components/common/InputTextBox.vue';
import TimeSelect from '@/components/common/TimeSelect.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import icInformation from '@/assets/icons/ic_information_blue.svg'
import icSearchW from '@/assets/icons/ic_search_w.svg'
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';
import Modal from '@/components/common/Modal.vue';
import CommonTable from '@/components/common/CommonTable.vue';
import SearchCustomer from '@/components/common/modal-content/SearchCustomer.vue';

import { useModalStore } from '@/stores/modalStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import { useReservationStore } from '@/stores/reservationStore';
import { showAlert } from '@/utils/ui';

const emit = defineEmits(['refresh-list']);

const modalStore = useModalStore();
const modal = modalStore.reserveInfoModal;
const hospitalStore = useHospitalStore();
const reservationStore = useReservationStore();

const reserveData = modal.data.reserve;
const reserveClientPet = modal.data.clientPet;

// 고객번호가 매칭되어 있는지 확인하는 함수
const isCustomerMatched = (clientItem) => {
    // 예약 상태가 확정(inState === 1)인 경우, reserveData의 geUserIdx와 gePetNo를 우선 확인
    if (reserveData?.inState === 1) {
        if (reserveData.geUserIdx && clientItem?.userSno) {
            if (String(reserveData.geUserIdx) === String(clientItem.userSno)) {
                // gePetNo도 확인 (있는 경우)
                if (reserveData.gePetNo) {
                    return String(reserveData.gePetNo) === String(clientItem.petSno);
                }
                return true; // geUserIdx만 매칭되어도 OK
            }
        }
        if (reserveData.gePetNo && clientItem?.petSno) {
            return String(reserveData.gePetNo) === String(clientItem.petSno);
        }
    }
    
    // 확정 상태가 아니거나 geUserIdx/gePetNo가 없는 경우, 기존 로직 사용
    // reserveClientPet의 고객번호나 동물번호와 일치하는지 확인
    const petUserNo = reserveClientPet?.userNo || reserveClientPet?.user_num;
    const petPetNo = reserveClientPet?.petNo || reserveClientPet?.pet_num;
    
    const clientUserNo = clientItem?.userNo || clientItem?.user_num;
    const clientPetNo = clientItem?.petNo || clientItem?.pet_num;
    
    // 고객번호와 동물번호가 모두 일치하면 매칭된 것으로 간주
    return (petUserNo && clientUserNo && String(petUserNo) === String(clientUserNo)) ||
           (petPetNo && clientPetNo && String(petPetNo) === String(clientPetNo));
};

// 고객 정보 리스트 초기화 및 자동 매칭 처리
const initializeClientList = () => {
    const clientList = modal.data.clientList || [];
    
    // 예약 상태가 확정인 경우, geUserIdx/gePetNo를 기준으로 매칭 확인
    const isConfirmed = reserveData?.inState === 1;
    
    // 매칭 조건을 만족하는 정보가 1개만 있는 경우 자동 매칭 (확정 상태가 아닐 때만)
    let autoMatched = false;
    if (!isConfirmed && clientList.length === 1) {
        autoMatched = true;
    }
    
    return clientList.map((item) => {
        const matched = autoMatched || isCustomerMatched(item);
        return {
            ...item,
            lastStatusDateTxt: item.lastStatusDate ? formatDate(item.lastStatusDate) : '',
            regDateTxt: item.regDate ? formatDate(item.regDate) : '',
            isMatched: matched, // 고객번호가 매칭된 경우에만 매칭 상태
            rowClass: matched ? 'row-matched' : '', // 매칭된 행에 스타일 클래스 추가
            // 품종: breedName 사용 (백엔드에서 br.Name2 AS breedName으로 제공)
            breed: item.breedName || '',
            // 성별: PET_GENDER_MAP으로 변환
            sex: PET_GENDER_MAP[item.sex] || item.sex || '',
            // 주소 정보 (1건인 경우 사용)
            userAddr: item.userAddr || '',
            userAddr2: item.userAddr2 || '',
            // 담당의사 (1건인 경우 사용)
            petDoctor: item.petDoctor || 'unknown',
            // 관리자 (1건인 경우 사용)
            manager: '관리자',
        };
    });
};

const reserveClientList = ref(initializeClientList());

// 고객 매칭 토글 함수 (단일 선택: 하나 선택 시 기존 선택 해제)
const toggleCustomerMatch = (row) => {
    toggleCustomerMatchUtil(reserveClientList.value, row);
};

const startTime = ref(null);
const endTime = ref(null);

// 예약 방문일 (단일 날짜)을 위한 ref 상태 정의
const reserveDate = ref(null);

// 담당의 ID와 이름을 위한 ref
const selectedDoctorId = ref(null);
const doctorName = ref('');

// 예약 취소 관련 상태
const cancelReasonType = ref(''); // 선택된 취소 사유 타입
const cancelReasonDirect = ref(''); // 직접 입력 내용

// 예약 확정 관련 상태
const sendNotification = ref(false); // 고객에게 예약 확정 알림 발송 여부

// 필드 ref
const reserveDateRef = ref(null);
const startTimeRef = ref(null);
const endTimeRef = ref(null);
const doctorSelectRef = ref(null);

// 예약 방문일과 시간 초기화
if (reserveData.reTime) {
    const startDate = new Date(reserveData.reTime);
    if (!isNaN(startDate)) {
        reserveDate.value = startDate;
        startTime.value = formatTime(startDate);
    }
}

// 종료 시간 설정
const endSource = reserveData.reTimeEnd || reserveData.reTimeHis;
if (endSource) {
    const endDate = new Date(endSource);
    if (!isNaN(endDate)) {
        endTime.value = formatTime(endDate);
    }
}

// 담당의 이름 설정
if (reserveData.doctorName) {
    doctorName.value = reserveData.doctorName;
} 

// 담당의 옵션 (CustomSingleSelect용)
const doctorOptions = computed(() => {
    const options = [];
    
    // 기본 옵션 추가 (매칭 안된 경우를 대비)
    options.push({
        value: null,
        label: '담당의 선택'
    });
    
    // 담당의 리스트 옵션 추가
    if (hospitalStore.doctorList && hospitalStore.doctorList.length > 0) {
        hospitalStore.doctorList.forEach(doc => {
            options.push({
                value: doc.id,
                label: doc.userName || doc.name || ''
            });
        });
    }
    
    return options;
});

// 담당의 선택 시 이름 업데이트
const handleDoctorChange = (doctorId) => {
    selectedDoctorId.value = doctorId;
    // null이거나 빈 값이면 초기화
    if (!doctorId || doctorId === null) {
        doctorName.value = '';
        selectedDoctorId.value = null;
        return;
    }
    
    const selectedDoctor = hospitalStore.doctorList.find(doc => doc.id === doctorId);
    if (selectedDoctor) {
        doctorName.value = selectedDoctor.userName || selectedDoctor.name || '';
    } else {
        doctorName.value = '';
    }
};

// 필드에 focus를 주는 헬퍼 함수
const focusField = async (ref, selector) => {
    await nextTick();
    try {
        if (!ref.value) return;
        
        const componentInstance = ref.value;
        // Vue 3 컴포넌트 ref에서 DOM 요소 접근
        const rootElement = componentInstance.$el || componentInstance;
        const element = rootElement?.querySelector?.(selector);
        
        if (element) {
            element.click();
        }
    } catch (error) {
        console.warn('필드 focus 실패:', error);
    }
};

// 예약 확정 validation
const validateReservation = async () => {
    // 1. 방문일 검증
    if (!reserveDate.value) {
        modalStore.confirmModal.openModal({
            title: '예약 방문일 확인',
            text: '예약 방문일을 선택해주세요.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => {modalStore.confirmModal.closeModal()}
        })
        await focusField(reserveDateRef, '.fake-input');
        return false;
    }
    
    // 2. 시작 시간 검증
    if (!startTime.value) {
        modalStore.confirmModal.openModal({
            title: '예약 시간 확인',
            text: '예약 시작 시간을 선택해주세요.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => {modalStore.confirmModal.closeModal()}
        })
        await focusField(startTimeRef, '.input-display');
        return false;
    }
    
    // 3. 종료 시간 검증
    if (!endTime.value) {
        modalStore.confirmModal.openModal({
            title: '예약 시간 확인',
            text: '예약 종료 시간을 선택해주세요.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => {modalStore.confirmModal.closeModal()}
        })
        await focusField(endTimeRef, '.input-display');
        return false;
    }
    
    // 4. 시간 검증: 시작 시간이 종료 시간보다 늦으면 안됨
    const startMinutes = formatTimeToMinutes(startTime.value);
    const endMinutes = formatTimeToMinutes(endTime.value);
    
    if (startMinutes !== null && endMinutes !== null && startMinutes >= endMinutes) {
        modalStore.confirmModal.openModal({
            title: '예약시간 확인',
            text: '예약 종료 시간은 시작 시간보다 이후로 설정해야 합니다.\n다시 확인해주세요.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => {modalStore.confirmModal.closeModal()}
        })
        await focusField(endTimeRef, '.input-display');
        return false;
    }
    
    // 5. 담당의 배정 검증
    if (!selectedDoctorId.value) {
        modalStore.confirmModal.openModal({
            title: '담당의 배정',
            text: '담당의가 배정되지 않았습니다.\n담당의를 배정한 뒤 예약을 확정해주세요.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => {modalStore.confirmModal.closeModal()}
        })
        await focusField(doctorSelectRef, '.select__box');
        return false;
    }
    
    // 6. 고객 매칭 검증 (고객 정보가 있는 경우 반드시 매칭되어야 함)
    if (reserveClientList.value.length > 0) {
        const hasMatchedCustomer = reserveClientList.value.some(item => item.isMatched);
        if (!hasMatchedCustomer) {
            modalStore.confirmModal.openModal({
                title: '고객 매칭 확인',
                text: '고객 정보가 있습니다. 고객을 매칭한 뒤 예약을 확정해주세요.',
                confirmBtnText: '확인',
                noCancelBtn: true,
                onConfirm: () => {modalStore.confirmModal.closeModal()}
            })
            return false;
        }
    }
    
    return true;
};

// 예약 확정 버튼 클릭 핸들러
const handleConfirmReservation = async () => {
    if (!await validateReservation()) {
        return;
    }
    
    // 예약 확정 확인 모달 열기
    modalStore.confirmReserveModal.openModal();
};

// 예약 확정 실행 함수
const handleConfirmReservationSave = async () => {
    // 선택된 담당의 정보 찾기
    const selectedDoctor = selectedDoctorId.value 
        ? hospitalStore.doctorList.find(doc => doc.id === selectedDoctorId.value)
        : null;
    
    const confirmData = {
        inState: 1, // 예약 확정 상태
        reTime: formatDateTimeForAPI(reserveDate.value, startTime.value),
        reTimeEnd: formatDateTimeForAPI(reserveDate.value, endTime.value),
        doctorId: selectedDoctorId.value,
        doctor: selectedDoctor ? (selectedDoctor.userName) : null, // 담당의 이름
        geReMemo: reserveData.geReMemo, // 병원 메모
        sendNotification: sendNotification.value,
    };

    // 매칭된 고객 정보 추가 (있는 경우)
    const matchedCustomer = reserveClientList.value.find(item => item.isMatched);
    if (matchedCustomer) {
        if (matchedCustomer.userSno) {
            confirmData.userSno = matchedCustomer.userSno;
        }
        if (matchedCustomer.petSno) {
            confirmData.petSno = matchedCustomer.petSno;
        }
    }

    const result = await reservationStore.confirmReservation(reserveData.reserveIdx, confirmData);
    
    if (result.success) {
        // 성공 시 모달 닫기
        modalStore.confirmReserveModal.closeModal();
        modalStore.reserveInfoModal.closeModal();
        
        // 검색 조건 유지한 채로 리스트 새로고침
        emit('refresh-list');
        
        // 성공 메시지 표시
        modalStore.confirmModal.openModal({
            title: '예약 확정',
            text: '예약이 확정되었습니다.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => {
                modalStore.confirmModal.closeModal();
            }
        });
    } else {
        // 실패 시 에러 메시지 표시
        modalStore.confirmModal.openModal({
            title: '예약 확정 실패',
            text: result.message || '예약 확정 중 오류가 발생했습니다.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => modalStore.confirmModal.closeModal()
        });
    }
};

// 고객 검색에서 고객 선택 시 처리
const handleCustomerSelected = (customer) => {
    // 선택한 고객만 리스트에 남기고 나머지는 제거 (단일 결과 화면으로 표시)
    const newCustomer = {
        ...customer,
        lastStatusDateTxt: customer.lastStatusDate ? formatDate(customer.lastStatusDate) : '',
        regDateTxt: customer.regDate ? formatDate(customer.regDate) : '',
        isMatched: true,
        rowClass: 'row-matched',
        breed: customer.breedName || '',
        sex: PET_GENDER_MAP[customer.sex] || '',
        // 고객/동물 번호 (예약 확정 시 필요)
        userSno: customer.userSno || null,
        petSno: customer.petSno || null,
        // 주소 정보 (1건인 경우 사용)
        userAddr: customer.userAddr || '',
        userAddr2: customer.userAddr2 || '',
        // 담당의사 (1건인 경우 사용)
        petDoctor: customer.petDoctor || '',
        petName: customer.petName || '',
        petBw: customer.petBw || '',
        rfid: customer.rfid || '',
        speciesName: customer.speciesName || '',
        breedName: customer.breedName || '',
        lastStatusDate: customer.lastStatusDate || '',
        regDate: customer.regDate || '',
    };
    
    // 선택한 고객만 리스트에 남김 (단일 결과 화면으로 표시)
    reserveClientList.value = [newCustomer];
    
    // 고객 검색 모달 닫기
    modalStore.searchCustomerModal.closeModal();
};

// 예약 취소 저장 로직
const handleSaveCancel = async () => {
    // 1. 유효성 검사
    if (!cancelReasonType.value) {
        showAlert('취소 사유를 선택해주세요.');
        return;
    }
    
    // 2. '직접 입력' 선택 시 내용 확인
    if (cancelReasonType.value === '직접 입력') {
        // 빈 값 체크
        if (!cancelReasonDirect.value.trim()) {
            showAlert('취소 사유를 입력해주세요.');
            return;
        }
        
        // 3. 50자 초과 체크 추가
        if (cancelReasonDirect.value.length > 50) {
            showAlert('취소 사유는 최대 50자까지 입력 가능합니다.');
            return;
        }
    }

    // 최종 전달될 사유 데이터
    const finalReason = cancelReasonType.value === '직접 입력' 
        ? cancelReasonDirect.value 
        : cancelReasonType.value;

    const cancelData = {
        rejectMsg: finalReason,
    };

    const result = await reservationStore.cancelReservation(reserveData.reserveIdx, cancelData);
    
    if (result.success) {
        // 성공 시 모달 닫기
        modalStore.cancelReserveModal.closeModal();
        modalStore.reserveInfoModal.closeModal();
        
        // 검색 조건 유지한 채로 리스트 새로고침
        emit('refresh-list');
        
        // 성공 메시지 표시
        modalStore.confirmModal.openModal({
            title: '예약 취소',
            text: '예약이 취소되었습니다.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => {
                modalStore.confirmModal.closeModal();
            }
        });
    } else {
        // 실패 시 에러 메시지 표시
        modalStore.confirmModal.openModal({
            title: '예약 취소 실패',
            text: result.message || '예약 취소 중 오류가 발생했습니다.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => modalStore.confirmModal.closeModal()
        });
    }
};

// 초기 담당의 ID 저장 (리스트 로드 후 확인용)
const initialDoctorId = ref(null);
if (reserveData.doctorId) {
    initialDoctorId.value = reserveData.doctorId;
} else if (reserveData.docId) {
    initialDoctorId.value = reserveData.docId;
}

// 모달이 열릴 때 담당의 리스트 로드 및 매칭 확인
onMounted(async () => {
    if (hospitalStore.doctorList.length === 0) {
        await hospitalStore.getDoctorList();
    }
    
    // 리스트 로드 후 초기 담당의 ID가 리스트에 있는지 확인
    if (initialDoctorId.value) {
        const doctorExists = hospitalStore.doctorList.some(doc => doc.id === initialDoctorId.value);
        if (doctorExists) {
            selectedDoctorId.value = initialDoctorId.value;
        } else {
            // 리스트에 없으면 null로 설정 (기본 옵션 선택 상태)
            selectedDoctorId.value = null;
        }
    }
});

// 고객정보 테이블 정의 (여러 건인 경우)
const customerInfoColumns = [
    { key: 'userSno', label: 'No.', width: '7%' },
    { key: 'userNo', label: '고객번호', width: '12%' },
    { key: 'userName', label: '고객명', width: '10%' },
    { key: 'userTel', label: '전화번호', width: '15%' },
    { key: 'petNo', label: '동물번호', width: '12%' },
    { key: 'petName', label: '동물명', width: '10%' },
    { key: 'speciesName', label: '종', width: '10%' },
    { key: 'breed', label: '품종', width: '10%'},
    { key: 'sex', label: '성별', width: '10%'},
    { key: 'lastStatusDateTxt', label: '최근방문일', width: '17%'},
    { key: 'action', label: '고객매칭', width: '10%'},
]

// 예약 확정 상태일 때는 매칭된 고객만 필터링
const matchedClientList = computed(() => {
    if (reserveData.inState === 1) {
        // 예약 확정 상태: 매칭된 고객만 반환
        return reserveClientList.value.filter(item => item.isMatched);
    }
    // 예약 확정 전: 전체 리스트 반환
    return reserveClientList.value;
});

// 조회 결과가 1건인지 확인 (예약 확정 상태일 때는 매칭된 고객만 고려)
const isSingleResult = computed(() => matchedClientList.value.length === 1)

// 예약 확정 상태 여부
const isConfirmed = computed(() => reserveData.inState === 1);

// 예약 취소 상태 확인 (inState === 2 또는 3)
const isCancelled = computed(() => {
    return reserveData.inState === 2 || reserveData.inState === 3;
});

// 매칭된 고객 정보 (SearchCustomer에 전달)
const matchedCustomerForSearch = computed(() => {
    return reserveClientList.value?.find(item => item.isMatched) || null;
});

// 1건인 경우 고객 정보 데이터
const singleCustomerData = computed(() => {
    if (isSingleResult.value && matchedClientList.value.length > 0) {
        return matchedClientList.value[0];
    }
    return null;
})

// 1건인 경우 동물 정보 데이터 (singleCustomerData에서 가져옴)
const singlePetData = computed(() => {
    if (isSingleResult.value && singleCustomerData.value) {
        const customer = singleCustomerData.value;
        // singleCustomerData에 동물 정보가 포함되어 있으므로 해당 정보 반환
        // reserveClientPet는 초기 데이터이므로, 선택한 고객의 정보를 우선 사용
        return {
            petSno: customer.petSno || '',
            petName: customer.petName || '',
            petBw: customer.petBw || '',
            rfid: customer.rfid || '',
            speciesName: customer.speciesName || '',
            breedName: customer.breedName || '',
            sex: customer.sex || '',
            petInsertDate: customer.petInsertDate || customer.regDate || '',
            lastVisitDate: customer.lastVisitDate || customer.lastStatusDate || '',
            petDoctor: customer.petDoctor || '',
        };
    }
    return null;
})


// 접수 일시 계산
const receivedDateTime = computed(() => 
    formatDateTime(reserveData.createdAt)
);

// 확정 일시 계산 (inState가 1일 때만 표시)
const confirmedDateTime = computed(() => 
    reserveData.inState === 1 ? formatDateTime(reserveData.updatedAt) : ''
);

// 모달이 열릴 때마다 값 초기화
watch(() => modalStore.cancelReserveModal.isVisible, (newVal) => {
    if (newVal) {
        // 모달이 열리면(true) 데이터 초기화
        cancelReasonType.value = '';
        cancelReasonDirect.value = '';
    }
});
watch(() => cancelReasonType.value, (newVal) => {
    if (newVal) {
        cancelReasonDirect.value = '';
    }
});

// 차트보기 버튼 클릭 핸들러
const handleViewChart = () => {
    if (singlePetData.value?.petSno) {
        const url = `https://intolink.co.kr/plus/main?pet_no=${singlePetData.value.petSno}`;
        window.open(url, '_blank');
    }
};
</script>

<template>
    <div class="modal-contents-inner">
        <!-- 예약 정보 -->
        <div class="d-flex flex-col gap-8">

            <!-- 타이틀 -->
            <div class="modal-content-title-wrapper">
                <div class="d-flex gap-8 align-items-center">
                    <p class="title-l">예약 정보</p>
                    
                    <div class="d-flex gap-4 align-center">
                        <p class="body-l">예약 상태</p>
                        <span class="flag" :class="RESERVE_STATUS_CLASS_MAP[reserveData.inState]">{{ RESERVE_STATUS_MAP[reserveData.inState] }}</span>
                    </div>
                </div>
            </div>

            <!-- 정보 -->
            <div class="info-lists-wrapper">
                <!-- 왼쪽 -->
                <div class="info-list left">
                    <div class="info-item">
                        <p class="label">예약 고객명</p>
                        <InputTextBox 
                            v-model="reserveData.userName"
                            :disabled="true"
                            placeholder="예약 고객명"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">고객 전화번호</p>
                        <InputTextBox 
                            v-model="reserveData.userTel"
                            :disabled="true"
                            placeholder="고객 전화번호"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">주소</p>
                        <InputTextBox 
                            v-model="reserveData.address1"
                            :disabled="true"
                            placeholder="주소"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">상세 주소</p>
                        <InputTextBox 
                            v-model="reserveData.address2"
                            :disabled="true"
                            placeholder="상세 주소"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">동물명</p>
                        <InputTextBox 
                            v-model="reserveData.petName"
                            :disabled="true"
                            placeholder="동물명"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">종</p>
                        <InputTextBox 
                            v-model="reserveData.spesice"
                            :disabled="true"
                            placeholder="종"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">품종</p>
                        <InputTextBox 
                            :model-value="reserveData.breed || ''"
                            :disabled="true"
                            placeholder="품종"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">성별</p>
                        <InputTextBox 
                            v-model="PET_GENDER_MAP[reserveData.petSex]"
                            :disabled="true"
                            placeholder="성별"
                        />
                    </div>
                    <div class="info-item align-start">
                        <p class="label" style="padding-top: 10px;">고객 메모</p>
                        <TextAreaBox 
                            v-model="reserveClientPet.clientMemo"
                            :disabled="true"
                            placeholder="고객 메모"/>
                    </div>
                </div>
    
                <!-- 오른쪽 -->
                <div class="info-list right">
                    <div class="info-item">
                        <p class="label">예약 경로</p>
                        <InputTextBox 
                            v-model="RESERVE_ROUTE_MAP[reserveData.reRoute]"
                            :disabled="true"
                            placeholder="예약 경로"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">상품명</p>
                        <InputTextBox 
                            v-model="reserveData.roomName"
                            :disabled="true"
                            placeholder="상품명"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">예약 방문일</p>
                        <div class="d-flex gap-8" style="flex:2;">
                            <CustomDatePicker ref="reserveDateRef" v-model="reserveDate" :range="false" />

                            <!-- 시간 선택 ( 00: 00 ~ 00: 00) -->
                            <div class="d-flex align-center gap-4" style="flex:2;">
                                <TimeSelect ref="startTimeRef" v-model="startTime" class="time-select-wrap"/>
                                <span class="time-separator">-</span>
                                <TimeSelect ref="endTimeRef" v-model="endTime" class="time-select-wrap"/>
                            </div>
                        </div>
                    </div>
                    <div class="info-item">
                        <p class="label">담당의</p>
                        <div class="select-wrapper">
                            <CustomSingleSelect 
                                ref="doctorSelectRef"
                                :model-value="selectedDoctorId"
                                @update:model-value="handleDoctorChange"
                                :options="doctorOptions"
                                placeholder="담당의 선택"
                                select-width="100%"
                            />
                        </div>
                    </div>
                    <div class="info-item">
                        <p class="label">접수 일시</p>
                        <InputTextBox 
                            :model-value="receivedDateTime"
                            :disabled="true"
                            placeholder="접수 일시"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">확정 일시</p>
                        <InputTextBox 
                            :model-value="confirmedDateTime"
                            :disabled="true"
                            placeholder="확정 일시"
                        />
                    </div>
                    <div class="info-item align-start">
                        <p class="label" style="padding-top: 10px;">병원 메모</p>
                        <TextAreaBox 
                            v-model="reserveData.geReMemo"
                            :disabled="true"
                            placeholder="병원 메모"
                            height="160px"
                        />
                    </div>
                </div>
            </div>

        </div>

        <!--고객정보 -->
        <div class="d-flex flex-col gap-6 customer-info-section">
            <!-- 조회 결과가 1건인 경우: 고객 정보와 동물 정보를 별도 섹션으로 표시 -->
            <template v-if="isSingleResult">
                <!-- 타이틀 --> 
                <div class="modal-content-title-wrapper">
                    <div class="d-flex gap-4 align-items-center">
                        <p class="title-l">고객 정보</p>
                        <div class="d-flex gap-4 align-center">
                            <img :src="icInformation" alt="안내아이콘" class="helper__icon">
                            <span class="body-s helper__text">
                                예약 고객 정보를 기준으로 검색했어요. 우리병원 차트에 등록된 고객과 매칭해주세요. 신규로 등록하는 경우 매칭없이 예약을 확정해주세요.
                            </span>
                        </div>
                    </div>

                    <!-- 고객 검색 버튼 -->
                    <button 
                        v-if="!isCancelled"
                        class="btn btn--size-24 btn--black" 
                        @click="modalStore.searchCustomerModal.openModal()"
                    >
                        <img :src="icSearchW" alt="아이콘">
                        고객 검색
                    </button>
                </div>

                <div class="info-lists-wrapper">
                    <!-- 고객 정보 (왼쪽) - 테이블 형태 -->
                    <ul class="form-container">
                        <li class="form-item">
                            <div class="form-label">고객번호</div>
                            <div class="form-content">
                                <span class="body-s">{{ singleCustomerData?.userNo || '' }}</span>
                            </div>
                        </li>
                        <li class="form-item">
                            <div class="form-label">고객명</div>
                            <div class="form-content">
                                <span class="body-s">{{ singleCustomerData?.userName || '' }}</span>
                            </div>
                        </li>
                        <li class="form-item">
                            <div class="form-label">연락처</div>
                            <div class="form-content">
                                <span class="body-s">{{ singleCustomerData?.userTel || '' }}</span>

                            </div>
                        </li>
                        <li class="form-item">
                            <div class="form-label">주소</div>
                            <div class="form-content">
                                <span class="body-s">{{ singleCustomerData?.userAddr || '' }}</span>
                            </div>
                        </li>
                        <li class="form-item">
                            <div class="form-label">상세주소</div>
                            <div class="form-content">
                                <span class="body-s">{{ singleCustomerData?.userAddr2 || '' }}</span>
                            </div>
                        </li>
                    </ul>

                    <!-- 동물 정보 (오른쪽) - 2열 테이블 형태 -->
                    <ul class="form-container">
                        <li class="form-item">
                            <div class="form-label">동물번호</div>
                            <div class="form-content">
                                <div class="d-flex align-center justify-between">
                                    <span class="body-s">{{ singlePetData?.petSno || '' }}</span>

                                    <button class="btn btn--size-24 btn--black-outline" @click="handleViewChart">차트보기</button>
                                </div>
                            </div>
                            <div class="form-label" style="width:92px;">체중</div>
                            <div class="form-content">
                                <span class="body-s">{{ singlePetData?.petBw ? `${singlePetData.petBw}kg` : '' }}</span>
                            </div>
                        </li>

                        <li class="form-item">
                            <div class="form-label">동물이름</div>
                            <div class="form-content">
                                <span class="body-s">{{ singlePetData?.petName || '' }}</span>
                            </div>
                            <div class="form-label" style="width:92px;">동물등록번호</div>
                            <div class="form-content">
                                <span class="body-s">{{ singlePetData?.rfid ? singlePetData.rfid : '-' }}</span>
                            </div>
                        </li>
                        <li class="form-item">
                            <div class="form-label">종</div>
                            <div class="form-content">
                                <span class="body-s">{{ singlePetData?.speciesName || '' }}</span>
                            </div>
                            <div class="form-label" style="width:92px;">등록일</div>
                            <div class="form-content">
                                <span class="body-s">{{ singlePetData?.petInsertDate ? formatDateDot(singlePetData.petInsertDate) : '' }}</span>
                            </div>
                        </li>
                        <li class="form-item">
                            <div class="form-label">품종</div>
                            <div class="form-content">
                                <span class="body-s">{{ singlePetData?.breedName || '' }}</span>
                            </div>
                            <div class="form-label" style="width:92px;">최근방문일</div>
                            <div class="form-content">
                                <span class="body-s">{{ singlePetData?.lastVisitDate ? formatDateDot(singlePetData.lastVisitDate) : '' }}</span>
                            </div>
                        </li>
                        <li class="form-item">
                            <div class="form-label">성별</div>
                            <div class="form-content">
                                <span class="body-s">{{ singlePetData?.sex ? (PET_GENDER_MAP[singlePetData.sex] || '') : '' }}</span>
                            </div>
                            <div class="form-label" style="width:92px;">담당의사</div>
                            <div class="form-content">
                                <span class="body-s">{{ singlePetData?.petDoctor || '' }}</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </template>

            <!-- 조회 결과가 여러 건인 경우: 기존처럼 하나의 테이블 -->
            <template v-else>
                <!-- 타이틀 -->
                <div class="modal-content-title-wrapper">
                    <div class="d-flex gap-4 align-items-center">
                        <p class="title-l">고객 정보</p>
                        <div class="d-flex gap-4 align-center">
                            <img :src="icInformation" alt="안내아이콘" class="helper__icon">
                            <span class="body-s helper__text">
                                예약 고객 정보를 기준으로 검색했어요. 우리병원 차트에 등록된 고객과 매칭해주세요. 신규로 등록하는 경우 매칭없이 예약을 확정해주세요.
                            </span>
                        </div>
                    </div>

                    <!-- 고객 검색 버튼 -->
                    <button 
                        v-if="!isCancelled"
                        class="btn btn--size-24 btn--black" 
                        @click="modalStore.searchCustomerModal.openModal()"
                    >
                        <img :src="icSearchW" alt="아이콘">
                        고객 검색
                    </button>
                </div>

                <!-- 테이블 -->
                <div class="customer-info-table-wrapper">
                    <CommonTable
                        :columns="customerInfoColumns"
                        :rows="matchedClientList"
                        table-empty-sub-text="예약 확정 시, 신규 고객으로 등록되어 예약이 접수됩니다."
                    >
                        <!-- 고객매칭 버튼 슬롯 -->
                        <template #action="{ row, rowIndex }">
                            <button 
                                class="btn btn--size-24"
                                :class="row.isMatched ? 'btn--blue' : 'btn--black-outline'"
                                @click.stop="toggleCustomerMatch(row)"
                            >
                                {{ row.isMatched ? '고객매칭 해제' : '고객매칭' }}
                            </button>
                        </template>
                    </CommonTable>
                </div>
            </template>
        </div>

    </div>

    <!-- 버튼 -->
    <div v-if="!isCancelled" class="modal-button-wrapper">
        <div class="buttons">
            <button class="btn btn--size-40 btn--blue-outline" @click="modalStore.cancelReserveModal.openModal()">예약취소</button>
            <button class="btn btn--size-40 btn--blue" @click="handleConfirmReservation">{{ isConfirmed ? '저장' : '예약 확정' }}</button>
        </div>
    </div>

    <!--  고객 예약 정보 > 고객 검색 모달 // 고객예약 정보 안으로 옮김 --> 
    <Modal
        v-if="modalStore.searchCustomerModal.isVisible"
        size="m"
        title="고객 검색"
        :modalState="modalStore.searchCustomerModal"
    >
        <SearchCustomer 
            :matched-customer="matchedCustomerForSearch"
            @customer-selected="handleCustomerSelected" 
        />
    </Modal>
    
    <!-- 고객 예약 정보 > 예약 취소 모달 -->
    <Modal 
        v-if="modalStore.cancelReserveModal.isVisible"
        title="예약 취소" 
        size="xs"
        :modal-state="modalStore.cancelReserveModal"
    >
        <div class="modal-contents-inner">
            <div class="d-flex flex-col gap-16">
                <span class="title-s">{{ formatDateTime(reserveDate) }} {{ reserveData.userName }}-{{ reserveData.petName }}</span>
    
                <div class="d-flex flex-col gap-8">
                    <span class="body-m" style="color: #494949;">예약을 취소하시려면 취소 사유 선택 후 저장 버튼을 클릭해주세요.</span>
    
                    <ul class="d-flex flex-col gap-8">
                        <li>
                            <label class="radio">
                                <input type="radio" v-model="cancelReasonType" value="진료/예약 마감" />
                                <span class="circle"></span>
                                <span class="label">진료/예약 마감</span>
                            </label>
                        </li>
                        <li>
                            <label class="radio">
                                <input type="radio" v-model="cancelReasonType" value="진료 불가한 질병/동물" />
                                <span class="circle"></span>
                                <span class="label">진료 불가한 질병/동물</span>
                            </label>
                        </li>
                        <li>
                            <label class="radio">
                                <input type="radio" v-model="cancelReasonType" value="응급 진료" />
                                <span class="circle"></span>
                                <span class="label">응급 진료</span>
                            </label>
                        </li>
                        <li>
                            <label class="radio">
                                <input type="radio" v-model="cancelReasonType" value="직접 입력" />
                                <span class="circle"></span>
                                <span class="label">직접 입력</span>
                            </label>
    
                            <TextAreaBox 
                                v-model="cancelReasonDirect"
                                :disabled="cancelReasonType !== '직접 입력'"
                                placeholder="최대 50자 입력 가능" 
                                :max-length="50"
                                :is-error="cancelReasonDirect.length > 50"
                                :error-message="'50자까지 입력 가능합니다.'"
                            />
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue-outline" @click="modalStore.cancelReserveModal.closeModal()">닫기</button>
                <button class="btn btn--size-32 btn--blue" @click="handleSaveCancel">저장</button>
            </div>
        </div>
    </Modal>
    
    <!-- 고객 예약 정보 > 예약 확정 모달 -->
    <Modal 
        v-if="modalStore.confirmReserveModal.isVisible"
        title="예약 확정" 
        size="xs"
        :modal-state="modalStore.confirmReserveModal"
    >
        <div class="modal-contents-inner">
            <div class="d-flex flex-col gap-16">
                <span class="body-m">예약을 확정하시겠습니까?</span>
                
                <label class="checkbox">
                    <input type="checkbox" v-model="sendNotification" />
                    <span class="box"></span>
                    <span class="label">고객에게 예약 확정 알림 발송</span>
                </label>
            </div>
        </div>
        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue-outline" @click="modalStore.confirmReserveModal.closeModal()">닫기</button>
                <button class="btn btn--size-32 btn--blue" @click="handleConfirmReservationSave">{{ isConfirmed ? '저장' : '예약 확정' }}</button>
            </div>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
    .modal-contents-inner {
        display: flex;
        flex-direction: column;
        gap: 16px; // 24px -> 16px로 줄임

        flex-grow: 1;
        // overflow: hidden; // 전체 스크롤 제거
        min-height: 0;
    }

    .modal-content-title-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
    }

    .helper__text {color: $primary-700;}

    .info-lists-wrapper {
        display:flex;
        gap:8px;
        overflow-y: auto;
    }

    .info-list {
        flex:1;
        display: flex;
        flex-direction: column;
        gap: 6px; // 8px -> 6px로 줄임
        padding: 14px 12px; // 20px 16px -> 16px 12px로 줄임

        border-radius: 8px;
        border: 1px solid $gray-200;
        background-color: $gray-00;

    }

    // 고객 정보 테이블 (1열 형태)
    .customer-info-table {
        flex: 1;
        border-radius: 8px;
        border: 1px solid $gray-200;
        background-color: $gray-00;
        padding: 0;
        overflow: hidden;
    }
    .info-item {
        display: flex;
        align-items: center;
        gap: 6px; // 8px -> 6px로 줄임

        .label {
            width: 80px;
            @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
            color: $gray-700;
        }
    }

    :deep(.dp__input_wrap) {height: 32px !important;}
    :deep(.dp__input) {height: 32px !important;}

    .select-wrapper {
        flex: 1;
        min-width: 0;
    }

    // 고객정보 섹션 스타일
    .customer-info-section {
        flex: 1;
        // min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 200px; // 최소 2명의 고객 정보가 보이도록 최소 높이 설정 (헤더 40px + 행 2개 72px + 여유공간)

        // .info-lists-wrapper {
        //     padding: 16px 12px;

        //     border: 1px solid $gray-200;
        //     border-radius: 8px;
        // }
    }

    .customer-info-table-wrapper { 
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        
        // CommonTable의 table-section 스타일 조정 (박스는 유지하되 높이 제어)
        :deep(.table-section) {
            height: 100%;
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
        }
        
        // CommonTable의 table-wrapper가 스크롤 담당
        :deep(.table-wrapper) {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
        }
        
        // 매칭된 행 스타일
        :deep(.row-matched) {
            background-color: $primary-50;
        }
    }

    :deep(.form-item) {min-height: 32px; height: 32px;}
    :deep(.form-label) {min-width: 70px;}
    :deep(.form-content) {
        .d-flex {
            .body-s {
                flex:1;
            }
        }
        min-width: 0;
        .body-s {
            max-width: 100%;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
    }
    :deep(.empty-box) {
        margin-top: 10px;
    }
</style>