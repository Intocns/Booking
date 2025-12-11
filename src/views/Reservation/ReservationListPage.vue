<!-- 전체예약 조회 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';

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
    <TableLayout />
</template>