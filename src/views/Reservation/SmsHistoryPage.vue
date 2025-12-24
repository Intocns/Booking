<!-- SMS 발송 내역 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import FilterKeywordBtn from '@/components/common/filters/FilterKeywordBtn.vue';
import CommonTable from '@/components/common/CommonTable.vue';

import icReset from '@/assets/icons/ic_reset.svg'
import { ref } from 'vue';

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

const currentDate = ref(new Date())
</script>

<template>
    <!-- 페이지 타이틀 -->
    <PageTitle title="SMS 발송 내역" /> 

    <TableLayout>
        <!-- 검색 필터 -->
        <template #filter>
            <FilterDate button-type="quick" v-model="currentDate" default-select="7" />
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
            <FilterKeywordBtn :placeholder="'고객명, 동물명, 전화번호 검색'" />
            <button class="btn btn--size-32 btn--black-outline" @click="searchClear()" style="width: 40px;">
                <img :src="icReset" alt="초기화아이콘">
            </button>
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