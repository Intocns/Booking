<!-- 예약 일정 확인 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue'
import TableLayout from '@/components/common/TableLayout.vue';
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
</script>

<template>
    <!-- 페이지 타이틀 -->
    <PageTitle
        title="예약 일정 확인"
        helper-text="차트 [예약 일정] 메뉴에 등록된 일정을 기준으로 조회됩니다."
    />

    <TableLayout>
        <template #filter>
            <!-- TODO: 일자 버튼 수정 -->
            <FilterDate />
            <FilterSelect label="담당의" />
            <FilterSelect label="예약 상태" />
            <FilterSelect label="예약 경로" />
            <!--TODO: 초기화버튼 추가 -->
        </template>

        <template #table>
            
        </template>
    </TableLayout>
</template>