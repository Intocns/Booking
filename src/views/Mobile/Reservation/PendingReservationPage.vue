<script setup>
import TableLayout from '@/components/common/TableLayout.vue';
import ListTable from '@/components/common/Mobile/ListTable.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import FilterKeyword from '@/components/common/filters/FilterKeyword.vue';
import ReserveInfo from '@/components/common/modal-content/mobile/ReserveInfo.vue';

import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { RESERVE_ROUTE_OPTIONS, RESERVE_ROUTE_MAP } from "@/constants";

import { useReservationStore } from '@/stores/reservationStore';
import { useModalStore } from '@/stores/modalStore';
import FilterBtn from '@/components/common/Mobile/filters/FilterBtn.vue';
import icClose from '@/assets/icons/mobile/ic_close_b.svg'

const reservationStore = useReservationStore();
const modalStore = useModalStore();

const reservationChannelOptions = RESERVE_ROUTE_OPTIONS.filter(opt => opt.value !== 1);
const reservationChannel = ref(['all']);
const keyword = ref('');
const dynamicTitle = ref('고객 예약 정보'); // 고객예약정보 모달 타이틀

const totalCount = computed(() => reservationStore.reservePendingList.length);

const reserveSummary = computed(() => {
    const counts = Object.keys(RESERVE_ROUTE_MAP).reduce((acc, key) => {
        acc[key] = 0;
        return acc;
    }, {});

    reservationStore.reservePendingList.forEach(row => {
        if (counts[row.reRoute] !== undefined) {
            counts[row.reRoute]++;
        }
    });

    const customOrder = ['4', '2']; // 순서 변경 및 intoVetGe 제외

    return customOrder
        .filter(key => RESERVE_ROUTE_MAP[key]) // 혹시 모를 키 누락 방지
        .map(key => ({
            label: RESERVE_ROUTE_MAP[key],
            value: String(counts[key]).padStart(2, '0'),
        }));
})

// 필터 값 변환 헬퍼 함수 ('all'이 포함되어 있으면 null로 변환)
const convertFilterParam = (value) => {
    if (!value || value.length === 0 || value.includes('all')) return null;
    return value;
};

const searchList = async () => {
    if (!reservationChannel.value?.length) {
        reservationStore.reservePendingList = [];
        return;
    }
    
    reservationStore.getPendingList({
        keyword: keyword.value?.trim() || null,
        reRoute: convertFilterParam(reservationChannel.value),
    });
};

let isInitialMount = true;

watch([reservationChannel], () => {
    if (isInitialMount) return;
    nextTick(() => searchList());
}, { deep: true });

const handelReserveDetail = (row) => {
    reservationStore.getReserveInfo(row.idx);
}

const closeReserveInfoModal = () => {
    modalStore.reserveInfoModal.closeModal()
    document.body.style.overflow = '';
}

const handleTitleUpdate = (newTitle) => {
    dynamicTitle.value = newTitle;
};

onMounted(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    searchList();
    isInitialMount = false;
})
</script>

<template>
    <TableLayout :is-mobile="true">
        <template #filter>
            <div class="d-flex flex-col gap-8">
                <FilterKeyword 
                    :placeholder="'고객명, 동물명, 전화번호 검색'" 
                    v-model="keyword"
                    @search="searchList()"
                    :is-mobile="true"
                />
    
                <div class="d-flex justify-between align-center flex-wrap">
                    <span class="caption-mobile reserve-list-info">예약일자를 기준으로 내역이 조회됩니다.</span>
    
                    <!-- 조회 필터 버튼 -->
                    <FilterBtn
                        v-model:channel="reservationChannel"
                        :channel-options="reservationChannelOptions"
                    />
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

            <ListTable :rows="reservationStore.reservePendingList" />
        </template>
    </TableLayout>

    <!-- 예약 정보 안내 모달 (모바일 )-->
    <div 
        v-if="modalStore.reserveInfoModal.isVisible"
        class="mobile-full-page"
    >
        <header class="mobile-full-page-header">
            <h2>{{ dynamicTitle }}</h2>
            <button @click="closeReserveInfoModal"><img :src="icClose" alt="닫기"></button>
        </header>

        <div class="mobile-full-page-body">
            <ReserveInfo @refresh-list="searchList" @update-title="handleTitleUpdate" :is-mobile="true" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.reserve-list-info {color: $gray-700;}

.mobile-total-count {
    display: flex;
    flex-wrap:wrap;
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
        flex-wrap:wrap;
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