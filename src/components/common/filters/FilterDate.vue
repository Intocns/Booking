<!-- 일자 검색 필터 -->
<script setup>
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { ko } from 'date-fns/locale'
import { startOfMonth, startOfDay, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, addDays, subWeeks, subDays, differenceInDays  } from "date-fns";
import { ref, computed, watch, onMounted } from 'vue';

import CustomDatePicker from '@/components/common/CustomDatePicker.vue'

import icArrowLeft from '@/assets/icons/ic_arrow_left.svg'
import icArrowRight from '@/assets/icons/ic_arrow_right.svg'
import icInformationB from '@/assets/icons/ic_infomation_b.svg'

const props = defineProps({
    modelValue: {
        type: [Date, Array, String],
        required: true
    },
    buttonType: { // 해당 타입에 따라 빠른 선택 버튼 보기 달라짐
        type: String,
        default: 'quick' // 'quick'(오늘, 7일 등 버튼) | 'arrow'( < > 오늘 화살표)
    },
    isRange: { // 데이터 타입 (단일 선택인가, 기간 선택인가?)
        type: Boolean,
        default: true // 기본값이 기간 선택
    },
    // 기본으로 선택될 버튼 설정 (예: 'today', '7', '30')
    defaultSelect: { type: String, default: '7' },
    hasTooltip: {type: Boolean, default: false}, // 라벨 옆에 툴팁 표시 해줌
    tooltipText: {type: String, default: ''}, // 툴팁 텍스트
    useLimit: { type: Boolean, default: false }, // 날짜 선택 기간 제한을 둘지 결정
    limitMonths: { type: Number, default: 3 }, // 몇 개월 전까지 제한할지 결정
});

// 부모와 날짜를 동기화하기 위한 emit
const emit = defineEmits(['update:modelValue']);

// 부모의 v-model(modelValue)과 직접 연결되는 계산된 속성
const dateRange = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});
const today = startOfDay(new Date());
// dateRange.value = [today, today]; //최초

// 빠른 선택 로직
const setRange = (days) => {
    let start, end;
    if (days === 'today') {
        start = today;
        end = today;
    } else {
        const d = days === '30' ? 30 : Number(days); // 1개월 처리
        start = today;
        end = addDays(today, d);
    }

    // isRange 값에 따라 배열 혹은 단일 객체로 전송
    if (props.isRange) {
        dateRange.value = [start, end];
    } else {
        dateRange.value = start; // 단일 선택일 경우 시작일 기준
    }
};

// 네비게이션 로직 (<, >, 오늘)
const navigateDate = (direction) => {
    // 기준 날짜 가져오기 (배열이면 첫 번째 날 기준)
    const current = Array.isArray(dateRange.value) ? dateRange.value[0] : dateRange.value;

    let baseDate = current ? new Date(current) : new Date();
    
    let start, end;

    if (direction === 'today') {
        baseDate = new Date(); // 오늘 기준으로 초기화
    }

    // 월간 뷰일 때
    if (props.defaultSelect === '30') {
        // addMonths는 연도가 바뀌는 것을 자동 계산
        const targetMonth = direction === 'prev' ? subMonths(baseDate, 1) : 
                            direction === 'next' ? addMonths(baseDate, 1) : new Date();
        
        // 연도가 바뀌어도 안전하도록 해당 월의 1일과 말일을 다시 계산
        start = startOfMonth(targetMonth);
        end = endOfMonth(targetMonth);
    } 
    // 주간 뷰일 때
    else if (props.defaultSelect === '7') {
        const targetWeek = direction === 'prev' ? subWeeks(baseDate, 1) : 
                            direction === 'next' ? addWeeks(baseDate, 1) : new Date();
        
        start = startOfWeek(targetWeek, { weekStartsOn: 0 }); // 일요일
        end = endOfWeek(targetWeek, { weekStartsOn: 0 });   // 토요일
    } 
    // 일간 뷰 
    else {
        const targetDate = direction === 'prev' ? subDays(baseDate, 1) : 
                            direction === 'next' ? addDays(baseDate, 1) : new Date();
        start = startOfDay(targetDate);
        end = start;
    }

    // 최종 값을 부모에게 전달
    if (props.isRange) {
        dateRange.value = [start, end];
    } else {
        dateRange.value = start;
    }
};


const activeQuick = computed(() => {
    if (props.buttonType !== 'quick' || !Array.isArray(dateRange.value)) return null;
    
    const [start, end] = dateRange.value;
    if (!start || !end) return null;
    
    // 종료일이 오늘인지 확인 (오늘 기준 빠른 선택일 경우)
    const isStartToday = startOfDay(new Date(start)).getTime() === today.getTime();
    if (!isStartToday) return null;

    const diff = differenceInDays(startOfDay(new Date(end)), today);
    if (diff === 0) return 'today';
    if (diff === 7) return '7';
    if (diff === 15) return '15';
    if (diff === 30) return '30';
    return null;
});

onMounted(() => {
    // 마운트 시 defaultSelect 값에 따라 범위 설정
    // 기본값은 7일
    if (props.defaultSelect) {
        setRange(props.defaultSelect);
    }
})
</script>

<template>
    <div class="search-filter__section search-filter__date">
        <!-- 캘린더 선택 -->
        <div class="search-filter__date-range">
            <span class="search-filter__label title-s">일자</span>

            <div v-if="hasTooltip" class="helper">
                <img :src="icInformationB" alt="안내아이콘" class="helper__icon">
                <div class="tooltip-content">
                    {{ tooltipText }}
                </div>
            </div>

            <div class="search-filter__datepicker">
                <CustomDatePicker v-model="dateRange" :range="props.isRange" :use-limit="props.useLimit" :limit-months="props.limitMonths" />
            </div>
        </div>

        <!-- 빠른 선택 버튼 (오늘/7일/15일/1개월) -->
        <div v-if="props.buttonType === 'quick'" class="search-filter__date-buttons">
            <div class="search-filter__date-button" v-for="opt in [['today', '오늘'], [7, '7일'], [15, '15일'], [30, '1개월']]" :key="opt[0]">
                <label :class="['btn btn--size-24 btn--black-outline', { selected: activeQuick === String(opt[0]) }]" @click="setRange(opt[0])">
                    <span>{{ opt[1] }}</span>
                </label>
            </div>
        </div>

        <!-- 화살표 버튼 (<,>, 오늘) -->
        <div v-else-if="props.buttonType === 'arrow'" class="search-filter__date-nav">
            <button type="button" class="btn--size-24 btn--black-outline" @click="navigateDate('prev')">
                <img :src="icArrowLeft">
            </button>
            <button type="button" class="btn--size-24 btn--black-outline" @click="navigateDate('next')">
                <img :src="icArrowRight">
            </button>
            <button type="button" class="btn--size-24 btn--black-outline" @click="navigateDate('today')">오늘</button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .search-filter__section {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .search-filter__date-range {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .search-filter__datepicker {
        width: 240px;
        height: 32px;
    }

    .search-filter__date {
        &-buttons {
            display: flex;
            gap: 4px;

            input[type="radio"] {display: none;}
        }

        &-nav {
            display: flex;
            gap: 4px;
        }
    }

    :deep(.helper) {
        z-index: 100000;
    }
    :deep(.tooltip-content) {
        left: 5px;
        top: 27px;
        z-index: 100000;
    }
</style>