<script setup>
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { ko } from 'date-fns/locale'
import { startOfDay, startOfToday, subDays, subMonths } from "date-fns";
import { formatDate } from '@/utils/dateFormatter.js';

import { ref, computed, nextTick } from 'vue';

import icCalendar from '@/assets/icons/ic_calendar.svg'
import icClear from '@/assets/icons/ic_clear.svg'

const props = defineProps({
    modelValue: {
        // 단일 날짜: Date | null, 범위: Date[] | null
        type: [Array, Date, null], 
        // 기본값: range=true일 경우 7일 전 ~ 오늘, range=false일 경우 null (단일 날짜)
        default: (props) => props.range 
            ? [subDays(startOfDay(new Date()), 7), startOfDay(new Date())]
            : null,
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
    disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const dpRef = ref(null);

// v-model을 computed 속성으로 래핑하여 양방향 바인딩 처리
const dateRange = computed({
    get: () => props.modelValue,
    set: (value) => {
        emit('update:modelValue', value);
    }
});

// 값이 있는지 확인하는 computed 속성
const hasValue = computed(() => {
    if (!props.modelValue) return false;
    
    if (props.range) {
        // Array 타입 (range)일 때, 배열의 첫 번째 요소가 null이 아닌지 확인
        return Array.isArray(props.modelValue) && props.modelValue[0] !== null;
    } else {
        // Date 타입 (단일)일 때, 값이 null이 아닌지 확인
        return props.modelValue instanceof Date;
    }
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
        return `${formatDate(start)} ~ ${formatDate(end)}`;
    } else if (dateRange.value) {
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
    if (dpRef.value) {
        dpRef.value.openMenu();
    }
};

const onDateUpdate = (val) => {
    // 단일 날짜 선택 모드 (range=false) - 클릭 시 즉시 적용
    if (!props.range) {
        if (val instanceof Date) {
            emit('update:modelValue', startOfDay(val));
            dpRef.value?.closeMenu();
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
</script>

<template>
    <div class="date-picker-container" :style="{ 'min-width': pickerWidth + 'px' }"> 
        
        <div 
            class="fake-input" 
            :class="{ '--has-value': hasValue, '--disabled': disabled }"
            @click="openDatePicker"
        >
            <span class="display-text">{{ formatDisplay() }}</span>

            <div class="icon-area">
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
:deep(.dp--clear-btn) {display: none;}
:deep(.dp__input_icon) {display: none !important;}
:deep(.dp__arrow_top) {display: none;}

:deep(.dp--menu-wrapper),
:deep(.dp__menu),
:deep(.dp__menu > div) {width:240px !important; min-width: 240px !important; left: 40px !important;}

:deep(.dp__month_year_wrap .dp__month_year_wrap) {flex-direction: row-reverse;} // 월 이동 버튼 자리 바꿈
:deep(.dp__month_year_select) { // 월, 년도 선택 버튼
    font-family: $font-family-base;
    @include typo($body-l-size, $body-l-weight, $body-l-spacing, $body-l-line);
}
:deep(.dp__inner_nav) {border: 1px solid $gray-200;}
:deep(.dp__calendar_header_item) { // 일자 (월/화/수/목/금)
    color: $gray-700;  
    font-family: $font-family-base;
    @include typo($title-xs-size, $title-xs-weight, $title-xs-spacing, $title-xs-line);
    @include flex-center;
}
:deep(.dp__calendar_header_separator) {display: none;} // 일자 아래 보더
:deep(.dp__range_between) {background-color: $gray-50;} // 선택된 range 날짜 배경 컬러
:deep(.dp__calendar_item) {width:32px; height: 32px;}
:deep(.dp__cell_inner) { // 날짜
    width: 32px;
    height: 32px;
    @include flex-center;
    padding: 10px;
    font-family: $font-family-base;
    color: $gray-700;
    @include typo($body-s-size, $body-s-weight, $body-s-spacing, $body-s-line);
}
:deep(.dp__cell_disabled) { // 선택 할 수 없는 날짜
    // pointer-events: none;
    cursor: not-allowed;
    color: $gray-100 !important;
}
:deep(.dp__range_start), // 선택 start날짜
:deep(.dp__range_end), // 선택 end 날짜
:deep(.dp__active_date) { // active 날짜
    color: $gray-00 !important;
    background-color: $primary-700 !important;
    border-radius: 50% !important;
    z-index: 1;
}
:deep(.dp__range_between) { // 기간에 해당하는 날짜
    background-color: $gray-50;
}
:deep(.dp__cell_offset) {color: $gray-200;} // 해당 하는 월에 포함되지 않는 날짜 컬러
:deep(.dp__action_row) {  // 캘렌더 아래 버튼 영역
    border-top: 1px solid $gray-200;
    justify-content: flex-end;
    gap: 4px;
}
:deep(.dp__action_row .btn) {width: 40px;}
:deep(.dp__selection_preview) {display: none;} // 선택 날짜 미리보기
:deep(.dp__action_button) { // 액션 버튼 공통
    font-family: $font-family-base;
    @include typo($title-xs-size, $title-xs-weight, $title-xs-spacing, $title-xs-line);
    border-radius: 4px;
}
:deep(.dp__action_cancel) { // 취소버튼
    background-color: $gray-00;
    border-color: $gray-300;
    color: $gray-700;
}
:deep(.dp__action_buttons .dp__action_select) { // 적용 버튼
    background-color: $gray-700;
}

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
</style>