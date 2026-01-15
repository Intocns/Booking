<!-- 네이버 플레이스 관리 > 간단 예약 관리 -->
<script setup>
// 컴포넌트
import FilterDate from '@/components/common/filters/FilterDate.vue';
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';

import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-vue";
import { ref, onMounted, watch, computed, reactive } from 'vue';
import { formatDate } from '@/utils/dateFormatter';
import { storeToRefs } from 'pinia';
// 스토어
import { useProductStore } from '@/stores/productStore';
import { format } from 'date-fns';

const productStore = useProductStore()
const { productList, productScheduleDataList } = storeToRefs(productStore);

/**
 * 상태 관리
 */
const currentDate = ref(new Date()); // 날짜 선택 값 (기본값: 오늘 날짜)
const calendarRef = ref(null); // 캘린더 인스턴스 참조

// productScheduleDataList 값변할 때마다 자동으로 라이브러리용 events 재계산
const events = computed(() => {
    const allEvents = [];
    
    if (!productScheduleDataList.value) return [];

    productScheduleDataList.value.forEach(item => {
        allEvents.push(...parseHourBitToEvents(item));
    });
    return allEvents;
});

// productList를 DayPilot 형식(columns)으로 변환
const columns = computed(() => {
    return productList.value.map(product => ({
        id: product.bizItemId, // events의 resource와 같은 이벤트끼리 매칭
        name: product.name,
        width: 220, // 너비
        // 각 col별 버튼 추가
        html: `
            <div class="product-header-cell">
                <div class="product-name">${product.name}/${product.bizItemId}</div>
                <div class="header-btn-group">
                    <div class="d-flex justify-between">
                        <div class="d-flex gap-4">
                            <button 
                                class="btn btn--size-24 btn--black-outline" 
                                onclick="window.allOpen('${product.bizItemId}')"
                            >
                                전체가능
                            </button>
                            <button 
                                class="btn btn--size-24 btn--black-outline"
                                onclick="window.allClose('${product.bizItemId}')"
                            >
                                전체마감
                            </button>
                        </div>

                        <button 
                            data-id="${product.bizItemId}"
                            data-imp="${product.isImp}"
                            class="imp-update-btn btn btn--size-24 ${product.isImp ? 'btn--blue-outline' : 'btn--black-outline'}" 
                        >
                            ${product.isImp ? '노출중' : '노출하기'}
                        </button>
                    </div>
                </div>
            </div>
        `
    }));
});

// hourBit를 DayPilot 이벤트로 변환하는 함수 
// hourBit를 30분 단위로 쪼개서 이벤트를 생성함 
const parseHourBitToEvents = (item) => {
    const bitString = item.hourBit; // "0000111..." (48자)
    const newEvents = []; // 가공해서 담아줄 events 데이터
    const dateStr = item.date; // "2023-10-27"

    for (let i = 0; i < bitString.length; i++) {
        const bit = bitString[i];
        
        // 30분 단위 계산
        const totalMinutes = i * 30;
        const hour = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const min = (totalMinutes % 60).toString().padStart(2, '0');
        
        const nextTotalMinutes = (i + 1) * 30;
        const nextHour = Math.floor(nextTotalMinutes / 60).toString().padStart(2, '0');
        const nextMin = (nextTotalMinutes % 60).toString().padStart(2, '0');

        // 이벤트를 생성 
        newEvents.push({
            id: `bit_${item.bizItemId}_${i}`, // 라이브러리가 식별할 수 있는 id
            resource: item.bizItemId, // 라이브러리 캘린터 형식이 resource인경우 필요(col의 id값과 같아야 연동됨)
            start: `${dateStr}T${hour}:${min}:00`, 
            end: `${dateStr}T${nextHour}:${nextMin}:00`,
            backColor: "#fff", // 이벤트 셀 기본 배경 컬러
            tags: { 
                bitValue: bit, // (0: 미운영, 1: 운영)
                stock: item.stock,
            }
        });
    }
    return newEvents;
};

// 상품 ID를 받아 현재 상품이 노출/비노출(isImp) 상태인지 확인
const getIsImp = (resourceId) => {
    const product = productList.value.find(p => p.bizItemId === resourceId);
    // product가 존재하고, isImp가 true일 때만 true 반환
    return product ? product.isImp : false;
};

