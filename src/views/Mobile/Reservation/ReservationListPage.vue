<script setup>
import TableLayout from '@/components/common/TableLayout.vue';
import ListTable from '@/components/common/Mobile/ListTable.vue';
import Modal from '@/components/common/Modal.vue';
import ReserveInfo from '@/components/common/modal-content/mobile/ReserveInfo.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterKeyword from '@/components/common/filters/FilterKeyword.vue';
import FilterDoctorBtn from '@/components/common/Mobile/filters/FilterDoctorBtn.vue';

import icCheckW from '@/assets/icons/mobile/ic_check_w.svg'
import icCheckB from '@/assets/icons/mobile/ic_check_b.svg'
import icClose from '@/assets/icons/mobile/ic_close_b.svg'
import icArrowLeft from '@/assets/icons/ic_arrow_left.svg'

import { onMounted, computed, ref, watch, nextTick } from 'vue';
import { formatDate } from "@/utils/dateFormatter";
import { RESERVE_STATUS_OPTIONS, RESERVE_ROUTE_OPTIONS } from "@/constants";

import { useReservationStore } from '@/stores/reservationStore';
import { useModalStore } from '@/stores/modalStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import FilterBtn from '@/components/common/Mobile/filters/FilterBtn.vue';
import { fromUnixTime } from 'date-fns';
import { formatCount } from '@/utils/countFormatter';

const reservationStore = useReservationStore();
const modalStore = useModalStore();
const hospitalStore = useHospitalStore();

const reservationStatus = ref(['all']);
const doctorList = ref(['all']);
const reservationChannel = ref(['all']);
const currentSort = ref('0')
const keyword = ref('');
const dateRange = ref([]);
const dynamicTitle = ref('고객 예약 정보'); // 고객예약정보 모달 타이틀
const categoryFilter = ref(['진료예약', '진료예정', '백신', '미용', '기타']); // 전체 선택 기본값
const categoryOptions = [
    { label: '진료 예약', value: '진료예약', color: '#3B82F6' },
    { label: '진료 예정', value: '진료예정', color: '#22C55E' },
    { label: '백신', value: '백신', color: '#A855F7' },
    { label: '미용', value: '미용', color: '#F97316' },
    { label: '기타', value: '기타', color: '#6B7280' },
];

const reserveStatusOptions = RESERVE_STATUS_OPTIONS;
const reservationChannelOptions = RESERVE_ROUTE_OPTIONS;
const sortOptions = [
    { label: '예약일 빠른 순', value: '0'},
    { label: '예약일 느린 순', value: '1'},
    { label: '접수일시 빠른 순', value: '2'},
    { label: '접수일시 느린 순', value: '3'},
]

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

// 탭 선택 상태 (null이면 전체)
const activeTab = ref(null);

const selectTab = (categoryValue) => {
    activeTab.value = activeTab.value === categoryValue ? null : categoryValue;
};

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
        categoryValue: opt.value,
    }));
});

// 탭 필터링된 리스트
const filteredByTab = computed(() => {
    if (activeTab.value === null) return sortedReserveList.value;
    return sortedReserveList.value.filter(row => row.category === activeTab.value);
});

// 정렬된 리스트 computed
const sortedReserveList = computed(() => {
    // 1. 데이터가 아예 없는 경우 빈 배열 반환
    if (!reservationStore.reserveList || reservationStore.reserveList.length === 0) {
        return [];
    }

    const list = [...reservationStore.reserveList];

    return list.sort((a, b) => {
        const dateA = a?.reTime || '';
        const dateB = b?.reTime || '';
        const regA = a?.createdAt || '';
        const regB = b?.createdAt || '';

        switch (currentSort.value) {
            case '0': // 예약일 빠른 순
                return dateA.localeCompare(dateB);
            case '1': // 예약일 느린 순
                return dateB.localeCompare(dateA);
            case '2': // 접수일시 빠른 순
                return regA.localeCompare(regB);
            case '3': // 접수일시 느린 순
                return regB.localeCompare(regA);
            default:
                return 0;
        }
    });
});

// 카테고리별로 그룹핑된 리스트
const collapsedSections = ref({});

const toggleSection = (categoryValue) => {
    collapsedSections.value[categoryValue] = !collapsedSections.value[categoryValue];
};

const isSectionCollapsed = (categoryValue) => {
    return !!collapsedSections.value[categoryValue];
};

const groupedReserveList = computed(() => {
    const list = sortedReserveList.value;
    if (!list.length) return [];

    const categoryMap = {};
    categoryOptions.forEach(opt => {
        categoryMap[opt.value] = { ...opt, items: [] };
    });

    list.forEach(row => {
        const cat = row.category;
        if (categoryMap[cat]) {
            categoryMap[cat].items.push(row);
        } else {
            categoryMap[5].items.push(row); // 기타
        }
    });

    // 필터에 선택된 카테고리만, 아이템이 있는 것만 반환
    return categoryOptions
        .filter(opt => categoryFilter.value.includes(opt.value) && categoryMap[opt.value].items.length > 0)
        .map(opt => categoryMap[opt.value]);
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
        clinicType: categoryFilter.value.length === categoryOptions.length ? null : categoryFilter.value,
        order: 0,
    });
};

