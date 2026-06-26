<!-- 전체예약 조회 -->
<script setup>
import { onMounted, ref, computed, watch, nextTick } from 'vue';
import { startOfDay, subDays, addDays } from "date-fns";
import { formatDate } from "@/utils/dateFormatter";
import { RESERVE_STATUS_OPTIONS, RESERVE_ROUTE_OPTIONS } from "@/constants";
import { useReservationStore } from '@/stores/reservationStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import { useModalStore } from '@/stores/modalStore';
import { useTalkSmsStore } from '@/stores/talkSmsStore';
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import Modal from '@/components/common/Modal.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import FilterKeywordBtn from '@/components/common/filters/FilterKeywordBtn.vue';
import FilterCheckbox from '@/components/common/filters/FilterCheckbox.vue';
import ReserveInfo from '@/components/common/modal-content/ReserveInfo.vue';
import SendSmsTalk from '@/components/common/modal-content/SendSmsTalk.vue';
import icSms from '@/assets/icons/ic_sms.svg';
import icReset from '@/assets/icons/ic_reset.svg';
import icEmpty from '@/assets/icons/ic_empty.svg';
import icInformationB from '@/assets/icons/ic_infomation_b.svg';
const reservationStore = useReservationStore();
const hospitalStore = useHospitalStore();
const modalStore = useModalStore();
const talkSmsStore = useTalkSmsStore();

// 예약 정보 모달 사이즈
const reserveInfoModalSize = computed(() => {
    const clinicType = modalStore.reserveInfoModal.data?.reserve?.clinicType;
    if (clinicType === '진료예약') return 'l';
    return 's';
});

// SMS 모달 컴포넌트 ref 및 선택된 예약 데이터
const sendSmsTalkRef = ref(null);
const selectedReservation = ref(null);

// 문자 발송 모달 열기
const openSmsModal = (row) => {
    // row 객체 전체를 전달하고 필요한 필드만 추가 매핑
    selectedReservation.value = {
        ...row, // row 객체의 모든 필드 포함
        petName: row?.petName,
        reservationDate: row?.reTimeTxt,
        reservationTime: row?.reTimeHisTxt,
        productName: row?.roomName,
        hospitalPhone: hospitalStore.hospitalData?.company_tel, //cocode 기반 실제 병원전화번호
        phoneTxt: row?.phoneTxt, // 수신번호용 전화번호
        protectorName: row?.userName, // 고객명
        visitSource: row?.reRouteTxt, // 예약경로 텍스트
        visitSourceText: '', // 방문경로(기타일 경우 text 입력 값)
    };

    modalStore.smsModal.openModal();
};

// 테이블 col 정의
const columns = [
    { key: 'reTimeTxt', label: '예약일자', width: '8%', sortable: true, },
    { key: 'reTimeHisTxt', label: '예약시간', width: '6%', sortable: true, },
    { key: 'inStateTxt', label: '예약상태', width: '6%' },
    { key: 'clinicTypeTxt', label: '예약 타입', width: '8%' },
    { key: 'roomName', label: '상품명/진료실명', width: '10%', tooltip: 'Intovet GE 또는 Intovet Cloud에서 직접 생성한 예약의 경우,\n해당 예약으로 인해 마감된 외부예약의 상품명/진료실명이 표시됩니다.' },
    { key: 'userName', label: '고객명', width: '7%', sortable: true, },
    { key: 'phoneTxt', label: '전화번호', width: '10%' },
    { key: 'petName', label: '동물명', width: '8%' },
    { key: 'speciesName', label: '종', width: '6%' },
    { key: 'doctor', label: '담당의', width: '7%' },
    { key: 'reRouteTxt', label: '예약경로', width: '7%' },
    { key: 'createdAtTxt', label: '접수일시', width: '10%', sortable: true, },
    { key: 'actions', label: '관리', width: '7%' },
]

