<!-- 고객 예약 정보 -->
<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { PET_GENDER_MAP, RESERVE_ROUTE_MAP } from '@/utils/reservation';
import { formatDate, formatTime, formatDateTime, formatTimeToMinutes } from '@/utils/dateFormatter';

import InputTextBox from '@/components/common/InputTextBox.vue';
import TimeSelect from '@/components/common/TimeSelect.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import icInformation from '@/assets/icons/ic_information_blue.svg'
import icSearchW from '@/assets/icons/ic_search_w.svg'
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';

import CommonTable from '@/components/common/CommonTable.vue';

import { useModalStore } from '@/stores/modalStore';
import { useHospitalStore } from '@/stores/hospitalStore';

const modalStore = useModalStore();
const modal = modalStore.reserveInfoModal;
const hospitalStore = useHospitalStore();

const reserveData = modal.data.reserve;
const reserveClientPet = modal.data.clientPet;

// 고객번호가 매칭되어 있는지 확인하는 함수
const isCustomerMatched = (clientItem) => {
    // reserveClientPet의 고객번호나 동물번호와 일치하는지 확인
    const petUserNo = reserveClientPet?.userNo || reserveClientPet?.user_num;
    const petPetNo = reserveClientPet?.petNo || reserveClientPet?.pet_num;
    
    const clientUserNo = clientItem?.userNo || clientItem?.user_num;
    const clientPetNo = clientItem?.petNo || clientItem?.pet_num;
    
    // 고객번호와 동물번호가 모두 일치하면 매칭된 것으로 간주
    return (petUserNo && clientUserNo && String(petUserNo) === String(clientUserNo)) ||
           (petPetNo && clientPetNo && String(petPetNo) === String(clientPetNo));
};

const reserveClientList = ref(
    modal.data.clientList.map((item) => {
        const matched = isCustomerMatched(item);
        return {
            ...item,
            lastStatusDateTxt: formatDate(item.lastStatusDate),
            isMatched: matched, // 고객번호가 매칭된 경우에만 매칭 상태
            rowClass: matched ? 'row-matched' : '' // 매칭된 행에 스타일 클래스 추가
        };
    })
);

// 고객 매칭 토글 함수 (단일 선택: 하나 선택 시 기존 선택 해제)
const toggleCustomerMatch = (row) => {
    const index = reserveClientList.value.findIndex(item => item === row);
    if (index !== -1) {
        const wasMatched = reserveClientList.value[index].isMatched;
        
        // 모든 고객의 매칭 상태 초기화
        reserveClientList.value.forEach(item => {
            item.isMatched = false;
            item.rowClass = '';
        });
        
        // 클릭한 고객이 매칭되지 않았던 경우에만 매칭 (토글)
        if (!wasMatched) {
            reserveClientList.value[index].isMatched = true;
            reserveClientList.value[index].rowClass = 'row-matched';
        }
    }
};

const startTime = ref(null);
const endTime = ref(null);

// 예약 방문일 (단일 날짜)을 위한 ref 상태 정의
const reserveDate = ref(null);

// 담당의 ID와 이름을 위한 ref
const selectedDoctorId = ref(null);
const doctorName = ref('');

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
        alert('예약 방문일을 선택해주세요.');
        await focusField(reserveDateRef, '.fake-input');
        return false;
    }
    
    // 2. 시작 시간 검증
    if (!startTime.value) {
        alert('예약 시작 시간을 선택해주세요.');
        await focusField(startTimeRef, '.input-display');
        return false;
    }
    
    // 3. 종료 시간 검증
    if (!endTime.value) {
        alert('예약 종료 시간을 선택해주세요.');
        await focusField(endTimeRef, '.input-display');
        return false;
    }
    
    // 4. 시간 검증: 시작 시간이 종료 시간보다 늦으면 안됨
    const startMinutes = formatTimeToMinutes(startTime.value);
    const endMinutes = formatTimeToMinutes(endTime.value);
    
    if (startMinutes !== null && endMinutes !== null && startMinutes >= endMinutes) {
        alert('예약 종료 시간은 시작 시간보다 이후로 설정해야 합니다. 다시 확인해주세요.'); //TODO : 모달로 변경해양함
        await focusField(endTimeRef, '.input-display');
        return false;
    }
    
    // 5. 담당의 배정 검증
    if (!selectedDoctorId.value) {
        alert('담당의가 배정되지 않았습니다. 담당의를 배정한 뒤 예약을 확정해주세요.'); //TODO : 모달로 변경해양함
        await focusField(doctorSelectRef, '.select__box');
        return false;
    }
    
    return true;
};

