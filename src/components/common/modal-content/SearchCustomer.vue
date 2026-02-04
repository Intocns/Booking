<!-- 고객 검색 모달 -->
<script setup>
import { ref, computed } from 'vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import InputTextBox from '@/components/common/InputTextBox.vue';
import CommonTable from '@/components/common/CommonTable.vue';
import { useReservationStore } from '@/stores/reservationStore';
import { PET_GENDER_MAP, CUSTOMER_SEARCH_TYPE_OPTIONS } from '@/constants';
import { getSearchTypeInt, toggleCustomerMatch as toggleCustomerMatchUtil } from '@/utils/customer';
import { useModalStore } from '@/stores/modalStore';

const emit = defineEmits(['customer-selected']);
const modalStore = useModalStore();

const reservationStore = useReservationStore();

// props: 매칭된 고객 정보 (ReserveInfo에서 전달)
const props = defineProps({
    matchedCustomer: {
        type: Object,
        default: null
    }
});

// 조회 조건 옵션
const searchTypeOptions = CUSTOMER_SEARCH_TYPE_OPTIONS;

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
    toggleCustomerMatchUtil(customerList.value, row);
};

// 조회 버튼 활성화 여부 (무조건 검색어가 2글자 이상이어야 함)
const isSearchEnabled = computed(() => {
    return searchKeyword.value.trim().length >= 2;
});


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
        customerList.value = (result || []).map(item => {
            // 매칭된 고객과 비교하여 자동 선택
            let isMatched = false;
            if (props.matchedCustomer) {
                // userSno와 petSno로 비교
                const matchedUserSno = props.matchedCustomer.userSno || props.matchedCustomer.userNo;
                const matchedPetSno = props.matchedCustomer.petSno || props.matchedCustomer.petNo;
                const itemUserSno = item.userSno || item.userNo;
                const itemPetSno = item.petSno || item.petNo;
                
                if (matchedUserSno && itemUserSno && String(matchedUserSno) === String(itemUserSno)) {
                    // petSno도 있으면 둘 다 일치해야 함
                    if (matchedPetSno && itemPetSno) {
                        isMatched = String(matchedPetSno) === String(itemPetSno);
                    } else {
                        isMatched = true; // userSno만 일치해도 매칭
                    }
                } else if (matchedPetSno && itemPetSno && String(matchedPetSno) === String(itemPetSno)) {
                    isMatched = true; // petSno만 일치해도 매칭
                }
            }
            
            return {
                ...item,
                isMatched: isMatched,
                rowClass: isMatched ? 'row-matched' : '',
                breed: item.breedName || '',
                sex: PET_GENDER_MAP[item.sex] || '',
            };
        });
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
    { key: 'userNo', label: '고객번호', width: '10%' },
    { key: 'userName', label: '고객명', width: '12%' },
    { key: 'userTel', label: '전화번호', width: '15%' },
    { key: 'petNo', label: '동물번호', width: '12%' },
    { key: 'petName', label: '동물명', width: '12%' },
    { key: 'speciesName', label: '종', width: '12%' },
    { key: 'breed', label: '품종', width: '15%'},
    { key: 'sex', label: '성별', width: '12%'},
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
                class="btn btn--size-40 btn--black"
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