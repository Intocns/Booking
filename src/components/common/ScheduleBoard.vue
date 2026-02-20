<script setup>
import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-vue";
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
// 예약 상태 아이콘
import icConfirm from '@/assets/icons/ic_res_confirm.svg'
import icPersonal from '@/assets/icons/ic_res_personal.svg'
import icCancel from '@/assets/icons/ic_res_canceled.svg'
import icHold from '@/assets/icons/ic_res_hold.svg'
// 예약 경로 아이콘
import icNaver from '@/assets/icons/ic_res_naver.svg'
import icIntoPet from '@/assets/icons/ic_res_intoPet.svg'
import icIntoLink from '@/assets/icons/ic_res_intolink.svg'
// 스토어
import { useReservationStore } from "@/stores/reservationStore";

const reservationStore = useReservationStore();

// 상태 아이콘 매핑
const statusIcons = {
    0: icHold,
    1: icConfirm,
    2: icCancel,
    3: icCancel,
    4: icPersonal,
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
    eventResizeHandling: "Disabled",
    
    onEventClick: (args) => {
        handelReserveDetail(args.e.data.reserveIdx)
    },

    onBeforeEventRender: (args) => {
        const status = args.data.inState;
        const clinicType = args.data.clinicType; // clinicType 가져오기
        
        const bgColors = {
            0: '#ffe9a5', // 대기
            1: '#cceaff', // 확정
            2: '#ffd3db', // 취소
            3: '#ffd3db', // 거절
            4: '#D2FAE2', // 개인(불가)
        };

        // clinicType이 '개인일정'인 경우
        if (clinicType == '개인일정') {
            args.data.backColor = bgColors[4];
        } else {
            // 2. 그 외에는 status(inState) 값에 따라 색상 결정
            args.data.backColor = bgColors[status];
        }

    },
    
    cellDuration: 30,
    cellHeight: 60,
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

        scrollToWorkTime();
        
        setTimeout(() => {
            addResizeHandles();
        }, 100);
    }
}, { deep: true });

// 예약 상세보기 핸들러
const handelReserveDetail = (reserveIdx) => {
    reservationStore.getReserveInfo(reserveIdx)
}

const scrollToWorkTime = () => {
    const calendarEl = document.querySelector('.calendar_default_main');
    if (calendarEl) {
        calendarEl.scrollTop = 1080; // 9시 위치로 스크롤
    }
};

// 컬럼 리사이즈 관련 변수
let resizeHandles = [];
let isResizing = false;
let startX = 0;
let startWidth = 0;
let currentColumn = null;
let resizeHandleCheckInterval = null;

// 리사이즈 핸들 추가 함수
const addResizeHandles = () => {
    if (props.viewType !== 'Resources') return;
    
    // 컬럼 헤더 찾기 - 헤더 영역에서만 찾기
    const headerArea = document.querySelector('.calendar_default_main > div:first-child');
    if (!headerArea) return;
    
    const colHeaders = headerArea.querySelectorAll('.calendar_default_colheader');
    
    colHeaders.forEach((header) => {
        // 이미 핸들이 있는지 확인
        if (header.querySelector('.column-resize-handle')) {
            return;
        }
        
        const headerInner = header.querySelector('.calendar_default_colheader_inner');
        if (!headerInner) return;
        
        // 리사이즈 핸들 생성
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'column-resize-handle';
        resizeHandle.style.cssText = `
            position: absolute;
            right: -2px;
            top: 0;
            width: 4px;
            height: 100%;
            cursor: col-resize;
            background: transparent;
            z-index: 1000;
            user-select: none;
            transition: all 0.2s;
            pointer-events: auto;
            clip-path: none;
            -webkit-clip-path: none;
        `;
        
        // 마우스 이벤트
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            currentColumn = header;
            startX = e.clientX;
            startWidth = header.offsetWidth;
            
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });
        
        // position이 relative가 아니면 설정
        if (getComputedStyle(header).position === 'static') {
            header.style.position = 'relative';
        }
        
        header.appendChild(resizeHandle);
        resizeHandles.push(resizeHandle);
    });
};

// 리사이즈 핸들 제거 함수
const removeResizeHandles = () => {
    resizeHandles.forEach(handle => {
        if (handle.parentNode) {
            handle.parentNode.removeChild(handle);
        }
    });
    resizeHandles = [];
};

// 컬럼 너비 업데이트 헬퍼 함수
const updateColumnWidth = (cell, newWidth) => {
    cell.style.width = `${newWidth}px`;
    cell.style.minWidth = `${newWidth}px`;
    cell.style.maxWidth = 'none';
};

