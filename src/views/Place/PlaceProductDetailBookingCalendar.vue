<!-- 상품"수정" > 예약 정보 -->
<script setup>
import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-vue";
import { ref, reactive, onMounted, computed } from 'vue';
// 아이콘
import icArrowRight from '@/assets/icons/ic_arrow_right_blue.svg'
// 컴포넌트
import ModalSimple from "@/components/common/ModalSimple.vue";
import CustomSingleSelect from "@/components/common/CustomSingleSelect.vue";
// 스토어
import { useModalStore } from "@/stores/modalStore";
import TimeSelect from "@/components/common/TimeSelect.vue";

const modalStore = useModalStore();

// 캘린더 데이터 (예시 데이터)
const events = ref([
    {
        id: 1,
        start: "2026-01-07T10:00:00",
        end: "2026-01-07T10:30:00",
        text: "",
        backColor: "#E3F2FD",
        cssClass: "event-open",
    },
    {
        id: 2,
        start: "2026-01-07T10:30:00",
        end: "2026-01-07T11:00:00",
        text: "",
        backColor: "#E3F2FD",
        cssClass: "event-open",
    },
    {
        id: 3,
        start: "2026-01-07T11:00:00",
        end: "2026-01-07T11:30:00",
        text: "",
        backColor: "#E3F2FD",
        cssClass: "event-open",
    },
    {
        id: 4,
        start: "2026-01-07T11:30:00",
        end: "2026-01-07T12:00:00",
        text: "",
        backColor: "#E3F2FD",
        cssClass: "event-open",
    },
    {
        id: 5,
        start: "2026-01-07T12:00:00",
        end: "2026-01-07T12:30:00",
        text: "",
        backColor: "#F5F5FA",
        cssClass: "event-closed",
    },
    {
        id: 6,
        start: "2026-01-07T12:30:00",
        end: "2026-01-07T13:00:00",
        text: "",
        backColor: "#F5F5FA",
        cssClass: "event-closed",
    },
    {
        id: 7,
        start: "2026-01-07T13:00:00",
        end: "2026-01-07T13:30:00",
        text: "",
        backColor: "#E3F2FD",
        cssClass: "event-open",
    },
    {
        id: 8,
        start: "2026-01-07T13:30:00",
        end: "2026-01-07T14:00:00",
        text: "",
        backColor: "#E3F2FD",
        cssClass: "event-open",
    },
]);

// 요일옵션 데이터 (임시)
const daysOptions = [
    { label: '월', value: 'mon' },
    { label: '화', value: 'tue' }, 
    { label: '수', value: 'wed' },
    { label: '목', value: 'thu' }, 
    { label: '금', value: 'fri' }, 
    { label: '토', value: 'sat' }, 
    { label: '일', value: 'sun' }
];

// 예약 가능 동물 수 (임시 1~10)
const animalCountOptions = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

// 상태관리
const selectedEvent = ref(null);

// 이전 주로 이동
const prevWeek = () => {
    // 현재 시작일 - 7
    const currentStart = new DayPilot.Date(calendarConfig.startDate);
    calendarConfig.startDate = currentStart.addDays(-7);
};

// 다음 주로 이동
const nextWeek = () => {
    // 현재 시작일 + 7
    const currentStart = new DayPilot.Date(calendarConfig.startDate);
    calendarConfig.startDate = currentStart.addDays(7);
};

// 현재 표시되는 날짜 범위 텍스트
const dateRangeText = computed(() => {
    if (!calendarConfig.startDate) return "";
    
    const start = new DayPilot.Date(calendarConfig.startDate);
    // 주간 뷰(7일)이므로 시작일 + 6일이 종료일
    const end = start.addDays(6);
    
    // 형식: 2026.01.05 - 01.11
    return `${start.toString("yyyy.MM.dd")} - ${end.toString("MM.dd")}`;
});

// 이벤트(예약 정보) 클릭 시 호출
const handleEventClick = (args) => {
    const eventData = args.e.data;
    // selectedEvent는 모달 내부에서 수정할 '복사본' 역할을 합니다.
    selectedEvent.value = JSON.parse(JSON.stringify(eventData)); 
    
    // 모달 스토어의 openModal에 데이터 전달
    modalStore.setDateSettingModal.openModal(selectedEvent.value);
};


