<!-- 예약 일정 확인 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
import TableLayout from '@/components/common/TableLayout.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import ScheduleBoard from '@/components/common/ScheduleBoard.vue';
import ScheduleBoardWeekly from '@/components/common/ScheduleBoardWeekly.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';
import ScheduleBoardMonthly from '@/components/common/ScheduleBoardMonthly.vue';

import { ref, computed } from 'vue';
import { startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-vue";

// 캘린더 뷰 상태 관리 (초기값: 'Resources' 또는 'Week' 등)
// DayPilot 기준으로 'Resources', 'Week', 'Month' 중 하나를 사용합니다.
const currentView = ref('Resources');

const changeView = (view) => {
    currentView.value = view;
};

const safeDayPilotDate = computed(() => {
    return format(currentDate.value, 'yyyy-MM-dd');
});

// 임시데이터 (해당 컬럼 id 와 스케쥴 데이터의 resource가 같아야함)
const staffResources = [
    { id: 'kim', name: '김뽀삐' },
    { id: 'lee', name: '이뽀삐' },
    { id: 'park', name: '박뽀삐' },
    { id: 'choi', name: '최뽀삐' },
    { id: 'go', name: '고뽀삐' },
    { id: 'namgung', name: '남궁뽀삐' },
];

// 임시 데이터
const events = ref([
    { 
        id: "1", 
        resource: "kim", 
        start: "2025-12-17T10:00:00", 
        end: "2025-12-17T11:30:00", 
        name: "민혜린",
        patient: '초코',
        product_name: '건강검진',
        memo: '건강검진으로 처음 방문, 정기 건강검진 추천', 
        status: 'hold', 
        path: 'intolink',

    },
    { 
        id: "2", 
        resource: "lee", 
        start: "2025-12-17T14:00:00", 
        end: "2025-12-17T16:00:00", 
        name: '개인일정',
        patient: '',
        product_name: '', 
        memo: '',
        status: 'personal', 
        path: ''
    },
    { 
        id: "3", 
        resource: "kim", 
        start: "2025-12-17T10:00:00", 
        end: "2025-12-17T10:30:00", 
        name: '박길동',
        patient: '두부',
        product_name: '간단 건강검진', 
        memo: '두부 정기검진 2회차, 보호자 개인 일정 사유로 취소됨',
        status: 'canceled', 
        path: 'intopet'
    },
    { 
        id: "4", 
        resource: "lee", 
        start: "2025-12-17T16:00:00", 
        end: "2025-12-17T17:00:00", 
        name: '개인일정',
        patient: '',
        product_name: '', 
        memo: '',
        status: 'personal', 
        path: ''
    },
    { 
        id: "5", 
        resource: "lee", 
        start: "2025-12-17T09:00:00", 
        end: "2025-12-17T10:00:00", 
        name: '이길동',
        patient: '먼지',
        product_name: '일반 진료', 
        memo: '구토로 내원함',
        status: 'confirm', 
        path: ''
    },
    { 
        id: "6", 
        resource: "lee", 
        start: "2025-12-17T09:00:00", 
        end: "2025-12-17T10:00:00", 
        name: '김길동',
        patient: '별이',
        product_name: '백신 접종', 
        memo: '3차 접종',
        status: 'hold', 
        path: ''
    },
]);

const currentDate = ref(new Date());

const datePickerValue = computed({
    get: () => {
        // 주간/월간 뷰일 때는 FilterDate가 [시작, 끝] 배열을 원하므로 가공해서 줌
        if (currentView.value === 'Week') {
        return [startOfWeek(currentDate.value, { weekStartsOn: 0 }), endOfWeek(currentDate.value, { weekStartsOn: 0 })];
        } else if (currentView.value === 'Month') {
        return [startOfMonth(currentDate.value), endOfMonth(currentDate.value)];
        }
        // 일간 뷰일 때는 그냥 날짜 하나
        return currentDate.value;
    },
    set: (newValue) => {
        //newValue가 배열 [Date, Date]로 들어오든 단일 Date로 들어오든 
        //기준 날짜' 하나만 뽑음
        if (Array.isArray(newValue)) {
            currentDate.value = newValue[0]; 
        } else {
            currentDate.value = newValue;
        }
    }
});
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

            <FilterDate 
                button-type="arrow" 
                v-model="datePickerValue" 
                :is-range="currentView === 'Resources' ? false : true"
                :default-select="currentView === 'Resources' ? 'today' : (currentView === 'Week' ? '7' : '30')"
            />
            <FilterSelect label="담당의" />
            <FilterSelect v-if="currentView != 'Month'" label="예약 상태" />
            <FilterSelect v-if="currentView != 'Month'" label="예약 경로" />
            <!--TODO: 초기화버튼 추가 -->
        </template>

        <template #table>
            <div class="contents-wrapper">
                <!-- 스케쥴 (일간) -->
                <ScheduleBoard 
                    v-if="currentView === 'Resources'" 
                    :view-type="currentView"
                    :events="events" 
                    :staffs="staffResources" 
                    :startDate="safeDayPilotDate"
                />

                <!-- 스케쥴 (주간) -->
                <ScheduleBoardWeekly 
                    v-else-if="currentView === 'Week'" 
                    :events="events" 
                    :staffs="staffResources" 
                    :startDate="safeDayPilotDate" 
                />

                <!-- 스케쥴 (월간) -->
                <ScheduleBoardMonthly 
                    v-else-if="currentView === 'Month'" 
                    :events="events" 
                    :staffs="staffResources" 
                    :startDate="safeDayPilotDate" 
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