// 마우스 이동 이벤트
const handleMouseMove = (e) => {
    if (!isResizing || !currentColumn) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(220, startWidth + diff);
    
    const headerArea = document.querySelector('.calendar_default_main > div:first-child');
    if (!headerArea) return;
    
    const allHeaderCells = headerArea.querySelectorAll('.calendar_default_colheader');
    const currentIndex = Array.from(allHeaderCells).indexOf(currentColumn);
    
    if (currentIndex === -1) return;
    
    // 현재 컬럼의 너비 변경
    updateColumnWidth(currentColumn, newWidth);
    
    // 헤더 영역의 같은 인덱스 컬럼 업데이트
    const headerColumnTables = headerArea.querySelectorAll('tbody tr td:nth-child(2) table');
    headerColumnTables.forEach(columnTable => {
        const columnCells = columnTable.querySelectorAll('td');
        const targetCell = columnCells[currentIndex];
        if (targetCell) {
            updateColumnWidth(targetCell, newWidth);
            
            const innerDiv = targetCell.querySelector('.calendar_default_colheader_inner');
            if (innerDiv) {
                innerDiv.style.width = `${newWidth}px`;
                innerDiv.style.maxWidth = `${newWidth}px`;
                innerDiv.style.boxSizing = 'border-box';
            }
        }
    });
    
    // 본문 영역의 같은 인덱스 컬럼 업데이트
    const calendarBody = document.querySelector('.calendar_default_main > div:nth-child(2)');
    if (calendarBody) {
        const bodyColumnTables = calendarBody.querySelectorAll('tbody tr td:nth-child(2) table');
        bodyColumnTables.forEach(columnTable => {
            const columnCells = columnTable.querySelectorAll('td');
            const targetCell = columnCells[currentIndex];
            if (targetCell) {
                updateColumnWidth(targetCell, newWidth);
                
                const cellInner = targetCell.querySelector('div');
                if (cellInner) {
                    updateColumnWidth(cellInner, newWidth);
                }
                
                // 이벤트 카드 너비 제한
                const events = targetCell.querySelectorAll('.calendar_default_event_inner');
                events.forEach(event => {
                    event.style.maxWidth = `${newWidth - 8}px`;
                    event.style.boxSizing = 'border-box';
                });
            }
        });
    }
};

// 마우스 업 이벤트
const handleMouseUp = () => {
    if (isResizing) {
        isResizing = false;
        currentColumn = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // 리사이즈 완료 후 핸들 다시 추가
        setTimeout(() => {
            addResizeHandles();
        }, 100);
    }
};

const getInState = (data) => {
    return data.clinicType === '개인일정' ? 4 : data.inState;
};

