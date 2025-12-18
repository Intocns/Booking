<!-- 일자 검색 필터 -->
<script setup>
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { ko } from 'date-fns/locale'
import { startOfDay, subDays, differenceInDays, addMonths, subMonths } from "date-fns";
import { ref, computed, watch } from 'vue';

import CustomDatePicker from '@/components/common/CustomDatePicker.vue'

import icArrowLeft from '@/assets/icons/ic_arrow_left.svg'
import icArrowRight from '@/assets/icons/ic_arrow_right.svg'

const props = defineProps({
    modelValue: {
        type: [Date, Array, String],
        required: true
    },
    type: { // 해당 타입에 따라 빠른 선택 버튼 보기 달라짐
        type: String,
        default: 'range' // 'range' | 'nav' 'range'(기본/기간형) 또는 'nav'(네비게이션형)
    }
});

// 부모와 날짜를 동기화하기 위한 emit
const emit = defineEmits(['update:modelValue']);

// 부모의 v-model(modelValue)과 직접 연결되는 계산된 속성
const dateRange = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

// 빠른 선택 로직
const setRange = (days) => {
    const today = startOfDay(new Date());

    if (days === 'today') {
        dateRange.value = [today, today];
        return;
    }

    if (days === 30) { // 1개월
        dateRange.value = [subDays(today, 30), today];
        return;
    }

    dateRange.value = [subDays(today, days), today];
};

// 네비게이션 로직 (<, >, 오늘)
const navigateDate = (direction) => {
    // 현재 값이 배열이면 첫 번째 값 사용, 아니면 값 그대로 사용
    const current = Array.isArray(dateRange.value) ? dateRange.value[0] : dateRange.value;
    const baseDate = current ? new Date(current) : new Date();
    
    if (direction === 'prev') {
        dateRange.value = subMonths(baseDate, 1);
    } else if (direction === 'next') {
        dateRange.value = addMonths(baseDate, 1);
    } else {
        dateRange.value = startOfDay(new Date());
    }
};


const activeQuick = computed(() => {
    if (props.type !== 'range' || !Array.isArray(dateRange.value)) return null;
    const [start, end] = dateRange.value;
    if (!start || !end) return null;
    const diff = differenceInDays(new Date(end), new Date(start));
    
    if (diff === 0) return 'today';
    if (diff === 7) return '7';
    if (diff === 15) return '15';
    if (diff === 30) return '30';
    return null;
});

</script>

<template>
    <div class="search-filter__section search-filter__date">
        <!-- 캘린더 선택 -->
        <div class="search-filter__date-range">
            <span class="search-filter__label title-s">일자</span>
            <div class="search-filter__datepicker">
                <CustomDatePicker v-model="dateRange" :range="props.type === 'range'" />
            </div>
        </div>

        <!-- 빠른 선택 버튼 (오늘/7일/15일/1개월) -->
        <div v-if="props.type === 'range'" class="search-filter__date-buttons">
            <div class="search-filter__date-button" v-for="opt in [['today', '오늘'], [7, '7일'], [15, '15일'], [30, '1개월']]" :key="opt[0]">
                <label :class="['btn btn--size-24 btn--black-outline', { selected: activeQuick === String(opt[0]) }]" @click="setRange(opt[0])">
                    <span>{{ opt[1] }}</span>
                </label>
            </div>
        </div>

        <!-- 빠른 선택 버튼 (<,>, 오늘) -->
        <div v-else-if="props.type === 'nav'" class="search-filter__date-nav">
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
</style>