// Today 버튼 클릭 함수
const setToday = () => {
    const today = new Date();
    // 시작과 끝을 오늘로 설정 (FilterDate가 받아들이는 형식에 맞춤)
    dateRange.value = [today, today];
};

// 현재 선택된 날짜가 오늘인지 확인하는 computed
const isTodayActive = computed(() => {
    if (!dateRange.value || dateRange.value.length < 2) return false;
    
    const todayStr = formatDate(new Date());
    const startStr = formatDate(dateRange.value[0]);
    const endStr = formatDate(dateRange.value[1]);
    
    return startStr === todayStr && endStr === todayStr;
});

const closeReserveInfoModal = () => {
    modalStore.reserveInfoModal.closeModal()
    document.body.style.overflow = '';
}

const handleTitleUpdate = (newTitle) => {
    dynamicTitle.value = newTitle;
};

watch([reservationStatus, doctorList, reservationChannel, categoryFilter, dateRange], () => {
    nextTick(() => searchList());
}, { deep: true });

onMounted(async() => {
    window.scrollTo({ top: 0, behavior: 'auto' })

    // 담당의 리스트 불러오기
    if(hospitalStore.doctorList.length == 0) {
        await hospitalStore.getDoctorList();
    }
    searchList(); // 검색
})
</script>

<template>
    <TableLayout :is-mobile="true">
        <template #filter>
            <div class="d-flex flex-col gap-16">
                <div class="d-flex flex-col align-center">
                    <FilterDate
                        v-model="dateRange"
                        :default-select="'today'"
                        :is-mobile="true"
                    />
                    <span class="caption-mobile reserve-list-info">예약일자를 기준으로 내역이 조회됩니다.</span>
                </div>
    
                <div class="d-flex flex-col gap-8">
                    <FilterKeyword 
                        v-model="keyword"
                        placeholder="고객명, 동물명, 전화번호 검색"
                        @search="searchList()"
                        :is-mobile="true" 
                    />
    
                    <div class="d-flex justify-between align-center flex-wrap gap-6">
                        <div
                            class="btn btn--mobile-option"
                            :class="{ 'selected': isTodayActive }"
                            @click="setToday"
                        >
                            <img :src="isTodayActive ? icCheckW : icCheckB" alt="체크아이콘">
                            <span>Today</span>
                        </div>
    
                        <div class="d-flex gap-8">
                            <!-- 담당의 -->
                            <FilterDoctorBtn
                                v-model="doctorList" 
                                :options="doctorOptions"
                            />
                            <!-- 조회 필터 버튼 -->
                            <FilterBtn
                                v-model:category="categoryFilter"
                                :category-options="categoryOptions"
                                v-model:status="reservationStatus"
                                v-model:channel="reservationChannel"
                                v-model:sort="currentSort"
                                :status-options="reserveStatusOptions"
                                :channel-options="reservationChannelOptions"
                                :sort-options="sortOptions"
                                :show-reset-btn="true"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #table>
            <div class="mobile-total-count">
                <div class="tab-item" :class="{ active: activeTab === null }" @click="selectTab(null)">
                    <span class="label">Total</span>
                    <span class="cnt">{{ totalCount }}</span>
                </div>

                <div
                    v-for="(reserve, index) in reserveSummary"
                    :key="index"
                    class="tab-item"
                    :class="{ active: activeTab === reserve.categoryValue }"
                    @click="selectTab(reserve.categoryValue)"
                >
                    <span class="label">{{ reserve.label }}</span>
                    <span class="cnt">{{ reserve.value }}</span>
                </div>
            </div>

            <ListTable :rows="filteredByTab" />
        </template>
    </TableLayout>

    <!-- 예약 정보 안내 모달 (모바일 )-->
    <div 
        v-if="modalStore.reserveInfoModal.isVisible"
        class="mobile-full-page"
    >
        <header class="mobile-full-page-header">
            <button @click="closeReserveInfoModal"><img :src="icArrowLeft" alt="닫기" width="20"></button>
            <div class="header-title">
                <h2>{{ dynamicTitle }}</h2>
            </div>
        </header>

        <div class="mobile-full-page-body">
            <ReserveInfo @refresh-list="searchList" @update-title="handleTitleUpdate" :is-mobile="true" />
        </div>
    </div>
</template>

<style lang="scss">
.reserve-list-info {color: $gray-700;}

.mobile-total-count {
    padding: 0 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar { display: none; }

    .tab-item {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        cursor: pointer;
        padding-bottom: 16px;
        border-bottom: 2px solid transparent;

        &.active {
            border-bottom-color: $gray-900;

            .label { color: $gray-900; }
            .cnt { color: $primary-700; }
        }

        .label {
            color: $gray-500;
            @include typo($body-s-mobile-size, $body-s-mobile-weight, $body-s-mobile-spacing, $body-s-mobile-line);
            line-height: 1;
        }

        .cnt {
            color: $gray-500;
            @include typo($title-s-mobile-size, $title-s-mobile-weight, $title-s-mobile-spacing, $title-s-mobile-line);
            line-height: 1;
        }
    }
}
</style>