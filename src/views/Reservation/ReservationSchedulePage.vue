<!-- 예약 일정 확인 -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue'
import TableLayout from '@/components/common/TableLayout.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import ScheduleBoard from '@/components/common/ScheduleBoard.vue';
import ScheduleBoardWeekly from '@/components/common/ScheduleBoardWeekly.vue';
import ScheduleBoardMonthly from '@/components/common/ScheduleBoardMonthly.vue';
import Modal from '@/components/common/Modal.vue';
import ReserveInfo from '@/components/common/modal-content/ReserveInfo.vue';

import { ref, computed, onMounted, watch } from 'vue';
import { startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { RESERVE_ROUTE_OPTIONS, RESERVE_STATUS_OPTIONS } from '@/constants';
// 아이콘
import icReset from '@/assets/icons/ic_reset.svg'
// 스토어
import { useReservationStore } from '@/stores/reservationStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import { useModalStore } from '@/stores/modalStore';

const reservationStore = useReservationStore()
const hospitalStore = useHospitalStore();
const modalStore = useModalStore();

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

// 담당의 데이터 (해당 컬럼 id 와 스케쥴 데이터의 resource가 같아야함)
const staffResources = computed(() => {
    if (!hospitalStore.doctorList) return [];
    
    // 선택된 값이 없거나 '전체('')'가 포함되어 있으면 전체 표시
    if (selectedDoctorList.value.includes('all') || selectedDoctorList.value.length === 0) {
        return hospitalStore.doctorList.map(doc => ({ id: doc.id, name: doc.userName }));
    }
    
    // 필터링된 담당의만 표시
    return hospitalStore.doctorList
        .filter(doc => selectedDoctorList.value.includes(doc.id))
        .map(doc => ({ id: doc.id, name: doc.userName }));
});

// 검색 필터용 담당의 옵션 초기값
const selectedDoctorList = ref(['all']);
// 검색필터용 담당의 옵션
const doctorOptions = computed(() => {
    if (!hospitalStore.doctorList) return [];

    const list = hospitalStore.doctorList.map(doc => ({
        value: doc.id, // 담당의 ID
        label: doc.userName, // 담당의 이름
    }));

    return [
        { value: 'all', label: '전체' }, 
        ...list
    ];
})

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

// 예약 상태 초기값
const reservationStatus = ref(['all']);
// 예약 상태 옵션 정의
const reserveStatusOptions = RESERVE_STATUS_OPTIONS;

// 예약경로 초기값
const reservationChannel = ref(['all']);
// 예약경로 옵션 정의
const reservationChannelOptions = RESERVE_ROUTE_OPTIONS;

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
        status: reservationStatus.value, // 예약상태
        doctorId: selectedDoctorList.value, // 담당의
        startDate: start, 
        endDate: end,
        reRoute: reservationChannel.value, // 예약 경로
    };
});

// [수정] 날짜, 뷰, 담당의 변경 시마다 호출
watch([currentDate, currentView, selectedDoctorList, reservationStatus, reservationChannel], () => {
    reservationStore.getReserveSchedule(fetchParams.value);
}, { deep: true });

const searchClear = () => { //초기화 버튼
    currentView.value = 'Resources';
    currentDate.value = new Date();
    selectedDoctorList.value = ['all'];
    reservationStatus.value = ['all'];
    reservationChannel.value = ['all'];
};

onMounted(async() => {
    // 담당의 리스트 불러오기
    await hospitalStore.getDoctorList();

    // reservationStore.getReserveSchedule(fetchParams.value);
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
            <FilterSelect 
                label="담당의" 
                :options="doctorOptions" 
                v-model="selectedDoctorList" 
            />
            <FilterSelect 
                v-if="currentView != 'Month'" 
                label="예약 상태"
                :options="reserveStatusOptions"
                v-model="reservationStatus"
            />
            <FilterSelect 
                v-if="currentView != 'Month'" 
                label="예약 경로" 
                :options="reservationChannelOptions" 
                v-model="reservationChannel" 
            />
            <button class="btn btn--size-32 btn--black-outline" @click="searchClear()" style="width: 40px;">
                <img :src="icReset" alt="초기화아이콘">
            </button>
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

    <!-- 예약 정보 안내 모달 -->
    <Modal
        v-if="modalStore.reserveInfoModal.isVisible"
        size="l"
        title="고객 예약 정보"
        :modalState="modalStore.reserveInfoModal"
    >
        <ReserveInfo />
    </Modal>
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