const reservationStatus = ref(['all']);
const doctorList = ref(['all']);
const reservationChannel = ref(['all']);
const keyword = ref('');
const categoryFilter = ref(['진료예약', '진료예정', '백신', '미용', '기타']); // 전체 선택 기본값
const categoryOptions = [
    { label: '진료 예약', value: '진료예약', color: '#3B82F6' },
    { label: '진료 예정', value: '진료예정', color: '#22C55E' },
    { label: '백신', value: '백신', color: '#A855F7' },
    { label: '미용', value: '미용', color: '#F97316' },
    { label: '기타', value: '기타', color: '#6B7280' },
];
const dateRange = ref([]);

const reserveStatusOptions = RESERVE_STATUS_OPTIONS;
const reservationChannelOptions = RESERVE_ROUTE_OPTIONS;

const doctorOptions = computed(() => {
    const options = [{ label: '전체', value: 'all' }];
    if (hospitalStore.doctorList?.length > 0) {
        const doctors = hospitalStore.doctorList.map(doc => ({
            label: doc.userName || doc.name || '',
            value: doc.id
        }));
        options.push(...doctors);
    }
    return options;
});

const startDate = computed(() => formatDate(dateRange.value?.[0]));
const endDate = computed(() => formatDate(dateRange.value?.[1]));
const totalCount = computed(() => reservationStore.reserveList.length);

const reserveSummary = computed(() => {
    const counts = {};
    categoryOptions.forEach(opt => { counts[opt.value] = 0; });

    reservationStore.reserveList.forEach(row => {
        const cat = row.category;
        if (counts[cat] !== undefined) counts[cat]++;
        else counts['기타']++;
    });

    return categoryOptions.map(opt => ({
        label: opt.label,
        value: counts[opt.value].toString().padStart(2, '0'),
    }));
});

// 컬럼 정렬
const sortConfig = ref({ key: null, order: 'none' });

const handleSort = (col) => {
    if (!col.sortable) return;
    let order = 'asc';
    if (sortConfig.value.key === col.key) {
        if (sortConfig.value.order === 'asc') order = 'desc';
        else if (sortConfig.value.order === 'desc') order = 'none';
    }
    sortConfig.value = { key: order === 'none' ? null : col.key, order };
};

const sortItems = (items) => {
    const { key, order } = sortConfig.value;
    if (!key || order === 'none') return items;
    return [...items].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal === bVal) return 0;
        const modifier = order === 'asc' ? 1 : -1;
        return aVal > bVal ? modifier : -modifier;
    });
};

// 테이블 그룹 헤더용 라벨 (필터 라벨과 다를 수 있음)
const categoryGroupLabels = {
    '기타': '기타 (일반예약/개인일정)',
};

// 카테고리별 그룹핑된 리스트 (각 그룹 내에서 정렬)
const groupedReserveList = computed(() => {
    const list = reservationStore.reserveList;
    if (!list || !list.length) return [];

    const categoryMap = {};
    categoryOptions.forEach(opt => {
        categoryMap[opt.value] = { ...opt, items: [] };
    });

    list.forEach(row => {
        const cat = row.category;
        if (categoryMap[cat]) {
            categoryMap[cat].items.push(row);
        } else {
            categoryMap['기타'].items.push(row);
        }
    });

    return categoryOptions
        .filter(opt => categoryFilter.value.includes(opt.value))
        .map(opt => ({
            ...categoryMap[opt.value],
            groupLabel: categoryGroupLabels[opt.value] || opt.label,
            items: sortItems(categoryMap[opt.value].items),
        }));
});

// 필터 값 변환 헬퍼 함수 ('all'이 포함되어 있으면 null로 변환)
const convertFilterParam = (value) => {
    if (!value || value.length === 0 || value.includes('all')) return null;
    return value;
};