// 상품별 운영/미운영 토글 버튼 이벤트
const handleToggle = async(event, isChecked) => {
    const bizItemId = event.data.resource;
    const fullStart = event.data.start.toString();
    const day = fullStart.split('T')[0]; // yyyy-mm-dd
    
    // 현재 이 상품의 해당 날짜 스케줄 데이터 가져옴
    const schedule = productStore.productScheduleDataList.find(
        s => s.bizItemId === bizItemId && s.date === day
    );
    if (!schedule) return;

    // hourBit 수정 (0: 마감, 1: 운영)
    const bitIndex = parseInt(event.data.id.split('_').pop());
    const bitArray = schedule.hourBit.split('');
    bitArray[bitIndex] = isChecked ? '1' : '0';
    const newHourBit = bitArray.join('');

    // TODO: times배열이 어떤값인지 아직 몰라 임시로 해둠 
    // 수정된 hourBit를 바탕으로 times 배열(운영 시간 리스트) 생성
    const times = [];
    for (let i = 0; i < newHourBit.length; i++) {
        if (newHourBit[i] === '1') {
            const startTotal = i * 30;
            const endTotal = (i + 1) * 30;
            
            times.push({
                startTime: `${Math.floor(startTotal / 60).toString().padStart(2, '0')}:${(startTotal % 60).toString().padStart(2, '0')}`,
                endTime: `${Math.floor(endTotal / 60).toString().padStart(2, '0')}:${(endTotal % 60).toString().padStart(2, '0')}`
            });
        }
    }

    const params = {
        scheduleId: bizItemId,
        day: day,
        times: times,
    }

    console.log(params)

    // const response = await productStore.setScheduleTime(bizItemId, schId, params);

    // if(response.status_code <= 300) {

    // }
};

// 상품 노출/비노출 버튼 (캘린더 헤더 버튼)
const clickProductImpUpdateBtn = (async(itemId, isImp) => {
    let params = [
        {
            "bizItemId" : itemId,
            "isImp" : isImp,
        }
    ]

    let response = await productStore.setItemShow(params);

    if(response.status_code <= 300){
        productStore.getProductList();
    }
})

// ---------------------------------------------
// 캘린더 구성 옵션
// ---------------------------------------------
const config = ref({
    viewType: "Resources", // 리소스 뷰 모드
    locale: "ko-kr", // 언어 설정
    timeFormat: "Clock24Hours", // 타임 포맷 24시 형식
    hourNameShort: false, 
    columns: columns.value,           // computed columns 연결
    events: events.value,             // events 연결
    eventMoveHandling: "Disabled", // 이벤트셀 움직이는것 막음
    eventResizeHandling: "Disabled", // 이벤트셀 핸들링 막음
    startDate: format(currentDate.value, 'yyyy-MM-dd'),
    cellHeight: 40,
    headerHeight: 64,

    // 비노출, 휴무일 처리
    onBeforeCellRender: (args) => {
        const resourceId = args.cell.resource;
        //  productList에서 현재 리소스(상품)의 정보 찾기
        const product = productList.value.find(p => p.bizItemId === resourceId);

        // 만약 상품이 비노출 상품인 경우(isImp === false) 컬럼 전체 회색 처리
        if (product && !product.isImp) {
            args.cell.properties.backColor = "#EDEDF2"; // 비노출 상품 배경색
            return;
        }

        //  노출 중인 상품 중 '휴무일'인 경우 처리
        const schedule = productScheduleDataList.value.find(s => s.bizItemId === resourceId);
        if (schedule && schedule.isHoliday) {
            args.cell.properties.backColor = "#EDEDF2"; // 휴무일 배경색
            return;
        }

        // TODO: 노출 중인 상품 중 영업일이 아닌 경우 처리 (isBusinessDay == false)
        

        // 정상 운영 상태 -> 흰색 처리
        args.cell.properties.backColor = "#fff";
        args.cell.html = "";
    },

    onBeforeEventRender: (args) => {
        const resourceId = args.data.resource;
        const product = productList.value.find(p => p.bizItemId === args.data.resource);
        if (product && !product.isImp) { // 상품 비노출 상태인 경우
            args.data.cssClass = "hidden-event"; // 이벤트를 화면에서 숨김
        }

        const schedule = productScheduleDataList.value.find(s => s.bizItemId === resourceId);
        if (schedule && !schedule.isBusinessDay) { // 영업일 여부
            args.data.cssClass = "hidden-event"; // 이벤트를 화면에서 숨김
        }

        if(schedule && schedule.isHoliday) { // 휴무일인 경우
            args.data.cssClass = 'hidden-event';
        }
    },

    onHeaderClick: (args) => {
        // 헤더에 html로 삽입해준 버튼에 vue-click이벤트 불가함으로 클릭한 요소(타겟) 찾아서 이벤트 실행해줘야함

        if (args.originalEvent.target.classList.contains('imp-update-btn')) { // 상품 노출/비노출 버튼
            const target = args.originalEvent.target
            
            const bizItemId = Number(target.getAttribute('data-id'));
            const currentImp = target.getAttribute('data-imp') === 'true';
            const nextImp = !currentImp;
            
            clickProductImpUpdateBtn(bizItemId, nextImp);
        }
    }
})

