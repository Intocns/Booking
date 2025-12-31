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

import { ref, computed, onMounted, watch } from 'vue';
import { startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-vue";

// 스토어
import { useReservationStore } from '@/stores/reservationStore';

const reservationStore = useReservationStore()

// 캘린더 뷰 상태 관리 (초기값: 'Resources')
const currentView = ref('Resources');

// 일/주/월 탭버튼 클릭
const changeView = (view) => {
    currentView.value = view;
};

// 날짜형식을 dayPilot 형식에 맞게 변환
const safeDayPilotDate = computed(() => {
    return format(currentDate.value, 'yyyy-MM-dd');
});

// 임시 담당의 데이터 (해당 컬럼 id 와 스케쥴 데이터의 resource가 같아야함)
const staffResources = [
    { id: 'hrshin', name: '신혜린' },
    { id: 'IntoVet', name: '관리자' },
    { id: '', name: '미지정' },
    { id: 'choi', name: '최뽀삐' },
    { id: 'go', name: '고뽀삐' },
    { id: 'namgung', name: '남궁뽀삐' },
    { id: 'test1', name: 'test1' },
    // { id: 'test2', name: 'test2' },
];

// 선택 날짜 값 (초기값: 오늘 날짜)
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

// 검색 파라미터 생성 로직 (현재 뷰에 따라 시작/종료일 자동 계산)
const fetchParams = computed(() => {
    let start, end;

    if (currentView.value === 'Resources') {
        start = format(currentDate.value, 'yyyy-MM-dd');
        end = start;
    } else if (currentView.value === 'Week') {
        start = format(startOfWeek(currentDate.value, { weekStartsOn: 0 }), 'yyyy-MM-dd');
        end = format(endOfWeek(currentDate.value, { weekStartsOn: 0 }), 'yyyy-MM-dd');
    } else if (currentView.value === 'Month') {
        start = format(startOfMonth(currentDate.value), 'yyyy-MM-dd');
        end = format(endOfMonth(currentDate.value), 'yyyy-MM-dd');
    }

    return {
        doctorId: [], // 필요한 경우 여기에 담당의 필터 추가
        startDate: start,
        endDate: end,
    };
});

// 날짜나 뷰가 바뀔 때마다 실행
watch([currentDate, currentView], () => {
    reservationStore.getReserveSchedule(fetchParams.value);
}, { immediate: false }); // onMounted에서 초기 호출하므로 false

onMounted(() => {
    const params = {
        doctorId: [], // 담당의
        startDate: currentDate,
        endDate: currentDate,
    }
    reservationStore.getReserveSchedule(params)
})
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
                    :events="reservationStore.reserveScheduleList" 
                    :staffs="staffResources" 
                    :startDate="safeDayPilotDate"
                />

                <!-- 스케쥴 (주간) -->
                <ScheduleBoardWeekly 
                    v-else-if="currentView === 'Week'" 
                    :events="reservationStore.reserveScheduleList" 
                    :staffs="staffResources" 
                    :startDate="safeDayPilotDate" 
                />

                <!-- 스케쥴 (월간) -->
                <ScheduleBoardMonthly 
                    v-else-if="currentView === 'Month'" 
                    :events="reservationStore.reserveScheduleList" 
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