<!-- 플레이스 설정 > 운영설정탭 -->
<script setup>
// 컴포넌트
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import Modal from '@/components/common/Modal.vue';
// 아이콘
import icArrowRightB from '@/assets/icons/ic_arrow_right_blue.svg'
import icInfo from '@/assets/icons/ic_information_blue.svg'
import toggleOn from '@/assets/icons/toggle_on.svg'
import toggleOff from '@/assets/icons/toggle_off.svg'
// 이미지
import imgPlaceOpen from '@/assets/images/img_place_open_preview.png'
import imgPlaceClose from '@/assets/images/img_place_closed_preview.png'

import { onMounted, ref, reactive, watch, onBeforeUnmount, computed } from 'vue';
import { showAlert } from '@/utils/ui';
// 스토어
import { useModalStore } from '@/stores/modalStore';
import { usePlaceStore } from '@/stores/placeStore';

const modalStore = useModalStore();
const placeStore = usePlaceStore();

const openTooltips = ref(false); // 노출이력 툴팁 노출 상태관리
const tooltipPos = reactive({ x: 0, y: 0 }); // 노출이력 툴팁 위치
const tooltipRef = ref(null); // 툴팁 요소 참조
// 각 설정의 토글 상태 (기본값 true 또는 false)
const isAcceptingReservation = ref(true); // 예약 받기
const isTodayReservationEnabled = ref(true); // 당일 예약

// 당일 예약 마감 시간 옵션 (임시)
const todayReserveTimeOptions = [
    { label: '이전까지', value: '0' },
    { label: '1시간 전', value: '1' },
    { label: '2시간 전', value: '2' },
    { label: '3시간 전', value: '3' },
];
// 선택된 값을 저장할 변수
const selectedTime = ref('');

// 선택된 시간에 따른 동적 캡션 문구
const dynamicCaption = computed(() => {
    const timeMap = {
        '0': '오후 5시', // 이전까지 (0시간 전)
        '1': '오후 4시', // 1시간 전
        '2': '오후 3시', // 2시간 전
        '3': '오후 2시', // 3시간 전
    };

    // 선택된 값에 맞는 시간을 가져오고, 없으면 기본값 설정
    const targetTime = timeMap[selectedTime.value] || '오후 4시';
    
    return `[예시] 이용시간이 오후 5시인 경우, ${targetTime}까지 예약 가능`;
});

// 예약 받기 토글 => 260206 JJB 저장 통합으로 합치면서 아래 저장 부분 주석처리
// const handleToggleAcceptance = async() => {
//     const originalValue = !isAcceptingReservation.value; // 이전 상태 저장
//     const newStatus = isAcceptingReservation.value ? '1' : '0';

//     try {
//         await placeStore.setAcceptingReservation(newStatus);
//     } catch {
//         isAcceptingReservation.value = originalValue;
//     }
// }

// 당일 예약 토글 => 260206 JJB 저장 통합으로 합치면서 아래 저장 부분 주석처리
// const handleUpdateTodayReserve = async() => {
//     // 이전 상태 저장
//     const prevYn = !isTodayReservationEnabled.value ? 1 : 0;
//     const prevTime = placeStore.operationInfo?.alarmValue || '0';

//     const newYn = isTodayReservationEnabled.value ? 1 : 0;
//     // 당일 예약을 끄는 경우 ''으로 보냄
//     const newSelectedTime = isTodayReservationEnabled.value ? selectedTime.value : '';
    
//     try {
//         await placeStore.setTodayReservation(newYn, newSelectedTime);
//     } catch (error) {
//         // 에러 시 이전 값으로
//         isTodayReservationEnabled.value = prevYn === 1;
//         selectedTime.value = prevTime;
//     }
// }

const saveOperatorSetting = async() => {
    let params = {
        serviceUseYn : isAcceptingReservation.value ? 1 : 0, //예약받기
        todayUseYn : isTodayReservationEnabled.value ? 1 : 0, //예약받기
        todayValue : isTodayReservationEnabled.value ? selectedTime.value : '', //예약받기
    }

    const response = await placeStore.setOperatorSetting(params);
    // console.log('저장');

    if(response.status_code <= 300){
        showAlert('저장 되었습니다.');
    }
}

// 노출이력 버튼
const handleGetHistory = (event) => {
    tooltipPos.x = event.clientX + 20; 
    tooltipPos.y = event.clientY;

    placeStore.getImpHistory();
    openTooltips.value = true;
}

// 툴팁 노출 상태 감시
watch(openTooltips, (isOpen) => {
    if (isOpen) {
        // window 클릭 이벤트가 동시에 발생해서 바로 닫히는 것을 방지
        setTimeout(() => {
            window.addEventListener('click', closeTooltips);
        }, 0);
    } else {
        window.removeEventListener('click', closeTooltips);
    }
});

// 외부 클릭 시 툴팁 닫기
const closeTooltips = (event) => {
    // 클릭된 타겟이 툴팁 엘리먼트 내부에 포함되어 있지 않다면 닫기
    if (tooltipRef.value && !tooltipRef.value.contains(event.target)) {
        openTooltips.value = false;
        window.removeEventListener('click', closeTooltips);
    }
};

onMounted(async() => {
    await placeStore.getOperationInfo();

    const info = placeStore.operationInfo;
    if (info) {
        isAcceptingReservation.value = info.isAcceptingReservation;
        isTodayReservationEnabled.value = info.isTodayReservationEnabled;
        selectedTime.value = info.alarmValue || '0';
    }
})

// 컴포넌트 언마운트 시 이벤트 제거
onBeforeUnmount(() => {
    window.removeEventListener('click', closeTooltips);
});
</script>

