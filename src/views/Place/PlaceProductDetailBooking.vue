<script setup>
// 컴포넌트
import TimeSelect from '@/components/common/TimeSelect.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';
// 아이콘
import icPlus from '@/assets/icons/ic_plus_black.svg'
import icPlusBlue from '@/assets/icons/ic_plus_blue.svg'
import icDel from '@/assets/icons/ic_del.svg'

import { ref, watch } from 'vue';

// 1~10까지 옵션 자동 생성
const animalCountOptions = Array.from({ length: 10 }, (_, i) => ({
    label: String(i + 1),
    value: i + 1
}));

/**
 * 상태관리
 */
// 선택된 마리수 (기본값 0 또는 1)
const selectedAnimalCount = ref(null);
// 시간 선택 관련 ref
const startTime = ref('');
const endTime = ref('');

// --- 운영 일정 상태 관리 ---
const scheduleMode = ref('regular'); // 'regular' (정기), 'event' (이벤트)
// 이벤트 기간 데이터 (DatePicker가 들어갈 영역)
const eventDates = ref([
    { start: '', end: '' } // 초기값 1개
]);
// 기간 추가 함수
const addEventDate = () => {
    eventDates.value.push({ start: '', end: '' });
};
// 기간 삭제 함수
const removeEventDate = (index) => {
    eventDates.value.splice(index, 1);
};

// --- 운영 시간 상태 관리 ---
// 'all' (모든 영업일 동일), 'split' (평일/주말 구분), 'daily' (요일별 설정)
const operatingMode = ref('all');
// 1. 모든 영업일 동일 데이터
const allDaysTime = ref([{ start: '', end: '' }]);
// 시간대 추가 함수
const addTimeRange = (targetArray) => {
    targetArray.push({ start: '', end: '' });
};
// 시간대 삭제 함수
const removeTimeRange = (targetArray, index) => {
    targetArray.splice(index, 1);
};
// 2번 영역을 위한 주말 통합 옵션
const weekendOptions = [
    { label: '주말(토, 일)', value: 'weekend_all' },
    { label: '토, 일 구분', value: 'weekend_split' }
];

// 3, 4번 영역에서 다시 합치기 위한 옵션
const satOptions = [{ label: '토요일', value: 'sat' }, { label: '토, 일 합치기', value: 'merge' }];
const sunOptions = [{ label: '일요일', value: 'sun' }, { label: '토, 일 합치기', value: 'merge' }];

// 상태 관리
const splitMode = ref('weekend_all'); // 'weekend_all' or 'weekend_split'

// --- 운영 시간 상태 관리 ---
const splitTime = ref({
    weekday: [{ start: '', end: '' }], // 평일 시간대 리스트
    weekend: [{ start: '', end: '' }], // 통합 주말 시간대 리스트
    sat: [{ start: '', end: '' }],     // 토요일 시간대 리스트
    sun: [{ start: '', end: '' }]      // 일요일 시간대 리스트
});

// "토, 일 합치기" 선택 시 감지하여 모드 변경
const handleWeekendMerge = (val) => {
    if (val === 'merge') {
        splitMode.value = 'weekend_all';
    }
};

// --- 요일별 설정 관련 상태 ---
const daysOptions = [
    { label: '월', value: 'mon' },
    { label: '화', value: 'tue' },
    { label: '수', value: 'wed' },
    { label: '목', value: 'thu' },
    { label: '금', value: 'fri' },
    { label: '토', value: 'sat' },
    { label: '일', value: 'sun' }
];

// --- 요일별 설정 관련 상태 ---
const dailyGroups = ref([
    {
        selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        times: [{ start: '', end: '' }]
    }
]);

// 요일 그룹 추가
const addDailyGroup = () => {
    dailyGroups.value.push({
        selectedDays: [],
        times: [{ start: '', end: '' }]
    });
};

// 요일 그룹 삭제
const removeDailyGroup = (index) => {
    dailyGroups.value.splice(index, 1);
};


