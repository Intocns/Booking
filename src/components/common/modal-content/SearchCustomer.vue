<!-- 고객 검색 모달 -->
<script setup>
import { ref, computed } from 'vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import InputTextBox from '@/components/common/InputTextBox.vue';
import CommonTable from '@/components/common/CommonTable.vue';
import { useReservationStore } from '@/stores/reservationStore';

const reservationStore = useReservationStore();

// 조회 조건 옵션
const searchTypeOptions = [
    { label: '전체', value: 'all' },
    { label: '고객번호', value: 'userNo' },
    { label: '고객명', value: 'userName' },
    { label: '전화번호', value: 'userTel' },
    { label: '동물번호', value: 'petNo' },
    { label: '동물명', value: 'petName' },
];

// 선택된 조회 조건
const selectedSearchType = ref('all');
// 검색어
const searchKeyword = ref('');
// 검색 결과
const customerList = ref([]);
// 로딩 상태
const isLoading = ref(false);

// 조회 버튼 활성화 여부 (무조건 검색어가 2글자 이상이어야 함)
const isSearchEnabled = computed(() => {
    return searchKeyword.value.trim().length >= 2;
});

// searchType을 Int로 변환하는 함수
const getSearchTypeInt = (searchType) => {
    const typeMap = {
        'all': 0, // 전체 검색
        'userNo': 1, // 고객번호
        'userName': 2, // 고객명
        'userTel': 3, // 전화번호
        'petNo': 4, // 동물번호
        'petName': 5, // 동물명
    };
    return typeMap[searchType] ?? 0;
};

// 고객 검색 함수
const handleSearch = async () => {
    // 검색어가 2글자 미만이면 검색 불가 (버튼이 disabled되어 있어서 여기까지 오지 않지만 안전장치)
    if (searchKeyword.value.trim().length < 2) {
        return;
    }

    isLoading.value = true;
    try {
        const searchData = {
            searchType: getSearchTypeInt(selectedSearchType.value),
            keyword: searchKeyword.value.trim() || null,
        };

        const result = await reservationStore.searchClientMapping(searchData);
        customerList.value = result || [];
    } catch (error) {
        console.error('고객 검색 오류:', error);
    } finally {
        isLoading.value = false;
    }
};

// 엔터키로 검색
const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
        handleSearch();
    }
};

// 고객 선택 함수
const handleSelectCustomer = (customer) => {
    // TODO: 선택한 고객 정보를 부모 컴포넌트로 전달하는 로직 구현
    console.log('선택한 고객:', customer);
    // 예: emit을 통해 부모 컴포넌트에 전달하거나, store에 저장
};

// 고객 테이블 col 정의
const customerColumns = [
    { key: 'userNo', label: '고객번호', width: '15%' },
    { key: 'userName', label: '고객명', width: '15%' },
    { key: 'userTel', label: '전화번호', width: '15%' },
    { key: 'petNo', label: '동물번호', width: '15%' },
    { key: 'petName', label: '동물명', width: '15%' },
    { key: 'speciesName', label: '종', width: '10%' },
    { key: 'breed', label: '품종', width: '10%'},
    { key: 'sex', label: '성별', width: '10%'},
    { key: 'action', label: '고객매칭', width: '10%'},
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
                        <InputTextBox 
                            v-model="searchKeyword" 
                            placeholder="검색어 입력" 
                            @keypress="handleKeyPress"
                        />
                        <button 
                            class="btn btn--size-32"
                            :class="isSearchEnabled && !isLoading ? 'btn--black' : 'is-disabled'"
                            @click="handleSearch"
                            :disabled="isLoading || !isSearchEnabled"
                        >
                            {{ isLoading ? '조회중...' : '조회' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- 고객 테이블 -->
            <div class="customer-table-wrapper">
                <CommonTable
                    :columns="customerColumns"
                    :rows="customerList"
                    table-empty-text="검색 결과가 없습니다."
                >
                    <template #action="{ row }">
                        <button 
                            class="btn btn--size-24 btn--blue"
                            @click.stop="handleSelectCustomer(row)"
                        >
                            선택
                        </button>
                    </template>
                </CommonTable>
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

// 조회 버튼 비활성화 스타일
.btn.is-disabled {
    background-color: $gray-200;
    color: $gray-400;
    cursor: not-allowed;
    
    &:hover {
        background-color: $gray-200;
        box-shadow: none;
    }
}
</style>