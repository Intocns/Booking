<!-- 전체예약 조회 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import Modal from '@/components/common/Modal.vue';
import SendSmsTalk from '@/components/common/modal-content/SendSmsTalk.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import FilterKeyword from '@/components/common/filters/FilterKeyword.vue';

import { onMounted, ref } from 'vue';
// 스토어
import { useReservationStore } from '@/stores/reservationStore';

const reservationStore = useReservationStore();

// 테이블 col 정의
const columns = [
    { key: 'idx', label: 'No.', width: '5%' },
    { key: '', label: '예약상태', width: '10%' },
    { key: '', label: '예약일자', width: '10%' },
    { key: '', label: '예약시간', width: '5%' },
    { key: '', label: '상품명/진료실명', width: '10%' },
    { key: 'user_name', label: '고객명', width: '10%' },
    { key: 'phone', label: '전화번호', width: '15%' },
    { key: 'pet_name', label: '동물명', width: '15%' },
    { key: 'species_name', label: '종', width: '10%' },
    { key: '', label: '담당의', width: '10%' },
    { key: '', label: '병원 메모', width: '20%' },
    { key: '', label: '예약경로', width: '10%' },
    { key: '', label: '접수일시', width: '15%' },
    { key: '', label: '관리', width: '15%' },
]

onMounted(() => {
    reservationStore.getReservationList({
        'cocode': '2592',
        'status': '',
        'doctorId': '',
        'keyword': '',
        'startDate': '2025-12-07',
        'endDate': '2025-12-03',
        'reRoute': 0
    })
})
</script>

<template>
    <!-- 페이지 타이틀 -->
    <PageTitle
        title="전체 예약 조회"
        :total="987"
        :details="[
            { label: '확정', value: '15' },
            { label: '대기', value: '05' },
            { label: '취소 · 거절', value: '05', warning: true },
        ]"
        helper-text="예약일자를 기준으로 내역이 조회됩니다"
    />

    <!-- 테이블 콘텐츠 (검색필터 + 테이블) -->
    <TableLayout
        :columns="columns" 
        :rows="[]"
    >
        <template #filter>
            <FilterDate />
            <FilterSelect :label="'예약상태'" />
            <FilterSelect :label="'담당의'" />
            <FilterKeyword :placeholder="'고객명, 동물명, 전화번호 검색'" />
        </template>
    </TableLayout>

    <!-- 모달 -->
    <Modal 
        :visible="false" 
        :size="'s'" 
        :title="'문자 발송'"
    >
        <SendSmsTalk />
    </Modal>
</template>