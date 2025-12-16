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

import icSms from '@/assets/icons/ic_sms.svg';

import { useReservationStore } from '@/stores/reservationStore';
import { useModalStore } from '@/stores/modalStore';

import { onMounted } from 'vue';

const reservationStore = useReservationStore();
const modalStore = useModalStore();

// 테이블 col 정의
const columns = [
    { key: 'idx', label: 'No.', width: '5%' },
    { key: 're_time', label: '예약일자', width: '10%' },
    { key: '', label: '예약시간', width: '5%' },
    { key: '', label: '상품명/진료실명', width: '10%' },
    { key: 'user_name', label: '고객명', width: '10%' },
    { key: 'phone', label: '전화번호', width: '15%' },
    { key: 'pet_name', label: '동물명', width: '15%' },
    { key: 'species_name', label: '종', width: '10%' },
    { key: '', label: '고객 메모', width: '20%' },
    { key: '', label: '예약경로', width: '10%' },
    { key: '', label: '접수일시', width: '15%' },
    { key: 'actions', label: '관리', width: '15%' }, // 커스텀 슬롯
]

onMounted(() => {
    // 대기 예약 리스트 불러오기
    reservationStore.getPendingList();
})
</script>

<template>
    <!-- 페이지 타이틀 -->
    <PageTitle
        title="대기 예약 관리"
        :total="987"
        :details="[
            { label: '네이버예약', value: '15' },
            { label: 'IntoVet GE', value: '05' },
            { label: '인투펫', value: '05' },
        ]"
        helper-text="예약일자를 기준으로 내역이 조회됩니다"
    /> 

    <TableLayout>
        <!-- 검색 필터 -->
        <template #filter>
            <FilterKeywordBtn :placeholder="'고객명, 동물명, 전화번호 검색'" />
        </template>
        
        <!-- 테이블 -->
        <template #table>
            <CommonTable :columns="columns" :rows="reservationStore.reservePendingList">
    
                <template #actions="{ row, rowIndex }">
                    <button class="btn btn--size-24 btn--black-outline" @click="modalStore.reserveInfoModal.openModal()">상세</button>
                    <button class="btn btn--size-24 btn--black-outline" @click="modalStore.smsModal.openModal()"><img :src="icSms" alt="SMS"></button>
                </template>
    
            </CommonTable>
        </template>
    </TableLayout>

    <!-- 예약 정보 안내 모달 -->
    <Modal
        v-if="modalStore.reserveInfoModal.isVisible"
        size="m"
        title="고객 예약 정보"
        :modalState="modalStore.reserveInfoModal"
    >
        <ReserveInfo />
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