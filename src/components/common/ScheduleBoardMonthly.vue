<script setup>
import { DayPilot, DayPilotMonth } from "@daypilot/daypilot-lite-vue";
import { ref, watch, computed, onMounted } from 'vue';

import icArrowDown from '@/assets/icons/ic_arrow_down_b.svg'
// 예약 상태 아이콘
import icConfirm from '@/assets/icons/ic_res_confirm.svg'
import icPersonal from '@/assets/icons/ic_res_personal.svg'
import icCancel from '@/assets/icons/ic_res_canceled.svg'
import icHold from '@/assets/icons/ic_res_hold.svg'
import icPlusCircle from '@/assets/icons/ic_plus_circle.svg'

// 상태 아이콘 매핑
const statusIcons = {
    1: icConfirm, //확정
    3: icPersonal, //개인일정
    2: icCancel, // 취소
    0: icHold // 대기
};

const props = defineProps(['startDate', 'events', 'staffs']);
const emit = defineEmits(['date-click']);

const calendarRef = ref(null);
const selectedDate = ref("");
const selectedEvents = ref([]);

// 클릭된 날짜를 yyyy-MM-dd 형식으로 따로 저장할 변수 하나 추가
const selectedDateStr = ref("");

// props 데이터를 가공해서 '스태프별 요약 데이터'로 만듬
// const summaryEvents = computed(() => {
//     const dayGroups = {};

//     props.events.forEach(ev => {
//         // T를 기준으로 자르되, 데이터가 없을 경우를 대비
//         const date = ev.start.includes('T') ? ev.start.split('T')[0] : ev.start;
//         if (!dayGroups[date]) dayGroups[date] = {};
        
//         const rId = ev.resource;
//         dayGroups[date][rId] = (dayGroups[date][rId] || 0) + 1;
//     });

//     const processed = [];

//     Object.entries(dayGroups).forEach(([date, staffCounts]) => {
//         Object.entries(staffCounts).forEach(([resId, count]) => {
//             // staffs가 아직 비어있을 수 있으므로 체크
//             const staff = props.staffs?.find(s => s.id === resId);
//             const staffName = staff ? staff.name : resId;

//             processed.push({
//                 id: `summary-${date}-${resId}`,
//                 start: `${date}T00:00:00`,
//                 end: `${date}T23:59:59`,
//                 text: `${staffName} ${count}`,
//                 resourceId: resId,
//                 tags: { isSummary: true }
//             });
//         });
//     });

//     return processed;
// });
const summaryEvents = computed(() => {
    const dayGroups = {};

    // 1. 데이터 그룹화 (날짜별 -> 직원별)
    props.events.forEach(ev => {
        const date = ev.start.includes('T') ? ev.start.split('T')[0] : ev.start;
        if (!dayGroups[date]) dayGroups[date] = [];
        
        const rId = ev.resource;
        let staffData = dayGroups[date].find(d => d.resourceId === rId);
        if (!staffData) {
            staffData = { resourceId: rId, count: 0 };
            dayGroups[date].push(staffData);
        }
        staffData.count++;
    });

    const processed = [];

    Object.entries(dayGroups).forEach(([date, staffList]) => {
        // 한 날짜에 직원이 5명 이상인 경우에만 '더보기' 로직 적용 (4명까지는 다 보여줌)
        const showMore = staffList.length > 4;
        const displayList = showMore ? staffList.slice(0, 3) : staffList;

        // 실제 표시할 직원 막대기 생성
        displayList.forEach((item) => {
            const staffIndex = props.staffs?.findIndex(s => s.id === item.resourceId) ?? "";
            const staff = props.staffs[staffIndex] ?? "";
            // 💡 중요: staffs 배열의 인덱스를 사용하여 1, 2, 3, 4번 색상 고정 (0~3)
            const colorIdx = (staffIndex !== -1 ? staffIndex % 4 : 0) + 1;

            processed.push({
                id: `summary-${date}-${item.resourceId}`,
                start: `${date}T00:00:00`,
                end: `${date}T23:59:59`,
                text: `${staff ? staff.name : item.resourceId} ${item.count}`,
                tags: { colorIdx, isSummary: true } // 💡 tags에 컬러 번호 저장
            });
        });

        // 4개 초과일 때 "+ 카운트" 막대기 추가
        if (showMore) {
            const extraCount = staffList.length - 3;
            processed.push({
                id: `more-${date}`,
                start: `${date}T00:00:00`,
                end: `${date}T23:59:59`,
                text: `${extraCount}`,
                tags: { isMore: true } // 더보기 전용 태그
            });
        }
    });

    return processed;
});
const config = ref({
    locale: "ko-kr",
    startDate: new DayPilot.Date(props.startDate),
    events: summaryEvents.value, // 가공된 요약 데이터 전달
    eventHeight: 28,
    heightSpec: "Fixed",
    
    //  캘린더 막대 
    onBeforeEventRender: (args) => {
        if(args.data.tags?.isMore) {
            args.data.html = `
                <div class="summary-event-bar more-bar">
                    <img src="${icPlusCircle}" alt="아이콘" />
                    <span class="more-count">${args.data.text}</span>
                </div>
            `
        } else {
            args.data.html = `
            <div class="summary-event-bar vet-color-${args.data.tags.colorIdx}">
                <span class="s-name">${args.data.text.split(' ')[0]}</span>
                <span class="s-count">${args.data.text.split(' ')[1]}</span>
            </div>
            `;
        }
    },

    
    //  날짜 클릭 시 원본 데이터(props.events)를 필터링해서 사이드바에 표시
    onEventClick: (args) => {
        //  클릭한 날짜 문자열 추출 
        const clickedDate = args.e.start().toString("yyyy-MM-dd");
        
        handleDateSelection(clickedDate);
    },

    //  날짜 클릭 시 원본 데이터(props.events)를 필터링해서 사이드바에 표시
    onTimeRangeSelected: (args) => {
        //  클릭한 날짜 문자열 추출 
        const clickedDateStr = args.start.toString("yyyy-MM-dd");
        
        handleDateSelection(clickedDateStr);
    },

    onBeforeCellRender: (args) => {
        // 기준이 되는 달 (props.startDate 기준)
        const currentMonth = new DayPilot.Date(props.startDate).getMonth();
        const cellMonth = args.cell.start.getMonth();
        const cellDate = args.cell.start.toString("yyyy-MM-dd");
        const today = DayPilot.Date.today().toString("yyyy-MM-dd");

        // 초기화 (이전 설정 초기화)
        args.cell.properties.backColor = "#ffffff";

        // 1. 다른 달 날짜 처리
        if (currentMonth !== cellMonth) {
            args.cell.properties.backColor = "#f8f9fa";
        } 
        
        // 2. 오늘 날짜 하이라이트
        if (cellDate === today) {
            args.cell.properties.backColor = "#E2F3FF";
        }

        // 3. 사용자가 클릭해서 선택한 날짜 (가장 우선순위 높음)
        if (cellDate === selectedDateStr.value) {
            args.cell.properties.backColor = "#8BCDFF";
        }
    }
});

