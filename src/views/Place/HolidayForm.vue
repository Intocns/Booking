<!-- 상품등록 > 예약 정보 > 휴무일 설정 on -->
<script setup>
import { ref, computed, watch } from 'vue';
// 컴포넌트
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';
import ModalDatePicker from '@/components/common/ModalDatePicker.vue';
// 아이콘
import icPlus from '@/assets/icons/ic_plus_black.svg';
import icDel from '@/assets/icons/ic_del.svg';
import icClear from '@/assets/icons/ic_clear.svg'
// utils
// import { formatDate } from 'date-fns';
import { formatDate,  formatDateSplit } from '@/utils/dateFormatter';
import { DAYS_OPTIONS, PUBLIC_HOLIDAYS_OPTIONS } from '@/constants';

// 주 옵션 데이터 (임시)
const weeksOptions = [
    { label: '첫번째', value: 1 },
    { label: '두번째', value: 2 },
    { label: '세번째', value: 3 },
    { label: '네번째', value: 4 },
    { label: '다섯번째', value: 5 },
];

/**
 * 상태관리
 */
const holidayType = ref(''); // 'WEEKLY', 'BI_WEEKLY', 'MONTHLY' 연결용
const selectedDays = ref([]); // 매주/격주용 요일
const startDate = ref(null); // 격주 선택 시 시작일 저장
const monthlyRules = ref([ // 매달 선택 시 규칙 초기값 세팅
    { selectedWeeks: [], selectedDays: [] }
]);
const selectedPublicHolidays = ref([]); // 선택된 공휴일 value들이 담길 배열

const isModalOpen = ref(false); // 모달 열림/닫힘
const selectedDateInModal = ref(null); // 모달 내 데이트피커와 연결
const customHolidays = ref([]); // 선택된 날짜 리스트 ['2023-12-25', '2023-12-26']

// 요일 버튼 클릭 이벤트
const toggleDay = (dayValue) => {
    // 격주일 때 시작일이 없으면 클릭 방지 
    if (holidayType.value === 'BI_WEEKLY' && !startDate.value) return

    const index = selectedDays.value.indexOf(dayValue);
    if (index > -1) {
        // 이미 있으면 제거
        selectedDays.value.splice(index, 1);
    } else {
        // 없으면 추가
        selectedDays.value.push(dayValue);
    }
};

// 요일 선택 가능 여부 계산
const isDaySelectionDisabled = computed(() => {
    // 격주인데 시작일이 없으면 비활성화
    return holidayType.value === 'BI_WEEKLY' && !startDate.value;
});

// 매달 > 규칙 추가
const addMonthlyRule = () => {
    monthlyRules.value.push({ selectedWeeks: [], selectedDays: [] });
};
// 매달 > 규칙 삭제
const removeMonthlyRule = (index) => {
    monthlyRules.value.splice(index, 1);
};
// 매달 전용 요일 토글 함수
const toggleMonthlyDay = (ruleIndex, dayValue) => {
    const days = monthlyRules.value[ruleIndex].selectedDays;
    const index = days.indexOf(dayValue);
    index > -1 ? days.splice(index, 1) : days.push(dayValue);
};


// 1. 전체 휴무 선택 시
const handleAllPublicHolidays = (e) => {
    if (e.target.checked) {
        // 모든 공휴일 value를 배열에 담음
        selectedPublicHolidays.value = PUBLIC_HOLIDAYS_OPTIONS.map(h => h.value);
    } else {
        selectedPublicHolidays.value = [];
    }
};

// 2. 명절 당일만 휴무 선택 시
const handleHolidayOnly = (e) => {
    if (e.target.checked) {
        // 설날 당일, 추석 당일만 필터링 
        const targets = [ 2, 12 ]; // 임시 value값임
        selectedPublicHolidays.value = PUBLIC_HOLIDAYS_OPTIONS
            .filter(h => targets.includes(h.value))
            .map(h => h.value);
    } else {
        selectedPublicHolidays.value = [];
    }
};

// 3. 개별 버튼 클릭 시
const togglePublicHoliday = (dayVal) => {
    const index = selectedPublicHolidays.value.indexOf(dayVal);
    if (index > -1) {
        selectedPublicHolidays.value.splice(index, 1);
    } else {
        selectedPublicHolidays.value.push(dayVal);
    }
};

