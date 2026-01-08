<!-- 상품관리 > 상품 수정 > 예약 정보 tab > 예약정보, 예약오픈/미노출 설정 -->
<script setup>
// 컴포넌트
import ModalDatePicker from '@/components/common/ModalDatePicker.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';
import OperatingTimeForm from './OperatingTimeForm.vue';
import Modal from '@/components/common/Modal.vue';
import HolidayForm from './HolidayForm.vue';
// 아이콘
import icSetting from '@/assets/icons/ic_setting.svg'
import icEdit from '@/assets/icons/ic_edit.svg'
import icPlus from '@/assets/icons/ic_plus_black.svg';
import icDel from '@/assets/icons/ic_del.svg';

import { ref, computed } from 'vue';
// 스토어
import { useModalStore } from '@/stores/modalStore';

const modalStore = useModalStore();

// 상태관리
const selectedAnimalCount = ref(null); // 예약 가능 동물 수 선택
const isHolidayEnabled = ref(false); // 휴무일 설정 여부 (Toggle)
const scheduleMode = ref('regular'); // 운영 일정 : 'regular', 'event'
const applyMode = ref('all'); // 적용 기간 : 'all', 'period'

const isDatePickerModalOpen = ref(false);
const settingType = ref(''); // 현재 어떤 설정을 하고 있는지 저장


// 설정 데이터 생성 함수
const createDefaultConfig = () => ({
    operatingMode: 'all',
    allDaysTime: [{ start: '', end: '' }],
    splitMode: 'weekend_all',
    splitTime: {
        weekday: [{ start: '', end: '' }], weekend: [{ start: '', end: '' }],
        sat: [{ start: '', end: '' }], sun: [{ start: '', end: '' }]
    },
    dailyGroups: [{ selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], times: [{ start: '', end: '' }] }]
});

// [데이터] 정기 운영용
const regularConfig = ref(createDefaultConfig());

// [데이터] 이벤트 기간/설정용
const eventDates = ref([{ start: '', end: '' }]);
const periodConfigs = ref([createDefaultConfig()]);

const addEventPeriod = () => {
    eventDates.value.push({ start: '', end: '' });
    periodConfigs.value.push(createDefaultConfig());
};

const removeEventPeriod = (idx) => {
    eventDates.value.splice(idx, 1);
    periodConfigs.value.splice(idx, 1);
};

// 예약 가능 동물 수 (임시 1~10)
const animalCountOptions = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));


// 1. 모달 타이틀 동적 계산
const datePickerModalTitle = computed(() => {
    switch (settingType.value) {
        case 'OPEN_DATE': return '예약 오픈일을 선택해 주세요';
        case 'EXPOSURE_START': return '노출 시작일을 선택해 주세요';
        case 'EXPOSURE_END': return '미노출 시작일을 선택해 주세요';
        default: return '날짜를 선택해 주세요';
    }
});

// 공통 모달 열기 함수
const openModal = (type) => {
    settingType.value = type;
    isDatePickerModalOpen.value = true;
};

// 이벤트 핸들러
const onOpenDateSetting = () => openModal('OPEN_DATE'); // 예약 오픈일 설정하기
const onExposureStartSetting = () => openModal('EXPOSURE_START'); // 노출 시작일 설정하기
const onExposureEndSetting = () => openModal('EXPOSURE_END'); // 미노출 시작일 설정하기

// 모달에서 '적용' 버튼 눌렀을 때 처리
const onAddHoliday = (selectedData) => {
    console.log(`${settingType.value} 설정됨:`, selectedData);
    // 여기서 settingType에 따라 각각 다른 API 호출이나 상태 변경 처리
    isDatePickerModalOpen.value = false;
};
</script>

