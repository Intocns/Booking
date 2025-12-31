<script setup>
import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-vue";
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { api } from "@/api/axios";
// 예약 상태 아이콘
import icConfirm from '@/assets/icons/ic_res_confirm.svg'
import icPersonal from '@/assets/icons/ic_res_personal.svg'
import icCancel from '@/assets/icons/ic_res_canceled.svg'
import icHold from '@/assets/icons/ic_res_hold.svg'
// 예약 경로 아이콘
import icNaver from '@/assets/icons/ic_res_naver.svg'
import icIntoPet from '@/assets/icons/ic_res_intoPet.svg'
import icIntoLink from '@/assets/icons/ic_res_intolink.svg'

// 상태 아이콘 매핑
const statusIcons = {
    0: icHold,
    1: icConfirm,
    2: icCancel,
    3: icPersonal,
};
    // 0: '예약대기',
    // 1: '예약확정',
    // 2: '예약취소',
    // 3: '예약거절'??

// 예약 경로 아이콘 매핑
const pathIcons = {
    1: icIntoLink,
    2: icIntoPet,
    4: icNaver,
};
    // 1: 'IntoVetGE',
    // 2: '인투펫',
    // 3: 'fitpet',
    // 4: '네이버예약'

// ---------------------------------------------
// props 정의
// ---------------------------------------------
const props = defineProps({
    viewType: {
        type: String,
        default: 'Resources'
    },
    events: {
        type: Array,
        default: () => []
    },
    staffs: {
        type: Array,
        default: () => []
    },
    startDate: {
        type: [Date, String],
        default: () => new Date()
    }
});
// ---------------------------------------------

// 캘린더 인스턴스 참조
const calendarRef = ref(null);

// ---------------------------------------------
//  리소스 및 이름 변환 로직
// ---------------------------------------------
// staffs 프롭스를 DayPilot 형식(columns)으로 변환
const columns = computed(() => {
    return props.staffs.map(staff => ({
        id: staff.id,
        name: staff.name
    }));
});


// ---------------------------------------------
// 캘린더 구성 옵션
// ---------------------------------------------
const config = ref({
    locale: "ko-kr",
    timeFormat: "Clock24Hours",
    hourNameShort: false,

    // 이벤트 데이터 연결
    events: props.events,
    // 시작 날짜 설정
    startDate: props.startDate,
    eventMoveHandling: "Disabled",
    
    onEventClick: (args) => {
        // 부모에게 클릭 이벤트 알림 (필요 시)
        console.log("선택된 스케줄:", args.e.data);
    },

    onBeforeEventRender: (args) => {
        const status = args.data.inState;
        
        // 상태별 배경색
        const bgColors = {
            0: '#ffe9a5', // 대기
            1: '#cceaff', // 확정
            2: '#ffd3db', // 취소
            3: '#D2FAE2', // 개인(불가)
        };
        args.data.backColor = bgColors[status];
    },
    
    cellDuration: 30,
    cellHeight: 40, 
    businessBeginsHour: 9,                  
    businessEndsHour: 20,
});

// ---------------------------------------------
// 프롭스 변경 감지 
// ---------------------------------------------
// viewType, events, staffs, startDate 중 하나라도 변하면 캘린더 업데이트
watch(() => [props.viewType, props.events, props.staffs, props.startDate], ([newView, newEvents, newStaffs, newDate]) => {
    if (calendarRef.value && calendarRef.value.control) {
        const dp = calendarRef.value.control;
        
        dp.update({
            viewType: newView,
            startDate: new DayPilot.Date(newDate), // 일반 Date를 DayPilot Date로 래핑
            events: newEvents,
            columns: newView === 'Resources' ? columns.value : null,
        });
    }
}, { deep: true });

onMounted(() => {
    // 초기 로드 시 업데이트
    if (calendarRef.value && calendarRef.value.control) {
        calendarRef.value.control.update({
            startDate: new DayPilot.Date(props.startDate),
            events: props.events,
            columns: props.viewType === 'Resources' ? columns.value : null,
        });
    }
});
</script>