// 캘린더 설정
const calendarConfig = reactive({
    viewType: "Week",                // 주간 뷰 설정
    locale: "ko-kr",                 // 한국어 설정
    weekStarts: 1,                   // 0: 일요일, 1: 월요일 (시작일 설정)
    headerDateFormat: "MM.dd (ddd)", // 헤더 날짜 형식
    timeFormat: "Clock24Hours",      // 타임 포맷 24시 형식
    cellHeight: 32,                  // 셀 높이
    businessBeginsHour: 9,           // 시작 시간
    businessEndsHour: 20,            // 종료 시간
    dayBeginsHour: 0,                // 하루 시작 (0시)
    dayEndsHour: 24,                 // 하루 끝 (24시)
    events: events.value,
    eventMoveHandling: "Disabled",
    eventResizeHandling: "Disabled",
    
    // 날짜 클릭 시 이벤트 
    // onTimeRangeSelected: (args) => {
    //     console.log("선택된 시간:", args.start, args.end);
    // },

    // 이벤트(예약 정보) 클릭 시
    onEventClick: handleEventClick,
});

const calendarRef = ref(null);

// 모달 내에서 편집할 해당 날짜의 전체 시간 리스트
const dayEvents = computed(() => {
    if (!selectedEvent.value) return [];
    
    // 클릭한 이벤트의 날짜(YYYY-MM-DD) 추출
    const selectedDate = new DayPilot.Date(selectedEvent.value.start).toString("yyyy-MM-dd");
    
    // 전체 events 중 같은 날짜인 것만 필터링하여 반환
    return events.value.filter(ev => 
        new DayPilot.Date(ev.start).toString("yyyy-MM-dd") === selectedDate
    );
});

// 모달 헤더에 표시할 날짜 형식 (25.01.07 (수))
const modalTitle = computed(() => {
    if (!selectedEvent.value) return ""
    
    // yy.MM.dd (ddd) -> 26.01.07 (수)
    // ddd는 요일을 한 글자(월, 화, 수...)로 표시합니다.
    return new DayPilot.Date(selectedEvent.value.start).toString("yy.MM.dd (ddd)","ko-kr");
});

const handelSetOperationModalOpen = (() => {
    modalStore.setDateSettingModal.closeModal();
    modalStore.setOperationRuleModal.openModal();
})
onMounted(() => {
    // 초기 로드 시 오늘 날짜로 이동
    calendarConfig.startDate = DayPilot.Date.today().firstDayOfWeek(1);
})
</script>

<template>
    <!-- 날짜 선택 영역 -->
    <div class="calendar-nav-bar">
        <button class="nav-btn" @click="prevWeek">
            <img src="@/assets/icons/ic_arrow_left.svg" alt="이전">
        </button>

        <div class="current-range">
            <span class="heading-s">{{ dateRangeText }}</span>
        </div>
        
        <button class="nav-btn" @click="nextWeek">
            <img src="@/assets/icons/ic_arrow_right.svg" alt="다음">
        </button>
    </div>

    <!-- 캘랜더 -->
    <div class="calendar-wrapper">
        <DayPilotCalendar 
            :config="calendarConfig" 
            :events="events" 
            ref="calendarRef" 
        />
    </div>

    <!-- 날짜 선택 시, 운영 설정 모달 -->
    <ModalSimple
        v-if="modalStore.setDateSettingModal.isVisible"
        :title="modalTitle"
        :modal-state="modalStore.setDateSettingModal"
        modal-width="320px"
    >
        <div class="modal-contents-inner">
            <div class="d-flex flex-col gap-16 align-center">
                <button class="btn-link" @click="handelSetOperationModalOpen">진료 가능 동물 수, 운영시간 변경하기<img :src="icArrowRight" alt="아이콘"></button>
                <div class="d-flex gap-8">
                    <button class="btn btn--size-24 btn--black-outline">전체 가능</button>
                    <button class="btn btn--size-24 btn--black-outline">전체 마감</button>
                </div>
            </div>

            <div class="time-list-container">
                <div v-for="item in dayEvents" :key="item.id" class="time-item d-flex align-center justify-between">
                    <span class="body-m">{{ new DayPilot.Date(item.start).toString("HH:mm") }}</span>
                    <label class="toggle">
                        <input 
                            type="checkbox" 
                            :checked="item.cssClass === 'event-open'"
                            @change="toggleEventStatus(item)"
                        />
                        <img class="toggle-img" />
                    </label>
                </div>
            </div>
        </div>
        <div class="modal-button-wrapper">
            <button class="btn btn--size-32 btn--black" @click="modalStore.setDateSettingModal.closeModal()">취소</button>
            <button class="btn btn--size-32 btn--blue">저장</button>
        </div>
    </ModalSimple>

    <!-- 진료가능 동물 수, 운영시간 변경하기 -->
    <ModalSimple
        v-if="modalStore.setOperationRuleModal.isVisible"
        :modal-state="modalStore.setOperationRuleModal"
        :title="modalTitle"
    >
        <div class="modal-contents-inner">
            <!-- 일정 설정 -->
            <div class="d-flex flex-col gap-16 align-center">
                <span class="body-m">선택한 일정의 설정을 변경할 수 있습니다.</span>

                <!-- 요일 버튼 -->
                <div class="day-button-group d-flex gap-4">
                    <button 
                        v-for="day in daysOptions" 
                        :key="day.value" 
                        type="button" 
                        class="btn-day" 
                    >
                        {{ day.label }}
                    </button>
                </div>

                <!-- 예약가능 설정 -->
                <div class="d-flex align-center gap-4 body-s">
                    매 30분 마다
                    <CustomSingleSelect 
                        v-model="selectedAnimalCount" 
                        :options="animalCountOptions" 
                        select-width="63px" 
                        placeholder="0" 
                    />
                    마리 진료 가능
                </div>
            </div>

            <div style="min-height: 200px;">
                <!-- 시간 설정 -->
                <div class="d-flex align-center gap-8" style="margin-top: 32px;">
                    <span class="title-s">시작</span>
                    <TimeSelect />
                    -
                    <span class="title-s">마지막</span>
                    <TimeSelect />
                </div>
            </div>

            <div style="margin-top: 16px; border-top: 1px solid #ddd; padding-top: 16px;">
                <button class="text-button text-button--blue" style="width: 100%;">시간 추가</button>
            </div>
        </div>

        <div class="modal-button-wrapper">
            <button class="btn btn--size-32 btn--black" @click="modalStore.setOperationRuleModal.closeModal()">취소</button>
            <button class="btn btn--size-32 btn--blue">저장</button>
        </div>
    </ModalSimple>
