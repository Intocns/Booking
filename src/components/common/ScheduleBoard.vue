<script setup>
import { DayPilotCalendar } from "@daypilot/daypilot-lite-vue";
import { ref, onMounted, watch } from 'vue';
import { api } from "@/api/axios";

// ---------------------------------------------
// 1. Props 정의 (상위 컴포넌트로부터 뷰 타입을 받음)
const props = defineProps({
    viewType: {
        type: String,
        default: 'Resources' // 기본값 설정
    }
});
// ---------------------------------------------

// 캘린더 인스턴스, 현재 날짜, 선택된 스케줄
const calendarRef = ref(null);
const currentDate = ref(new Date());
const selectedSchedule = ref(null);
const currentView = ref('Resources'); // 초기 뷰 설정 (직원별)

// 1. 직원 (리소스) 데이터
const columns = ref([]);
const staffResources = [
    { id: 'kim', name: '김뽀삐' },
    { id: 'lee', name: '이뽀삐' },
    { id: 'park', name: '박뽀삐' },
    { id: 'choi', name: '최뽀삐' },
    { id: 'go', name: '고뽀삐' },
    { id: 'namgung', name: '남궁뽀삐' },
];
const getResourceName = (resourceId) => staffResources.find(r => r.id === resourceId)?.name || '알 수 없음';


// 2. 스케줄 (이벤트) 데이터
const events = ref([
    { id: "1", resource: "kim", start: "2025-12-17T10:00:00", end: "2025-12-17T11:30:00", text: "미팅 A"},
    { id: "2", resource: "lee", start: "2025-12-17T14:00:00", end: "2025-12-17T16:00:00", text: "교육",},
    { id: "3", resource: "kim", start: "2025-12-18T10:00:00", end: "2025-12-18T12:00:00", text: "팀 회의 (목요일)",},
]);

// 3. 캘린더 구성 옵션
const config = ref({
    events: events.value, 
    startDate: currentDate.value.toISOString().split('T')[0],
    locale: "ko-kr",
    timeFormat: "Clock24Hours",
    hourNameShort: false,
    // heightSpec: "Full",
    showNonBusiness: false,
    
    // DayPilot Lite의 Events
    // 4, 6번 요구사항: 스케줄 클릭 이벤트 처리
    onEventClick: (args) => {
        // 선택된 스케줄을 저장하여 상세 영역에 표시 (6번)
        selectedSchedule.value = args.e.data; 
        // 모달창 노출 함수 호출 (4번) (실제 모달 로직 필요)
        // showModal(args.e.data);
    },

    // 5번 요구사항: 스케줄 블록 상세 내용 커스터마이징
    onBeforeEventRender: (args) => {
        console.log("DayPilot Event Render Args:", args);
        const resourceId = args.data?.resource; 
        const eventText = args.data?.text;

        const resourceName = getResourceName(resourceId);
        
        args.data.html = `
            <div>
                <strong>${eventText}</strong>
                <div style="font-size: 0.8em; color: #555;">(${resourceName})</div>
            </div>
        `;
    },
    
    // 리소스 뷰에만 적용될 설정
    cellDuration: 60, // 시간 단위 (분)
    cellHeight: 80, 
    businessBeginsHour: 9,                   
    businessEndsHour: 19,
});

// ---------------------------------------------
// 2. 뷰 타입 변경 감지 및 캘린더 업데이트
watch(() => props.viewType, (newViewType) => {
    if (calendarRef.value && calendarRef.value.control) {
        calendarRef.value.control.update({
            viewType: newViewType,
            // 리소스 뷰가 아니면 columns를 null로 설정하여 기본 요일 헤더를 사용하도록 합니다.
            columns: newViewType === 'Resources' ? columns.value : null, 
        });
    }
});
// ---------------------------------------------

