<!-- 고객 예약 정보 모달 content (기존 로직 스크립트는 웹과동일) -->
<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue';
import { RESERVE_STATUS_CLASS_MAP, PET_GENDER_SHORT_MAP, RESERVE_STATUS_SHORT_MAP, EXTERNAL_LINKS, RESERVE_ROUTE_MAP } from '@/constants';
import { toggleCustomerMatch as toggleCustomerMatchUtil } from '@/utils/customer';
import { formatDate, formatTime, formatDateTime, formatTimeToMinutes, formatDateTimeForAPI, formatDateDot } from '@/utils/dateFormatter';

import InputTextBox from '@/components/common/InputTextBox.vue';
import TimeSelect from '@/components/common/TimeSelect.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import icInformation from '@/assets/icons/ic_information_blue.svg'
import icSearchB from '@/assets/icons/ic_search.svg'
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';
import Modal from '@/components/common/Modal.vue';
import CommonTable from '@/components/common/CommonTable.vue';
import SearchCustomer from '@/components/common/modal-content/SearchCustomer.vue';

import { useModalStore } from '@/stores/modalStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import { useReservationStore } from '@/stores/reservationStore';
import { showAlert } from '@/utils/ui';
import { formatPhone } from '@/utils/phoneFormatter';

import icEmpty from '@/assets/icons/ic_empty.svg'
import icArrow from '@/assets/icons/mobile/ic_arrow_right.svg'
import icDropdownBtn from '@/assets/icons/mobile/ic_dropdown_btn.svg'
import icShow from '@/assets/icons/mobile/ic_show.svg'
import icArrowTop from '@/assets/icons/mobile/ic_arrow_top.svg'
import icLinkBlack from '@/assets/icons/mobile/ic_link_black.svg'
import icLinkBlue from '@/assets/icons/mobile/ic_link_blue.svg'

// 예약 경로 아이콘
import icNaver from '@/assets/icons/ic_res_naver.svg'
import icIntoPet from '@/assets/icons/ic_res_intoPet.svg'
import icIntoLink from '@/assets/icons/ic_res_intolink.svg'
import BottomSheet from '../../Mobile/BottomSheet.vue';

// 예약 경로 아이콘 매핑
const pathIcons = {
    1: icIntoLink,
    2: icIntoPet,
    4: icNaver,
};

const emit = defineEmits(['refresh-list', 'update-title']);
const props = defineProps({
    isMobile: {type: Boolean, default: false,}
})

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

// 담당의 value값으로 담당의 이름 반환
const getDoctorName = (doctorValue) => {
    if (!doctorValue) return '';
    const doctor = doctorOptions.value.find(d => d.value === doctorValue);
    return doctor ? doctor.label : '';
}

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
            lastVisitDateTxt: item.lastVisitDate ? formatDate(item.lastVisitDate) : '',
            regDateTxt: item.regDate ? formatDate(item.regDate) : '',
            isMatched: matched, // 고객번호가 매칭된 경우에만 매칭 상태
            rowClass: matched ? 'row-matched' : '', // 매칭된 행에 스타일 클래스 추가
            // 품종: breedName 사용 (백엔드에서 br.Name2 AS breedName으로 제공)
            breed: item.breedName || '',
            // 성별: PET_GENDER_MAP으로 변환
            sex: PET_GENDER_SHORT_MAP[item.sex] || '',
            // 주소 정보 (1건인 경우 사용)
            userAddr: item.userAddr || '',
            userAddr2: item.userAddr2 || '',
            // 담당의사 (1건인 경우 사용)
            petDoctor: Number(item.petDoctor) >= 0 ? getDoctorName(item.petDoctor) : '',
            // 관리자 (1건인 경우 사용)
            manager: '관리자',
        };
    });
};

const reserveClientList = ref(initializeClientList());

// 고객 매칭 토글 함수 (단일 선택: 하나 선택 시 기존 선택 해제)
const toggleCustomerMatch = (row) => {
    toggleCustomerMatchUtil(reserveClientList.value, row);
    // 사용자가 리스트에서 직접 버튼을 눌렀으므로, 
    // 상세 뷰로 자동 전환되지 않도록 수동 조작 상태를 true로 설정
    isManualUnmatched.value = true;
};

// 매칭해제 전용 함수 (상세 뷰에서 클릭 시)
const unmatchCustomer = () => {
    const matchedItem = reserveClientList.value.find(item => item.isMatched);
    
    if (matchedItem) {
        // 매칭 해제
        toggleCustomerMatchUtil(reserveClientList.value, matchedItem);
        
        // 매칭을 수동으로 풀었으므로 테이블 뷰를 보여주기 위해 true 설정
        isManualUnmatched.value = true;
    }
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

// 사용자가 수동으로 매칭을 조작했는지 여부
const isManualUnmatched = ref(false);

const isFolded = ref(false); // 예약 정보 접기 상태

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
        // await focusField(doctorSelectRef, '.select__box');
        return false;
    }
    
    // 6. 고객 매칭 검증 (고객 정보가 있는 경우 반드시 매칭되어야 함)
    // TODO: cocode가 5자리 미만(10000 미만)인 경우에만 매칭 필수
    // const cocode = hospitalStore.hospitalInfo.cocode;
    // const isMatchingRequired = String(cocode).length < 5;
    const checkClinicType = reserveData.clinicType !== '일반예약' && reserveData.clinicType !== '개인일정'
    
    // if (checkClinicType && isMatchingRequired && reserveClientList.value.length > 0) {
    if (checkClinicType && reserveClientList.value.length > 0) {
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
const handleConfirmReservation = async (isConfirmed) => {
    if (!await validateReservation()) {
        return;
    }
    
    if(isConfirmed) { // 수정의 경우
        handleConfirmReservationSave(isConfirmed)
    } else {
        // 예약 확정 확인 모달 열기
        modalStore.confirmReserveModal.openModal();
    }
};

// 예약 확정 실행 함수
const handleConfirmReservationSave = async (isConfirmed) => {    
    // 바텀시트 닫기
    modalStore.confirmReserveModal.closeModal();

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
        // if (matchedCustomer.userSno) {
        //     confirmData.userSno = matchedCustomer.userSno;
        // }
        // if (matchedCustomer.petSno) {
        //     confirmData.petSno = matchedCustomer.petSno;
        // }

        confirmData.userSno = matchedCustomer.userSno ?? null;
        confirmData.petSno = matchedCustomer.petSno ?? null;
        confirmData.userName = matchedCustomer.userName ?? null; // 매칭된 고객 userName, petName,연락처 추가
        confirmData.petName = matchedCustomer.petName ?? null;
        confirmData.userTel = matchedCustomer.userTel ?? null;
    }

    const result = await reservationStore.confirmReservation(reserveData.reserveIdx, confirmData);
    
    if (result.success) {
        // 성공 시 모달 닫기
        modalStore.reserveInfoModal.closeModal();
        // 검색 조건 유지한 채로 리스트 새로고침
        emit('refresh-list');
        // 성공 메시지 표시
        modalStore.confirmModal.openModal({
            title: isConfirmed ? '' : '예약 확정',
            text: isConfirmed ? '변경된 내용으로 저장되었습니다.' : '예약이 확정되었습니다.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => {
                modalStore.confirmModal.closeModal();
            }
        });
    } else {
        // 실패 시 에러 메시지 표시
        modalStore.confirmModal.openModal({
            title: isConfirmed ? '' : '예약 확정 실패',
            text: result.message || (isConfirmed ? '저장 중' : '예약 확정 중') + '오류가 발생했습니다.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => modalStore.confirmModal.closeModal()
        });
    }
};

