<!-- 스케쥴 (주간) -->
<script setup>
import { computed, ref } from 'vue';

// 예약 상태 아이콘
import icConfirm from '@/assets/icons/ic_res_confirm.svg'
import icPersonal from '@/assets/icons/ic_res_personal.svg'
import icCancel from '@/assets/icons/ic_res_canceled.svg'
import icHold from '@/assets/icons/ic_res_hold.svg'

// 상태 아이콘 매핑
const statusIcons = {
    confirm: icConfirm,
    personal: icPersonal,
    canceled: icCancel,
    hold: icHold
};

const props = defineProps({
    events: { type: Array, default: () => [] },
    staffs: { type: Array, default: () => [] },
    startDate: { type: Date, default: new Date() }
});

// 1. 선택된 셀 정보 (직원명, 날짜)
const selectedCell = ref({
    staffName: '',
    date: '',
    fullDate: ''
});

// 2. 셀 클릭 핸들러
const handleCellClick = (date, staff) => {
    selectedCell.value = {
        staffName: staff.name,
        date: date.monthDay,
        dayName: date.dayName,
        fullDate: date.full,
        staffId: staff.id
    };
};

// 3. 선택된 셀에 해당하는 상세 일정 필터링 (시간순 정렬)
const selectedEvents = computed(() => {
    if (!selectedCell.value.fullDate) return [];
    
    return props.events
        .filter(e => 
        e.start.startsWith(selectedCell.value.fullDate) && 
        e.resource === selectedCell.value.staffId
        )
        .sort((a, b) => a.start.localeCompare(b.start)); // 시간순 정렬
});

// 시간 포맷팅 함수 (예: 2025-11-03T11:00 -> 11:00)
const formatTime = (dateTimeStr) => {
    return dateTimeStr.split('T')[1].substring(0, 5);
};

// 1. 7일치 날짜 배열 생성
const weekDates = computed(() => {
    const dates = [];
    const start = new Date(props.startDate);
    // 해당 주의 일요일부터 시작하도록 계산 (필요에 따라 조정)
    const day = start.getDay();
    start.setDate(start.getDate() - day);

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    // 오늘 날짜 문자열 (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const fullDate = d.toISOString().split('T')[0];

        dates.push({
            full: d.toISOString().split('T')[0],
            monthDay: `${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`,
            dayName: dayNames[d.getDay()],
            isSunday: d.getDay() === 0,
            isSaturday: d.getDay() === 6,
            isToday: fullDate === todayStr // 오늘인지 확인하는 플래그 추가
        });
    }
    return dates;
});

// 2. 데이터를 [날짜][직원][상태]별로 그룹화 (카운팅)
const summaryData = computed(() => {
    const grid = {};
    props.events.forEach(event => {
        const date = event.start.split('T')[0];
        const staff = event.resource;
        const status = event.status || 'confirm';

        if (!grid[date]) grid[date] = {};
        if (!grid[date][staff]) grid[date][staff] = {};
        
        grid[date][staff][status] = (grid[date][staff][status] || 0) + 1;
    });
    return grid;
});

const statusLabels = {
    confirm: '예약확정',
    hold: '예약대기',
    canceled: '예약취소',
    personal: '개인일정'
};
</script>

