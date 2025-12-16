<!-- SMS 발송 내역 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import FilterKeyword from '@/components/common/filters/FilterKeyword.vue';
import CommonTable from '@/components/common/CommonTable.vue';

// sms 발송 내역 테이블 col 정의
const columns = [
    { key: 'idx', label: 'No.', width: '5%' },
    { key: 'send_date', label: '발송일자', width: '15%' },
    { key: 'user_name', label: '고객명', width: '10%' },
    { key: 'pet_name', label: '동물명', width: '10%' },
    { key: 'message', label: '발송내역', width: '25%' },
    { key: 'send_type', label: '발송구분', width: '10%' },
    { key: 'status', label: '발송결과', width: '10%' },
]
</script>

<template>
    <!-- 페이지 타이틀 -->
    <PageTitle title="SMS 발송 내역" /> 

    <TableLayout>
        <!-- 검색 필터 -->
        <template #filter>
            <FilterDate />
            <FilterSelect
                label="발송구분"
            />
            <FilterSelect
                label="발송결과"
                :options="[
                    { label: '전체', value: 'all' },
                    { label: '성공', value: 'sent' },
                    { label: '실패', value: 'failed' },
                ]" 
            />
            <FilterKeyword :placeholder="'고객명, 동물명, 전화번호 검색'" />
        </template>

        <!-- 테이블 -->
        <template #table>
            <CommonTable 
                :columns="columns" 
                :rows="[]"
            />
        </template>
        
    </TableLayout>
</template>