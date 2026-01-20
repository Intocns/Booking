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

import { ref, computed, onMounted } from 'vue';
// 스토어
import { useModalStore } from '@/stores/modalStore';
import { useProductStore } from '@/stores/productStore';
//util
import { setOperatingObject } from '@/utils/product';

const modalStore = useModalStore();
const productStore = useProductStore();

// 상태관리
const selectedAnimalCount = ref(null); // 예약 가능 동물 수 선택
const isHolidayEnabled = ref(false); // 휴무일 설정 여부 (Toggle)
const scheduleMode = ref('regular'); // 운영 일정 : 'regular', 'event'
const applyMode = ref('all'); // 적용 기간 : 'all', 'period'

const isDatePickerModalOpen = ref(false);
const settingType = ref(''); // 현재 어떤 설정을 하고 있는지 저장

// props
const props = defineProps({
    savedItemId: {type: String},
    viewType: {type: String, default:null},
    previewName: { type: String },
    previewDesc: { type: String },
    previewDetails: { type: Array },
    previewNotice: { type: String }
})


// 설정 데이터 생성 함수
const createDefaultConfig = () => ({
    operatingMode: 'all',
    allDaysTime: [{ startTime: '', endTime: '' }],
    splitMode: 'weekend_all',
    splitTime: {
        weekday: [{ startTime: '', endTime: '' }], weekend: [{ startTime: '', endTime: '' }],
        sat: [{ startTime: '', endTime: '' }], sun: [{ startTime: '', endTime: '' }]
    },
    dailyGroups: [{ selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], times: [{ startTime: '', endTime: '' }] }]
});

// [데이터] 정기 운영용
const regularConfig = ref(createDefaultConfig());

// [데이터] 이벤트 기간/설정용
const eventDates = ref([[]]);
const periodConfigs = ref([createDefaultConfig()]);
// 운영 설정 데이터 (하나로 관리)
const configs = ref([createDefaultConfig()]);


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

// 상품 수정 >> 일정 설정 >> 예약 정보 저장(예약일정)
const updateItemSchedule = (async(type) => {
    const reserveCnt = selectedAnimalCount;
    const pos = setScheduleForSave();
    let impos = null;

    if(type == 'operating'){
        impos = HolidayForm; //수정화면 오픈 시 조회햇던 holiday 그대로 가져올 것
    }else{
        impos = isHolidayEnabled.value ? holidayFormRef.value.setSaveFormat() : null;
    }

    const params = {
        reserveCnt : reserveCnt.value,
        pos : pos,
        impos : impos
    }

    console.log(params);
    return false;

    const response = await productStore.updateItemReservationInfo(props.savedItemId, params);

    if(response.status_code <= 300){
        alert('저장이 완료되었습니다');
    }else{
        alert('오류가 발생했습니다. 관리자에게 문의해주세요.');
    }
})

//저장 전 일정 계산
const setScheduleForSave = () => {
    const isRegular = (scheduleMode.value === 'regular');
    const isAllMode = (scheduleMode.value === 'regular' || applyMode.value === 'all');

    return eventDates.value.flatMap((event, idx) => {
        const eventObject = !isRegular ? event : null;
        // 전체 설정 모드면 무조건 0번(첫 번째) 설정을 사용
        const targetConfig = isAllMode ? configs.value[0] : configs.value[idx];
        
        return setOperatingObject(eventObject, targetConfig, scheduleMode.value);
    });
}

const bitToTimeRanges = (bitString) => {
    // 비트가 없거나 전부 0인 경우
    if (!bitString || !bitString.includes('1')) {
        return [{ startTime: '', endTime: '' }];
    }

    const ranges = [];
    let start = null;

    // 48비트 순회 (0~47)
    for (let i = 0; i < bitString.length; i++) {
        const bit = bitString[i];
        
        // 1을 만났는데 아직 시작점이 없다면 (새로운 구간 시작)
        if (bit === '1' && start === null) {
            start = i;
        } 
        
        // 현재가 1인데 다음이 0이거나, 문자열의 끝인 경우 (구간 종료)
        if (start !== null && (bitString[i + 1] === '0' || i === bitString.length - 1)) {
            const end = i + 1; // 종료 지점은 인덱스 + 1 (길이 개념)
            
            const formatTime = (totalHalfHours) => {
                const hours = Math.floor(totalHalfHours / 2);
                const minutes = (totalHalfHours % 2) * 30;
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            };

            ranges.push({
                startTime: formatTime(start),
                endTime: formatTime(end)
            });
            
            start = null; // 초기화
        }
    }

    // console.log(bitString, ranges);
    return ranges.length > 0 ? ranges : [{ startTime: '', endTime: '' }];
};