const searchList = async () => {
    const isStatusEmpty = !reservationStatus.value?.length;
    const isDoctorEmpty = !doctorList.value?.length;
    const isRouteEmpty = !reservationChannel.value?.length;
    const isCategoryEmpty = !categoryFilter.value?.length;

    if (isStatusEmpty || isDoctorEmpty || isRouteEmpty || isCategoryEmpty) {
        reservationStore.reserveList = [];
        return;
    }

    reservationStore.getReservationList({
        status: convertFilterParam(reservationStatus.value),
        doctorId: convertFilterParam(doctorList.value),
        keyword: keyword.value?.trim() || null,
        startDate: startDate.value,
        endDate: endDate.value,
        reRoute: convertFilterParam(reservationChannel.value),
        clinicType: categoryFilter.value.map(v => v === '미용' ? '미용예약' : v),
        order: 0,
    }, categoryFilter.value);
};

const searchClear = () => {
    reservationStatus.value = ['all'];
    doctorList.value = ['all'];
    reservationChannel.value = ['all'];
    keyword.value = '';
    const today = startOfDay(new Date());
    dateRange.value = [today, today];
};

let isInitialMount = true;

watch([reservationStatus, doctorList, reservationChannel, dateRange, categoryFilter], () => {
    if (isInitialMount) return;
    nextTick(() => searchList());
}, { deep: true });

const handelReserveDetail = (row) => {
    reservationStore.getReserveInfo(row.idx, row);
};

