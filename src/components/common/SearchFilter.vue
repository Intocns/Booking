<!-- 검색필터 컴포넌트 -->
<script setup>
import CustomSelect from './CustomSelect.vue';
    
import { ref, computed } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { ko } from 'date-fns/locale'
import { startOfDay, subDays, differenceInDays } from "date-fns";

import icSearch from '@/assets/icons/ic_search.svg';
import icClear from '@/assets/icons/ic_clear.svg';

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


let keyword = ref("");

// 담당의 예시
const doctors = ['담당의1', '담당의2', '담당의3']
const selectedDoctors = ref([])

</script>

<template>
    <div class="search-filter-wrapper">
        <div class="search-filter">

            <!-- 일자 필터 -->
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

            <!-- 예약상태 -->
            <div class="search-filter__section">
                <span class="search-filter__label title-s">예약상태</span>
                <CustomSelect
                    v-model="selectedDoctors"
                    :options="doctors"
                    placeholder="전체"
                />
            </div>

            <!-- 담당의 -->
            <div class="search-filter__section">
                <span class="search-filter__label title-s">담당의</span>
                <CustomSelect
                    v-model="selectedDoctors"
                    :options="doctors"
                    placeholder="전체"
                />
            </div>

            <!-- 검색 -->
            <div class="search-filter__section">
                <span class="search-filter__label title-s">검색</span>
                <div class="search-filter__control search-filter__search_text_box">
                    <input 
                        type="text"
                        v-model="keyword"
                        name="" 
                        id="" 
                        class="body-m" 
                        @input="keyword = $event.target.value"
                        placeholder="고객명, 동물명, 전화번호 검색"
                    >

                    <!-- 아이콘 -->
                    <span class="search-filter__icons">
                        <!-- clear icon: 값 있을 때만 표시 -->
                        <img 
                            :src="icClear" 
                            alt="입력 삭제 아이콘"
                            class="clear-icon"
                            :class="{ visible: keyword.length > 0 }"
                            @click="keyword = ''"
                        >

                        <img :src="icSearch" alt="검색 아이콘">
                    </span>
                </div>
            </div>

            <!-- 초기화 버튼 -->
            <div class="search-filter__actions">
                <button class="btn btn--size-32 btn--blue">초기화</button>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .search-filter-wrapper {
        display: flex;
        padding: 20px 16px;
        align-items: flex-start;
        gap: 10px;
        border-radius: 8px;
        border: 1px solid $gray-200;
        background-color: $gray-00;
        width: 100%;
    }

    .search-filter {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;

        &__section {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        &__date-range {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        &__datepicker {
            width: 240px;
            height: 32px;
        }

        &__date {
            &-buttons {
                display: flex;
                gap: 4px;

                input[type="radio"] {display: none;}
            }
        }

        &__icons {
            width: 36px;
            display: flex;
            justify-content: flex-end;
            gap: 4px;

            .clear-icon {
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
            }
            .clear-icon.visible {
                opacity: 1;
                visibility: visible;
            }
        }
    }

    // 검색 인풋
    .search-filter__search_text_box {
        display: flex;
        // width: 240px;
        flex: 1;
        height: 32px;
        padding: 0 10px;
        align-items: center;
        gap: 10px;

        border: 1px solid $gray-200;
        border-radius: 4px;
        background-color: $gray-00;
        transition: all .2s ease;

        &:focus-within {
            border-color: $gray-900;
        }

        /* 인풋에 값이 있을 때 */
        &.filled {
            border-color: $gray-900;
        }

        /* disabled */
        &.disabled {
            background-color: $gray-50;
            border-color: $gray-200;
            cursor: not-allowed;

            input {
                background: transparent;
                cursor: not-allowed;
            }

            img {opacity: 0.6;}
        }

        input {
            border: none;
            flex: 1;
            // width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            &:focus { outline: none; }
            &::placeholder {
                color: $gray-400;
            }
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
    :deep(.dp--clear-btn) {height: 100%}
    :deep(.dp__input_icon) {display: none;}
    :deep(.dp__arrow_top ) {display: none;}
    :deep(.dp--menu-wrapper),
    :deep(.dp__menu),
    :deep(.dp__menu > div) {width:240px; min-width: 240px;}
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
    :deep(.dp__range_start), // 선택 start날짜
    :deep(.dp__range_end), // 선택 end 날짜
    :deep(.dp__active_date) { // active 날짜
        color: $gray-00 !important;
        background-color: $primary-700 !important;
        border-radius: 50%;
        z-index: 1;
    }
    :deep(.dp__cell_offset ) {color: $gray-200;} // 해당 하는 월에 포함되지 않는 날짜 컬러
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