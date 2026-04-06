<script setup>
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { ko } from 'date-fns/locale'
import { startOfDay, startOfToday, subDays, subMonths, addDays } from "date-fns";
import { formatDate } from '@/utils/dateFormatter.js';

import { ref, computed, nextTick } from 'vue';

import BottomSheet from './Mobile/BottomSheet.vue';
import icCalendar from '@/assets/icons/ic_calendar.svg'
import icClear from '@/assets/icons/ic_clear.svg'
import ConfirmModal from './ConfirmModal.vue';

const props = defineProps({
    modelValue: {
        // 단일 날짜: Date | null, 범위: Date[] | null
        type: [Array, Date, null, Object], 
        // 기본값: range=true일 경우 오늘 ~ 7일 후, range=false일 경우 null (단일 날짜)
        default: (props) => props.range 
            ? [startOfDay(new Date()), addDays(startOfDay(new Date()), 7)]
            : startOfDay(new Date()),
    },
    range: { // 날짜 단일 선택이 아닌 기간 선택
        type: Boolean,
        default: true,
    },
    placeholder: {
        type: String,
        default: '날짜 선택',
    },
    pickerWidth: { // 너비값
        type: [String, Number],
        default: '120',
    },
    useLimit: { type: Boolean, default: false }, // 날짜 선택 기간 제한을 둘지 결정
    limitMonths: { type: Number, default: 3 }, // 몇 개월 전까지 제한할지 결정
    disabled: { type: Boolean, default: false },
    isMobile: { type: Boolean, default: false }, // 모바일 환경 체크
    isSearchFilter: {type:Boolean, default: false }, // 모바일 > 상단 검색조회용
    useMonthPicker: {type:Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const dpRef = ref(null);
const mobileDpRef = ref(null); // 모바일 전용 데이트피커 ref
const isBottomSheetOpen = ref(false);

// v-model을 computed 속성으로 래핑하여 양방향 바인딩 처리
const dateRange = computed({
    get: () => props.modelValue,
    set: (value) => {
        emit('update:modelValue', value);
    }
});

// 값이 있는지 확인하는 computed 속성
const hasValue = computed(() => {
    const val = props.modelValue;
    if (!val) return false;
    
    // 1. 기간 선택 (Array)
    if (props.range && Array.isArray(val)) {
        return val.length > 0 && val[0] !== null;
    }

    // 2. Month Picker (Object: { month: 2, year: 2026 })
    if (typeof val === 'object' && val !== null && 'month' in val) {
        return true;
    }

    // 3. 단일 날짜 (Date 객체)
    if (val instanceof Date) {
        return !isNaN(val.getTime()); // 유효한 날짜인지까지 확인
    }

    return false;
});

// 선택가능한 최소 날짜 계산
const minDate = computed(() => {
    if(!props.useLimit) return null;
    return subMonths(startOfDay(new Date()), props.limitMonths);
})
const maxDate = computed(() => {
    if(!props.useLimit) return null;
    return startOfDay(new Date());
})

// 표시할 텍스트 포맷 (예: YYYY.MM.DD ~ YYYY.MM.DD)
const formatDisplay = () => {
    if (!hasValue.value) {
        return props.placeholder;
    }

    if (props.range && Array.isArray(dateRange.value)) {
        const start = dateRange.value[0];
        const end = dateRange.value[1];

        // 시작일과 종료일이 같으면 하나만 표시
        if (Number(start) === Number(end)) {
            return formatDate(start);
        }

        return `${formatDate(start)} -  ${formatDate(end)}`;
    }

    // 2. Month Picker 객체 ({ month, year }) 인 경우
    if (typeof dateRange.value === 'object' && 'month' in dateRange.value) {
        const { year, month } = dateRange.value;
        return `${year}년 ${month + 1}월`; 
    }

    if (dateRange.value) {
        return formatDate(dateRange.value);
    }

    return props.placeholder;
};

// 값 초기화 함수
const clearDate = (event) => {
    // event.stopPropagation(); // fake-input의 @click 이벤트 전파 방지
    
    // v-model을 null 또는 빈 배열로 초기화
    const resetValue = props.range ? [] : null;
    emit('update:modelValue', resetValue);
    
    // 데이트피커가 열려 있다면 닫기
    if (dpRef.value) {
        dpRef.value.closeMenu();
    }
};

// fake-input 클릭 시 데이트피커 메뉴 열기
const openDatePicker = () => {
    if (props.isMobile) {
        isBottomSheetOpen.value = true;
    } else if (dpRef.value) {
        dpRef.value.openMenu();
    }
};

const onDateUpdate = (val) => {
    // 단일 날짜 선택 모드 (range=false) - 클릭 시 즉시 적용
    if (!props.range) {
        if (val instanceof Date) {
            emit('update:modelValue', startOfDay(val));
            dpRef.value?.closeMenu();
        } else { // 단일, 달 선택만 인 경우
            const value = { month: val.month, year: val.year}
            emit('update:modelValue', value)
        }
        return;
    }

    // 범위 선택 모드 (range=true)
    if (!val || !Array.isArray(val)) return;

    const [start, end] = val;

    // 시작일만 선택한 경우 → 하루짜리로 자동 완성
    if (start && !end) {
        const fixed = [startOfDay(start), startOfDay(start)];
        emit('update:modelValue', fixed);
        dpRef.value?.closeMenu();
        return;
    }

    // 시작일 + 종료일 모두 선택한 경우 → 즉시 적용
    if (start && end) {
        const fixed = [startOfDay(start), startOfDay(end)];
        emit('update:modelValue', fixed);
        dpRef.value?.closeMenu();
    }
};

const preventScroll = (e) => {
    const isOverlay = e.target.closest('.dp__overlay');
    if (!isOverlay) {
        e.preventDefault();
        e.stopPropagation();
    }
};

const onOpen = () => {
    nextTick(() => {
        // 캘린더 전체 팝업 요소를 찾습니다.
        const menu = document.querySelector('.dp__menu');
        if (menu) {
            // capture: true를 주면 라이브러리 내부 로직보다 우리가 먼저 이벤트를 뺏어옵니다.
            menu.addEventListener('wheel', preventScroll, { passive: false, capture: true });
        }
    });
};

const onClose = () => {
    const menu = document.querySelector('.dp__menu');
    if (menu) {
        menu.removeEventListener('wheel', preventScroll, { capture: true });
    }
};

// 모바일 바텀시트에서 '적용' 버튼 클릭 시
const handleMobileSelect = () => {
    // VueDatePicker의 내장 selectDate 함수를 직접 호출
    if (mobileDpRef.value) {
        // 라이브러리 내부의 selectDate 메서드 호출
        mobileDpRef.value.selectDate(); 
    }
    isBottomSheetOpen.value = false;
};
</script>

<template>
    <div class="date-picker-container" :class="isMobile ? 'mobile' : ''" :style="{ 'min-width': pickerWidth + 'px' }"> 
        
        <div 
            class="fake-input" 
            :class="{ '--has-value': hasValue, '--disabled': disabled, '--is-mobile-search-filter' : isSearchFilter }"
            @click="openDatePicker"
        >
            <span class="display-text">{{ formatDisplay() }}</span>

            <div v-if="!isSearchFilter" class="icon-area">
                <img  
                    :src="icCalendar" 
                    alt="달력 아이콘" 
                    class="icon icon--calendar"
                />

                <!-- <button 
                    v-else 
                    class="icon-button" 
                    @click.stop="clearDate" 
                    aria-label="선택 날짜 초기화"
                >
                    <img :src="icClear" alt="초기화 아이콘" class="icon icon--clear" />
                </button> -->
            </div>
        </div>
        
        <!-- :range="range" 로 수정해놓음 -->
        <VueDatePicker
            v-if="!isMobile"
            :key="range"
            ref="dpRef"
            v-model="dateRange"
            :range="range"
            :min-date="minDate"
            :max-date="maxDate"
            :auto-apply="!range"
            partial-range
            :locale="ko"
            week-start="0"
            :time-config="{ enableTimePicker: false }"
            :hide-input="true"
            :teleport-center="false"
            class="hidden-datepicker-instance"
            :disabled="disabled"
            @update:model-value="onDateUpdate"
            @open="onOpen" 
            @closed="onClose"
        >
            <template v-if="range" #action-row="{ selectDate, closeMenu }">
                <button class="btn btn--size-24 btn--black-outline" @click="dpRef && dpRef.closeMenu()">취소</button>
                <button class="btn btn--size-24 btn--black" @click="selectDate()">적용</button>
            </template>
        </VueDatePicker>

        <BottomSheet 
            v-model="isBottomSheetOpen" 
            bottom-sheet-title="날짜 선택"
            save-btn-text="확인"
            @save="handleMobileSelect"
        >
            <template #content>
                <div class="mobile-bottom-sheet-datepicker-wrapper">
                    <VueDatePicker
                        v-model="dateRange"
                        ref="mobileDpRef"
                        inline
                        :range="range"
                        :min-date="minDate"
                        :max-date="maxDate"
                        :locale="ko"
                        week-start="0"
                        :time-config="{ enableTimePicker: false }"
                        :auto-apply="false"
                        month-picker-close-on-scroll
                        :month-picker="useMonthPicker"
                        @update:model-value="onDateUpdate"
                    />
                </div>
            </template>
        </BottomSheet>
    </div>
</template>

<style lang="scss" scoped>
// datepicker 라이브러리 커스텀 스타일
:deep(.dp__main) { 
    position: absolute;
    top: 0;
    left: -40px;
    height: 32px;
    // display: none;
}
:deep(.dp__input) { 
    height: 32px;
    opacity: 0;
    padding:8px; 
}
:deep(.dp__input:focus) {
    border-color: $gray-900;
    box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.06);
}

:deep(.dp--menu-wrapper),
:deep(.dp__menu),
:deep(.dp__menu > div) {width:240px !important; min-width: 240px !important; left: 40px !important;}

.date-picker-container {
    position: relative;
    flex:2;
}
:deep(.dp__arrow_bottom) {
    display: none !important;
}
.fake-input { 
    width: 100%;
    position: relative;
    height: 32px;
    padding: 0 10px;
    border: 1px solid $gray-200;
    border-radius: 4px;
    display: flex;
    justify-content: space-between; // 텍스트와 아이콘 분리
    align-items: center;
    cursor: pointer;
    background-color: white;
    color: $gray-400;
    
    @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);

    &:hover {
        border-color: $gray-400;
    }
    
    &.--has-value {
        color: $gray-900;
    }
    &.--disabled {
        background-color: $gray-50;
        color: $gray-700;
        cursor: default;
    }

    &.--is-mobile-search-filter {
        border: none;
        height: auto;
        color: $gray-700;
        justify-content: center;
        @include typo($title-xl-mobile-size, $title-xl-mobile-weight, $title-xl-mobile-spacing, $title-xl-mobile-line);
    }
}

.icon-area {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    width: 16px; 
    height: 16px; 
    margin-left: 8px;

    .icon {
        width: 100%;
        height: 100%;
    }

    .icon-button {
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
    }
}

/* 모바일 바텀시트 내부 달력 커스텀 */
.mobile-bottom-sheet-datepicker-wrapper {
    // padding: 10px 0;
    padding-bottom: 24px;
    
    :deep(.dp__main) {
        width: 100% !important;
        position: relative;
        height: auto;
        left: 0;
        justify-content:center;
    }

    :deep(.dp__menu) {
        border: none;
        width: 100% !important;
        left: 0 !important;
        min-width: 100% !important;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    :deep(.dp__menu > div) {
        width: 296px !important;
    }

    :deep(.dp__overlay) {
        width: 100% !important;
    }

    :deep(.dp__inner_nav) {
        border: none;
        color: $gray-700;
    }

    :deep(.dp__month_year_wrap) {
        gap:4px;
    }
    :deep(.dp__month_year_select) {
        font-family: Pretendard;
        font-size: 16px;
        font-weight: 700;
        line-height: 140%;
        letter-spacing: -0.48px;
        color: $gray-700;

        &[data-dp-element="overlay-year"] {
            justify-content: flex-end;
            margin-left: 20px;
            &::after {content: "년"}
        }
        &[data-dp-element="overlay-month"] {
            justify-content: flex-start;
        }
    }

    :deep(.dp__calendar_header_item) {
        font-size: 14px;

    }

    :deep(.dp__cell_inner) {
        width:40px !important;
        height: 40px !important;
        font-size: 14px;
        // height:41px !important;
    }

    :deep(.dp__today) {
        background-color: $primary-50;
        border: none;
        border-radius: 100px;
        color: $primary-700;
        font-weight: 700;

        &.dp__range_between {
            background-color: $gray-50;
            border-radius: 5px ;
        }
    }

    :deep(.dp__calendar_item) {
        height: auto;
    }
    
    :deep(.dp__instance_calendar) {
        width: 100%;
    }

    :deep(.dp--year-select) {
        @include typo($title-xl-mobile-size, $title-xl-mobile-weight, $title-xl-mobile-spacing, $title-xl-mobile-line);
        &::after {content: '년';}
    }

    :deep(.dp__overlay_cell) {
        border-radius: 100px;
        color: $gray-700;
        @include typo($body-l-mobile-size, $body-l-mobile-weight, $body-l-mobile-spacing, $body-l-mobile-line);
    }

    :deep(.dp__overlay_cell_active) {
        border-radius: 100px;
        color: $primary-700;
        background-color: $primary-50;
        @include typo($title-l-mobile-size, $title-l-mobile-weight, $title-l-mobile-spacing, $title-l-mobile-line);
    }

    /* 하단 버튼 액션 열 숨기기 (바텀시트 자체 버튼 사용 시) */
    :deep(.dp__action_row) {
        display: none;
    }
}
</style>