<!-- 고객 검색 모달 -->
<script setup>
import { ref, computed } from 'vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import InputTextBox from '@/components/common/InputTextBox.vue';
import CommonTable from '@/components/common/CommonTable.vue';
import { useReservationStore } from '@/stores/reservationStore';
import { PET_GENDER_MAP } from '@/utils/reservation';
import { useModalStore } from '@/stores/modalStore';

const emit = defineEmits(['customer-selected']);
const modalStore = useModalStore();

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

// 고객 매칭 토글 함수 (단일 선택: 하나 선택 시 기존 선택 해제)
const toggleCustomerMatch = (row) => {
    const index = customerList.value.findIndex(item => item === row);
    if (index !== -1) {
        const wasMatched = customerList.value[index].isMatched;
        
        // 모든 고객의 매칭 상태 초기화
        customerList.value.forEach(item => {
            item.isMatched = false;
            item.rowClass = '';
        });
        
        // 클릭한 고객이 매칭되지 않았던 경우에만 매칭 (토글)
        if (!wasMatched) {
            customerList.value[index].isMatched = true;
            customerList.value[index].rowClass = 'row-matched';
        }
    }
};

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
        // 검색 결과에 매칭 상태 초기화 및 데이터 포맷팅
        customerList.value = (result || []).map(item => ({
            ...item,
            isMatched: false,
            rowClass: '',
            // 품종: breedName 사용 (백엔드에서 br.Name2 AS breedName으로 제공)
            breed: item.breedName || '',
            // 성별: PET_GENDER_MAP으로 변환
            sex: PET_GENDER_MAP[item.sex] || item.sex || '',
        }));
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

// 선택된 고객 (매칭된 고객)
const selectedCustomer = computed(() => {
    return customerList.value.find(item => item.isMatched) || null;
});

// 선택 동물로 접수 버튼 클릭
const handleSelectPet = () => {
    if (!selectedCustomer.value) {
        return;
    }
    
    // 부모 컴포넌트에 선택한 고객 정보 전달
    emit('customer-selected', selectedCustomer.value);
};

// 신규 동물 등록 버튼 클릭
const handleNewPetRegistration = () => {
    // 고객 검색 모달 닫기 (신규 등록은 예약 확정 시 처리)
    modalStore.searchCustomerModal.closeModal();
    // TODO: 신규 동물 등록 로직 (필요시 추가)
};

// 고객 테이블 col 정의
const customerColumns = [
    { key: 'userNo', label: '고객번호', width: '8%' },
    { key: 'userName', label: '고객명', width: '12%' },
    { key: 'userTel', label: '전화번호', width: '15%' },
    { key: 'petNo', label: '동물번호', width: '12%' },
    { key: 'petName', label: '동물명', width: '12%' },
    { key: 'speciesName', label: '종', width: '12%' },
    { key: 'breed', label: '품종', width: '8%'},
    { key: 'sex', label: '성별', width: '8%'},
    { key: 'action', label: '고객매칭', width: '13%'},
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
                    @row-click="(row) => {}"
                >
                    <template #action="{ row }">
                        <button 
                            class="btn btn--size-24"
                            :class="row.isMatched ? 'btn--blue' : 'btn--black-outline'"
                            @click.stop="toggleCustomerMatch(row)"
                        >
                            {{ row.isMatched ? '고객매칭 해제' : '고객매칭' }}
                        </button>
                    </template>
                </CommonTable>
            </div>
        </div>
    </div>
    
    <!-- 버튼 -->
    <div class="modal-button-wrapper">
        <div class="buttons">
            <button 
                class="btn btn--size-40 btn--blue-outline"
                @click="handleNewPetRegistration"
            >
                신규 동물 등록
            </button>
            <button 
                class="btn btn--size-40 btn--blue"
                @click="handleSelectPet"
                :disabled="!selectedCustomer"
            >
                선택 동물로 접수
            </button>
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
    
    // 매칭된 행 스타일
    :deep(.row-matched) {
        background-color: $primary-50;
    }
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