onMounted(async () => {
    if (hospitalStore.doctorList.length === 0) {
        await hospitalStore.getDoctorList();
    }
    hospitalStore.getHospitalInfo(); // 발신번호(병원 전화)용
    talkSmsStore.preloadTemplatesAndPoint();
    searchList();
    isInitialMount = false;
});
</script>
<template>
    <!-- 페이지 타이틀 -->
    <PageTitle title="전체 예약 조회" :total="totalCount" :details="reserveSummary" helper-text="예약일자를 기준으로 내역이 조회됩니다" />

    <!-- 테이블 콘텐츠 (검색필터 + 테이블) -->
    <TableLayout>
        <!-- 검색필터 -->
        <template #filter>
            <FilterDate v-model="dateRange" :default-select="'today'" />
            <FilterSelect label="담당의" :options="doctorOptions" v-model="doctorList" />
            <FilterSelect label="예약상태" :options="reserveStatusOptions" v-model="reservationStatus" />
            <FilterSelect label="예약 경로" :options="reservationChannelOptions" v-model="reservationChannel" />
            <FilterKeywordBtn v-model="keyword" :placeholder="'고객명, 동물명, 전화번호 검색'" @search="searchList()" />

            <button class="btn btn--size-32 btn--dark reset-btn" @click="searchClear()" style="width: 40px;">
                <img :src="icReset" alt="초기화아이콘">
            </button>

            <div class="filter-spacer"></div>

            <FilterCheckbox v-model="categoryFilter" :options="categoryOptions" />
        </template>

        <!-- 테이블 -->
        <template #table>
            <div class="table-section">
                <div class="table-wrapper">
                    <table class="table">
                        <colgroup>
                            <col v-for="(col, idx) in columns" :key="idx" :width="col.width">
                        </colgroup>
                        <thead>
                            <tr>
                                <th v-for="col in columns" :key="col.key" :class="[
                                    { 'sortable-th': col.sortable },
                                    { 'is-sorted': sortConfig.key === col.key && sortConfig.order !== 'none' }
                                ]" @click="handleSort(col)">
                                    <div class="d-flex align-center justify-center gap-4">
                                        {{ col.label }}
                                        <div v-if="col.tooltip" class="helper">
                                            <img :src="icInformationB" alt="안내아이콘" class="helper__icon">
                                            <div class="tooltip-content">
                                                {{ col.tooltip }}
                                            </div>
                                        </div>
                                        <span v-if="col.sortable" class="sort-icons">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <rect x="0.5" y="0.5" width="23" height="23" rx="3.5" fill="white" />
                                                <rect x="0.5" y="0.5" width="23" height="23" rx="3.5"
                                                    stroke="#CDCDD1" />
                                                <path
                                                    d="M15.8459 10.3333C16.2836 10.3333 16.51 9.8107 16.2107 9.49136L12.7295 5.77817C12.3345 5.35676 11.6655 5.35676 11.2705 5.77817L7.78935 9.49136C7.48997 9.8107 7.7164 10.3333 8.15412 10.3333H15.8459Z"
                                                    :fill="sortConfig.key === col.key ? (sortConfig.order === 'asc' ? '#0C75FF' : '#CDCDD1') : '#49494D'" />
                                                <path
                                                    d="M15.8459 13.6667C16.2836 13.6667 16.51 14.1893 16.2107 14.5086L12.7295 18.2218C12.3345 18.6432 11.6655 18.6432 11.2705 18.2218L7.78935 14.5086C7.48997 14.1893 7.7164 13.6667 8.15412 13.6667H15.8459Z"
                                                    :fill="sortConfig.key === col.key ? (sortConfig.order === 'desc' ? '#0C75FF' : '#CDCDD1') : '#49494D'" />
                                            </svg>
                                        </span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody v-for="group in groupedReserveList" :key="group.value">
                            <!-- 카테고리 그룹 헤더 -->
                            <tr class="category-group-header">
                                <td :colspan="columns.length">
                                    <span class="category-dot"></span>
                                    {{ group.groupLabel }}
                                </td>
                            </tr>
                            <!-- 데이터 행 -->
                            <template v-if="group.items.length > 0">
                                <tr v-for="row in group.items" :key="row.idx" @click="handelReserveDetail(row)"
                                    :class="[row.rowClass, 'is-clickable']">
                                    <td v-for="col in columns" :key="col.key">
                                        <!-- 예약상태 -->
                                        <template v-if="col.key === 'inStateTxt'">
                                            <div class="status-cell" :class="`status-cell--state-${row.inState}`">
                                                {{ row[col.key] }}
                                            </div>
                                        </template>
                                        <!-- 예약경로 -->
                                        <template v-else-if="col.key === 'reRouteTxt'">
                                            <div class="status-cell">
                                                <span class="dot" :class="`dot--route-${row.reRoute}`"></span>
                                                {{ row[col.key] }}
                                            </div>
                                        </template>
                                        <!-- 관리 버튼 -->
                                        <template v-else-if="col.key === 'actions'">
                                            <div class="d-flex justify-center gap-4">
                                                <button class="btn btn--size-24 btn--black-outline"
                                                    @click.stop="handelReserveDetail(row)">상세</button>
                                                <button class="btn btn--size-24 btn--black-outline"
                                                    @click.stop="openSmsModal(row)"><img :src="icSms"
                                                        alt="SMS"></button>
                                            </div>
                                        </template>
                                        <!-- 기본 -->
                                        <template v-else>
                                            {{ row[col.key] != null && row[col.key] !== '' ? row[col.key] : '' }}
                                        </template>
                                    </td>
                                </tr>
                            </template>
                            <!-- 데이터 없음 -->
                            <tr v-else class="category-empty-row">
                                <td :colspan="columns.length">
                                    <div class="category-empty">
                                        <img :src="icEmpty" alt="비어있음 아이콘">
                                        <span class="body-m">등록된 내역이 없습니다.</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div v-if="!reservationStore.isLoading && reservationStore.reserveList.length === 0"
                        class="empty-box">
                        <img src="" alt="">
                        <span class="title-s">검색 결과가 없습니다.</span>
                    </div>
                </div>
            </div>
        </template>
    </TableLayout>

    <!-- 예약 정보 안내 모달 -->
    <Modal v-if="modalStore.reserveInfoModal.isVisible" :size="reserveInfoModalSize" title="고객 예약 정보"
        :modalState="modalStore.reserveInfoModal">
        <ReserveInfo @refresh-list="searchList" />
    </Modal>

    <!-- 문자 발송 모달 -->
    <Modal v-if="modalStore.smsModal.isVisible" size="s" title="알림톡/SMS 발송" :modalState="modalStore.smsModal">
        <SendSmsTalk ref="sendSmsTalkRef" :reservationData="selectedReservation" />
    </Modal>