// pos 배열을 받아 UI 설정 객체(config)로 변환하는 함수
const mapPosToConfig = (posArray) => {
    const config = createDefaultConfig();
    if (!posArray || posArray.length === 0) return config;

    // 1. 평일/주말/토/일 아이템 정교하게 찾기
    // 평일: mon~fri 중 하나라도 포함되어 있고, sat/sun은 포함하지 않음
    const weekdayItem = posArray.find(p => 
        p.weekdays.some(day => ['mon', 'tue', 'wed', 'thu', 'fri'].includes(day)) &&
        !p.weekdays.includes('sat') && !p.weekdays.includes('sun')
    );
    
    // 주말(토+일): sat과 sun을 모두 포함함
    const weekendItem = posArray.find(p => 
        p.weekdays.includes('sat') && p.weekdays.includes('sun')
    );

    // 개별 토/일
    const satItem = posArray.find(p => p.weekdays.length === 1 && p.weekdays[0] === 'sat');
    const sunItem = posArray.find(p => p.weekdays.length === 1 && p.weekdays[0] === 'sun');

    // 2. 판별 및 매핑
    if (posArray.length === 1 && posArray[0].weekdays.length === 7) {
        config.operatingMode = 'all';
        config.allDaysTime = bitToTimeRanges(posArray[0].hourBit);
    } 
    else if (weekdayItem && weekendItem) {
        config.operatingMode = 'split';
        config.splitMode = 'weekend_all';
        config.splitTime.weekday = bitToTimeRanges(weekdayItem.hourBit);
        config.splitTime.weekend = bitToTimeRanges(weekendItem.hourBit);
    } 
    else if (weekdayItem && satItem && sunItem) {
        config.operatingMode = 'split';
        config.splitMode = 'sat_sun_individually';
        config.splitTime.weekday = bitToTimeRanges(weekdayItem.hourBit);
        config.splitTime.sat = bitToTimeRanges(satItem.hourBit);
        config.splitTime.sun = bitToTimeRanges(sunItem.hourBit);
    } 
    else {
        config.operatingMode = 'daily';
        config.dailyGroups = posArray.map(p => ({
            selectedDays: p.weekdays,
            times: bitToTimeRanges(p.hourBit)
        }));
    }
    // console.log('--- 매핑 결과 확인 ---');
    // console.log('Mode:', config.operatingMode);
    // console.log('Value:', JSON.stringify(config));
    return config;
};

onMounted(async() => {
    //예약 정보 조회
    await productStore.getItemReservationInfo(props.savedItemId); // productScheduleInfo
    const data = productStore.productScheduleInfo;
    if (!data) return;

    // 2. 예약 가능 동물 수 매핑
    selectedAnimalCount.value = data.reserveCnt;

    // 3. 휴무일 설정 여부 매핑
    isHolidayEnabled.value = !!(data.impos && (data.impos.week || data.impos.spDay || data.impos.hoDay));

    // 4. 운영 일정 매핑 (pos 데이터 분석)
    const pos = data.pos || [];

    const hasEventDate = pos.some(item => item.sdate && item.edate);

    if (hasEventDate) {
        scheduleMode.value = 'event';
        const periods = [...new Set(pos.map(p => `${p.sdate}~${p.edate}`))];
        applyMode.value = periods.length > 1 ? 'period' : 'all';
        eventDates.value = periods.map(p => p.split('~'));
        
        // 새 배열로 할당
        const newConfigs = periods.map(period => {
            const periodPos = pos.filter(p => `${p.sdate}~${p.edate}` === period);
            // console.log('---hasEventDate 매핑---');
            // console.log(mapPosToConfig(periodPos));
            return mapPosToConfig(periodPos);
        });
        configs.value = newConfigs;
    } else {
        scheduleMode.value = 'regular';
        // console.log('---regular 매핑---');
        // console.log(mapPosToConfig(pos));

        // 새 배열로 할당
        configs.value = [mapPosToConfig(pos)];
    }


    //상품 기본 정보 조회 >> 예약 오픈, 노출/미노출 설정
    await productStore.getItemDetailInfo(props.savedItemId); // itemDetailInfo
})
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
                                    <CustomDatePicker  v-model="eventDates[idx]" />
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
                        <div v-if="scheduleMode === 'regular' || applyMode === 'all'">
                            <OperatingTimeForm v-model="configs[0]" />
                        </div>

                        <!-- 이벤트 운영 && 기간별 설정의 경우 -->
                        <div v-else-if="scheduleMode === 'event' && applyMode === 'period'" class="d-flex flex-col gap-16">
                            <!-- 기간별로 운영시간 설정 영역 보여줌 -->
                            <div 
                                v-for="(pConfig, idx) in configs" 
                                :key="idx"
                                class="d-flex flex-col gap-8 period-item"
                            >
                                <div class="title-s">
                                    {{ eventDates[idx][0] ? formatDateToDay(eventDates[idx][0]) : '시작일 미정' }} ~ 
                                    {{ eventDates[idx][1] ? formatDateToDay(eventDates[idx][1]) : '종료일 미정' }}
                                </div>
                                <OperatingTimeForm v-model="configs[idx]" :idx="idx" />
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

        <div class="button-wrapper">
            <button class="btn btn--size-40 btn--black" @click="router.push({ name: 'placeProduct'})">목록으로</button>
            <button class="btn btn--size-40 btn--blue" @click="updateItemSchedule('operating')">저장</button>
        </div>
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
            <HolidayForm ref="holidayFormRef" />
        </div>

        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue" @click="updateItemSchedule('holiday')">저장</button>
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

    .button-wrapper {
        display: flex;
        gap: 8px;
        padding-top: 16px;

        button {flex:1;}
    }
</style>