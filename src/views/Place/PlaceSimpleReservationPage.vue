<!-- 네이버 플레이스 관리 > 간단 예약 관리 -->
<script setup>
import FilterDate from '@/components/common/filters/FilterDate.vue';
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';

import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-vue";
import { ref, onMounted, watch, computed } from 'vue';
// 스토어
import { useProductStore } from '@/stores/productStore';
import { storeToRefs } from 'pinia';

const productStore = useProductStore()

const currentDate = ref(new Date());
// 캘린더 인스턴스 참조
const calendarRef = ref(null);

const { productList } = storeToRefs(productStore);

// productList를 DayPilot 형식(columns)으로 변환
const columns = computed(() => {
    return productList.value.map(product => ({
        id: product.bizItemId,
        name: product.name,
        width: 220, // 너비
        html: `
            <div class="product-header-cell">
                <div class="product-name">${product.name}</div>
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
                            class="btn btn--size-24 btn--blue-outline active-status" 
                            onclick="window.toggleVisibility('${product.bizItemId}')"
                        >
                            노출중
                        </button>
                    </div>
                </div>
            </div>
        `
    }));
});

// ---------------------------------------------
// 캘린더 구성 옵션
// ---------------------------------------------
const config = ref({
    viewType: "Resources", // 리소스 뷰 모드
    locale: "ko-kr", // 언어 설정
    timeFormat: "Clock24Hours", // 타임 포맷 24시 형식
    hourNameShort: false, 

    // 가로 스크롤 활성화를 위한 설정
    widthSpec: "Fixed", // 너비를 고정하여 컨테이너보다 넓으면 스크롤 생성
    headerWidth: 64,    // 왼쪽 시간축 너비
    columnWidth: 220,

    startDate: currentDate,
    cellDuration: 64,
    cellHeight: 80,
    headerHeight: 64,
})

// columns가 계산된 후 혹은 데이터 로드 후 실행
watch(columns, (newCols) => {
    if (calendarRef.value && newCols.length > 0) {
        // control.update를 통해 DayPilot 내부 렌더링 엔진에 변경 알림
        calendarRef.value.control.update({
            columns: newCols,
            // widthSpec: "Fixed",
            // columnWidthSpec: "Auto",
        });
    }
}, { deep: true });

onMounted(() => {
    productStore.getProductList()
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
                    ref="calendarRef"
                    :config="config"
                    :columns="columns"
                >

                </DayPilotCalendar>
            </div>
        </template>

    </TableLayout>

</template>

<style lang="scss" scoped>
    // .contents-wrapper {
    //     width: 100%;
    //     overflow: hidden;
    // }
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
        }

        // 캘린더영역
        & > div:nth-child(2) {
            height: calc(100% - 64px) !important; 
            width: auto !important;
            overflow: visible !important;

            & > div > table > tbody > tr > td:nth-child(1) {
                position: sticky;
                top: 64px;
                left: 0;
                z-index: 1;
            }
        }

        table {
            width: auto !important; 
            table-layout: fixed;
        }

    }

    /* 3. 각 컬럼과 셀의 너비를 강제로 고정 */
    :deep(.calendar_default_colheader),
    :deep(.calendar_default_colheader_inner),
    :deep(.calendar_default_cell),
    :deep(.calendar_default_cell_inner) {
        // width: 220px !important; /* 리소스당 너비 */
        min-width: 200px !important;
    }
    :deep(.calendar_default_corner) {
        width: 65px !important;
    }

    /* 4. 왼쪽 시간축 고정 */
    :deep(.calendar_default_rowheader),
    :deep(.calendar_default_rowheader_inner) {
        width: 64px !important;
        min-width: 64px !important;
        // margin-right: 1px;
        border-right: 1px solid $gray-200;
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
            height:32px;
            margin-bottom: 1px;

            border-top: 1px solid $gray-200;
            border-bottom: 1px solid #dedee3;
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
        margin-left: 4px;
        margin-top: 4px;
        margin-bottom: 4px;
        
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