// 특정 그룹 내 요일 토글
const toggleDayInGroup = (groupIndex, dayValue) => {
    const days = dailyGroups.value[groupIndex].selectedDays;
    const index = days.indexOf(dayValue);
    if (index > -1) {
        days.splice(index, 1);
    } else {
        days.push(dayValue);
    }
};
// 선택된 요일들을 담는 배열 (기본값: 전체 선택 혹은 빈 배열)
const selectedDays = ref(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']); 

// 요일 버튼 클릭 핸들러
const toggleDay = (dayValue) => {
    const index = selectedDays.value.indexOf(dayValue);
    if (index > -1) {
        // 이미 선택된 경우 제거
        selectedDays.value.splice(index, 1);
    } else {
        // 선택되지 않은 경우 추가
        selectedDays.value.push(dayValue);
    }
};

// 요일별 시간 데이터 (선택된 요일 그룹에 적용될 시간)
const dailyGroupTime = ref({ start: '', end: '' });
</script>

<template>
    <ul class="form-container">
        <!-- 예약 가능 동물 수 -->
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
                    <span class="caption">※ 예약 가능한 동물 수는 IntoVet GE, 인투펫 예약 데이터와 연동되어 제공되는 기능입니다.</span>
                </div>
            </div>
        </li>

        <!-- 운영 일정 -->
        <li class="form-item">
            <div class="form-label required">운영 일정</div>
            <div class="form-content">
                <div class="d-flex flex-col gap-12">
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

                    <div v-if="scheduleMode === 'event'" class="event-setting-container d-flex flex-col gap-8">
                        <div v-for="(date, idx) in eventDates" :key="'event-' + idx" class="d-flex align-center gap-8">
                            <span class="title-s" style="min-width: 30px;">기간</span>
                            
                            <CustomDatePicker />

                            <button 
                                v-if="idx === 0" 
                                type="button" 
                                class="btn btn--size-24 btn--black-outline" 
                                @click="addEventDate"
                            >
                                <img :src="icPlus" alt=""> 기간 추가
                            </button>
                            <button 
                                v-else 
                                type="button" 
                                class="btn btn--size-24 btn--black-outline" 
                                @click="removeEventDate(idx)"
                            >
                                <img :src="icDel" alt="" width="14"> 삭제
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </li>

        <!-- 적용 기간 -->
        <li v-if="scheduleMode === 'event'" class="form-item">
            <div class="form-label required">적용 기간</div>
            <div class="form-content"></div>
        </li>

        <!-- 운영 시간 -->
        <li class="form-item">
            <div class="form-label required">운영 시간</div>
            <div class="form-content">
                <div>
                    <div class="d-flex gap-16">
                        <label class="radio">
                            <input type="radio" v-model="operatingMode" value="all" />
                            <span class="circle"></span>
                            <span class="label">모든 영업일 동일</span>
                        </label>
                        
                        <label class="radio">
                            <input type="radio" v-model="operatingMode" value="split" />
                            <span class="circle"></span>
                            <span class="label">평일/주말 운영 시간 구분</span>
                        </label>
    
                        <label class="radio">
                            <input type="radio" v-model="operatingMode" value="daily" />
                            <span class="circle"></span>
                            <span class="label">요일별 설정</span>
                        </label>
                    </div>
                    <span class="caption">※ 휴게 시간은 제외하고 등록해주세요.</span>
                </div>

                <div v-if="operatingMode === 'all'" class="d-flex flex-col gap-8">
                    <div 
                        v-for="(time, idx) in allDaysTime" 
                        :key="idx" 
                        class="d-flex align-center gap-8"
                    >
                        <span class="title-s">시작</span>
                        <TimeSelect v-model="time.start" class="time-select-wrap"/>
                        
                        <span class="time-separator">-</span>
                        
                        <span class="title-s">마지막</span>
                        <TimeSelect v-model="time.end" class="time-select-wrap"/>

                        <button 
                            v-if="idx === 0" 
                            type="button"
                            class="btn btn--size-24 btn--black-outline"
                            @click="addTimeRange(allDaysTime)"
                        >
                            <img :src="icPlus" alt=""> 시간 추가
                        </button>

                        <button 
                            v-else 
                            type="button"
                            class="btn btn--size-24 btn--black-outline" 
                            @click="removeTimeRange(allDaysTime, idx)"
                            style="width: 71px;"
                        >
                            <img :src="icDel" alt="" width="14"> 삭제
                        </button>
                    </div>
                </div>

                <div v-else-if="operatingMode === 'split'" class="d-flex flex-col gap-8">
                    <div class="d-flex flex-col gap-8">
                        <div v-for="(time, idx) in splitTime.weekday" :key="'weekday-' + idx" class="d-flex align-center gap-8">
                            <span class="title-s" style="width: 120px;">
                                <template v-if="idx === 0">평일(월~금)</template>
                            </span>
                            <TimeSelect v-model="time.start" class="time-select-wrap"/>
                            <span class="time-separator">-</span>
                            <TimeSelect v-model="time.end" class="time-select-wrap"/>
                            
                            <button v-if="idx === 0" type="button" class="btn btn--size-24 btn--black-outline" @click="addTimeRange(splitTime.weekday)">
                                <img :src="icPlus" alt=""> 시간 추가
                            </button>
                            <button v-else type="button" class="btn btn--size-24 btn--black-outline" style="width: 71px;" @click="removeTimeRange(splitTime.weekday, idx)">
                                <img :src="icDel" alt="" width="14"> 삭제
                            </button>
                        </div>
                    </div>

                    <template v-if="splitMode === 'weekend_all'">
                        <div class="d-flex flex-col gap-8">
                            <div v-for="(time, idx) in splitTime.weekend" :key="'weekend-' + idx" class="d-flex align-center gap-8">
                                <div style="width: 120px;">
                                    <CustomSingleSelect v-if="idx === 0" v-model="splitMode" :options="weekendOptions" select-width="120px" />
                                </div>
                                <TimeSelect v-model="time.start" class="time-select-wrap"/>
                                <span class="time-separator">-</span>
                                <TimeSelect v-model="time.end" class="time-select-wrap"/>
                                
                                <button v-if="idx === 0" type="button" class="btn btn--size-24 btn--black-outline" @click="addTimeRange(splitTime.weekend)">
                                    <img :src="icPlus" alt=""> 시간 추가
                                </button>
                                <button v-else type="button" class="btn btn--size-24 btn--black-outline" style="width: 71px;" @click="removeTimeRange(splitTime.weekend, idx)">
                                    <img :src="icDel" alt="" width="14"> 삭제
                                </button>
                            </div>
                        </div>
                    </template>

                    <template v-else-if="splitMode === 'weekend_split'">
                        <div class="d-flex flex-col gap-8">
                            <div v-for="(time, idx) in splitTime.sat" :key="'sat-' + idx" class="d-flex align-center gap-8">
                                <div style="width: 120px;">
                                    <CustomSingleSelect v-if="idx === 0" :model-value="'sat'" :options="satOptions" select-width="120px" @update:modelValue="handleWeekendMerge" />
                                </div>
                                <TimeSelect v-model="time.start" class="time-select-wrap"/>
                                <span class="time-separator">-</span>
                                <TimeSelect v-model="time.end" class="time-select-wrap"/>
                                <button v-if="idx === 0" type="button" class="btn btn--size-24 btn--black-outline" @click="addTimeRange(splitTime.sat)">
                                    <img :src="icPlus" alt=""> 시간 추가
                                </button>
                                <button v-else type="button" class="btn btn--size-24 btn--black-outline" style="width: 71px;" @click="removeTimeRange(splitTime.sat, idx)">
                                    <img :src="icDel" alt="" width="14"> 삭제
                                </button>
                            </div>
                        </div>
                        <div class="d-flex flex-col gap-8">
                            <div v-for="(time, idx) in splitTime.sun" :key="'sun-' + idx" class="d-flex align-center gap-8">
                                <div style="width: 120px;">
                                    <CustomSingleSelect v-if="idx === 0" :model-value="'sun'" :options="sunOptions" select-width="120px" @update:modelValue="handleWeekendMerge" />
                                </div>
                                <TimeSelect v-model="time.start" class="time-select-wrap"/>
                                <span class="time-separator">-</span>
                                <TimeSelect v-model="time.end" class="time-select-wrap"/>
                                <button v-if="idx === 0" type="button" class="btn btn--size-24 btn--black-outline" @click="addTimeRange(splitTime.sun)">
                                    <img :src="icPlus" alt=""> 시간 추가
                                </button>
                                <button v-else type="button" class="btn btn--size-24 btn--black-outline" style="width: 71px;" @click="removeTimeRange(splitTime.sun, idx)">
                                    <img :src="icDel" alt="" width="14"> 삭제
                                </button>
                            </div>
                        </div>
                    </template>
                </div>

                <div v-else-if="operatingMode === 'daily'" class="daily-setting-container d-flex flex-col gap-16">
                    <div>
                        <button type="button" class="text-button text-button--blue add-item-btn" @click="addDailyGroup">
                            <img :src="icPlusBlue" alt=""> 요일 추가
                        </button>
                    </div>

                    <div 
                        v-for="(group, gIdx) in dailyGroups" 
                        :key="'group-' + gIdx" 
                        class="daily-group-item d-flex gap-16 align-start"
                    >
                        <div class="day-button-group d-flex gap-4">
                            <button 
                                v-for="day in daysOptions" 
                                :key="day.value"
                                type="button"
                                class="btn-day"
                                :class="{ 'active': group.selectedDays.includes(day.value) }"
                                @click="toggleDayInGroup(gIdx, day.value)"
                            >
                                {{ day.label }}
                            </button>
                        </div>

                        <div class="d-flex flex-col gap-8" style="flex: 1;">
                            <div v-for="(time, tIdx) in group.times" :key="'time-' + tIdx" class="d-flex align-center gap-8">
                                <div class="d-flex gap-8 align-center" style="flex:2;">
                                    <span class="title-s">시작</span>
                                    <TimeSelect v-model="time.start" class="time-select-wrap"/>
                                    <span class="time-separator">-</span>
                                    <span class="title-s">마지막</span>
                                    <TimeSelect v-model="time.end" class="time-select-wrap"/>
                                </div>
                                
                                <div class="d-flex align-center gap-8" style="flex: 1;">
                                    <button v-if="tIdx === 0" type="button" class="btn btn--size-24 btn--black-outline" @click="addTimeRange(group.times)">
                                        <img :src="icPlus" alt=""> 시간 추가
                                    </button>
                                    <button v-else type="button" class="btn btn--size-24 btn--black-outline" style="width: 71px;" @click="removeTimeRange(group.times, tIdx)">
                                        <img :src="icDel" alt="" width="14"> 삭제
                                    </button>
    
                                    <button 
                                        v-if="tIdx === 0 && gIdx > 0" 
                                        type="button" 
                                        class="btn btn--size-24 btn--black-outline" 
                                        @click="removeDailyGroup(gIdx)"
                                    >
                                        <img :src="icDel" alt="" width="14"> 요일 삭제
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </li>

        <!-- 휴무일 설정 -->
        <li class="form-item">
            <div class="form-label">휴무일 설정</div>
            <div class="form-content">
                <label class="toggle">
                    <input type="checkbox" />
                    <span class="toggle-img"></span>
                </label>
            </div>
        </li>
    </ul>

    <div class="button-wrapper">
        <button class="btn btn--size-40 btn--black">이전으로</button>
        <button class="btn btn--size-40 btn--blue">다음</button>
    </div>
</template>

<style lang="scss" scoped>
    :deep(.caption) { color: $gray-500; }

    .add-item-btn {
        width: 100%;
        height: 32px;
        margin-bottom: 4px;

        border-radius: 5px;
        border: 1px solid $gray-200;
    }

    .button-wrapper {
        // padding-top: 16px;
        padding-top: 40px;
        display: flex;
        gap: 8px;

        background-color: $gray-00;

        button {
            flex: 1;
        }
    }
</style>