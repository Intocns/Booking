<!-- 대기 예약 관리 -->
<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue';
import { RESERVE_ROUTE_OPTIONS, RESERVE_ROUTE_MAP } from "@/constants";
import { useReservationStore } from '@/stores/reservationStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import { useModalStore } from '@/stores/modalStore';
import { useTalkSmsStore } from '@/stores/talkSmsStore';
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import CommonTable from '@/components/common/CommonTable.vue';
import Modal from '@/components/common/Modal.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import FilterKeywordBtn from '@/components/common/filters/FilterKeywordBtn.vue';
import ReserveInfo from '@/components/common/modal-content/ReserveInfo.vue';
import SendSmsTalk from '@/components/common/modal-content/SendSmsTalk.vue';
import SearchCustomer from '@/components/common/modal-content/SearchCustomer.vue';
import icSms from '@/assets/icons/ic_sms.svg';
import icReset from '@/assets/icons/ic_reset.svg';

const reservationStore = useReservationStore();
const hospitalStore = useHospitalStore();
const modalStore = useModalStore();
const talkSmsStore = useTalkSmsStore();

// SMS 모달 컴포넌트 ref 및 선택된 예약 데이터
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
        hospitalPhone: row?.hospitalPhone, //TODO: cocode 기반 실제 병원명으로 교체
        phoneTxt: row?.phoneTxt, // 수신번호용 전화번호
        protectorName: row?.userName, // 고객명
        visitSource: row?.reRouteTxt, // 예약경로 텍스트
        visitSourceText: '', // 방문경로(기타일 경우 text 입력 값)
    };

    modalStore.smsModal.openModal();
};

const reservationChannel = ref(['all']);
const keyword = ref('');
const reservationChannelOptions = RESERVE_ROUTE_OPTIONS.filter(opt => opt.value !== 1);
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
    { key: 'actions', label: '관리', width: '7%' },
]

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

const searchClear = () => {
    reservationChannel.value = ['all'];
    keyword.value = '';
};

let isInitialMount = true;

watch([reservationChannel], () => {
    if (isInitialMount) return;
    nextTick(() => searchList());
}, { deep: true });

const handelReserveDetail = (row) => {
    reservationStore.getReserveInfo(row.idx);
};

onMounted(() => {
    hospitalStore.getHospitalInfo(); // 발신번호(병원 전화)용
    talkSmsStore.preloadTemplatesAndPoint();
    searchList();
    isInitialMount = false;
});
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
            <CommonTable :columns="columns" :rows="reservationStore.reservePendingList" @row-click="handelReserveDetail" :is-click-able="true">
                <!-- 예약경로 앞에 dot -->
                <template #reRouteTxt="{ row, value }">
                    <div class="status-cell">
                        <span class="dot" :class="`dot--route-${row.reRoute}`"></span>
                        {{ value }}
                    </div>
                </template>
                <!-- 버튼 -->
                <template #actions="{ row, rowIndex }">
                    <button class="btn btn--size-24 btn--black-outline" @click.stop="handelReserveDetail(row)">상세</button>
                    <button class="btn btn--size-24 btn--black-outline" @click.stop="openSmsModal(row)"><img :src="icSms" alt="SMS"></button>
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