// 고객 검색에서 고객 선택 시 처리
const handleCustomerSelected = (customer) => {
    const petInfoByType = {//customer.buttonType을 키값으로 사용 => 0 : 신규동물, 1 : 선택동물
        0: {
            petSno: '',
            breed: '',
            sex: PET_GENDER_SHORT_MAP[reserveData.petSex] || '',
            petName: reserveData.petName,
            petBw: '',
            breedName: '',
            speciesName: reserveData.spesice,
            petDoctor: '',
            rfid: '',
            lastVisitDate: '',
            regDate: '',
        },
        1: {
            petSno: customer.petSno,//동물번호
            breed: customer.breedName,//품종
            sex: customer.sex || '',//성별
            petName: customer.petName,//동물명
            petBw: customer.petBw,//체중
            breedName: customer.breedName,//품종명
            speciesName: customer.speciesName,//종명
            petDoctor: Number(customer.petDoctor) >= 0 ?  getDoctorName(customer.petDoctor) : '',// 담당의사 (1건인 경우 사용)
            rfid: customer.rfid || '',//동물등록번호
            lastVisitDateTxt: customer.lastVisitDate ? formatDate(customer.lastVisitDate) : '',//최근방문일
            regDateTxt: customer.regDate ? formatDate(customer.regDate) : '',//등록일
        }
    };

    // 선택한 고객만 리스트에 남기고 나머지는 제거 (단일 결과 화면으로 표시)
    // const newCustomer = {
    //     ...customer,
    //     lastStatusDateTxt: customer.lastStatusDate ? formatDate(customer.lastStatusDate) : '',
    //     regDateTxt: customer.regDate ? formatDate(customer.regDate) : '',
    //     isMatched: true,
    //     rowClass: 'row-matched',
    //     breed: customer.breedName || '',
    //     sex: PET_GENDER_MAP[customer.sex] || '',
    //     // 고객/동물 번호 (예약 확정 시 필요)
    //     userSno: customer.userSno || null,
    //     petSno: customer.petSno || null,
    //     // 주소 정보 (1건인 경우 사용)
    //     userAddr: customer.userAddr || '',
    //     userAddr2: customer.userAddr2 || '',
    //     // 담당의사 (1건인 경우 사용)
    //     petDoctor: customer.petDoctor || '',
    //     petName: customer.petName || '',
    //     petBw: customer.petBw || '',
    //     rfid: customer.rfid || '',
    //     speciesName: customer.speciesName || '',
    //     breedName: customer.breedName || '',
    //     lastStatusDate: customer.lastStatusDate || '',
    //     regDate: customer.regDate || '',
    // };
    const newCustomer = {
        ...customer,
        // lastStatusDateTxt: customer.lastStatusDate ? formatDate(customer.lastStatusDate) : '',
        // regDateTxt: customer.regDate ? formatDate(customer.regDate) : '',
        isMatched: true,
        rowClass: 'row-matched',
        // 고객/동물 번호 (예약 확정 시 필요)
        userSno: customer.userSno || null,
        // 주소 정보 (1건인 경우 사용)
        userAddr: customer.userAddr || '',
        userAddr2: customer.userAddr2 || '',
        ...petInfoByType[customer.buttonType]//타입별 선언한 값으로 덮어쓰기
    };
    
    // 선택한 고객만 리스트에 남김 (단일 결과 화면으로 표시)
    reserveClientList.value = [newCustomer];
    isManualUnmatched.value = false;
    
    // 고객 검색 모달 닫기
    modalStore.searchCustomerModal.closeModal();
};

// 예약 취소 저장 로직
const handleSaveCancel = async () => {
    // 1. 유효성 검사
    if (!cancelReasonType.value) {
        showAlert('거절 사유를 선택해주세요.');
        return;
    }
    
    // 2. '직접 입력' 선택 시 내용 확인
    if (cancelReasonType.value === '직접 입력') {
        // 빈 값 체크
        if (!cancelReasonDirect.value.trim()) {
            showAlert('거절 사유를 입력해주세요.');
            return;
        }
        
        // 3. 50자 초과 체크 추가
        if (cancelReasonDirect.value.length > 50) {
            showAlert('거절 사유는 최대 50자까지 입력 가능합니다.');
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
            title: '예약 거절',
            text: '예약이 거절되었습니다.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: () => {
                modalStore.confirmModal.closeModal();
            }
        });
    } else {
        // 실패 시 에러 메시지 표시
        modalStore.confirmModal.openModal({
            title: '예약 거절 실패',
            text: result.message || '예약 거절 중 오류가 발생했습니다.',
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
    { key: 'lastVisitDateTxt', label: '최근방문일', width: '17%'},
    { key: 'action', label: '고객매칭', width: '10%'},
]

// 예약 확정 상태일 때는 매칭된 고객만 필터링
const matchedClientList = computed(() => {
    // if (reserveData.inState === 1) {
    //     // 예약 확정 상태: 매칭된 고객만 반환
    //     return reserveClientList.value.filter(item => item.isMatched);
    // }
    // 예약 확정 전: 전체 리스트 반환
    return reserveClientList.value;
});

// 조회 결과가 1건인지 확인 (예약 확정 상태일 때는 매칭된 고객만 고려)
// const isSingleResult = computed(() => matchedClientList.value.length === 1)

// 상세 뷰(고객/동물 정보 카드)를 보여줄 조건
const isSingleResult = computed(() => {
    // 수동으로 해제했거나 리스트에서 직접 매칭 중이라면 상세 뷰 차단 (테이블 유지)
    if (isManualUnmatched.value) {
        return false;
    }

    // 리스트가 딱 1개라면 (예약확정 상태든 아니든) 상세 뷰를 보여줌
    // initializeClientList에서 1개일 때 자동 매칭(isMatched: true) 처리가 이미 되어 있으므로 개수만 체크
    return reserveClientList.value.length === 1;
});

// 예약 확정 상태 여부
const isConfirmed = computed(() => reserveData.inState === 1);

// 예약 취소/거절 상태 확인 (inState === 2: 취소, 3: 거절)
const isCancelled = computed(() => {
    return reserveData.inState === 2 || reserveData.inState === 3;
});

// 고객 정보: 취소/거절 시 상세(단일) 뷰 숨김 → 테이블 빈 상태만 표시
const showCustomerDetailView = computed(() => !isCancelled.value && isSingleResult.value);
const customerTableRows = computed(() => (isCancelled.value ? [] : matchedClientList.value));

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
            petNo: customer.petNo || '',
            petName: customer.petName || '',
            petBw: customer.petBw || '',
            rfid: customer.rfid || '',
            speciesName: customer.speciesName || '',
            breedName: customer.breedName || '',
            sex: customer.sex || '',
            petInsertDate: customer.petInsertDate || customer.regDate || '',
            lastVisitDate: customer.lastVisitDate || '',
            petDoctor: getDoctorName(customer.petDoctor) || '',
        };
    }
    return null;
})


