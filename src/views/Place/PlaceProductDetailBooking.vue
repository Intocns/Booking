<script setup>
import { ref } from 'vue';
// 컴포넌트
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';
import OperatingTimeForm from './OperatingTimeForm.vue';
import HolidayForm from './HolidayForm.vue';
// 아이콘
import icPlus from '@/assets/icons/ic_plus_black.svg';
import icDel from '@/assets/icons/ic_del.svg';

import { formatDateToDay } from '@/utils/dateFormatter';
import { setOperatingObject } from '@/utils/product';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();

// 예약 가능 동물 수 (임시 1~10)
const animalCountOptions = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

const props = defineProps({
    savedItemId: {type: String},
    isSavedSchedule: {type: Boolean},
    viewType: {type: String, default:null},
    previewName: { type: String },
    previewDesc: { type: String },
    previewDetails: { type: Array },
    previewNotice: { type: String }
})

const emit = defineEmits(['update:nextTab'])
const holidayFormRef = ref(null)//저장 시 api에 맞춰 request형식으로 format하는 함수를 호출

// 상태 관리
const selectedAnimalCount = ref(null); // 예약 가능 동물 수 선택
const scheduleMode = ref('regular'); // 운영 일정 : 'regular', 'event'
const applyMode = ref('all'); // 적용 기간 : 'all', 'period'
const isHolidayEnabled = ref(false); // 휴무일 설정 여부 (Toggle)

// 설정 데이터 생성 함수
const createDefaultConfig = () => ({
    operatingMode: 'all',
    allDaysTime: [{ startTime: '', endTime: '' }],
    splitMode: 'weekend_all',
    splitTime: {
        weekday: [{ startTime: '', endTime: '' }], weekend: [{ startTime: '', endTime: '' }],
        sat: [{ startTime: '', endTime: '' }], sun: [{ startTime: '', endTime: '' }]
    },
    dailyGroups: [{ selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], times: [{ start: '', end: '' }] }]
});

// [데이터] 정기 운영용
const regularConfig = ref(createDefaultConfig());

// [데이터] 이벤트 기간/설정용
const eventDates = ref([{ startTime: '', endTime: '' }]);
const periodConfigs = ref([createDefaultConfig()]);

const addEventPeriod = () => {
    eventDates.value.push({ startTime: '', endTime: '' });
    periodConfigs.value.push(createDefaultConfig());
};

const removeEventPeriod = (idx) => {
    eventDates.value.splice(idx, 1);
    periodConfigs.value.splice(idx, 1);
};

//저장 전 일정 계산
const setScheduleForSave = () => {
    let scheduleInfo = [];

    const isRegular = (scheduleMode.value === 'regular')
    const isRegularConfig = (scheduleMode.value === 'regular' || (scheduleMode.value === 'event' && applyMode.value === 'all'));

    //선택한 운영일자에 따른 데이터가 저장된 객체 선택
    const selectedArr = isRegularConfig ? [regularConfig.value] : periodConfigs.value;

    //기간 만큼 생성
    scheduleInfo = eventDates.value.flatMap((event, idx) => {
                        const eventObject = !isRegular ? event : null
                        const fixedIdx = isRegularConfig ? 0 : idx
                        return setOperatingObject(eventObject, selectedArr[fixedIdx], scheduleMode)
                    })
    
    return scheduleInfo;
}

// 다음 버튼
const clickNextBtn = (async() => {
    const reserveCnt = selectedAnimalCount;
    const pos = setScheduleForSave();
    const impos = isHolidayEnabled.value ? holidayFormRef.value.setSaveFormat() : null;

    const params = {
        reserveCnt : reserveCnt.value,
        pos : pos,
        impos : impos
    }

    let response = '';

    if(!props.isSavedSchedule){
        response = await productStore.setItemReservationInfo(props.savedItemId, params);
    }else{
        response = await productStore.updateItemReservationInfo(props.savedItemId, params);
    }

    if(response.status_code <= 300){
        emit('update:nextTab', 'option' , props.savedItemId,props.isSavedSchedule);//다음 페이지 이동
    }else{
        alert('오류가 발생했습니다. 관리자에게 문의해주세요.');
    }
})

// 이전 버튼
const clickPrevBtn = (() => {
    emit('update:nextTab', 'basic');//이전 페이지 이동
})
</script>

<template>
    <ul class="form-container">
        <!-- 예약가능 동물 수 -->
        <li class="form-item">
            <div class="form-label required">예약가능 동물 수</div>
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

        <!-- 운영 일정 -->
        <li class="form-item">
            <div class="form-label required">운영 일정</div>
            <div class="form-content d-flex flex-col gap-16">
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
                            <CustomDatePicker v-model="eventDates[idx]" />
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
            <div class="form-label required">적용 방식</div>
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
            <div class="form-label required">운영 시간</div>
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
                        <div class="title-s"> {{ formatDateToDay(eventDates[idx][0]) }} ~ {{ formatDateToDay(eventDates[idx][1]) }}</div>
                        <OperatingTimeForm v-model="periodConfigs[idx]" :idx="idx" />
                    </div>
                </div>
            </div>
        </li>

        <!-- 휴무일 설정 -->
        <li class="form-item">
            <div class="form-label">휴무일 설정</div>
            <div class="form-content">
                <label class="toggle">
                    <input type="checkbox" v-model="isHolidayEnabled" />
                    <span class="toggle-img"></span>
                </label>
            </div>
        </li>

        <!-- 휴무일 설정 on 의 경우 설정 영역 보여줌 -->
        <li class="form-item" v-if="isHolidayEnabled">
            <div class="form-label"></div>
            <div class="form-content">
                <HolidayForm ref="holidayFormRef" />
                <!-- 정기휴무 -->
                <!-- 공휴일휴무 -->
                <!-- 날짜로 휴무일 지정 -->
            </div>
        </li>
    </ul>

    <div class="button-wrapper">
        <button class="btn btn--size-40 btn--black" @click="clickPrevBtn()">이전으로</button>
        <button class="btn btn--size-40 btn--blue" @click="clickNextBtn()">다음</button>
    </div>
</template>

<style lang="scss" scoped>
    :deep(.caption) { color: $gray-500; }

    .period-item {
        padding-bottom: 16px;
        border-bottom: 1px solid $gray-200;

        &:last-child {
            border-bottom: none;
        }
    }

    .button-wrapper {
        padding-top: 16px;
        // padding-top: 40px;
        display: flex;
        gap: 8px;

        background-color: $gray-00;

        button {
            flex: 1;
        }
    }
</style>