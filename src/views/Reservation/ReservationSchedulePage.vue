<!-- 예약 일정 확인 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
import TableLayout from '@/components/common/TableLayout.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import ScheduleBoard from '@/components/common/ScheduleBoard.vue';

import { ref } from 'vue';

// 캘린더 뷰 상태 관리 (초기값: 'Resources' 또는 'Week' 등)
// DayPilot 기준으로 'Resources', 'Week', 'Month' 중 하나를 사용합니다.
const currentView = ref('Resources');

const changeView = (view) => {
    currentView.value = view;
};
</script>

<template>
    <!-- 페이지 타이틀 -->
    <PageTitle
        title="예약 일정 확인"
        helper-text="차트 [예약 일정] 메뉴에 등록된 일정을 기준으로 조회됩니다."
    />

    <TableLayout>
        <template #filter>
            <!-- 일간/주간/월간 버튼 -->
            <div class="change-view-buttons">
                <button 
                    class="btn"
                    :class="{ 'btn__active': currentView === 'Resources' }"
                    @click="changeView('Resources')"
                >일</button>
                <button 
                    class="btn"
                    :class="{ 'btn__active': currentView === 'Week' }"
                    @click="changeView('Week')"
                >주</button>
                <button 
                    class="btn"
                    :class="{ 'btn__active': currentView === 'Month' }"
                    @click="changeView('Month')"
                >월</button>
            </div>
            <!-- TODO: 일자 버튼 수정 -->
            <FilterDate />
            <FilterSelect label="담당의" />
            <FilterSelect label="예약 상태" />
            <FilterSelect label="예약 경로" />
            <!--TODO: 초기화버튼 추가 -->
        </template>

        <template #table>
            <div class="contents-wrapper">
                <!-- 캘랜더 -->
                <ScheduleBoard :view-type="currentView" />
            </div>
        </template>
    </TableLayout>
</template>

<style lang="scss" scoped>
    .change-view-buttons {
        @include flex-center;
        padding: 4px;
        gap: 4px;

        border-radius: 5px;
        background-color: $gray-100;

        .btn {
            width:60px;
            height: 100%;
            padding: 0 8px;

            border-radius: 3px;
            background-color: $gray-100;
            color: $gray-400;
            @include typo($title-xs-size, $title-xs-weight, $title-xs-spacing, $title-xs-line);

            &__active {
                background-color: $gray-00;
                color: $gray-900;
            }
        }
    }
</style>