// // 뷰 변경 함수 (1번 요구사항)
// const changeView = (view) => {
//     currentView.value = view;
//     // 뷰 변경 후 DayPilot 캘린더에 새 설정을 적용
//     calendarRef.value.control.update({
//         viewType: view,
//     });
// };

// 날짜 이동 함수 (2번 요구사항)
const navigateCalendar = (direction) => {
    const dp = calendarRef.value.control;
    if (direction === 'prev') {
        dp.command(currentView.value === 'Month' ? 'navprev' : 'previous');
    } else if (direction === 'next') {
        dp.command(currentView.value === 'Month' ? 'navnext' : 'next');
    } else if (direction === 'today') {
        dp.command('today');
    }
    // 날짜 이동 후 현재 날짜 업데이트
    currentDate.value = dp.startDate.toDate();
};

// 모달 노출 함수 (4번 요구사항 - 모달 컴포넌트가 있다고 가정)
const showModal = (schedule) => {
    console.log("모달 창 노출:", schedule);
    alert(`예약 정보 모달: ${schedule.text}`);
};


onMounted(() => {
    columns.value = staffResources; // 직원 데이터 로드

    const param = {
        // cocode: 2592,
        // status: '',
        doctorId: '0',
        // keyword: '',
        startDate: '2024-11-01',
        endDate: '2024-11-05',
        // reRoute: 0
    }
    const response = api.post('/api/2592/reserve/sche', param);
    console.log(response)
});
</script>

<template>
    <div class="schedule-wrapper">
        <!-- <div class="calendar-controls">
            <button @click="navigateCalendar('prev')"> &lt; </button>
            <button @click="navigateCalendar('today')"> 오늘 </button>
            <button @click="navigateCalendar('next')"> &gt; </button>
            
            <span class="current-date">{{ currentDate.toDateString() }}</span>
        </div> -->

        <DayPilotCalendar 
            id="dp-schedule-calendar"
            ref="calendarRef"
            :columns="viewType === 'Resources' ? columns : null"
            :config="config"
            :viewType="viewType"
        >
        </DayPilotCalendar>

        <!-- <div v-if="selectedSchedule" class="schedule-details">
            <h3>선택된 스케줄 정보</h3>
            <p><strong>직원:</strong> {{ getResourceName(selectedSchedule.resource) }}</p>
            <p><strong>내용:</strong> {{ selectedSchedule.text }}</p>
            <p><strong>시간:</strong> {{ new Date(selectedSchedule.start).toLocaleTimeString() }} ~ {{ new Date(selectedSchedule.end).toLocaleTimeString() }}</p>
            <button @click="showModal(selectedSchedule)">예약 정보 모달 열기</button>
        </div> -->
    </div>
</template>

<style lang="scss" scoped>
    .calendar-container {
        width: 100%;
    }
    .schedule-wrapper {
        height: 100%;
    }
    :deep(.calendar_default_main) {
        border-color: $gray-200;
        font-family: $font-family-base;
    }

    :deep(.calendar_default_cornerright_inner), 
    :deep(.calendar_default_corner_inner), 
    :deep(.calendar_default_colheader_inner), 
    :deep(.calendar_default_alldayheader_inner) {
        background: $gray-100;
        border-color: $gray-200;
        color: $gray-700;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
    }
    :deep(.calendar_default_rowheader_inner) {
        @include flex-center;

        background: $gray-00;
        border-color: $gray-200;
        color: $gray-700;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
    }
    :deep(.calendar_default_rowheader_minutes) {
        font-size: inherit;
        vertical-align:baseline;
        padding: 0;
    }
    :deep(.calendar_default_rowheader_minutes::before) {
        content: ':';
        display: inline-block;
        transform: translateY(-1px);
    }

    :deep(.custom-schedule-item) {
        // backColor가 DayPilot 인라인 스타일로 적용되므로,
        // 여기서는 테두리 등 추가적인 꾸미기만 합니다.
        border: 1px solid #C0C0E0 !important; 
        border-radius: 4px;
        box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1); 
    }
</style>