<template>
    <div class="schedule-layout">

        <div class="weekly-table-wrapper">
            <table class="weekly-table">
                <colgroup>
                    <col width="4%">
                    <col width="15%">
                    <col width="15%">
                    <col width="15%">
                    <col width="15%">
                    <col width="15%">
                    <col width="15%">
                </colgroup>
            <thead>
                <tr>
                <th class="corner-cell"></th>
                <th v-for="staff in staffs" :key="staff.id">{{ staff.name }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="date in weekDates" :key="date.full" :class="{ 'today-row': date.isToday }">
                <td class="date-cell" :class="{ 'sun': date.isSunday, 'sat': date.isSaturday }" >
                    <div class="date-num">{{ date.monthDay }}</div>
                    <div class="date-name">{{ date.dayName }}</div>
                </td>
                
                <td 
                    v-for="staff in staffs" :key="staff.id" 
                    class="content-cell" 
                    :class="{ 'active': selectedCell.fullDate === date.full && selectedCell.staffId === staff.id }"
                    @click="handleCellClick(date, staff)"
                >
                    <div v-if="summaryData[date.full]?.[staff.id]" class="status-list">
                    <div 
                        v-for="(count, status) in summaryData[date.full][staff.id]" 
                        :key="status"
                        :class="['status-item', status]"
                    >
                        <span class="label">{{ statusLabels[status] }}</span>
                        <span class="count">{{ count }}</span>
                    </div>
                    </div>
                </td>
                </tr>
            </tbody>
            </table>
        </div>

        <!-- 상세내역 -->
        <div v-if="selectedCell.fullDate" class="detail-sidebar">
            <div class="detail-container">
                <div class="detail-header">
                    <span class="staff-name">{{ selectedCell.staffName }}</span>
                    <span class="date-info">{{ selectedCell.date }} ({{ selectedCell.dayName }})</span>
                </div>
                
                <div class="detail-list">
                <div v-for="event in selectedEvents" :key="event.id" :class="['detail-item', event.status]">
                    <div class="time-box">
                        <img 
                            :src="statusIcons[event.status || '']" 
                            alt="" 
                            class="status-icon"
                        />
                        {{ formatTime(event.start) }}
                    </div>
                    <div class="event-info">
                        <span class="patient">{{ event.name }}{{ event.patient ? '(' + event.patient + ')' : '' }}</span>
                        <span class="memo">{{ event.product_name }}</span>
                    </div>
                </div>
                <div v-if="selectedEvents.length === 0" class="no-data">일정이 없습니다.</div>
                </div>
            </div>
        </div>

    </div>
</template>

<style lang="scss" scoped>
.schedule-layout {
    display: flex;
    gap: 18px;
    height: 100%;
}
.weekly-table-wrapper {
    flex: 1; // 테이블이 남은 공간 다 차지
    width: 100%;
    height: 100%;
    overflow: auto;
    position: relative;
}

.weekly-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;

    tr.today-row {
        td {
            border-top: 1px solid $primary-200;
            border-bottom: 1px solid $primary-200;

            &:first-child {background-color: $primary-50;}
        }
    }

    th, td {
        border-right: 1px solid $gray-200;
        border-bottom: 1px solid $gray-200;
        vertical-align: top;
    }

    td {
        height: 114px;
    }

    // 헤더 스타일
    thead th {
        position: sticky;
        top: 0;
        z-index: 10; // 컨텐츠보다 위로
        padding: 6px 0;

        background: $gray-100;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
        color: $gray-700;
        border-top: 1px solid $gray-200; // 맨 위 보더 추가

        &:first-child {
            left: 0;
            border-left: 1px solid $gray-200;
            z-index: 20; // 날짜 헤더는 더 높게
        }
    }

  // 왼쪽 날짜 열 스타일
    .date-cell {
        position: sticky; // 가로 스크롤 시에도 날짜 고정
        left: 0;
        z-index: 5;
        border-left: 1px solid $gray-200;

        @include flex-center;
        flex-direction: column;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);

        background: $gray-00;
        color: $gray-700;
        
        &.sun { color: $warning-500; } // 일요일 빨간색
        &.sat { color: $primary-500; } // 토요일 파란색
    }

  // 스케줄 아이템 스타일
    .content-cell {
        padding: 6px;
    }

    .status-list {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .status-item {
        display: flex;
        height: 24px;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px;
        border-radius: 4px;

        @include typo($title-xs-size, $title-xs-weight, $title-xs-spacing, $title-xs-line);

        &.confirm { background: $status-confirmed_bg; color: $status-confirmed_text; }
        &.hold { background: $status-onHold_bg; color: $status-onHold_text; }
        &.canceled { background: $status-canceled_bg; color: $status-canceled_text; }
        &.personal { background: $status-personal_bg; color: $status-personal_text; }
    }
}

.detail-sidebar {
    width: 300px;
    // padding: 16px;

    background: #fff;
    border: 1px solid $gray-200;

    .detail-header {
        display:flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;

        border-bottom: 1px solid $gray-200;

        .staff-name { @include typo($heading-s-size, $heading-s-weight, $heading-s-spacing, $heading-s-line); }
        .date-info { @include typo($body-l-size, $body-l-weight, $body-l-spacing, $body-l-line);}
    }

    .detail-list {
        padding: 16px;
    }

    .detail-item {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        gap: 6px;
        margin-bottom: 8px;
        border-radius: 4px;

        @include typo($body-s-size, $body-s-weight, $body-s-spacing, $body-s-line);
        
        // 왼쪽 시간 강조 스타일
        .time-box {
            width: 60px;
            display: flex;
            align-items: center;
            gap: 4px;

            @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);

            .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
        }
        
        .event-info {
            flex: 1;
            display: flex;
            justify-content: space-between;

            .patient {
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .memo {
                text-align: right;
            }
        }

        // 상태별 사이드바 아이템 색상
        &.confirm { background: $status-confirmed_bg; color: $status-confirmed_text; }
        &.hold { background: $status-onHold_bg; color: $status-onHold_text; }
        &.canceled { background: $status-canceled_bg; color: $status-canceled_text; }
        &.personal { background: $status-personal_bg; color: $status-personal_text; }
    }
}

// 클릭된 셀 강조
.content-cell.active {
    background-color: $primary-200;
    // outline: 1px solid $primary-700;

    &:hover {background-color: $primary-200;}
}
</style>