</template>

<style lang="scss" scoped>
// 예약 대기 tr 배경색 (노란색)
.row-pending {
    background-color: #FFF6D9 !important;

    &:hover {
        background-color: #E2F3FF !important;
    }
}

// 예약 취소/거절 tr 연하게
.row-canceled {
    td {
        color: $gray-400
    }
}

.status-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

:deep(.search-filter) {
    width: 100%;
    flex-wrap: nowrap;
    align-items: center;

    .search-filter__label {
        white-space: nowrap;
    }
}

// 일자 datepicker 너비 축소
:deep(.search-filter__datepicker) {
    width: 220px;
}

// 오늘, 7일, 기간선택 버튼 + 초기화 버튼 selected 스타일
:deep(.search-filter__date-button) {
    .btn.selected {
        background-color: $gray-900;
        color: $gray-200;
        border-color: $gray-900;
    }
}

.btn--black-outline {

    &:hover,
    &.selected {
        background-color: $gray-900;
        color: $gray-200;
        border-color: $gray-900;
    }
}

.reset-btn {
    flex-shrink: 0;
    background-color: #0C0C0D;
    border-color: #0C0C0D;

    img {
        filter: brightness(0) invert(0.9);
    }
}

.filter-spacer {
    flex: 1;
}

.table-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid $gray-200;
    background-color: $gray-00;
}

.table-wrapper {
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
}

.table {
    width: 100%;
    border-spacing: 0;
    table-layout: fixed;

    thead {
        position: sticky;
        top: 0;
        z-index: 5;
        background-color: $gray-50;

        tr {
            height: 40px;
        }

        th {
            border-top: 2px solid $gray-700;
            border-bottom: 1px solid $gray-300;
            @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
            color: $gray-700;
            padding: 0 8px;
            text-align: center;
            white-space: nowrap;

            &.sortable-th {
                cursor: pointer;
            }

            &.sortable-th:hover {
                background-color: $gray-200;
            }

            &.is-sorted {
                background-color: $gray-200;
            }
        }
    }

    td {
        @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
        color: $gray-900;
        border-bottom: 1px solid $gray-300;
        padding: 0 8px;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    tbody tr {
        height: 36px;
        background-color: $gray-00;

        &:hover:not(.category-group-header) {
            background-color: #E2F3FF;
        }

        &.is-clickable td {
            cursor: pointer;
        }
    }
}

.category-group-header {
    background-color: $gray-100 !important;
    height: 36px;

    &:hover {
        background-color: $gray-100 !important;
    }

    td {
        padding: 0 8px;
        text-align: left;
        border-bottom: 1px solid $gray-300;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
        color: $gray-900;
    }

    .category-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #7899F0;
        margin-right: 6px;
        vertical-align: middle;
    }
}

.category-empty-row {
    &:hover {
        background-color: $gray-00 !important;
    }

    .category-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 24px 0;
        color: $gray-400;
    }
}

.sort-icons {
    flex-shrink: 0;
    display: flex;
    align-items: center;
}

.empty-box {
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.helper {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: pointer;

    &__icon {
        width: 16px;
        height: 16px;
    }

    .tooltip-content {
        visibility: hidden;
        opacity: 0;
        position: absolute;
        top: 10px;
        left: calc(100% + 8px);
        width: max-content;
        max-width: 400px;
        padding: 15px;
        border-radius: 5px;
        border: 1px solid $primary-700;
        background-color: $primary-50;
        @include typo($body-s-size, $body-s-weight, $body-s-spacing, $body-s-line);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        white-space: pre-wrap;
        text-align: left;
        z-index: 1;
    }

    &:hover {
        .tooltip-content {
            visibility: visible;
            opacity: 1;
        }
    }
}
</style>