// 접수 일시 계산
const receivedDateTime = computed(() => 
    formatDateTime(reserveData.createdAt)
);

// 확정/취소/거절 일시 필드 라벨 (상태에 따라 문구 변경)
const confirmedDateTimeLabel = computed(() => {
    if (reserveData.inState === 2) return '취소 일시';
    if (reserveData.inState === 3) return '거절 일시';
    return '확정 일시';
});
// 취소/거절 일시 필드 라벨 (상태에 따라 문구 변경)
const cancelRejectLabel = computed(() => {
    if (reserveData.inState === 2) return '취소 메모';
    if (reserveData.inState === 3) return '거절 메모';
});

// 확정/취소(거절 포함) 일시 계산
// - 예약확정(inState === 1) : updatedAt (확정 처리 시각)
// - 취소/거절(inState === 2 또는 3) : canceledAt (취소/거절 처리 시각)
// - 그 외 상태 : 빈 값
const confirmedDateTime = computed(() => {
    if (reserveData.inState === 2 || reserveData.inState === 3) {
        return reserveData.canceledAt ? formatDateTime(reserveData.canceledAt) : '';
    }
    if (reserveData.inState != 0 && reserveData.updatedAt) {
        return formatDateTime(reserveData.updatedAt);
    }
    return '';
});

// 병원 메모 표시값
// - 예약거절(inState === 3, 병원이 거절한 경우) 이면 rejectMsg 우선, 없으면 geReMemo
// - 그 외에는 geReMemo
const hospitalMemo = computed(() => {
    if (reserveData.inState === 3) {
        return reserveData.rejectMsg || reserveData.geReMemo || '';
    }
    return reserveData.geReMemo || '';
});

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
// 시작 시간이 선택되면 종료 시간을 자동으로 +30분, +한시간 설정
watch(startTime, (newStartTime) => {
    if (!newStartTime) return;

    // 시작 시간을 분 단위로 변환
    const startTotalMinutes = formatTimeToMinutes(newStartTime);
    
    if (startTotalMinutes !== null) {
        // 30분 || 60 추가
        const endTotalMinutes = startTotalMinutes + hospitalStore.bookingTime;

        // HH:mm 형식으로 변환
        const hours = Math.floor(endTotalMinutes / 60);
        const minutes = endTotalMinutes % 60;

        const displayHours = hours >= 24 ? 23 : hours;
        const displayMinutes = hours >= 24 ? 59 : minutes;
        
        // 종료 시간 자동 업데이트
        endTime.value = `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}`;
    }
});

// 종료 시간 수동 변경 시 검증 (추가)
watch(endTime, (newEnd) => {
    if (!startTime.value || !newEnd) return;

    const startMin = formatTimeToMinutes(startTime.value);
    const endMin = formatTimeToMinutes(newEnd);

    if (startMin !== null && endMin !== null && endMin <= startMin) {
        showAlert('마지막 시간은 시작 시간보다 빠를 수 없습니다.');

        // 값을 다시 시작 시간 +30 || || +60 으로 강제 보정 
        const correctedEnd = startMin + hospitalStore.bookingTime;
        const h = Math.floor(correctedEnd / 60);
        const m = correctedEnd % 60;

        const displayHours = h >= 24 ? 23 : h;
        const displayMinutes = h >= 24 ? 59 : m;

        endTime.value = `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}`;
    }
});

// 차트보기 버튼 클릭 핸들러
const handleViewChart = () => {
    if (singlePetData.value?.petSno) {
        const url = `${EXTERNAL_LINKS.CHART_MAIN}?pet_no=${singlePetData.value.petNo}`;
        window.open(url, '_blank');
    }
};


// 핸드폰 번호 표기
const textPhoneNumber = computed(() => {
    return formatPhone(reserveData.userTel);
})

// 모달 열릴때 watch > 배경 스크롤 방지 로직, 모달 타이틀 초기화
watch(() => modalStore.reserveInfoModal.isVisible, async(val) => {
    emit('update-title', '고객 예약 정보');

    await nextTick();
    if (val) {
        // 모달이 열릴 때 히스토리에 가짜 상태 추가
        // 브라우저는 history 하나 추가됐다고 인식
        window.history.pushState({ modal: 'reserveInfo' }, '', window.location.href);
        // 뒤로가기(popstate) 이벤트 리스너 등록
        window.addEventListener('popstate', handleBackGesture);

        // 열리면 배경 스크롤 고정
        document.body.style.overflow = 'hidden';
    } else {
        // 모달이 정상적으로(닫기 버튼 등) 닫히면 리스너 제거
        window.removeEventListener('popstate', handleBackGesture);

        // 닫히면 배경 스크롤 해제
        document.body.style.overflow = '';
    }
}, { immediate: true });

const handleBackGesture = () => {
    // 사용자가 뒤로가기 제스처를 하면 이 함수가 실행됨
    if (modalStore.reserveInfoModal.isVisible) {
        modalStore.reserveInfoModal.closeModal();
    }
};

// 고객검색 바텀시트 열기/닫기 상태
const openSearchBottomSheet = computed({
  get: () => modalStore.searchCustomerModal.isVisible,
  set: (val) => {
    modalStore.searchCustomerModal.closeModal();
  }
}, { immediate: true });

// 예약확정 바텀시트 열기/닫기 상태
const openConfirmReserveBottomSheet = computed({
  get: () => modalStore.confirmReserveModal.isVisible,
  set: (val) => {
    modalStore.confirmReserveModal.closeModal();
  }
}, { immediate: true });

// 예약거절 바텀시트 열기/닫기 상태
const openCancelReserveBottomSheet = computed({
  get: () => modalStore.cancelReserveModal.isVisible,
  set: (val) => {
    modalStore.cancelReserveModal.closeModal();
  }
}, { immediate: true });