<template>
    <div class="contents-wrapper">
        <ul class="setting-list">
            <li class="setting-item">
                <div class="setting-item__header">
                    <div class="setting-item__title-area">
                        <p class="title-m">예약 받기</p>
                        <button class="text-button text-button--blue" @click="modalStore.bookingGuideModal.openModal()">
                            자세히
                            <img :src="icArrowRightB" alt="아이콘">
                        </button>
                    </div>
    
                    <label class="toggle">
                        <!-- <input type="checkbox" v-model="isAcceptingReservation" @change="handleToggleAcceptance" /> -->
                        <input type="checkbox" v-model="isAcceptingReservation" @change="handleToggleAcceptance" />
                        <img class="toggle-img" />
                    </label>
                </div>
    
                <div class="setting-item__content">
                    <div class="status-box">
                        <span class="body-m">
                            {{ isAcceptingReservation 
                                ? '서비스가 노출 상태이므로 예약을 받을 수 있습니다.' 
                                : '서비스가 미노출 상태이므로. 예약을 받을 수 없습니다.' 
                            }}
                        </span>
                        <button class="btn btn--size-24 btn--black-outline" @click="handleGetHistory($event)">노출 이력</button>

                        <!-- 노출이력 -->
                        <div 
                            v-if="openTooltips && placeStore.historyData" 
                            ref="tooltipRef"
                            class="history-tooltips" 
                            :style="{ top: tooltipPos.y + 'px', left: tooltipPos.x + 'px' }"
                            @click.stop
                        >
                            <div class="tooltip-box">
                                <ul>
                                    <li>변경주체 : {{ placeStore.historyData.editorSubject || '-' }}</li>
                                    <li>변경일자 : {{ placeStore.historyData.editedDateTime || '-' }}</li>
                                    <li>변경내역 : {{ placeStore.historyData.isImp ? '노출' : '미노출' }}</li>
                                    <li>변경사유 : {{ placeStore.historyData.impHistoryReasonCode || '-' }}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </li>
    
            <li class="setting-item">
                <div class="setting-item__header">
                    <div class="setting-item__title-area helper">
                        <p class="title-m">당일예약</p>
                        <img :src="icInfo" alt="안내아이콘" class="helper__icon">
                        <div class="tooltip-content">
                            이용 당일에도 예약신청을 받을지 설정합니다.
                        </div>
                    </div>
    
                    <label class="toggle">
                        <!-- <input type="checkbox" v-model="isTodayReservationEnabled" @change="handleUpdateTodayReserve" /> -->
                        <input type="checkbox" v-model="isTodayReservationEnabled" />
                        <img class="toggle-img" />
                    </label>
                </div>
    
                <div class="setting-item__content">
                    <template v-if="isTodayReservationEnabled">
                        <div class="option-row">
                            <span class="body-m">당일 예약 시 이용시간</span>
                            <CustomSingleSelect 
                                :options="todayReserveTimeOptions" 
                                select-width="100px" 
                                v-model="selectedTime" 
                            />
                            <span class="body-m">까지 예약을 받습니다.</span>
                        </div>
                        <p class="setting-item__caption caption"> 
                            {{ dynamicCaption }}
                        </p>
                    </template>
    
                    <template v-else>
                        <div class="option-row">
                            <p class="body-m">이용 당일에는 예약을 받지 않습니다.</p>
                        </div>
                    </template>
                </div>
            </li>
        </ul>

        <div class="button-wrapper">
            <button class="btn btn--size-40 btn--blue" @click="saveOperatorSetting()">저장</button>
        </div>
    </div>

    <!-- 예약 받기 자세히 모달 -->
    <Modal
        v-if="modalStore.bookingGuideModal.isVisible"
        title="예약받기"
        size="s"
        :modal-state="modalStore.bookingGuideModal"
    >
        <div class="modal-contents-inner">
            <div class="booking-guide">
                <!-- left -->
                <div class="booking-guide__section">
                    <div class="d-flex justify-between">
                        <p class="modal-contents-title">시작 상태</p>
                        <img :src="toggleOn" alt="토글스위치">
                    </div>
    
                    <p class="modal-contents-body">
                        서비스 화면이 정상적으로 노출되며, 예약 신청이 가능합니다.
                    </p>
    
                    <img class="preview-img" :src="imgPlaceOpen" alt="예약받기 미리보기">
                </div>
                <!-- right -->
                <div class="booking-guide__section">
                    <div class="d-flex justify-between">
                        <p class="modal-contents-title">중지 상태</p>
                        <img :src="toggleOff" alt="토글스위치">
                    </div>
    
                    <p class="modal-contents-body">
                        서비스 화면이 미노출 되며, 예약 신청이 불가능 합니다.
                    </p>
    
                    <img class="preview-img" :src="imgPlaceClose" alt="예약중지 미리보기">
                </div>
            </div>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
    .setting-list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        width: 50%;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .setting-item {
        padding: 8px 16px;
        border: 1px solid $gray-200;
        border-radius: 4px;

        &__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        &__title-area {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        &__content {
            
            .status-box {
                display: flex;
                align-items: center;
                gap: 12px;
                color: $gray-700;
            }

            .option-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;

                color: $gray-700;
            }
        }

        &__caption {
            color: $gray-500;
            display: block;
        }
    }

    .booking-guide {
        display: flex;
        gap: 16px;

        &__section {
            flex: 1;
            padding: 24px 24px 0;

            border-radius: 8px;
            background-color: $gray-50;
            
            .preview-img {margin-top: 16px;}
        }
    }
    
    .history-tooltips {
        position: fixed;
        left: 0;
    }
    :deep(.tooltip-box) {
        border: 1px solid $primary-700;
        box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.15);
    }

    .button-wrapper {
        display: flex;
        width: 50%;

        .btn {flex:1;}
    }
</style>                                      