// 날짜 셀 클릭 이벤트
const handleDateSelection = (clickedDateStr) => {
    selectedDateStr.value = clickedDateStr;

    const date = new Date(clickedDateStr); 
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const week = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = week[date.getDay()];

    selectedDate.value = `${month}월 ${day}일 (${dayOfWeek})`;

    selectedEvents.value = props.events.filter(e => {
        const eventDate = e.start.includes('T') ? e.start.split('T')[0] : e.start;
        return eventDate === clickedDateStr;
    });
    
    if (calendarRef.value) {
        calendarRef.value.control.update();
    }
};

// 스태프별로 열림/닫힘 상태를 관리할 객체 (기본적으로 모두 열어두려면 초기값 설정)
const openStaffs = ref({});

// 선택된 이벤트를 스태프별로 그룹화
const groupedSelectedEvents = computed(() => {
    const groups = {};
    
    selectedEvents.value.forEach(ev => {
        const staffId = ev.resource;
        if (!groups[staffId]) {
            const staff = props.staffs.find(s => s.id === staffId);
            groups[staffId] = {
                name: staff ? (staff.name) : ('미지정(' + staffId + ')'),
                events: []
            };
        }
        groups[staffId].events.push(ev);
    });

    // 각 스태프 내 이벤트를 시간순으로 정렬
    Object.values(groups).forEach(group => {
        group.events.sort((a, b) => a.start.localeCompare(b.start));
    });

    return groups;
});

// 토글 함수
const toggleStaff = (staffId) => {
    openStaffs.value[staffId] = !openStaffs.value[staffId];
};

watch(() => [props.startDate, props.events, props.staffs], () => {
    if (calendarRef.value && calendarRef.value.control) {
        calendarRef.value.control.update({
            startDate: new DayPilot.Date(props.startDate),
            events: summaryEvents.value
        });
    }
}, { deep: true });

onMounted(() => {
    const wrapperHeight = document.querySelector('.monthly-wrapper').offsetHeight;
    const calculatedHeight = Math.floor((wrapperHeight - 30) / 5); // 헤더 빼고
    
    calendarRef.value.control.update({
        cellHeight: calculatedHeight
    });
})
</script>

