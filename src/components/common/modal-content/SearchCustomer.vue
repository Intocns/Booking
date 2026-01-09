<!-- 고객 검색 모달 -->
<script setup>
import { ref } from 'vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import InputTextBox from '@/components/common/InputTextBox.vue';
import CommonTable from '@/components/common/CommonTable.vue';

// 조회 조건 옵션
const searchTypeOptions = [
    { label: '전체', value: 'all' },
    { label: '고객번호', value: 'user_num' },
    { label: '고객명', value: 'user_name' },
    { label: '전화번호', value: 'phone' },
    { label: '동물번호', value: 'pet_num' },
    { label: '동물명', value: 'pet_name' },
];

// 선택된 조회 조건
const selectedSearchType = ref('all');
// 검색어
const searchKeyword = ref('');

// 고객 테이블 col 정의
const customerColumns = [
    { key: 'user_num', label: '고객번호', width: '15%' },
    { key: 'user_name', label: '고객명', width: '15%' },
    { key: 'phone', label: '전화번호', width: '15%' },
    { key: 'pet_num', label: '동물번호', width: '15%' },
    { key: 'pet_name', label: '동물명', width: '15%' },
    { key: 'species_name', label: '종', width: '10%' },
    { key: 'breed', label: '품종', width: '10%'},
    { key: 'gender', label: '성별', width: '10%'},
    { key: 'actions', label: '고객매칭', width: '10%'},
]

</script>

<template>
    <div class="modal-contents-inner">
        <!-- 고객 검색 -->
        <div class="d-flex flex-col gap-16">

            <!-- 검색 필드 -->
            <div class="d-flex flex-col gap-8">
                <p class="title-l mb-16">검색</p>
                
                <div class="search-box">
                    <CustomSingleSelect 
                        v-model="selectedSearchType"
                        :options="searchTypeOptions"
                        placeholder="선택"
                        select-width="120px"
                    />
    
                    <div class="d-flex gap-4" style="flex:1;">
                        <InputTextBox v-model="searchKeyword" placeholder="검색어 입력" />
                        <button class="btn btn--size-32 btn--black">조회</button>
                    </div>
                </div>
            </div>

            <!-- 고객 테이블 -->
            <div class="customer-table-wrapper">
                <CommonTable
                    :columns="customerColumns"
                    :rows="[]"
                />
            </div>
        </div>
    </div>
    
    <!-- 버튼 -->
    <div class="modal-button-wrapper">
        <div class="buttons">
            <button class="btn btn--size-40 btn--blue-outline">신규 동물 등록</button>
            <button class="btn btn--size-40 btn--blue">선택 동물로 접수</button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.search-box {
    width: 100%;
    display: flex;
    padding: 20px 16px;
    align-items: flex-start;
    gap: 8px;

    border-radius: 8px;
    border: 1px solid $gray-200;
    background-color: $gray-00;

    .btn {
        padding: 0 24px;
        flex-shrink: 0;
    }
}
.customer-table-wrapper {
    width: 876px;
    height: 300px;
}
</style>