<template>
    <div class="booking-right-layout">
        <section class="setting-box top">
            <p class="heading-s">예약 정보</p>
            <ul class="form-container">
                <li class="form-item">
                    <div class="form-label">예약 가능 동물 수</div>
                    <div class="form-content">
                        <div>
                            <div class="d-flex align-center gap-4 body-s">
                                매 30분 마다 최대
                                <CustomSingleSelect 
                                    v-model="selectedAnimalCount" 
                                    :options="animalCountOptions" 
                                    select-width="63px" 
                                    placeholder="0" 
                                />
                                마리까지 예약 가능
                            </div>
                            <span class="caption">
                                ※ 예약 가능한 동물 수는 IntoVet GE, 인투펫 예약 데이터와 연동되어 제공되는 기능입니다.
                            </span>
                        </div>
                    </div>
                </li>
                <li class="form-item">
                    <div class="form-label">운영 일정</div>
                    <div class="form-content">
                        <div class="d-flex gap-16">
                            <label class="radio">
                                <input type="radio" v-model="scheduleMode" value="regular" />
                                <span class="circle"></span>
                                <span class="label">정기 운영</span>
                            </label>

                            <label class="radio">
                                <input type="radio" v-model="scheduleMode" value="event" />
                                <span class="circle"></span>
                                <span class="label">이벤트 운영</span>
                            </label>
                        </div>

                        <!-- 이벤트 운영의 경우 기간 추가 영역 생성 -->
                        <div v-if="scheduleMode === 'event'" class="d-flex flex-col gap-8">
                            <div v-for="(date, idx) in eventDates" :key="idx" class="d-flex align-center gap-8">
                                <div class="d-flex align-center gap-8">
                                    <span class="title-s">기간</span>
                                    <CustomDatePicker />
                                </div>

                                <button 
                                    v-if="idx === 0" @click="addEventPeriod" 
                                    class="btn btn--size-24 btn--black-outline"
                                >
                                    <img :src="icPlus" alt="아이콘">기간 추가
                                </button>

                                <button 
                                    v-else 
                                    @click="removeEventPeriod(idx)" 
                                    class="btn btn--size-24 btn--black-outline"
                                >
                                    <img :src="icDel">삭제
                                </button>
                            </div>
                        </div>
                    </div>
                </li>

                <!-- 이벤트 운영일 경우, 적용 방식 설정  -->
                <li v-if="scheduleMode === 'event'" class="form-item">
                    <div class="form-label">적용 방식</div>
                    <div class="form-content">
                        <div class="d-flex gap-16">
                            <label class="radio">
                                <input type="radio" v-model="applyMode" value="all" />
                                <span class="circle"></span>
                                <span class="label">전체 설정</span>
                            </label>
                            <label class="radio">
                                <input type="radio" v-model="applyMode" value="period" />
                                <span class="circle"></span>
                                <span class="label">기간별 설정</span>
                            </label>
                        </div>
                    </div>
                </li>

                <!-- 운영 시간 -->
                <li class="form-item">
                    <div class="form-label">운영 시간</div>
                    <div class="form-content">
                        <!-- 정기운영 || 이벤트 운영 && 전체 설정의 경우 -->
                        <div v-if="scheduleMode === 'regular' || (scheduleMode === 'event' && applyMode === 'all')">
                            <OperatingTimeForm v-model="regularConfig" />
                        </div>

                        <!-- 이벤트 운영 && 기간별 설정의 경우 -->
                        <div v-else-if="scheduleMode === 'event' && applyMode === 'period'" class="d-flex flex-col gap-16">
                            <!-- 기간별로 운영시간 설정 영역 보여줌 -->
                            <div 
                                v-for="(pConfig, idx) in periodConfigs" 
                                :key="idx"
                                class="d-flex flex-col gap-8 period-item"
                            >
                                <!-- TODO: 기간 선택한 값으로 날짜 보여주어야함 -->
                                <div class="title-s">기간 {{ idx + 1 }}</div>
                                <OperatingTimeForm v-model="periodConfigs[idx]" :idx="idx" />
                            </div>
                        </div>
                    </div>
                </li>

                <li class="form-item">
                    <div class="form-label">휴무일 설정</div>
                    <div class="form-content">
                        <div class="d-flex align-center justify-between">
                            <label class="toggle">
                                <input type="checkbox" v-model="isHolidayEnabled" />
                                <span class="toggle-img"></span>
                            </label>
                            <button 
                                v-if="isHolidayEnabled" 
                                class="btn btn--size-24 btn--black-outline"
                                @click="modalStore.holidaySettingModal.openModal()"
                            >
                                <img :src="icEdit" alt="아이콘">휴무일 수정
                            </button>
                        </div>
                    </div>
                </li>

                <!-- 휴무일 설정 on -->
                <template v-if="isHolidayEnabled">
                    <li class="form-item">
                        <div class="form-label">정기 휴무일</div>
                        <div class="form-content">
                            <p class="body-s">매주 월, 일요일</p>
                        </div>
                    </li>
                    <li class="form-item">
                        <div class="form-label">법정 공휴일</div>
                        <div class="form-content">
                            <p class="body-s">설날 당일, 추석 당일, 크리스마스</p>
                        </div>
                    </li>
                    <li class="form-item">
                        <div class="form-label">그외 휴무일</div>
                        <div class="form-content">
                            <p class="body-s">매달 1일, 2025년 11월 30일, 2025년 12월 20일, 매달 1일, 2025년 11월 30일, 2025년 12월 20일 매달 1일, 2025년 11월 30일, 2025년 12월 20일</p>
                        </div>
                    </li>
                </template>

            </ul>
        </section>

        <section class="setting-box bottom">
            <p class="heading-s">예약 오픈, 노출/미노출 설정</p>
            
            <ul class="form-container">
                <li class="form-item">
                    <div class="form-label">예약 오픈일</div>
                    <div class="form-content">
                        <div class="d-flex align-center justify-between">
                            <span class="body-s">오픈일 설정시, 오픈일 이전까지 예약 상품은 사전공개됩니다.</span>
                            <button class="btn btn--size-24 btn--black-outline" @click="onOpenDateSetting">
                                <img :src="icSetting" alt="아이콘">설정하기
                            </button>
                        </div>
                    </div>
                </li>
                <li class="form-item">
                    <div class="form-label">노출 시작일</div>
                    <div class="form-content">
                        <div class="d-flex align-center justify-between">
                            <span class="body-s">노출되는 날짜, 시간을 미리 예약 설정할 수 있습니다.</span>
                            <button class="btn btn--size-24 btn--black-outline" @click="onExposureStartSetting">
                                <img :src="icSetting" alt="아이콘">설정하기
                            </button>
                        </div>
                    </div>
                </li>
                <li class="form-item">
                    <div class="form-label">미노출 시작일</div>
                    <div class="form-content">
                        <div class="d-flex align-center justify-between">
                            <span class="body-s">미노출되는 날짜, 시간을 미리 예약 설정할 수 있습니다.</span>
                            <button class="btn btn--size-24 btn--black-outline" @click="onExposureEndSetting">
                                <img :src="icSetting" alt="아이콘">설정하기
                            </button>
                        </div>
                    </div>
                </li>
            </ul>
        </section>
    </div>

    <!-- 예약 오픈, 노출/미노출 설정 모달 -->
    <ModalDatePicker
        :is-modal-open="isDatePickerModalOpen" 
        :title="datePickerModalTitle"
        :showRepeatOptions="false"
        @close="isDatePickerModalOpen = false"
        @add="onAddHoliday"
    />

    <!-- 휴무일 설정 모달 -->
    <Modal
        v-if="modalStore.holidaySettingModal.isVisible"
        size="m"
        title="휴무일 수정"
        :modal-state="modalStore.holidaySettingModal"
    >
        <div class="modal-contents-inner">
            <HolidayForm />
        </div>

        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue">저장</button>
            </div>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
    :deep(.caption) { color: $gray-500; }
    .booking-right-layout {
        display: flex;
        flex-direction: column;
        gap: 16px;
        height: 100%;

        .setting-box {
            display: flex;
            flex-direction: column;
            gap: 16px;
            
            background: #fff;
            border: 1px solid $gray-200;
            border-radius: 8px;
            padding: 24px;
            
            &.top {flex: 2; min-height:0;}
            &.bottom {flex: 1;}
        }
    }
</style>