<template>
    <div class="monthly-layout">
        <div class="monthly-wrapper">
            <DayPilotMonth :config="config" ref="calendarRef" />
        </div>
        
        <!-- 오른쪽 상세영역 -->
        <div class="detail-sidebar" v-if="selectedDate">
            <div class="detail-header">{{ selectedDate }}</div>
            <div class="detail-list">
                <div v-for="(group, staffId) in groupedSelectedEvents" :key="staffId" class="staff-group">
                    <div class="staff-title" @click="toggleStaff(staffId)">
                        <div class="title-wrapper">
                            <span class="title-l">{{ group.name }}</span>
                            <span class="body-l">수의사</span>
                        </div>

                        <div class="d-flex gap-16">
                            <span class="title-s">{{ group.events.length }} 건</span>
                            <span class="arrow" :class="{ 'is-open': openStaffs[staffId] }">
                                <img :src="icArrowDown" alt="">
                            </span>
                        </div>
                    </div>
                    
                    <div class="staff-content" v-show="openStaffs[staffId]">
                        <div v-for="ev in group.events" :key="ev.id" class="detail-item" :class="`detail-item__${ev.inState}`">
                            <div class="d-flex gap-6">
                                <div class="d-flex gap-4">
                                    <img 
                                        :src="statusIcons[ev.inState || '']" 
                                        alt="" 
                                        class="status-icon"
                                    />
                                    <span class="time title-s">{{ ev.start.split('T')[1].substring(0,5) }}</span>
                                </div>
                                <span class="patient body-s">{{ ev.userName }}{{ ev.petName ? '(' + ev.petName + ')' : '' }}</span>
                            </div>
                            <span class="memo body-s">{{ ev.roomName }}</span>
                        </div>  
                    </div>
                </div>
                
                <div v-if="Object.keys(groupedSelectedEvents).length === 0" class="no-data">
                    일정이 없습니다.
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.monthly-layout { display: flex; height: 100%; gap: 16px; }
.monthly-wrapper { flex: 1; height: 100%; overflow-y: auto;}

    :deep(.month_default_main) {
        border: none;
        border-top: 1px solid $gray-200;
        border-left: 1px solid $gray-200;
        font-family: $font-family-base;
    }

    :deep(.month_default_header_inner) {
        background: $gray-100;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);

        color: $gray-700;
        border-color: $gray-200
    }

    :deep(.month_default_cell_header) {
        padding: 8px;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
        text-align: left;

        color: $gray-700;
    }

    /* 일요일 헤더 */
    :deep(.month_default_header:nth-of-type(1)) {
        .month_default_header_inner {
            color: $warning-500;
        }
    }

    /* 토요일 헤더 */
    :deep(.month_default_header:nth-of-type(37)) {
        .month_default_header_inner {
            color: $primary-500;
        }
    }

    :deep(.month_default_cell_inner) {
        background-color: $gray-00;
    }

    :deep(.month_default_event) {
        transform: translateY(-60%);
    }

    :deep(.month_default_event_inner) {
        display: flex;
        justify-content: space-between;
        border-radius: 4px;
        border: none;
        padding: 0 8px 0 35px;

        background: transparent !important;

        .summary-event-bar {
            width: 100%;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            @include typo($title-xs-size, $title-xs-weight, $title-xs-spacing, $title-xs-line);

            border-radius: 4px;
            color: $gray-700;
        }
    }

    /* nth-of-type 대신 직접 지정한 클래스 사용 */
    :deep(.vet-color-1) { background-color: $vet1_bg; color: $vet1_bar; }
    :deep(.vet-color-2) { background-color: $vet2_bg; color: $vet2_bar; }
    :deep(.vet-color-3) { background-color: $vet3_bg; color: $vet3_bar; }
    :deep(.vet-color-4) { background-color: $vet4_bg; color: $vet4_bar; }

    /* 더보기 바 스타일 */
    :deep(.more-bar) {
        background-color: $gray-600;
        color: $gray-00 !important;
    }

    :deep(.month_default_event_bar) {display: none;}
    :deep(.month_default_shadow) {display: none;}

    .detail-sidebar {
        width: 300px;
        display: flex;
        flex-direction: column;

        background: $gray-00;
        border: 1px solid $gray-200;

        .detail-header { 
            @include typo($heading-s-size, $heading-s-weight, $heading-s-spacing, $heading-s-line);
            padding: 16px; 
            border-bottom: 1px solid $gray-200;
        }

        .detail-list { 
            display: flex; 
            flex-direction: column; 
            gap: 6px;
            height: 100%;
            overflow-y: auto;

            .staff-group {
                // padding: 16px;
                border-bottom: 1px solid $gray-200;

                .staff-title {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px;

                    color: $gray-700;

                    .title-wrapper {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .title-l {
                        max-width: 120px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        line-height: 1;
                    }

                    .arrow {
                        img {transition: transform .3s;}
                    }
                    .arrow.is-open {
                        img { transform: rotate(180deg);}
                    }
                }

                .staff-content {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    // max-height: 230px;
                    // overflow-y: auto;
                    padding: 16px;

                    border-top: 1px solid $gray-200;
                    background-color: $gray-50;
                }
            }

            .no-data {
                padding: 16px;
            }
        }
        
        .detail-item { 
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px; 
            padding: 8px 16px;
            cursor: pointer;

            border-radius: 4px;

            .patient {
                min-width: 0;
                max-width: 80px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .memo {
                max-width: 70px;
                text-align: right;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            // 상태별 사이드바 아이템 색상
            &__1 { background: $status-confirmed_bg; color: $status-confirmed_text; } // 확정
            &__0 { background: $status-onHold_bg; color: $status-onHold_text; } // 대기
            &__2 { background: $status-canceled_bg; color: $status-canceled_text; } // 취소
            &__3 { background: $status-personal_bg; color: $status-personal_text; } // 개인일정
        }
    }
    
    :deep(.not-current-month) {
        background-color: #f5f5f5 !important; // 회색 배경
        opacity: 0.7;
    }
</style>