</template>

<style lang="scss" scoped>
    .calendar-nav-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 50px;
        padding: 8px 24px;
        margin-bottom: 16px;

        border-radius: 4px;
        border: 1px solid $gray-200;

        .current-range {
            min-width: 200px;
            text-align: center;
            .heading-s {
                color: $gray-900;
            }
        }

        .nav-btn {
            @include flex-center;
            width: 24px;
            height: 24px;

            border-radius: 100px;
            border: 1px solid $gray-200;
            background: #fff;
            cursor: pointer;

            &:hover {
                background-color: $gray-50;
            }
        }
    }
    .calendar-wrapper {
        height: calc(100% - 66px);
    }

    // 캘렌더 커스텀 스타일
    :deep(.calendar_default_main) {
        width: 100%;
        height: 100%;
        overflow-x: auto;
        overflow-y: hidden;

        border-color: $gray-200;
        font-family: $font-family-base;

        // /* 헤더 영역 */
        & > div:first-child {
            width: auto !important;
            overflow: visible !important;
            position: sticky;
            top: 0;
            z-index: 2;
            
        }
    }

    :deep(.calendar_default_corner_inner) {
        background: $gray-100;
        border-color: $gray-200;
    }

    :deep(.calendar_default_cornerright_inner), 
    :deep(.calendar_default_colheader_inner), 
    :deep(.calendar_default_alldayheader_inner) {
        height: 100%;
        background: $gray-100;
        border-color: $gray-200;
        // border-right: 0;
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
    :deep(.calendar_default_event) {width: calc(100% + 4px) !important;}
    :deep(.calendar_default_event_inner) {
        border: none;

        &:hover {background-color: $primary-100 !important;}
    }
    :deep(.calendar_default_cell_inner) {
        background-color: $gray-00;
    }
    // 운영 스타일
    :deep(.calendar_default_event.event-open) {
        opacity: 0.9;
        background-color: $primary-50;
    }
    // 마감 스타일
    :deep(.calendar_default_event.event-closed) {
        background-color: $gray-50;
        opacity: 0.83;
        .calendar_default_event_inner {
            background: url('@/assets/images/Pattern.png') repeat !important;
        }
    }
    :deep(.calendar_default_event_bar) {display: none;} // 왼쪽 색상바 안보이도록
    :deep(.calendar_default_shadow) {display: none;}

    // 운영 설정 모달 스타일
    .time-list-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 50%;
        margin: 32px auto 0;
    }
    .btn-link {
        display: flex;
        gap: 4px;
        color: $primary-700;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line); 
    }
</style>