<template>
    <div class="schedule-wrapper">

        <DayPilotCalendar 
            id="dp-schedule-calendar"
            ref="calendarRef"
            :columns="viewType === 'Resources' ? columns : null"
            :config="config"
            :viewType="viewType"
        >
            <template #event="{event}">
                <div class="event-header">
                    <!-- 예약 상태 아이콘 -->
                    <div class="reserve-name">
                        <img :src="statusIcons[event.data.inState] || ''" alt="상태아이콘">
                        <span 
                            class="title" 
                            :class="`title__${event.data.inState}`"
                        >
                            {{ event.data.userName }} {{ event.data.petName ? '(' + event.data.petName + ')' : '' }}
                        </span>
                    </div>

                    <!-- 예약경로 아이콘(네이버/인투펫/링크) -->
                    <div class="reserve-icon">
                        <img v-if="event.data.reRoute" :src="pathIcons[event.data.reRoute] || ''" alt="예약경로 아이콘">
                    </div>
                </div>
                <div class="event-content">
                    <!-- 상품명/진료실명 -->
                    <p class="reserve-title" :class="`reserve-title__${event.data.inState}`">{{ event.data.roomName }}</p>
                    <!-- 병원 메모 -->
                    <p class="reserve-memo">{{ event.data.memo }}</p>
                </div>
            </template>
        </DayPilotCalendar>
    </div>
</template>

<style lang="scss" scoped>
    .calendar-container {
        width: 100%;
    }
    .schedule-wrapper {
        width: 100%;
        height: 100%;
    }
    :deep(.calendar_default_main) {
        width: 100%;
        height: 100%;
        overflow-x: auto;

        border-color: $gray-200;
        font-family: $font-family-base;

        // /* 헤더 영역 */
        & > div:first-child {
            width: auto !important;
            overflow: visible !important;
            position: sticky;
            top: 0;
            z-index: 2;
            table {
                tbody tr td:nth-child(2) table {
                    td {
                        // width: 220px !important; 
                        min-width: 220px !important;
                        max-width: 220px !important;
                    }
                }
                width: auto !important; 
                // table-layout: fixed;
            }
        }

        // 캘린더영역
        & > div:nth-child(2) {
            height: calc(100% - 64px) !important; 
            width: auto !important;
            overflow: visible !important;

            table {
                tbody tr td:nth-child(2) table {
                    td {
                        // width: 220px !important; 
                        min-width: 220px !important;
                        max-width: 220px !important;
                        & > div {
                            // width: 220px !important; 
                            min-width: 220px !important;
                            max-width: 220px !important;
                            
                        }
                    }
                }
                width: auto !important; 
                // table-layout: fixed;
            }
        }

    }

    // 리소스 컬럼 너비 고정
    :deep(.calendar_default_colheader),
    :deep(.calendar_default_cell) {
        min-width: 220px !important; 
        max-width: 220px !important;
        // width: 220px !important;
    }

    :deep(.calendar_default_cornerright_inner), 
    :deep(.calendar_default_corner_inner), 
    :deep(.calendar_default_colheader_inner), 
    :deep(.calendar_default_alldayheader_inner) {
        height: 100%;
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
    :deep(.calendar_default_event_inner) {
        margin: 4px;
        
        border-radius: 4px;
        border: none;
        padding: 8px;
        background: $gray-50; // 기본

        &.confirm {background: $status-confirmed_bg;}
        &.hold {background: $status-onHold_bg;}
        &.canceled {background: $status-canceled_bg;}
        &.personal {background: $status-personal_bg;}
    }
    :deep(.calendar_default_event_bar) {display: none;} // 왼쪽 색상바 안보이도록
    :deep(.calendar_default_shadow) {display: none;}

    .event-header {
        width:100%;
        display:flex;
        align-items: center;
        margin-bottom: 6px;
        gap:8px;

        .reserve-name {
            flex:2;
            display:flex;
            align-items:center;
            gap:4px;

            .title {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;

                @include typo($title-xs-size, $title-xs-weight, $title-xs-spacing, $title-xs-line);

                &__1 {color: $status-confirmed_text;} // 확정
                &__0 {color: $status-onHold_text;} // 대기
                &__2 {color: $status-canceled_text;} // 취소
                &__3 {color: $status-personal_text} // 개인(불가)
            }
        }
    }

    .event-content {
        display: flex;
        flex-direction: column;
        gap:2px;

        @include typo($body-xs-size, $body-xs-weight, $body-xs-spacing, $body-xs-line);

        .reserve-title {
            &__0 {color: $status-onHold_text;} // 대기
            &__1 {color: $status-confirmed_text;} // 확정
            &__2 {color: $status-canceled_text;} // 취소
            &__3 {color: $status-personal_text} // 개인(불가)
        }
        .reserve-memo {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            color: $gray-600;
        }
    }
</style>