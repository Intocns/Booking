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
import CommonTable from '@/components/common/CommonTable.vue';
import Modal from '@/components/common/Modal.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import FilterKeywordBtn from '@/components/common/filters/FilterKeywordBtn.vue';
import FilterCheckbox from '@/components/common/filters/FilterCheckbox.vue';
import ReserveInfo from '@/components/common/modal-content/ReserveInfo.vue';
import SendSmsTalk from '@/components/common/modal-content/SendSmsTalk.vue';
import icSms from '@/assets/icons/ic_sms.svg';
import icReset from '@/assets/icons/ic_reset.svg';
import icSort from '@/assets/icons/ic_sort.svg';
import icSortUp from '@/assets/icons/ic_sort_up.svg';
import icSortDown from '@/assets/icons/ic_sort_down.svg';
const reservationStore = useReservationStore();
const hospitalStore = useHospitalStore();
const modalStore = useModalStore();
const talkSmsStore = useTalkSmsStore();

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
    { key: 'roomName', label: '예약 내용', width: '12%' },
    { key: 'userName', label: '고객명', width: '7%', sortable: true, },
    { key: 'phoneTxt', label: '전화번호', width: '10%' },
    { key: 'petName', label: '동물명', width: '8%' },
    { key: 'speciesName', label: '종', width: '6%' },
    { key: 'doctor', label: '담당의', width: '7%' },
    { key: 'geReMemo', label: '병원 메모', width: '12%' },
    { key: 'reRouteTxt', label: '예약경로', width: '7%' },
    { key: 'createdAtTxt', label: '접수일시', width: '10%', sortable: true, },
    { key: 'actions', label: '관리', width: '7%' },
]

