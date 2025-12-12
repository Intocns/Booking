<!-- 대기 예약 관리 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import FilterKeywordBtn from '@/components/common/filters/FilterKeywordBtn.vue';
import CommonTable from '@/components/common/CommonTable.vue';

import { useReservationStore } from '@/stores/reservationStore';
import { onMounted } from 'vue';

const reservationStore = useReservationStore();


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
                    <button>상세</button>
                    <button>대기</button>
                </template>
    
            </CommonTable>
        </template>
    </TableLayout>
</template>