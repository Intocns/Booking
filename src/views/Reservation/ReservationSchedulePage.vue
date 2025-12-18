<!-- 예약 일정 확인 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
import TableLayout from '@/components/common/TableLayout.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import ScheduleBoard from '@/components/common/ScheduleBoard.vue';
import ScheduleBoardWeekly from '@/components/common/ScheduleBoardWeekly.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';

import { ref } from 'vue';

// 캘린더 뷰 상태 관리 (초기값: 'Resources' 또는 'Week' 등)
// DayPilot 기준으로 'Resources', 'Week', 'Month' 중 하나를 사용합니다.
const currentView = ref('Resources');

const changeView = (view) => {
    currentView.value = view;
};

const staffResources = [
    { id: 'kim', name: '김뽀삐' },
    { id: 'lee', name: '이뽀삐' },
    { id: 'park', name: '박뽀삐' },
    { id: 'choi', name: '최뽀삐' },
    { id: 'go', name: '고뽀삐' },
    { id: 'namgung', name: '남궁뽀삐' },
];

const events = ref([
    { id: "1", resource: "kim", start: "2025-12-17T10:00:00", end: "2025-12-17T11:30:00", text: "미팅 A", status: 'hold', path: 'intolink'},
    { id: "2", resource: "lee", start: "2025-12-17T14:00:00", end: "2025-12-17T16:00:00", text: "개인일정1", status: 'personal', path: ''},
    { id: "3", resource: "kim", start: "2025-12-17T10:00:00", end: "2025-12-17T10:30:00", text: "팀 회의 (목요일)", status: 'canceled', path: 'intopet'},
    { id: "4", resource: "lee", start: "2025-12-17T16:00:00", end: "2025-12-17T17:00:00", text: "개인일정2", status: 'personal', path: ''},
    { id: "5", resource: "lee", start: "2025-12-17T09:00:00", end: "2025-12-17T10:00:00", text: "건강검진", status: 'confirm', path: ''},
    { id: "6", resource: "lee", start: "2025-12-17T09:00:00", end: "2025-12-17T10:00:00", text: "건강검진", status: 'hold', path: ''},
]);

const currentDate = ref(new Date());
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
            <FilterDate type="nav" v-model="currentDate" />
            <FilterSelect label="담당의" />
            <FilterSelect label="예약 상태" />
            <FilterSelect label="예약 경로" />
            <!--TODO: 초기화버튼 추가 -->
        </template>

        <template #table>
            <div class="contents-wrapper">
                <!-- 스케쥴 (일간/월간) -->
                <ScheduleBoard 
                    v-if="currentView === 'Resources'" 
                    :view-type="currentView"
                    :events="events" 
                    :staffs="staffResources" 
                    :startDate="currentDate" 
                />

                <!-- 스케쥴 (주간) -->
                <ScheduleBoardWeekly 
                    v-else-if="currentView === 'Week'" 
                    :events="events" 
                    :staffs="staffResources" 
                    :startDate="currentDate" 
                />
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