// 예약 정보 접기 토글
const toggleFold = () => {
    isFolded.value = !isFolded.value;
};

// ===== 메모 더보기 버튼 관련
const isMemoOpen = ref(false); // 바텀시트 열림 상태
const memoDetail = ref({
    title: '',
    content: '',
    disabled: null,
    placeholder: '',
});

// 더보기 클릭 시 호출될 함수
const openMemo = (title, content, disabled = true) => {
    memoDetail.value = {title, content, disabled};

    if(title == '병원 메모') {
        memoDetail.value.placeholder = '메모를 입력하세요.'
    } else {
        memoDetail.value.placeholder = '등록된 정보가 없습니다.'
    }

    isMemoOpen.value = true;
};

// 상단으로 이동 버튼 관련
const isVisible = ref(false);
const modalInnerRef = ref(null);
// 스크롤 위치를 감시하는 함수
const checkScroll = () => {
    const scrollValue = modalInnerRef.value.scrollTop;
    // scroll top btn 보여줌
    isVisible.value = scrollValue > 300;

    // 스크롤이 90px 이상 내려가면 이름 정보를, 아니면 기본 타이틀을 보내기
    if (scrollValue > 90) {
        const titleText = `${reserveData.petName} / ${reserveData.userName}`;
        emit('update-title', titleText);
    } else {
        emit('update-title', '고객 예약 정보');
    }
};
const scrollToTop = () => {
    if (modalInnerRef.value) {
        modalInnerRef.value.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
};


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

    if (modalInnerRef.value) {
        modalInnerRef.value.addEventListener('scroll', checkScroll);
    }
});

onUnmounted(() => {
    if (modalInnerRef.value) {
        modalInnerRef.value.removeEventListener('scroll', checkScroll);
    }
});
</script>

