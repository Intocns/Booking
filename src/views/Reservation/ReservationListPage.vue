<!-- 전체예약 조회 -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import Modal from '@/components/common/Modal.vue';
import SendSmsTalk from '@/components/common/modal-content/SendSmsTalk.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import FilterKeywordBtn from '@/components/common/filters/FilterKeywordBtn.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import ReserveInfo from '@/components/common/modal-content/ReserveInfo.vue';
import SearchCustomer from '@/components/common/modal-content/SearchCustomer.vue';

import { formatDate } from "@/utils/dateFormatter";
import { RESERVE_STATUS_OPTIONS, RESERVE_ROUTE_OPTIONS } from "@/utils/reservation";
import { startOfDay } from "date-fns";

import { onMounted, ref, computed } from 'vue';
// 스토어
import { useReservationStore } from '@/stores/reservationStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import CommonTable from '@/components/common/CommonTable.vue';
import { useModalStore } from '@/stores/modalStore';
// 아이콘
import icSms from '@/assets/icons/ic_sms.svg';
import icReset from '@/assets/icons/ic_reset.svg';
const reservationStore = useReservationStore();
const hospitalStore = useHospitalStore();
const modalStore = useModalStore();

// 테이블 col 정의
const columns = [
    { key: 'idx', label: 'No.', width: '8%' },
    { key: 'inStateTxt', label: '예약상태', width: '7%' },
    { key: 'reTimeTxt', label: '예약일자', width: '12%' },
    { key: 'reTimeHisTxt', label: '예약시간', width: '6%' },
    { key: 'roomName', label: '상품명/진료실명', width: '10%' },
    { key: 'userName', label: '고객명', width: '9%' },
    { key: 'phoneTxt', label: '전화번호', width: '15%' },
    { key: 'petName', label: '동물명', width: '15%' },
    { key: 'speciesName', label: '종', width: '10%' },
    { key: 'doctor', label: '담당의', width: '10%' },
    { key: 'geReMemo', label: '병원 메모', width: '23%' },
    { key: 'reRouteTxt', label: '예약경로', width: '10%' },
    { key: 'createdAtTxt', label: '접수일시', width: '15%' },
    { key: 'actions', label: '관리', width: '15%' },
]

// 예약 상태 초기값
const reservationStatus = ref(['all']);
// 예약 상태 옵션 정의
const reserveStatusOptions = RESERVE_STATUS_OPTIONS;

// 담당의 초기값
const doctorList = ref(['all']);

// 담당의 옵션 정의 (API에서 가져온 리스트 + 전체 옵션)
const doctorOptions = computed(() => {
    const options = [{ label: '전체', value: 'all' }];
    
    if (hospitalStore.doctorList && hospitalStore.doctorList.length > 0) {
        const doctorList = hospitalStore.doctorList.map(doc => ({
            label: doc.userName || doc.name || '',
            value: doc.id
        }));
        options.push(...doctorList);
    }
    
    return options;
});
const keyword = ref('');

// 예약경로 초기값
const reservationChannel = ref(['all']);
// 예약경로 옵션 정의
const reservationChannelOptions = RESERVE_ROUTE_OPTIONS;

const dateRange = ref([]); 
const startDate = computed(() => formatDate(dateRange.value?.[0]));
const endDate   = computed(() => formatDate(dateRange.value?.[1]));
const totalCount = computed(() => reservationStore.reserveList.length);
const reserveSummary = computed(() => {
    let confirmed = 0;
    let pending = 0;
    let canceled = 0;

    reservationStore.reserveList.forEach(row => {
        switch (row.inState) {
            case 1: // 승인
                confirmed++;
                break;
            case 0: // 대기
                pending++;
                break;
            case 2: // 취소
            case 3: // 거절
                canceled++;
                break;
        }
    });

    return [
        { label: '확정', value: confirmed.toString().padStart(2, '0') },
        { label: '대기', value: pending.toString().padStart(2, '0') },
        { label: '취소 · 거절', value: canceled.toString().padStart(2, '0'), warning: true },
    ];
});

const searchList = async () => {
    reservationStore.getReservationList({
        cocode: 2592, //TODO: 임시 데이터 추후 삭제
        status: reservationStatus.value || null,
        doctorId: doctorList.value || null,
        keyword: keyword.value || null,
        startDate: startDate.value ,
        endDate: endDate.value ,
        reRoute: reservationChannel.value || null,
    });
};

const searchClear = () => { //초기화 버튼
    reservationStatus.value = ['all'];
    doctorList.value = ['all'];
    reservationChannel.value = ['all'];
    keyword.value = '';
    const today = startOfDay(new Date());
    dateRange.value = [today, today];
};

onMounted(async () => {
    // 담당의 리스트 로드
    if (hospitalStore.doctorList.length === 0) {
        await hospitalStore.getDoctorList();
    }
    // 예약 리스트 검색
    searchList();
})

// 검색 결과 리스트에 클래스 주입 
const processedRows = computed(() => {
    return reservationStore.reserveList.map(row => {
        let className = '';
        if (row.in_state === 0) className = 'row-pending';  // 대기
        if (row.in_state === 2) className = 'row-canceled'; // 취소
        
        return {
            ...row,
            rowClass: className // CommonTable의 tr :class와 연결됨
        };
    });
});

// 예약 상세보기 핸들러
const handelReserveDetail = (reserveIdx) => {
    reservationStore.getReserveInfo(reserveIdx)
}
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
            <FilterDate v-model="dateRange" :default-select="'7'" />
            <FilterSelect 
                label="예약상태"
                :options="reserveStatusOptions"
                v-model="reservationStatus"
            />
            <FilterSelect 
                label="담당의"
                :options="doctorOptions"
                v-model="doctorList"
                />
            <FilterSelect
                label="예약경로"
                :options="reservationChannelOptions"
                v-model="reservationChannel"
            />
           
            <FilterKeywordBtn 
                v-model="keyword"
                :placeholder="'고객명, 동물명, 전화번호 검색'"
                @search="searchList()" />

            <button class="btn btn--size-32 btn--black-outline" @click="searchClear()" style="width: 40px;">
                <img :src="icReset" alt="초기화아이콘">
            </button>
        </template>

        <!-- 테이블 -->
        <template #table>
            <CommonTable :columns="columns" :rows="processedRows">
                <!-- 예약상태 앞에 dot -->
                <template #inStateTxt="{ row, value }">
                    <div class="status-cell">
                        <span class="dot" :class="`dot--state-${row.inState}`"></span>
                        {{ value }}
                    </div>
                </template>
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
    <ConfirmModal
        v-if="modalStore.confirmModal.isVisible" 
        :modalState="modalStore.confirmModal"
    >
        <p>
            야간시간대(오후9시~다음날 오전 8시) 광고/홍보성 문자 발송 시,<br/>
            영리 목적의 광고성 문자 메시지 수신에 대한 일반적 사전 동의 외에<br/>
            별도의 동의를 받지 않았을 경우,<br/>
            3천만원 이하의 과태료가 부과될 수 있습니다.<br/>
            <br/>
            전송하시겠습니까?
        </p>
    </ConfirmModal>
</template>

<style lang="scss" scoped>
    // 예약 대기 tr 배경생
    :deep(.row-pending) {
        background-color: $status-onHold_table_bg !important; // 연한 노란색
    }
    // 예약 취소 tr 연하게
    :deep(.row-canceled) {
        // pointer-events: none;
        td {color: $gray-400}
    }
</style>