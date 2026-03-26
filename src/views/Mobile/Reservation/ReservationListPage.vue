<script setup>
import TableLayout from '@/components/common/TableLayout.vue';
import ListTable from '@/components/common/Mobile/ListTable.vue';
import Modal from '@/components/common/Modal.vue';
import ReserveInfo from '@/components/common/modal-content/mobile/ReserveInfo.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterKeyword from '@/components/common/filters/FilterKeyword.vue';
import FilterDoctorBtn from '@/components/common/Mobile/filters/FilterDoctorBtn.vue';

import icCheckW from '@/assets/icons/mobile/ic_check_w.svg'
import icCheckB from '@/assets/icons/mobile/ic_check_B.svg'
import icClose from '@/assets/icons/mobile/ic_close_b.svg'

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

const reserveSummary = computed(() => {
    const counts = { confirmed: 0, pending: 0, canceled: 0 };
    
    reservationStore.reserveList.forEach(row => {
        if (row.inState === 1) counts.confirmed++;
        else if (row.inState === 0) counts.pending++;
        else if (row.inState === 2 || row.inState === 3) counts.canceled++;
    });

    return [
        { label: '확정', value: counts.confirmed.toString().padStart(2, '0') },
        { label: '대기', value: counts.pending.toString().padStart(2, '0') },
        { label: '취소 · 거절', value: counts.canceled.toString().padStart(2, '0'), warning: true },
    ];
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
    
    if (isStatusEmpty || isDoctorEmpty || isRouteEmpty) {
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

watch([reservationStatus, doctorList, reservationChannel, dateRange], () => {
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
    
                    <div class="d-flex justify-between align-center">
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
                <div class="total">
                    Total 
                    <span class="cnt">{{ totalCount }}</span>
                </div>

                <div class="detail-count">
                    <div v-for="reserve in reserveSummary" class="detail">
                        <span class="label">{{ reserve.label }}</span>
                        <span class="cnt" :class="reserve.warning ? 'warning' : ''">{{ reserve.value }}</span>
                    </div>
                </div>
            </div>

            <ListTable :rows="reservationStore.reserveList" />
        </template>
    </TableLayout>

    <!-- 예약 정보 안내 모달 (모바일 )-->
    <div 
        v-if="modalStore.reserveInfoModal.isVisible"
        class="mobile-full-page"
    >
        <header class="mobile-full-page-header">
            <h2>고객 예약 정보</h2>
            <button @click="closeReserveInfoModal"><img :src="icClose" alt="닫기"></button>
        </header>

        <div class="mobile-full-page-body">
            <ReserveInfo @refresh-list="searchList" :is-mobile="true" />
        </div>
    </div>
</template>

<style lang="scss">
.reserve-list-info {color: $gray-700;}

.mobile-total-count {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;

    .total {
        @include typo($title-l-mobile-size, $title-l-mobile-weight, $title-l-mobile-spacing, $title-l-mobile-line);
        color: $gray-700;

        .cnt {
            color: $primary-700;
        }
    }

    .detail-count {
        display: flex;
        gap:6px;

        .detail {
            display: flex;
            align-items: center;
            gap: 4px;

            &::after {
                content: '';
                width: 1px;
                height: 12px;
                background-color: $gray-300;
                margin-left: 4px;
            }

            &:last-child::after {content:none;}

            .label {
                color: $gray-700;
                @include typo($body-s-mobile-size, $body-s-mobile-weight, $body-s-mobile-spacing, $body-s-mobile-line);
                line-height: 1;
            }

            .cnt {
                color: $gray-900;
                @include typo($title-s-mobile-size, $title-s-mobile-weight, $title-s-mobile-spacing, $title-s-mobile-line);
                line-height: 1;
                
                &.warning {color: $warning-500;}
            }
        }
    }
}
</style>