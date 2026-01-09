<!-- 대기 예약 관리 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import FilterKeywordBtn from '@/components/common/filters/FilterKeywordBtn.vue';
import CommonTable from '@/components/common/CommonTable.vue';
import Modal from '@/components/common/Modal.vue';
import ReserveInfo from '@/components/common/modal-content/ReserveInfo.vue';
import SendSmsTalk from '@/components/common/modal-content/SendSmsTalk.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import SearchCustomer from '@/components/common/modal-content/SearchCustomer.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';

import icSms from '@/assets/icons/ic_sms.svg';
import icReset from '@/assets/icons/ic_reset.svg'

import { useReservationStore } from '@/stores/reservationStore';
import { useModalStore } from '@/stores/modalStore';

import { RESERVE_ROUTE_OPTIONS, RESERVE_ROUTE_MAP } from "@/utils/reservation";
import { computed, ref, onMounted } from 'vue';

const reservationStore = useReservationStore();
const modalStore = useModalStore();

// 예약경로 초기값
const reservationChannel = ref(['all']);
// 예약경로 옵션 정의
const reservationChannelOptions = RESERVE_ROUTE_OPTIONS;
const keyword = ref('');
// 테이블 col 정의
const columns = [
    { key: 'idx', label: 'No.', width: '6%' },
    { key: 'reTimeTxt', label: '예약일자', width: '7%' },
    { key: 'reTimeHisTxt', label: '예약시간', width: '5%' },
    { key: 'roomName', label: '상품명/진료실명', width: '12%' },
    { key: 'userName', label: '고객명', width: '7%' },
    { key: 'phoneTxt', label: '전화번호', width: '10%' },
    { key: 'petName', label: '동물명', width: '8%' },
    { key: 'speciesName', label: '종', width: '6%' },
    { key: 'reMemo', label: '고객 메모', width: '12%' },
    { key: 'reRouteTxt', label: '예약경로', width: '7%' },
    { key: 'createdAtTxt', label: '접수일시', width: '10%' },
    { key: 'actions', label: '관리', width: '7%' }, // 커스텀 슬롯
]

const totalCount = computed(() => reservationStore.reservePendingList.length);
const reserveSummary = computed(() => {
    const counts = {};

    for (const key in RESERVE_ROUTE_MAP) {
        counts[key] = 0;
    }

    for (const row of reservationStore.reservePendingList) {
        if (counts[row.reRoute] !== undefined) {
            counts[row.reRoute]++;
        }
    }

    return Object.keys(RESERVE_ROUTE_MAP).map(key => ({
        label: RESERVE_ROUTE_MAP[key],
        value: String(counts[key]).padStart(2, '0'),
    }));
});

const searchList = async () => {
    reservationStore.getPendingList({
        cocode: 2592, //TODO: 임시 데이터 추후 삭제
        keyword: keyword.value,
        reRoute: reservationChannel.value,
    });
};

const searchClear = () => { //초기화 버튼
    reservationChannel.value = ['all'];
    keyword.value = '';
};

// 예약 상세보기 핸들러
const handelReserveDetail = (reserveIdx) => {
    reservationStore.getReserveInfo(reserveIdx)
}

onMounted(() => {
    // 대기 예약 리스트 불러오기
    searchList();
    // reservationStore.getPendingList();
})
</script>

<template>
    <!-- 페이지 타이틀 -->
    <PageTitle
        title="대기 예약 관리"
        :total="totalCount"
        :details="reserveSummary"
        helper-text="예약일자를 기준으로 내역이 조회됩니다"
    /> 

    <TableLayout>
        <!-- 검색 필터 -->
        <template #filter>
            <FilterSelect
                label="예약경로"
                :options="reservationChannelOptions"
                v-model="reservationChannel"
            />
            <FilterKeywordBtn 
                :placeholder="'고객명, 동물명, 전화번호 검색'" 
                v-model="keyword"
                @search="searchList()"
            />
            <button class="btn btn--size-32 btn--black-outline" @click="searchClear()" style="width: 40px;">
                <img :src="icReset" alt="초기화아이콘">
            </button>
        </template>
        
        <!-- 테이블 -->
        <template #table>
            <CommonTable :columns="columns" :rows="reservationStore.reservePendingList">
                <!-- 예약경로 앞에 dot -->
                <template #reRouteTxt="{ row, value }">
                    <div class="status-cell">
                        <span class="dot" :class="`dot--route-${row.reRoute}`"></span>
                        {{ value }}
                    </div>
                </template>
                <!-- 버튼 -->
                <template #actions="{ row, rowIndex }">
                    <button class="btn btn--size-24 btn--black-outline" @click="handelReserveDetail(row.idx)">상세</button>
                    <button class="btn btn--size-24 btn--black-outline" @click="modalStore.smsModal.openModal()"><img :src="icSms" alt="SMS"></button>
                </template>
    
            </CommonTable>
        </template>
    </TableLayout>

    <!-- 예약 정보 안내 모달 -->
    <Modal
        v-if="modalStore.reserveInfoModal.isVisible"
        size="l"
        title="고객 예약 정보"
        :modalState="modalStore.reserveInfoModal"
    >
        <ReserveInfo />
    </Modal>

    <!--  고객 예약 정보 > 고객 검색 모달 -->
    <Modal
        v-if="modalStore.searchCustomerModal.isVisible"
        size="m"
        title="고객 검색"
        :modalState="modalStore.searchCustomerModal"
    >
        <SearchCustomer />
    </Modal>

    <!-- 문자 발송 모달 -->
    <Modal 
        v-if="modalStore.smsModal.isVisible"
        size="s"
        title="문자 발송"
        :modalState="modalStore.smsModal"
    >
        <SendSmsTalk />
    </Modal>

    <!-- 문자 발송 확인 모달 -->
    <ConfirmModal />
</template>