onMounted(() => {
    // 초기 로드 시 업데이트
    if (calendarRef.value && calendarRef.value.control) {
        calendarRef.value.control.update({
            startDate: new DayPilot.Date(props.startDate),
            events: props.events,
            columns: props.viewType === 'Resources' ? columns.value : null,
        });

        scrollToWorkTime();
        
        setTimeout(() => {
            addResizeHandles();
        }, 100);
    }
    
    // 전역 마우스 이벤트 리스너
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
    removeResizeHandles();
    if (resizeHandleCheckInterval) {
        clearInterval(resizeHandleCheckInterval);
        resizeHandleCheckInterval = null;
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
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
                        <img :src="statusIcons[getInState(event.data)] || ''" alt="상태아이콘">
                        <span 
                            class="title" 
                            :class="`title__${getInState(event.data)}`"
                        >
                            {{ event.data.userName }} {{ event.data.petName ? '(' + event.data.petName + ')' : '' }}
                        </span>
                    </div>

                    <!-- 예약경로 아이콘(네이버/인투펫/링크) -->
                    <div class="reserve-icon">
                        <img v-if="event.data.reRoute" :src="pathIcons[event.data.reRoute] || ''" alt="예약경로 아이콘" width="16">
                    </div>
                </div>
                <div class="event-content">
                    <!-- 상품명/진료실명 -->
                    <p class="reserve-title" :class="`reserve-title__${getInState(event.data)}`">{{ event.data.roomName }}</p>
                    <!-- 병원 메모 -->
                    <p class="reserve-memo">{{ event.data.memo }}</p>
                </div>
            </template>
        </DayPilotCalendar>
    </div>
</template>

<style lang="scss" scoped>
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

        &::-webkit-scrollbar {
            height: 8px;
        }

        // 헤더 영역
        & > div:first-child {
            width: auto !important;
            overflow: visible !important;
            position: sticky;
            top: 0;
            z-index: 49;
            table {
                overflow: visible !important;
                width: auto !important;
                tbody tr td:nth-child(2) table {
                    overflow: visible !important;
                    tbody tr td {
                        min-width: 220px !important;
                        overflow: visible !important;
                    }
                }
            }
            overflow: visible !important;
        }

        // 캘린더영역
        & > div:nth-child(2) {
            height: calc(100% - 64px) !important; 
            width: auto !important;
            overflow: visible !important;

            > div > table > tbody > tr > td:nth-child(1) {
                position: sticky;
                left: 0;
                z-index: 1;
            }
            table {
                tbody tr td:nth-child(2) table td {
                    min-width: 220px !important;
                    & > div {
                        width: 100%;
                    }
                }

                &:first-child { // 이벤트 셀 위치 값 오류 수정
                    width: auto !important;
                }
            }
        }
    }
    
    // 헤더 테이블의 overflow visible
    :deep(.calendar_default_main > div:first-child table tbody tr td:nth-child(2) table td) {
        overflow: visible !important;
        position: relative;
    }

    :deep(.calendar_default_cornerright_inner), 
    :deep(.calendar_default_alldayheader_inner) {
        height: 100%;
        background: $gray-100;
        border-color: $gray-200;
        color: $gray-700;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
    }
    
    // 헤더 영역 높이 통일 - corner_inner와 colheader_inner 높이 맞추기
    :deep(.calendar_default_corner_inner),
    :deep(.calendar_default_colheader_inner) {
        height: 31px !important;
        min-height: 31px !important;
        max-height: 31px !important;
        background: $gray-100;
        border-color: $gray-200;
        color: $gray-700;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
        box-sizing: border-box;
    }
    
    // 컬럼 헤더 내부 요소는 컬럼 전체 너비 사용
    :deep(.calendar_default_colheader_inner) {
        width: 100%;
        overflow: hidden;
    }
    
    // 컬럼 헤더 position 설정
    :deep(.calendar_default_colheader) {
        position: relative !important;
        overflow: visible !important;
    }
    
    // 리사이즈 핸들 스타일
    :deep(.column-resize-handle) {
        z-index: 1000 !important;
        position: absolute !important;
        clip-path: none !important;
        -webkit-clip-path: none !important;
        overflow: visible !important;
        background: transparent !important;
        
        &::before {
            content: '';
            position: absolute;
            right: 3px;
            top: 20%;
            bottom: 20%;
            width: 1px;
            background: linear-gradient(
                to bottom,
                transparent 0%,
                rgba(0, 0, 0, 0.15) 20%,
                rgba(0, 0, 0, 0.15) 80%,
                transparent 100%
            );
            transition: all 0.2s ease;
            opacity: 0;
        }
        
        &::after {
            content: '';
            position: absolute;
            right: 2.5px;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 3px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.2);
            opacity: 0;
            transition: all 0.2s ease;
        }
        
        &:hover {
            background: transparent !important;
            &::before {
                background: linear-gradient(
                    to bottom,
                    transparent 0%,
                    rgba(59, 130, 246, 0.4) 20%,
                    rgba(59, 130, 246, 0.4) 80%,
                    transparent 100%
                );
                width: 2px;
                right: 3px;
                opacity: 1;
            }
            &::after {
                opacity: 1;
                background: rgba(59, 130, 246, 0.6);
                width: 4px;
                height: 4px;
            }
        }
        
        &:active {
            background: transparent !important;
            &::before {
                background: linear-gradient(
                    to bottom,
                    transparent 0%,
                    rgba(59, 130, 246, 0.7) 20%,
                    rgba(59, 130, 246, 0.7) 80%,
                    transparent 100%
                );
                width: 2px;
                opacity: 1;
            }
            &::after {
                opacity: 1;
                background: rgba(59, 130, 246, 0.9);
                width: 5px;
                height: 5px;
            }
        }
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
        background: $gray-50;
        box-shadow: -1px 0 3px rgba($color: #000000, $alpha: 0.2);
        
        max-width: calc(100% - 8px);
        overflow: hidden;
        box-sizing: border-box;

        &.confirm {background: $status-confirmed_bg;}
        &.hold {background: $status-onHold_bg;}
        &.canceled {background: $status-canceled_bg;}
        &.personal {background: $status-personal_bg;}

        &:hover {
            filter: brightness(96%);
        }
    }
    
    // 이벤트가 있는 셀도 overflow 제어
    :deep(.calendar_default_cell) {
        overflow: hidden;
        position: relative;
    }
    :deep(.calendar_default_event_bar) {display: none;}
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
            overflow: hidden;

            .title {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;

                @include typo($title-xs-size, $title-xs-weight, $title-xs-spacing, $title-xs-line);

                &__1 {color: $status-confirmed_text;}
                &__0 {color: $status-onHold_text;}
                &__2 {color: $status-canceled_text;}
                &__3 {color: $status-canceled_text;}
                &__4 {color: $status-personal_text;}
            }
        }

        .reserve-icon {flex-shrink: 0;}
    }

    .event-content {
        display: flex;
        flex-direction: column;
        gap:2px;

        @include typo($body-xs-size, $body-xs-weight, $body-xs-spacing, $body-xs-line);

        .reserve-title {
            &__0 {color: $status-onHold_text;}
            &__1 {color: $status-confirmed_text;}
            &__2 {color: $status-canceled_text;}
            &__3 {color: $status-canceled_text;}
            &__4 {color: $status-personal_text;}
        }
        .reserve-memo {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            color: $gray-600;
        }
    }
</style>