// 예약 확정 버튼 클릭 핸들러
const handleConfirmReservation = () => {
    if (!validateReservation()) {
        return;
    }
    
    // TODO: 추후 작업 - 예약 확정 저장 로직
    console.log('예약 확정 저장 로직 실행 예정');
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

// 고객정보 테이블 정의
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

const RESERVE_STATUS_MAP = {
    0: '대기',
    1: '확정',
    2: '취소',
    3: '거절'
}
const RESERVE_STATUS_CLASS_MAP = {
    0: 'flag--yellow',
    1: 'flag--basic',
    2: 'flag--warning',
    3: 'flag--warning'
}

// 접수 일시 계산
const receivedDateTime = computed(() => 
    formatDateTime(reserveData.createdAt)
);

// 확정 일시 계산 (inState가 1일 때만 표시)
const confirmedDateTime = computed(() => 
    reserveData.inState === 1 ? formatDateTime(reserveData.updatedAt) : ''
);
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
                            v-model="reserveClientPet.userName"
                            :disabled="true"
                            placeholder="예약 고객명"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">고객 전화번호</p>
                        <InputTextBox 
                            v-model="reserveClientPet.userTel"
                            :disabled="true"
                            placeholder="고객 전화번호"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">주소</p>
                        <InputTextBox 
                            v-model="reserveClientPet.address1"
                            :disabled="true"
                            placeholder="주소"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">상세 주소</p>
                        <InputTextBox 
                            v-model="reserveClientPet.address2"
                            :disabled="true"
                            placeholder="상세 주소"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">동물명</p>
                        <InputTextBox 
                            v-model="reserveClientPet.petName"
                            :disabled="true"
                            placeholder="동물명"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">종</p>
                        <InputTextBox 
                            v-model="reserveClientPet.speciesName"
                            :disabled="true"
                            placeholder="종"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">품종</p>
                        <InputTextBox 
                            v-model="reserveClientPet.breed"
                            :disabled="true"
                            placeholder="품종"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">성별</p>
                        <InputTextBox 
                            v-model="PET_GENDER_MAP[reserveClientPet.sex]"
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
                        <!-- TODO: reTime, reTimeEnd -->
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
                <button class="btn btn--size-24 btn--black" @click="modalStore.searchCustomerModal.openModal()">
                    <img :src="icSearchW" alt="아이콘">
                    고객 검색
                </button>
            </div>

            <!-- 테이블 -->
            <div class="customer-info-table-wrapper">
                <CommonTable
                    :columns="customerInfoColumns"
                    :rows="reserveClientList"
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
        </div>

    </div>

    <!-- 버튼 -->
    <div class="modal-button-wrapper">
        <div class="buttons">
            <button class="btn btn--size-40 btn--blue-outline">예약취소</button>
            <button class="btn btn--size-40 btn--blue" @click="handleConfirmReservation">예약 확정</button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .modal-contents-inner {
        display: flex;
        flex-direction: column;
        gap: 16px; // 24px -> 16px로 줄임

        flex-grow: 1;
        overflow: hidden; // 전체 스크롤 제거
        min-height: 0;
    }

    .modal-content-title-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
    }

    .helper__text {color: $primary-700;}

    .info-lists-wrapper {display:flex; gap:8px;}

    .info-list {
        flex:1;
        display: flex;
        flex-direction: column;
        gap: 6px; // 8px -> 6px로 줄임
        padding: 16px 12px; // 20px 16px -> 16px 12px로 줄임

        border-radius: 8px;
        border: 1px solid $gray-200;
        background-color: $gray-00;

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

    // .date-picker-wrap {flex:1; height: 32px;}
    :deep(.dp__input_wrap) {height: 32px !important;}
    :deep(.dp__input) {height: 32px !important;}

    .select-wrapper {
        flex: 1;
        min-width: 0;
    }

    // 고객정보 섹션 스타일
    .customer-info-section {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 200px; // 최소 2명의 고객 정보가 보이도록 최소 높이 설정 (헤더 40px + 행 2개 72px + 여유공간)
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
</style>