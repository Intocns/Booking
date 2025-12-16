<!-- 일자 검색 필터 -->
<script setup>
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { ko } from 'date-fns/locale'
import { startOfDay, subDays, differenceInDays } from "date-fns";
import { ref, computed } from 'vue';

const dpRef = ref(null);
const today = startOfDay(new Date());
const dateRange = ref([subDays(today, 7), today]); // 최근 7일 기본

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

const activeQuick = computed(() => {
    const [start, end] = dateRange.value;
    if (!start || !end) return null;

    const diff = differenceInDays(end, start);

    if (diff === 0) return 'today';
    if (diff === 7) return '7';
    if (diff === 15) return '15';
    if (diff === 30) return '30';

    return null;
});

const formatRange = (dates) => {
    if (!dates || dates.length < 2) return "날짜 선택";

    const f = (d) =>
        `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
        d.getDate()
        ).padStart(2, "0")}`;

    return `${f(dates[0])} - ${f(dates[1])}`;
};

</script>

<template>
    <div class="search-filter__section search-filter__date">
        <!-- 캘린더 선택 -->
        <div class="search-filter__date-range">
            <span class="search-filter__label title-s">일자</span>
            <div class="search-filter__datepicker">
                <div class="fake-input" @click="dpRef.openMenu()">
                    {{ formatRange(dateRange) }}

                    <VueDatePicker
                        ref="dpRef"
                        v-model="dateRange"
                        range
                        :locale="ko"
                        :time-config="{ enableTimePicker: false }"
                        :hide-input="true"
                        :week-start="0"
                    >
                        <template #action-row="{ selectDate, closeMenu }">
                            <button class="btn btn--size-24 btn--black-outline"  @click="dpRef && dpRef.closeMenu()">취소</button>
                            <button class="btn btn--size-24 btn--black" @click="selectDate()">적용</button>
                        </template>
                    </VueDatePicker>
                </div>
            </div>
        </div>

        <!-- 빠른 선택 버튼 -->
        <div class="search-filter__date-buttons">
            <!-- 오늘 -->
            <div class="search-filter__date-button">
                <label 
                    for="date_today" 
                    class="btn btn--size-24 btn--black-outline"  
                    @click="setRange('today')"
                    :class="{ selected: activeQuick === 'today' }"
                >
                    <input type="radio" name="date_today" id="date_today">
                    <span>오늘</span>
                </label>
            </div>
            <!-- 7일 -->
            <div class="search-filter__date-button">
                <label 
                    for="date_week" 
                    class="btn btn--size-24 btn--black-outline" 
                    @click="setRange(7)"
                    :class="{ selected: activeQuick === '7' }"
                >
                    <input type="radio" name="date_week" id="date_week">
                    <span>7일</span>
                </label>
            </div>
            <!-- 15일 -->
            <div class="search-filter__date-button">
                <label 
                    for="date_half" 
                    class="btn btn--size-24 btn--black-outline" 
                    @click="setRange(15)"
                    :class="{ selected: activeQuick === '15' }"
                >
                    <input type="radio" name="date_half" id="date_half">
                    <span>15일</span>
                </label>
            </div>
            <!-- 1개월 -->
            <div class="search-filter__date-button">
                <label 
                    for="date_month" 
                    class="btn btn--size-24 btn--black-outline" 
                    @click="setRange(30)"
                    :class="{ selected: activeQuick === '30' }"
                >
                    <input type="radio" name="date_month" id="date_month">
                    <span>1개월</span>
                </label>
            </div>
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
    }
    
    // datepicker 라이브러리 커스텀 스타일
    :deep(.dp__main) { 
        position: absolute;
        top: 0;
        left: 0;
        height: 32px;
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

    .fake-input { // 선택한 일자 보여주는 영역
        position: relative;
        height: 32px;
        padding: 0 10px;
        border: 1px solid $gray-200;
        border-radius: 4px;
        display: flex;
        align-items: center;
        cursor: pointer;
        background-color: white;

        &:hover {
            border-color: $gray-400;
        }
    }
</style>