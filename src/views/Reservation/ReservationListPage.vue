<!-- 전체예약 조회 -->
<script setup>
import { onMounted, ref, computed, watch, nextTick } from 'vue';
import { startOfDay, subDays } from "date-fns";
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
import ReserveInfo from '@/components/common/modal-content/ReserveInfo.vue';
import SendSmsTalk from '@/components/common/modal-content/SendSmsTalk.vue';
import icSms from '@/assets/icons/ic_sms.svg';
import icReset from '@/assets/icons/ic_reset.svg';
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
        hospitalPhone: row?.hospitalPhone, //TODO: cocode 기반 실제 병원명으로 교체
        phoneTxt: row?.phoneTxt, // 수신번호용 전화번호
        protectorName: row?.userName, // 고객명
        visitSource: row?.reRouteTxt, // 예약경로 텍스트
        visitSourceText: '', // 방문경로(기타일 경우 text 입력 값)
    };

    modalStore.smsModal.openModal();
};

// 테이블 col 정의
const columns = [
    { key: 'idx', label: 'No.', width: '6%' },
    { key: 'inStateTxt', label: '예약상태', width: '6%' },
    { key: 'reTimeTxt', label: '예약일자', width: '7%' },
    { key: 'reTimeHisTxt', label: '예약시간', width: '5%' },
    { key: 'roomName', label: '상품명/진료실명', width: '12%' },
    { key: 'userName', label: '고객명', width: '7%' },
    { key: 'phoneTxt', label: '전화번호', width: '10%' },
    { key: 'petName', label: '동물명', width: '8%' },
    { key: 'speciesName', label: '종', width: '6%' },
    { key: 'doctor', label: '담당의', width: '7%' },
    { key: 'geReMemo', label: '병원 메모', width: '12%' },
    { key: 'reRouteTxt', label: '예약경로', width: '7%' },
    { key: 'createdAtTxt', label: '접수일시', width: '10%' },
    { key: 'actions', label: '관리', width: '7%' },
]

const reservationStatus = ref(['all']);
const doctorList = ref(['all']);
const reservationChannel = ref(['all']);
const keyword = ref('');
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

const searchClear = () => {
    reservationStatus.value = ['all'];
    doctorList.value = ['all'];
    reservationChannel.value = ['all'];
    keyword.value = '';
    const today = startOfDay(new Date());
    dateRange.value = [subDays(today, 7), today];
};

let isInitialMount = true;

watch([reservationStatus, doctorList, reservationChannel, dateRange], () => {
    if (isInitialMount) return;
    nextTick(() => searchList());
}, { deep: true });

const processedRows = computed(() => {
    return reservationStore.reserveList.map(row => {
        let className = '';
        if (row.inState === 0) className = 'row-pending';
        if (row.inState === 2 || row.inState === 3) className = 'row-canceled';
        
        return { ...row, rowClass: className };
    });
});

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
            <CommonTable :columns="columns" :rows="processedRows" @row-click="handelReserveDetail" :is-click-able="true">
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
    // 예약 대기 tr 배경생
    :deep(.row-pending) {
        background-color: $status-onHold_table_bg !important; // 연한 노란색
    }
    // 예약 취소/거절 tr 연하게
    :deep(.row-canceled) {
        // pointer-events: none;
        td {color: $gray-400}
    }
</style>