<template>
    <div class="modal-contents-inner" :class="isMobile ? 'mobile' : ''" ref="modalInnerRef">
        <!-- 예약 정보 -->
        <div class="reserve-info-section">

            <div class="top">
                <!-- 타이틀 -->
                <div class="modal-content-title-wrapper">
                    <div class="d-flex align-center justify-between">
                        <div class="d-flex gap-8 align-center">
                            <p class="title-l">예약 정보</p>
                            <span v-if="reserveData.clinicType == '개인일정' || reserveData.clinicType == '일반예약'" class="flag flag--black">{{ reserveData.clinicType }}</span>
                            <span v-else class="flag" :class="RESERVE_STATUS_CLASS_MAP[reserveData.inState]">{{ RESERVE_STATUS_SHORT_MAP[reserveData.inState] }}</span>
                        </div>
        
                        <div class="reserve-number">
                            예약번호 <span>{{ reserveData.reserveIdx }}</span>
                        </div> 
                    </div>
    
                    <!-- 예약대기 안내문구 -->
                    <span v-if="reserveData.inState == 0" class="sub-txt">예약 승인이 필요합니다. 승인이 불가능할 경우, 일정 변경 또는 예약 거절 해주세요.</span>
                </div>
    
                <!-- 예약 동물정보 -->
                <div v-if="reserveData.clinicType !== '개인일정' && reserveData.clinicType !== '일반예약'" class="reserve-pet-info"> 
                    <div class="reserve-info">
                        <div class="info">
                            <span class="name pet">{{ reserveData.petName }}</span>
                            <span class="dot"></span>
                            <span class="name user">{{ reserveData.userName }}</span>
                        </div>
    
                        <div class="icon">
                            <img :src="pathIcons[reserveData.reRoute]" alt="예약경로">
                        </div>
                    </div>
                    <div class="pet-info">
                        <span class="phone">{{ textPhoneNumber }}</span>
                        <span class="dot"></span>
                        <span>{{ reserveData.spesice }}</span>
                        <span class="dot"></span>
                        <span>{{  PET_GENDER_SHORT_MAP[reserveData.petSex] }}</span>
                    </div>
                </div>

            </div>

            <template v-if="reserveData.clinicType == '개인일정' || reserveData.clinicType == '일반예약'">
                <div class="info-lists-wrapper">
                    <div class="info-list">
                        <div class="info-item">
                            <p class="label">예약 경로</p>
                            <InputTextBox 
                                v-model="RESERVE_ROUTE_MAP[reserveData.reRoute]"
                                :disabled="true"
                                placeholder="예약 경로"
                            />
                        </div>
                        <div class="info-item">
                            <p class="label">예약 일시</p>
                            <div class="d-flex gap-8 flex-wrap w-100" style="flex:2;">
                                <CustomDatePicker 
                                    ref="reserveDateRef" 
                                    v-model="reserveDate" 
                                    :range="false" 
                                    :disabled="isCancelled"
                                    :is-mobile="isMobile"
                                />
    
                                <!-- 시간 선택 ( 00: 00 ~ 00: 00) -->
                                <div class="d-flex align-center gap-4" style="flex:2;">
                                    <TimeSelect 
                                        ref="startTimeRef" 
                                        v-model="startTime" 
                                        class="time-select-wrap"
                                        :disabled="isCancelled"
                                        :is-mobile="isMobile"
                                    />
                                    <span class="time-separator">-</span>
                                    <TimeSelect 
                                        ref="endTimeRef" 
                                        v-model="endTime" 
                                        class="time-select-wrap"
                                        :disabled="isCancelled"
                                        :is-mobile="isMobile"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="info-item">
                            <p class="label">담당의</p>
                            <div class="select-wrapper w-100">
                                <CustomSingleSelect 
                                    ref="doctorSelectRef"
                                    :model-value="selectedDoctorId"
                                    @update:model-value="handleDoctorChange"
                                    :options="doctorOptions"
                                    placeholder="담당의 선택"
                                    select-width="100%"
                                    :disabled="isCancelled"
                                    :is-mobile="isMobile"
                                />
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="w-100 d-flex align-center justify-between">
                                <p class="label">병원 메모</p>
                                <p class="show-more-btn" @click="openMemo('병원 메모', reserveData.geReMemo, isCancelled)">더보기 <img :src="icArrow" alt=" 화살표"></p>
                            </div>
                            <div class="fake-textbox" :class="isCancelled ? 'disabled' : ''">    
                                <span v-if="!reserveData.geReMemo || reserveData.geReMemo.trim() === ''" class="empty-text">메모를 입력하세요.</span>
                                <p v-else class="text">{{ reserveData.geReMemo  }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <template v-else>
                <!-- 정보 -->
                <div v-show="!isFolded" class="info-lists-wrapper">
                    <div class="info-list">
                        <div class="info-item">
                            <p class="label">상품/진료실명</p>
                            <InputTextBox 
                                v-model="reserveData.roomName"
                                :disabled="true"
                                placeholder="상품명/진료실명"
                            />
                        </div>
                        <div class="info-item">
                            <p class="label">예약 방문일</p>
                            <div class="d-flex gap-8 flex-wrap w-100" style="flex:2;">
                                <CustomDatePicker 
                                    ref="reserveDateRef" 
                                    v-model="reserveDate" 
                                    :range="false" 
                                    :disabled="isCancelled"
                                    :is-mobile="isMobile"
                                />
    
                                <!-- 시간 선택 ( 00: 00 ~ 00: 00) -->
                                <div class="d-flex align-center gap-4" style="flex:2;">
                                    <TimeSelect 
                                        ref="startTimeRef" 
                                        v-model="startTime" 
                                        class="time-select-wrap"
                                        :disabled="isCancelled"
                                        :is-mobile="isMobile"
                                    />
                                    <span class="time-separator">-</span>
                                    <TimeSelect 
                                        ref="endTimeRef" 
                                        v-model="endTime" 
                                        class="time-select-wrap"
                                        :disabled="isCancelled"
                                        :is-mobile="isMobile"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="info-item">
                            <p class="label">담당의</p>
                            <div class="select-wrapper w-100">
                                <CustomSingleSelect 
                                    ref="doctorSelectRef"
                                    :model-value="selectedDoctorId"
                                    @update:model-value="handleDoctorChange"
                                    :options="doctorOptions"
                                    placeholder="담당의 선택"
                                    select-width="100%"
                                    :disabled="isCancelled"
                                    :is-mobile="isMobile"
                                />
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="w-100 d-flex align-center justify-between">
                                <p class="label">병원 메모</p>
                                <p class="show-more-btn" @click="openMemo('병원 메모', reserveData.geReMemo, isCancelled)">더보기 <img :src="icArrow" alt=" 화살표"></p>
                            </div>
                            <div class="fake-textbox" :class="isCancelled ? 'disabled' : ''">    
                                <span v-if="!reserveData.geReMemo || reserveData.geReMemo.trim() === ''" class="empty-text">메모를 입력하세요.</span>
                                <p v-else class="text">{{ reserveData.geReMemo  }}</p>
                            </div>
                        </div>
                        <!-- 예약취소, 거절의 경우 취소일시,취소메모 데이터 따로 보여줌 -->
                        <template v-if="isCancelled">
                            <div class="info-item">
                                <p class="label">{{ confirmedDateTimeLabel }}</p>
                                <InputTextBox 
                                    :model-value="confirmedDateTime"
                                    :disabled="true"
                                    :placeholder="confirmedDateTimeLabel"
                                />
                            </div>
                            <div class="info-item">
                                <div class="w-100 d-flex align-center justify-between">
                                    <p class="label">{{ cancelRejectLabel }}</p>
                                    <p class="show-more-btn" @click="openMemo(cancelRejectLabel, reserveData.rejectMsg)">더보기 <img :src="icArrow" alt=" 화살표"></p>
                                </div>
                                <div class="fake-textbox disabled">    
                                    <span v-if="!reserveData.rejectMsg || reserveData.rejectMsg.trim() === ''" class="empty-text">등록된 내용이 없습니다.</span>
                                    <p v-else class="text">{{ reserveData.rejectMsg  }}</p>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
                
                <div v-show="!isFolded" class="info-lists-wrapper border-top border-bottom">
                    <div class="info-list">
                        <div class="info-item">
                            <div class="w-100 d-flex align-center justify-between">
                                <p class="label">고객 메모</p>
                                <p class="show-more-btn" @click="openMemo('고객 메모', reserveData.reMemo)">더보기 <img :src="icArrow" alt=" 화살표"></p>
                            </div>
                            <div class="fake-textbox disabled">    
                                <span v-if="!reserveData.reMemo || reserveData.reMemo.trim() === ''" class="empty-text">등록된 정보가 없습니다.</span>
                                <p v-else class="text">{{ reserveData.reMemo }}</p>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="w-100 d-flex align-center justify-between">
                                <p class="label">추가 정보</p>
                                <p class="show-more-btn" @click="openMemo('추가 정보', reserveData.questions)">더보기 <img :src="icArrow" alt=" 화살표"></p>
                            </div>
                            <div class="fake-textbox disabled">
                                <span v-if="!reserveData.questions || reserveData.questions.trim() === ''" class="empty-text">등록된 정보가 없습니다.</span>
                                <p v-else class="text">{{ reserveData.questions }}</p>
                            </div>
                        </div>
                        <div v-if="reserveData.reRoute != 2" class="info-item">
                            <div class="w-100 d-flex align-center justify-between">
                                <p class="label">옵션</p>
                                <p class="show-more-btn" @click="openMemo('옵션', reserveData.options)">더보기 <img :src="icArrow" alt=" 화살표"></p>
                            </div>
                            <div class="fake-textbox disabled">    
                                <span v-if="!reserveData.options || reserveData.options.trim() === ''" class="empty-text">등록된 정보가 없습니다.</span>
                                <p v-else class="text">{{ reserveData.options  }}</p>
                            </div>
                        </div>
                        <!-- <div class="info-item">
                            <p class="label">주소</p>
                            <InputTextBox 
                                v-model="reserveData.address1"
                                :disabled="true"
                                placeholder="주소"
                            />
                        </div> -->
                        <!-- <div class="info-item">
                            <p class="label">상세 주소</p>
                            <InputTextBox 
                                v-model="reserveData.address2"
                                :disabled="true"
                                placeholder="상세 주소"
                            />
                        </div> -->
                        <!-- <div class="info-item">
                            <p class="label">종</p>
                            <InputTextBox 
                                v-model="reserveData.spesice"
                                :disabled="true"
                                placeholder="종"
                            />
                        </div> -->
                        <!-- <div class="info-item">
                            <p class="label">품종</p>
                            <InputTextBox 
                                :model-value="reserveData.breed || ''"
                                :disabled="true"
                                placeholder="품종"
                            />
                        </div> -->
                        <div class="info-item">
                            <p class="label">접수 일시</p>
                            <InputTextBox 
                                :model-value="receivedDateTime"
                                :disabled="true"
                                placeholder="접수 일시"
                            />
                        </div>
                    </div>
                </div>
    
                <div class="fold-reserve-info-btn" @click="toggleFold">
                    {{ isFolded ? '예약 정보 펼치기' : '예약 정보 접기' }}
                    <img :src="icDropdownBtn" alt="토글" :style="{ transform: isFolded ? 'rotate(180deg)' : 'rotate(0deg)' }">
                </div>
            </template>
        </div>

        <!-- 고객정보 (취소/거절 시 테이블 빈 상태만 표시) -->
        <div v-if="reserveData.clinicType !== '개인일정' && reserveData.clinicType !== '일반예약'" class="customer-info-section">
            <!-- 단일 결과 상세 뷰 (취소/거절이 아닐 때만) -->
            <template v-if="showCustomerDetailView">
                <div class="top">
                    <!-- 타이틀 --> 
                    <div class="modal-content-title-wrapper">
                        <div class="d-flex align-items-center justify-between">
                            <p class="title-xl-mobile">고객 정보</p>
    
                            <!-- 고객 검색 버튼 -->
                            <button 
                                v-if="!isCancelled && !isConfirmed"
                                class="btn btn--size-32 btn--black-outline" 
                                @click="modalStore.searchCustomerModal.openModal()"
                            >
                                <img :src="icSearchB" alt="아이콘">
                                고객 검색
                            </button>
                        </div>
           
                        <span class="caption-mobile helper__text">
                            예약 고객 정보를 기준으로 검색했어요. 우리병원 차트에 등록된 고객과 매칭해주세요. 신규로 등록하는 경우 매칭없이 예약을 확정해주세요.
                        </span>
                    </div>
                </div>

                <div class="bottom">
                    <div class="info-lists-wrapper">
                        <div class="show-chart-btn">
                            <button 
                            class="btn btn--size-32 btn--black-outline" 
                            @click="handleViewChart" 
                            v-if="(singlePetData?.petSno || '') != '' ">
                                <img  :src="icShow" alt="보기" width="16" />
                                차트보기
                            </button>
                            <button 
                                v-if="!isConfirmed"
                                class="btn btn--size-32 btn--black-outline" 
                                :class="{'is-disabled':isCancelled}"
                                :disabled="isCancelled" 
                                @click="unmatchCustomer">
                                    <img  :src="icLinkBlack" alt="매칭 해제" width="16" />
                                    매칭해제
                            </button>
                        </div>

                        <div class="list">
                            <div class="list__title">
                                <p>고객 정보</p>
                            </div>

                            <!-- 고객 정보  -->
                            <div class="list__item">
                                <div class="list-label">고객번호</div>
                                <div class="list-content">
                                    <span>{{ singleCustomerData?.userNo || '' }}</span>
                                </div>
                            </div>
                            <li class="list__item">
                                <div class="list-label">고객명</div>
                                <div class="list-content">
                                    <span>{{ singleCustomerData?.userName || '' }}</span>
                                </div>
                            </li>
                            <li class="list__item">
                                <div class="list-label">연락처</div>
                                <div class="list-content">
                                    <span>{{ singleCustomerData?.userTel || '' }}</span>
    
                                </div>
                            </li>
                            <!-- <li class="list__item">
                                <div class="list-label">주소</div>
                                <div class="list-content">
                                    <span>{{ singleCustomerData?.userAddr || '' }}</span>
                                </div>
                            </li> -->
                            <!-- <li class="list__item">
                                <div class="list-label">상세주소</div>
                                <div class="list-content">
                                    <span>{{ singleCustomerData?.userAddr2 || '' }}</span>
                                </div>
                            </li> -->
                        </div>
    
                        <div class="list border-top">
                            <div class="list__title">
                                <p>동물 정보</p>
                            </div>

                            <div class="list__item">
                                <div class="list-label">동물번호</div>
                                <div class="list-content">
                                    <div class="d-flex align-center justify-between">
                                        <span>{{ singlePetData?.petSno || '-' }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="list__item">
                                <div class="list-label">동물이름</div>
                                <div class="list-content">
                                    <span>{{ singlePetData?.petName || '-' }}</span>
                                </div>
                            </div>
                            <div class="list__item">
                                <div class="list-label">종</div>
                                <div class="list-content">
                                    <span>{{ singlePetData?.speciesName || '-' }}</span>
                                </div>
                            </div>
                            <div class="list__item">
                                <div class="list-label">품종</div>
                                <div class="list-content">
                                    <span>{{ singlePetData?.breedName || '-' }}</span>
                                </div>
                            </div>
                            <div class="list__item">
                                <div class="list-label">성별</div>
                                <div class="list-content">
                                    <span>{{ singlePetData?.sex || '' }}</span>
                                </div>
                            </div>
                            <div class="list__item">
                                <div class="list-label">체중</div>
                                <div class="list-content">
                                    <span>{{ singlePetData?.petBw ? `${singlePetData.petBw}kg` : '-' }}</span>
                                </div>
                            </div>
                            <div class="list__item">
                                <div class="list-label">동물등록번호</div>
                                <div class="list-content">
                                    <span>{{ singlePetData?.rfid ? singlePetData.rfid : '-' }}</span>
                                </div>
                            </div>
                            <div class="list__item">
                                <div class="list-label">등록일</div>
                                <div class="list-content">
                                    <span>{{ singlePetData?.petInsertDate ? formatDateDot(singlePetData.petInsertDate) : '-' }}</span>
                                </div>
                            </div>
                            <div class="list__item">
                                <div class="list-label">최근방문일</div>
                                <div class="list-content">
                                    <span>{{ singlePetData?.lastVisitDate ? formatDateDot(singlePetData.lastVisitDate) : '-' }}</span>
                                </div>
                            </div>
                            <div class="list__item">
                                <div class="list-label">담당의사</div>
                                <div class="list-content">
                                    <span>{{ singlePetData?.petDoctor || '' }}</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </template>

            <!-- 여러 건이거나 취소/거절: 테이블 (취소/거절 시 빈 상태) -->
            <template v-else>
                <div class="top">
                    <!-- 타이틀 -->
                    <div class="modal-content-title-wrapper">
                        <div class="d-flex align-items-center justify-between">
                            <p class="title-xl-mobile">고객 정보</p>
                            <!-- 고객 검색 버튼 (취소/거절 시 미표시) -->
                            <button 
                                v-if="!isCancelled && !isConfirmed"
                                class="btn btn--size-32 btn--black-outline" 
                                @click="modalStore.searchCustomerModal.openModal()"
                            >
                                <img :src="icSearchB" alt="아이콘">
                                고객 검색
                            </button>
                        </div>

                        <span class="caption-mobile helper__text">
                            예약 고객 정보를 기준으로 검색했어요. 우리병원 차트에 등록된 고객과 매칭해주세요. 신규로 등록하는 경우 매칭없이 예약을 확정해주세요.
                        </span>
                    </div>
                </div>

                <!-- 모바일에선 리스트로 보여줌 -->
                <div 
                    v-if="customerTableRows.length > 0" 
                    class="customers-list-wrapper" 
                >
                    <div v-for="row in customerTableRows" class="list-item" :class="row.isMatched ? 'matched' : ''">
                        <div class="list-item__content">
                            <p class="list-item__title">고객정보</p>
                            <div class="list-item__info">
                                <p class="name">{{ row.userName }} ({{ row.userNo }})</p>
                                <div class="sub-info">
                                    <span>{{ row.userTel }}</span>
                                    <span class="bar"></span>
                                    <span>최근 방문일 {{ formatDate(row.lastVisitDate) }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="list-item__content">
                            <p class="list-item__title">동물정보</p>
                            <div class="list-item__info">
                                <p class="name">{{ row.petName }} ({{ row.petNo }})</p>
                                <div class="sub-info">
                                    <span>{{ row.speciesName }}</span>
                                    <span class="bar"></span>
                                    <span>{{ row.breed }}</span>
                                    <span class="bar"></span>
                                    <span>{{ row.sex }}</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            class="btn btn--size-40" 
                            :class="row.isMatched ? 'btn--blue-outline' : 'btn--black-outline'"
                            @click="toggleCustomerMatch(row)
                        ">
                            <img :src="row.isMatched ? icLinkBlue : icLinkBlack" alt="매칭">
                            {{ row.isMatched ? '고객 매칭 해제' : '고객 매칭' }}
                        </button>
                    </div>
                </div>

                <div v-else class="empty-match-info">
                    <img :src="icEmpty" alt="비어있음 아이콘">
                    <div class="d-flex flex-col align-center">
                        <span class="title-m-mobile">검색 결과가 없습니다.</span>
                        <p class="caption-mobile">예약 확정 시, 신규 고객으로 등록되어 예약이 접수됩니다.</p>
                    </div>
                </div>
            </template>
        </div>

    </div>

    <!-- 버튼 -->
    <div v-if="!isCancelled" class="modal-button-wrapper" :class="isMobile ? 'mobile' : ''">
        <div v-if="reserveData.clinicType !== '개인일정' && reserveData.clinicType !== '일반예약'" class="buttons">
            <button class="btn btn--size-40 btn--blue-outline" @click="modalStore.cancelReserveModal.openModal()">예약거절</button>
            <button class="btn btn--size-40 btn--blue" @click="handleConfirmReservation(isConfirmed)">{{ isConfirmed ? '저장' : '예약 확정' }}</button>
        </div>
        <div v-else>
            <button class="btn btn--size-40 btn--blue-outline" @click="modalStore.reserveInfoModal.closeModal()">닫기</button>
            <button class="btn btn--size-40 btn--blue" @click="handleConfirmReservation(isConfirmed)">저장</button>
        </div>
    </div>

    <!-- 고객 예약 정보 > 메모 더보기 클릭시-->
    <BottomSheet
        v-model="isMemoOpen"
        :bottom-sheet-title="memoDetail.title"
        :save-btn-text="memoDetail.disabled ? '확인' : '저장'"
        @save="memoDetail.disabled 
        ? (isMemoOpen = false) 
        : (reserveData.geReMemo = memoDetail.content, isMemoOpen = false)"
    >
        <template #content>
            <div style="height:300px; margin-bottom:24px;">
                <TextAreaBox
                    v-model="memoDetail.content"
                    :disabled="memoDetail.disabled"
                    height="100%"
                    :placeholder="memoDetail.placeholder"
                />
            </div>
        </template>
    </BottomSheet>

    <!--  고객 예약 정보 > 고객 검색 모달 // 고객예약 정보 안으로 옮김 --> 
    <BottomSheet
        v-model="openSearchBottomSheet"
        bottom-sheet-title="고객 검색"
        :hide-bottom-sheet-btn="true"
    >
        <template #content>
            <SearchCustomer 
                :is-mobile="isMobile"
                :matched-customer="matchedCustomerForSearch"
                @customer-selected="handleCustomerSelected" 
            />
        </template>
    </BottomSheet>
    
    <!-- 고객 예약 정보 > 예약 취소 모달 -->
    <BottomSheet
        v-model="openCancelReserveBottomSheet"
        bottom-sheet-title="예약 거절"
        close-btn-text="취소"
        @save="handleSaveCancel"
        :show-close-btn="true"
    >
        <template #content>
            <div class="d-flex flex-col align-center gap-24">
                <div class="d-flex flex-col align-center gap-2">
                    <span class="title-m-mobile">{{ formatDateTime(reserveDate) }}</span>
                    <p class="title-l-mobile">{{ reserveData.userName }} {{ reserveData.petName }}</p>
                </div>
    
                <p class="body-l-mobile" style="color: #494949; text-align:center;">예약을 거절하시려면 거절 사유 선택 후<br/>저장 버튼을 클릭해주세요.</p>

                <ul class="reject-reason-list">
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
        </template>
    </BottomSheet>
    
    <!-- 고객 예약 정보 > 예약 확정 모달 -->
    <BottomSheet
        v-model="openConfirmReserveBottomSheet"
        bottom-sheet-title="예약 확정"
        @save="handleConfirmReservationSave(isConfirmed)"
        :save-btn-text="isConfirmed ? '저장' : '예약 확정'"
        :show-close-btn="true"
    >
        <template #content>
            <div class="confirm-reserve-bottomSheet-slot">
                <span class="body-l-mobile">예약을 확정하시겠습니까?</span>
                <label class="checkbox" v-if="reserveData.clinicType !== '개인일정' && reserveData.clinicType !== '일반예약'">
                    <input type="checkbox" v-model="sendNotification" />
                    <span class="box"></span>
                    <span class="label">고객에게 예약 확정 알림톡 발송</span>
                </label>
            </div>
        </template>
    </BottomSheet>

    <!-- goToTop버튼 -->
    <div v-show="isVisible" class="go-to-top" @click="scrollToTop">
        <img :src="icArrowTop" alt="top">
    </div>
</template>

<style lang="scss" scoped>
    .modal-contents-inner {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex-grow: 1;
        min-height: 0;
        overflow-y:  auto;
        padding-bottom: 10px;

    }

    .dot {
        width: 2px;
        height: 2px;
        background-color: $gray-500;
        display: block;
    }

    .fold-reserve-info-btn {
        @include flex-center;
        @include typo($title-m-mobile-size, $title-m-mobile-weight, $title-m-mobile-spacing, $title-m-mobile-line);
        color: $gray-500;
        gap:8px;
        padding: 20px 0;
    }

    .empty-match-info {
        @include flex-center;
        flex-direction: column;
        gap:20px;
        padding: 50px 0;

        color: $gray-400;
    }

    .modal-content-title-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        .sub-txt {
            @include typo($caption-mobile-size, $caption-mobile-weight, $caption-mobile-spacing, $caption-mobile-line);
            color: $gray-700;
        }
        .reserve-number {
            @include typo($body-m-mobile-size, $body-m-mobile-weight, $body-m-mobile-spacing, $body-m-mobile-line);
            color: $gray-500;
            span {@include typo($title-m-mobile-size, $title-m-mobile-weight, $title-m-mobile-spacing, $title-m-mobile-line);}
        }
    }

    // 예약 정보
    .reserve-info-section {
        display: flex;
        flex-direction: column;
        // gap: 20px;
        
        background-color: $gray-00;
        border: 1px solid $gray-200;
        border-radius: 16px;

        .top {

            display: flex;
            flex-direction: column;
            gap:20px;
            padding: 24px 20px 20px;
            border-bottom: 1px solid $gray-200;
            
            // 예약 동물 정보
            .reserve-pet-info {
                padding: 16px;
                border-radius: 8px;
                background-color: $primary-50;
    
                .reserve-info {
                    width: 100%;
                    display: flex;
                    // align-items: center;
                    justify-content: space-between;
                    // gap:16px;
        
                    .info {
                        flex: 2 0 0;
                        display: flex;
                        flex-wrap:wrap;
                        align-items: center;
                        gap: 6px;
                        row-gap: 0px;
        
                        .name { 
                            @include typo($title-l-mobile-size, $title-l-mobile-weight, $title-l-mobile-spacing, $title-l-mobile-line);
                            // text-overflow: ellipsis;
                            // overflow: hidden;
                            white-space: nowrap;
                            // &.pet {max-width: 80px;}
                            // &.user {max-width: 80px;}
                        }
                        .phone {
                            @include typo($body-m-mobile-size, $body-m-mobile-weight, $body-m-mobile-spacing, $body-m-mobile-line);
                            // text-overflow: ellipsis;
                            // overflow: hidden;
                            white-space: nowrap;
                            // max-width: 110px;
                        }
                    }
                    // .icon {flex: 1 0 0;}
                }
                .pet-info {
                    width: 100%;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 8px;
                    row-gap:0;
        
                    color: $gray-700;
                }
            }
        }

        .info-lists-wrapper {
            display:flex;
            gap:20px;
            overflow-y: auto;
            padding: 20px;
            flex-direction: column;
            overflow-y:visible;

            .info-list {
                // flex:1;
                display: flex;
                flex-direction: column;
                gap: 14px;
        
                .info-item {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
        
                    .label {
                        @include typo($title-m-mobile-size, $title-m-mobile-weight, $title-m-mobile-spacing, $title-m-mobile-line);
                        color: $gray-800;
                    }
        
                    .show-more-btn {
                        @include flex-center;
                        gap:4px;
                        @include typo($title-s-mobile-size, $title-s-mobile-weight, $title-s-mobile-spacing, $title-s-mobile-line);
                        color: $gray-700;
                    }
                    
                    .input-text-box-wrapper {
                        width: 100%;
                    }

                    .fake-textbox {
                        flex: 0;
                        min-height: 60px;
                        max-height: 60px;
                        overflow: hidden;

                        p {
                            display: -webkit-box;
                            -webkit-box-orient: vertical;
                            -webkit-line-clamp: 2;
                            line-clamp: 2;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            word-break: break-all;
                            line-height: 1.4; 
                        }
                    }
                }
            }
        }  
    }

    // 고객 정보
    .customer-info-section {

        border-radius: 16px;
        border: 1px solid $gray-200;
        background-color: $gray-00;

        display: flex;
        flex-direction: column;
        // gap:20px;

        .top {
            border-bottom:1px solid $gray-200;
            padding: 24px 20px 20px;
        }

        .bottom {
            padding: 20px;
        }

        .info-lists-wrapper {
            overflow-y: visible;
            border: 1px solid $gray-200;
            border-radius: 8px;

            .show-chart-btn {
                display: flex;
                gap:8px;
                background-color: $gray-50;
                padding: 8px 16px;
                border-radius: 8px 8px 0 0;

                button {
                    width: 100%;
                }
            }

            .list {
                display: flex;
                flex-direction: column;
                gap:16px;

                padding: 16px;

                &__title {
                    @include typo($title-l-mobile-size, $title-l-mobile-weight, $title-l-mobile-spacing, $title-l-mobile-line);
                    color: $primary-700;
                }

                &__item {
                    display: flex;
                    gap:24px;
                }

                .list-label {
                    width:104px;
                    @include typo($title-m-mobile-size, $title-m-mobile-weight, $title-m-mobile-spacing, $title-m-mobile-line);
                    color: $gray-800;
                }

                .list-content {
                    flex:1;
                    @include typo($body-m-mobile-size, $body-m-mobile-weight, $body-m-mobile-spacing, $body-m-mobile-line);
                }
            }
        }
        
    }

    // 고객 리스트
    .customers-list-wrapper {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap:8px;
        overflow-y: auto;

        .list-item {
            padding: 20px;
            width: 100%;
            display: flex;
            flex-direction: column;
            gap:16px;

            border-radius: 8px;
            background-color: $gray-50;

            &.matched {background-color: $primary-50;}

            &__content {
                display: flex;
                gap:8px;
                align-items: flex-start;
            }

            &__title {
                height: 22px;
                display: flex;
                align-items: center;
                white-space: nowrap;
                color: $primary-700;
                @include typo($caption-mobile-size, $caption-mobile-weight, $caption-mobile-spacing, $caption-mobile-line);
            }

            &__info {
                flex:1 0 0;
                display: flex;
                flex-direction: column;
                gap:2px;

                .name {
                    height: 22px;
                    display: flex;
                    align-items: center;
                    color: $gray-800;
                    @include typo($title-m-mobile-size, $title-m-mobile-weight, $title-m-mobile-spacing, $title-m-mobile-line);
                }

                .sub-info {
                    display: flex;
                    align-items: center;
                    flex-wrap:wrap;
                    gap: 8px;
                    color: $gray-500;
                    @include typo($caption-mobile-size, $caption-mobile-weight, $caption-mobile-spacing, $caption-mobile-line);
                }
                .bar {
                    width:1px;
                    height: 12px;
                    background-color: $gray-300;
                }
            }
        }
    }

    .modal-button-wrapper {
        &.mobile {
            position:relative;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: $gray-00;
            border-top: 1px solid $gray-200;
            padding: 20px;

            .buttons {
                width: 100%;
                button { flex: 1;}
            }
        }
    }

    .helper__text {color: $gray-700;}

    //  예약확정 바텀시트 슬롯
    .confirm-reserve-bottomSheet-slot {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap:24px;
        margin-bottom:24px;

        & > span {color: $gray-700;}
    }
    
    // 예약 거절 바텀시트 슬롯 css
    .reject-reason-list {
        width: 100%;
        display:flex;
        flex-direction: column;
        gap:16px;
        padding: 16px;
        margin-bottom:24px;
        border-radius: 8px;
        background-color: $gray-50;
    }

    :deep(.empty-box) {
        margin-top: 10px;
    }

    // 상단으로 이동 버튼 (go-to-top버튼)
    .go-to-top {
        position: fixed;
        bottom: 110px;
        right: 20px;
        @include flex-center;
        width: 48px;
        height: 48px;
        z-index: 2555;

        border: 1px solid $gray-300;
        border-radius: 5px;
        background-color: $gray-00;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.08);
    }
</style>