// 4. 체크박스가 라디오처럼 보이게 하기 위한 상태 계산
const isAllChecked = computed(() => {
    return PUBLIC_HOLIDAYS_OPTIONS.length > 0 && 
           selectedPublicHolidays.value.length === PUBLIC_HOLIDAYS_OPTIONS.length;
});

const isHolidayOnlyChecked = computed(() => {
    const targets = [ 2, 12 ]; // 임시 value값임
    // 선택된 개수가 2개이고, 그게 설날/추석 당일일 때만 체크 표시
    return selectedPublicHolidays.value.length === 2 && 
           selectedPublicHolidays.value.every(v => targets.includes(v));
});

// 날짜 추가 함수
const onAddHoliday = (data) => {    
    // 중복 추가 방지 (텍스트 기준이나 날짜 기준으로 체크)
    const isDuplicate = customHolidays.value.some(item => item.text === data.text);
    
    if (!isDuplicate) {
        // 모달에서 이미 포맷팅된 'text'를 보내주므로 그대로 push
        customHolidays.value.push(data);
        
        // 정렬이 필요하다면 날짜 기준 정렬
        customHolidays.value.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    isModalOpen.value = false;
};

const removeCustomHoliday = (idx) => {  
    customHolidays.value.splice(idx, 1)
}

//저장 시 api로 보낼 response형식으로 세팅
const setSaveFormat = () => {
    //정규 휴무 - 공통 return 데이터
    const baseHoliday = {
        holidayType : "REGULAR",
        repetitionType : holidayType.value
    };

    //정규 휴무 세팅
    let regularHoliday = {};

    switch(holidayType.value){
        case "WEEKLY" :
            regularHoliday = {
                week : [{
                    ...baseHoliday,
                    weekdays : selectedDays.value
                }]
            };
            break;
        case "BI_WEEKLY" :
            regularHoliday = {
                week : [{
                    ...baseHoliday,
                    weekdays : selectedDays.value,
                    startDate : formatDate(startDate.value)
                }]
            };
            break;
        case "MONTHLY" :
            regularHoliday = {
                mon: monthlyRules.value.map(data => ({
                    ...baseHoliday,
                    weekdays: data.selectedDays,
                    weekNumbers: data.selectedWeeks
                }))
            };
            break;
        default :
            break;     
    }

    //날짜로 휴무일 지정
    const spDayResult = customHolidays.value.map(data => {
        //정규 휴무 - 공통 return 데이터
        const baseCustomHoliday = {
            holidayType : "CUSTOM",
            repetitionType : data.type
        };

        let customHolydayResult = {};

        switch(data.type){
            case "DAILY" :
                customHolydayResult = {
                    ...baseCustomHoliday,
                    startDate : formatDate(data.date),
                    endDate : formatDate(data.date)
                };
                break;
            case "MONTHLY" :
                customHolydayResult = {
                    ...baseCustomHoliday,
                    repetitionDay : formatDateSplit(data.date).month
                };
                break;
            case "YEARLY" :
                customHolydayResult = {
                    ...baseCustomHoliday,
                    repetitionMonth : formatDateSplit(data.date).month,
                    repetitionDay : formatDateSplit(data.date).day
                };
                break;
            default :
                break;
        }

        return customHolydayResult;
    })

    const result = {
        ...regularHoliday,
        spDay : spDayResult,
        hoDay : selectedPublicHolidays.value.map(i => PUBLIC_HOLIDAYS_OPTIONS[i].apiValue ?? PUBLIC_HOLIDAYS_OPTIONS[i].label ?? '')
    };

    return result;
}

const initFormData = (impos) => {
    if (!impos) return;

    // 1. 정기 휴무 세팅
    if (impos.week && impos.week.length > 0) {
        const weekData = impos.week[0];
        holidayType.value = weekData.repetitionType; // WEEKLY or BI_WEEKLY
        selectedDays.value = weekData.weekdays;
        startDate.value = new Date(weekData.startDate) || null;
    } else if (impos.mon && impos.mon.length > 0) {
        holidayType.value = 'MONTHLY';
        monthlyRules.value = impos.mon.map(m => ({
            selectedWeeks: m.weekNumbers,
            selectedDays: m.weekdays
        }));
    }

    // 2. 공휴일 세팅
    if (impos.hoDay && Array.isArray(impos.hoDay)) {
        selectedPublicHolidays.value = PUBLIC_HOLIDAYS_OPTIONS
            .filter(opt => {
                // apiValue가 있으면 apiValue로 비교, 없으면 label로 비교
                const targetValue = opt.apiValue || opt.label;
                return impos.hoDay.includes(targetValue);
            })
            .map(opt => opt.value);
    }

    // 3. 그외 휴무일(spDay) 세팅
    if (impos.spDay) {
        customHolidays.value = impos.spDay.filter(d => d.holidayType === "CUSTOM").map(d => {
            let dateStr = d.startDate;
            let textStr = d.startDate;
            
            if (d.repetitionType === 'MONTHLY') {
                textStr = `매달 ${d.repetitionDay}일`;
                dateStr = `2026-01-${d.repetitionDay}`; // 더미 날짜
            } else if (d.repetitionType === 'YEARLY') {
                textStr = `매년 ${d.repetitionMonth}월 ${d.repetitionDay}일`;
                dateStr = `2026-${d.repetitionMonth}-${d.repetitionDay}`;
            }

            return {
                type: d.repetitionType,
                date: dateStr,
                text: textStr
            };
        });
    }
};

defineExpose({ setSaveFormat, initFormData })//부모 화면에서 사용하기 위해서 선언
</script>

<template>
    <div class="d-flex flex-col gap-16">
        <!-- 정기 휴무 -->
        <div class="holiday-form">
            <div class="holiday-form__option">
                <p class="title-s">정기 휴무</p>
                <!-- 정기 휴무 옵션 선택 (매주/격주/매달) -->
                <div class="d-flex gap-16">
                    <label class="radio">
                        <input type="radio" v-model="holidayType" value="WEEKLY" />
                        <span class="circle"></span>
                        <span class="label">매주</span>
                    </label>
                    <label class="radio">
                        <input type="radio" v-model="holidayType" value="BI_WEEKLY" />
                        <span class="circle"></span>
                        <span class="label">격주</span>
                    </label>
                    <label class="radio">
                        <input type="radio" v-model="holidayType" value="MONTHLY" />
                        <span class="circle"></span>
                        <span class="label">매달</span>
                    </label>
                </div>
            </div>
    
            <!-- 옵션: 매주  -->
            <div v-if="holidayType == 'WEEKLY'" class="holiday-form__option-list">
                <!-- 요일 버튼 -->
                <div class="day-button-group d-flex gap-4">
                    <button 
                        v-for="day in DAYS_OPTIONS" 
                        :key="day.value" 
                        type="button" 
                        class="btn-day" 
                        :class="{active: selectedDays.includes(day.value)}" 
                        @click="toggleDay(day.value)"
                    >
                        {{ day.label }}
                    </button>
                </div>
            </div>
    
            <!-- 옵션: 격주 -->
            <div v-if="holidayType == 'BI_WEEKLY'" class="holiday-form__option-list">
                <div>
                    <div class="d-flex align-center gap-8">
                        <span class="title-s">시작일</span>
                        <div style="width: 240px;">
                            <CustomDatePicker v-model="startDate" :range="false" />
                        </div>
                    </div>
                    <span class="caption">※ 시작일을 지정해 주세요.</span>
                </div>
    
                <!-- 시작일 지정 후 요일 선택 -->
                <!-- 요일 버튼 -->
                <div 
                    class="day-button-group d-flex gap-4"
                    :class="{ 'is-disabled': isDaySelectionDisabled }"
                >
                    <button 
                        v-for="day in DAYS_OPTIONS" 
                        :key="day.value" 
                        type="button" 
                        class="btn-day" 
                        :disabled="isDaySelectionDisabled"
                        :class="{ active: selectedDays.includes(day.value) }" 
                        @click="toggleDay(day.value)"
                    >
                        {{ day.label }}
                    </button>
                </div>
            </div>
    
            <!-- 옵션: 매달 -->
            <div v-if="holidayType == 'MONTHLY'" class="holiday-form__option-list">
                <div 
                    v-for="(rule, rIdx) in monthlyRules" 
                    :key="rIdx" 
                    class="d-flex align-center gap-16 mb-8"
                >
                    <div class="d-flex gap-16">
                        <label v-for="week in weeksOptions" :key="week.value" class="checkbox">
                            <input 
                                type="checkbox" 
                                :value="week.value" 
                                v-model="rule.selectedWeeks" 
                            />
                            <span class="box"></span>
                            <span class="label">{{ week.label }}</span>
                        </label>
                    </div>
    
                    <div class="day-button-group d-flex gap-4">
                        <button 
                            v-for="day in DAYS_OPTIONS" 
                            :key="day.value" 
                            type="button" 
                            class="btn-day" 
                            :class="{ active: rule.selectedDays.includes(day.value) }" 
                            @click="toggleMonthlyDay(rIdx, day.value)"
                        >
                            {{ day.label }}
                        </button>
                    </div>
    
                    <div class="d-flex gap-8">
                        <button 
                            v-if="rIdx === 0"
                            type="button"
                            class="btn btn--size-24 btn--black-outline" 
                            @click="addMonthlyRule"
                        >
                            <img :src="icPlus" alt="아이콘">규칙 추가
                        </button>
                        
                        <button 
                            v-else
                            type="button"
                            class="btn btn--size-24 btn--black-outline"
                            @click="removeMonthlyRule(rIdx)"
                        >
                            <img :src="icDel" width="14">삭제
                        </button>
                    </div>
                </div>
            </div>
    
        </div>
    
        <!-- 공휴일 휴무 -->
        <div class="holiday-form">
            <div class="holiday-form__option">
                <div class="title-s">공휴일 휴무</div>
                
                <div class="d-flex gap-16 mb-8">
                    <label class="checkbox">
                        <input 
                            type="checkbox" 
                            :checked="isAllChecked" 
                            @change="handleAllPublicHolidays" 
                        />
                        <span class="box"></span>
                        <span class="label">전체 휴무</span>
                    </label>
    
                    <label class="checkbox">
                        <input 
                            type="checkbox" 
                            :checked="isHolidayOnlyChecked" 
                            @change="handleHolidayOnly" 
                        />
                        <span class="box"></span>
                        <span class="label">설, 추석 당일만 휴무</span>
                    </label>
                </div> 
    
                <div class="d-flex align-center flex-wrap gap-4">
                    <button 
                        v-for="day in PUBLIC_HOLIDAYS_OPTIONS" 
                        :key="day.value"
                        type="button"
                        class="btn-day btn-day--auto"
                        :class="{ active: selectedPublicHolidays.includes(day.value) }"
                        @click="togglePublicHoliday(day.value)"
                    >
                        {{ day.label }}
                    </button>
                </div>
            </div>
        </div>
    
        <!-- 날짜로 휴무일 지정 -->
        <div class="holiday-form">
            <div class="holiday-form__option">
                <div class="d-flex align-center gap-8 mb-8">
                    <p class="title-s">날짜로 휴무일 지정</p>
                    <button 
                        type="button" 
                        class="btn btn--size-24 btn--black-outline"
                        @click="isModalOpen = true"
                    >
                        <img :src="icPlus" alt="아이콘">항목 추가
                    </button>
                </div>
    
                <div v-if="customHolidays.length > 0" class="d-flex flex-wrap gap-8">
                    <div 
                        v-for="(date, idx) in customHolidays" 
                        :key="idx" 
                        class="btn-day active selected-date-tag"
                    >
                        <span>{{ date.text }}</span>
                        <button type="button" @click="removeCustomHoliday(idx)">
                            <img :src="icClear" width="16" alt="삭제">
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- 날짜로 휴무일 지정 datepicker 팝업 -->
    <ModalDatePicker 
        :is-modal-open="isModalOpen" 
        @close="isModalOpen = false"
        @add="onAddHoliday"
    />

</template>

<style lang="scss" scoped>
    .holiday-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-bottom: 16px;

        border-bottom: 1px solid $gray-200;

        &:last-child {
            padding-bottom: 0;
            border-bottom: none;
        }

        &__option {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        &__option-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
    }

    .selected-date-tag {
        display: flex;
        align-items: center;
        gap: 10px;

        span {line-height: 1;}
    }
</style>