const reservationStatus = ref(['all']);
const doctorList = ref(['all']);
const reservationChannel = ref(['all']);
const keyword = ref('');
const showDetailFilter = ref(false);
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
        .filter(opt => categoryFilter.value.includes(opt.value) && categoryMap[opt.value].items.length > 0)
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
    reservationStore.getReserveInfo(row.idx);
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
    <PageTitle
        title="전체 예약 조회"
        :total="totalCount"
        :details="reserveSummary"
        helper-text="예약일자를 기준으로 내역이 조회됩니다"
    />

    <!-- 테이블 콘텐츠 (검색필터 + 테이블) -->
    <TableLayout>
        <!-- 검색필터 -->
        <template #filter>
            <FilterDate v-model="dateRange" :default-select="'today'" />
            <FilterSelect
                label="담당의"
                :options="doctorOptions"
                v-model="doctorList"
                />
            <FilterKeywordBtn
                v-model="keyword"
                :placeholder="'고객명, 동물명, 전화번호 검색'"
                @search="searchList()" />

            <button class="btn btn--size-32 btn--black-outline" @click="searchClear()" style="width: 40px;">
                <img :src="icReset" alt="초기화아이콘">
            </button>

            <FilterCheckbox
                v-model="categoryFilter"
                :options="categoryOptions"
            />

            <button class="btn btn--size-32 btn--black-outline" @click="showDetailFilter = !showDetailFilter">
                상세 조회
            </button>

            <!-- 상세 조회 필터 (토글) -->
            <div v-if="showDetailFilter" class="detail-filter">
                <FilterSelect
                    label="예약상태"
                    :options="reserveStatusOptions"
                    v-model="reservationStatus"
                />
                <FilterSelect
                    label="예약 경로"
                    :options="reservationChannelOptions"
                    v-model="reservationChannel"
                />
            </div>
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
                                <th
                                    v-for="col in columns"
                                    :key="col.key"
                                    :class="[
                                        { 'sortable-th': col.sortable },
                                        { 'is-sorted': sortConfig.key === col.key && sortConfig.order !== 'none' }
                                    ]"
                                    @click="handleSort(col)"
                                >
                                    <div class="d-flex align-center justify-center gap-4">
                                        {{ col.label }}
                                        <span v-if="col.sortable" class="sort-icons">
                                            <template v-if="sortConfig.key === col.key">
                                                <span v-if="sortConfig.order === 'asc'"><img :src="icSortUp" alt="정렬" width="20"></span>
                                                <span v-if="sortConfig.order === 'desc'"><img :src="icSortDown" alt="정렬" width="20"></span>
                                            </template>
                                            <span v-else><img :src="icSort" alt="정렬" width="20"></span>
                                        </span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody v-for="group in groupedReserveList" :key="group.value">
                            <!-- 카테고리 그룹 헤더 -->
                            <tr class="category-group-header">
                                <td :colspan="columns.length">
                                    {{ group.groupLabel }}
                                </td>
                            </tr>
                            <!-- 데이터 행 -->
                            <tr
                                v-for="row in group.items"
                                :key="row.idx"
                                @click="handelReserveDetail(row)"
                                :class="[row.rowClass, 'is-clickable']"
                            >
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
                                            <button class="btn btn--size-24 btn--black-outline" @click.stop="handelReserveDetail(row)">상세</button>
                                            <button class="btn btn--size-24 btn--black-outline" @click.stop="openSmsModal(row)"><img :src="icSms" alt="SMS"></button>
                                        </div>
                                    </template>
                                    <!-- 기본 -->
                                    <template v-else>
                                        {{ row[col.key] }}
                                    </template>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div v-if="!reservationStore.isLoading && reservationStore.reserveList.length === 0" class="empty-box">
                        <img src="" alt="">
                        <span class="title-s">검색 결과가 없습니다.</span>
                    </div>
                </div>
            </div>
        </template>
    </TableLayout>

    <!-- 예약 정보 안내 모달 -->
    <Modal
        v-if="modalStore.reserveInfoModal.isVisible"
        :size="modalStore.reserveInfoModal.data.reserve.clinicType == '개인일정' || modalStore.reserveInfoModal.data.reserve.clinicType == '일반예약' ? 's' : 'l'"
        title="고객 예약 정보"
        :modalState="modalStore.reserveInfoModal"
    >
        <ReserveInfo @refresh-list="searchList" />
    </Modal>

    <!-- 문자 발송 모달 -->
    <Modal 
        v-if="modalStore.smsModal.isVisible"
        size="s"
        title="알림톡/SMS 발송"
        :modalState="modalStore.smsModal"
    >
        <SendSmsTalk ref="sendSmsTalkRef" :reservationData="selectedReservation" />
    </Modal>
</template>

<style lang="scss" scoped>
    // 예약 대기 tr 배경색
    .row-pending {
        background-color: $status-onHold_table_bg !important;
    }
    // 예약 취소/거절 tr 연하게
    .row-canceled {
        td {color: $gray-400}
    }

    .detail-filter {
        width: 100%;
        display: flex;
        gap: 16px;
        padding-top: 12px;
        border-top: 1px solid $gray-100;
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
        overflow-x: hidden;
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

            tr { height: 40px; }
            th {
                border-top: 2px solid $gray-700;
                border-bottom: 1px solid $gray-300;
                @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
                color: $gray-700;
                padding: 0 8px;
                text-align: center;
                white-space: nowrap;

                &.sortable-th { cursor: pointer; }
                &.sortable-th:hover { background-color: $gray-200; }
                &.is-sorted { background-color: $gray-200; }
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

            &:hover:not(.category-group-header) { background-color: $primary-50; }

            &.is-clickable td { cursor: pointer; }
        }
    }

    .category-group-header {
        background-color: $gray-100 !important;
        height: 36px;

        &:hover { background-color: $gray-100 !important; }

        td {
            padding: 0 8px;
            text-align: left;
            border-bottom: 1px solid $gray-300;
            @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
            color: $gray-900;
        }
    }

    .sort-icons { flex-shrink: 0; }

    .empty-box {
        height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
</style>