// Computed가 변할 때 DayPilot 인스턴스에 데이터 업데이트해줌
watch([events, columns, currentDate], ([newEvents, newCols, newDate]) => {
    if (calendarRef.value) {
        calendarRef.value.control?.update({
            startDate: format(newDate, 'yyyy-MM-dd'),
            events: newEvents,
            columns: newCols,
        });
    }
}, { deep: true });

// 날짜가 변경되면 API 호출
watch(currentDate, async (newDate) => {
    const params = {
        startDate: formatDate(newDate),
        endDate: formatDate(newDate),
    };

    await Promise.all([
        productStore.getProductList(),
        productStore.getBusinessSchedule(params)
    ]);

}, { deep: true });

onMounted(async() => {
    // const params = {
    //     startDate: formatDate(currentDate.value),
    //     endDate: formatDate(currentDate.value),
    // };

    // await productStore.getProductList();
    // await productStore.getBusinessSchedule(params);
})
</script>

<template>
    <PageTitle title="간단 예약 관리" />

    <TableLayout>
        <template #filter>
            <FilterDate button-type="arrow" v-model="currentDate" :is-range="false" :default-select="'today'" />
        </template>

        <template #table>
            <div class="contents-wrapper">
                <DayPilotCalendar
                    id="dp-schedule-calendar"
                    ref="calendarRef"
                    :config="config"
                    :columns="columns"
                    :events="events"
                >
                    <template #event="{event}">
                        <div 
                            v-if="getIsImp(event.data.resource)" 
                            class="w-100 d-flex align-center justify-between"
                        >
                            <label class="toggle" @click="(e) => handleToggle(event, e.target.checked)">
                                <input type="checkbox" :checked="event.data.tags.bitValue === '1'" @click.stop />
                                <img class="toggle-img" />
                            </label>

                            <span class="body-s">/ {{ event.data.tags.stock }}</span>
                        </div>
                    </template>
                </DayPilotCalendar>
            </div>
        </template>

    </TableLayout>

</template>

<style lang="scss" scoped>
    .contents-wrapper {
        width: 100%;
        // overflow: hidden;
    }
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

        &::-webkit-scrollbar {
            height: 8px; /* 가로 스크롤바 두께 */
        }

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

            > div > table > tbody > tr > td:nth-child(1) {
                position: sticky;
                left: 0;
                z-index: 1;
            }

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

    /* 각 컬럼과 셀의 너비를 강제로 고정 */
    :deep(.calendar_default_colheader),
    :deep(.calendar_default_cell) {
        min-width: 220px !important; 
        max-width: 220px !important;
        // width: 220px !important;
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
        border-right: 0;
        color: $gray-700;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
    }

    :deep(.product-header-cell) {
        width: 100%;
        .product-name {
            display: flex;
            @include flex-center;
            height: 32px;

            border-right: 1px solid $gray-200;
        }
        .header-btn-group {
            display: flex;
            align-items: center;
            padding: 0 16px;
            // width: 100%;
            height:30px;
            margin-bottom: 1px;

            border-top: 1px solid $gray-200;
            // border-bottom: 1px solid #dedee3;
            border-right: 1px solid $gray-200;
            background-color: $gray-00;

            & > div {
                width: 100%;
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
        margin-left: 1px;
        margin-top: 1px;
        margin-bottom: 1px;
        margin-right: 1px;
        padding: 0 16px;
        @include flex-center;

        border: none;

        div {width: 100%;}
    }
    :deep(.calendar_default_event_bar) {display: none;} // 왼쪽 색상바 안보이도록
    :deep(.calendar_default_shadow) {display: none;}

    :deep(.hidden-event) {
        display: none !important;
    }

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

                &.confirm {color: $status-confirmed_text;}
                &.hold {color: $status-onHold_text;}
                &.canceled {color: $status-canceled_text;}
                &.personal {color: $status-personal_text}
            }
        }
    }

    .event-content {
        display: flex;
        flex-direction: column;
        gap:2px;

        @include typo($body-xs-size, $body-xs-weight, $body-xs-spacing, $body-xs-line);

        .reserve-title {
            &.confirm {color: $status-confirmed_text;}
            &.hold {color: $status-onHold_text;}
            &.canceled {color: $status-canceled_text;}
            &.personal {color: $status-personal_text}
        }
        .reserve-memo {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            color: $gray-600;
        }
    }
</style>