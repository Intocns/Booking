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
import FilterKeyword from '../filters/FilterKeyword.vue';
import { formatDate } from '@/utils/dateFormatter';

import icLinkBlue from '@/assets/icons/mobile/ic_link_blue.svg'
import icLinkBlack from '@/assets/icons/mobile/ic_link_black.svg'
import icEmpty from '@/assets/icons/ic_empty.svg'

const emit = defineEmits(['customer-selected']);
const modalStore = useModalStore();

const reservationStore = useReservationStore();

// props: 매칭된 고객 정보 (ReserveInfo에서 전달)
const props = defineProps({
    matchedCustomer: {
        type: Object,
        default: null
    },
    isMobile: {type:Boolean, default:false,}, // 모바일 환경 체크
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
    emit('customer-selected', {
        ...selectedCustomer.value,
        buttonType: 1
    });
};

// 신규 동물 등록 버튼 클릭
const handleNewPetRegistration = () => {
    if (!selectedCustomer.value) {
        return;
    }

    // 부모 컴포넌트에 선택한 고객 정보 전달
    emit('customer-selected', {
        ...selectedCustomer.value,
        buttonType: 0
    });

    // 고객 검색 모달 닫기 (신규 등록은 예약 확정 시 처리)
    // modalStore.searchCustomerModal.closeModal();
    // TODO: 신규 동물 등록 로직 (필요시 추가)
};

// 고객 테이블 col 정의
const customerColumns = [
    { key: 'userNo', label: '고객번호', width: '10%' },
    { key: 'userName', label: '고객명', width: '10%' },
    { key: 'userTel', label: '전화번호', width: '17%' },
    { key: 'petNo', label: '동물번호', width: '10%' },
    { key: 'petName', label: '동물명', width: '10%' },
    { key: 'speciesName', label: '종', width: '10%' },
    { key: 'breed', label: '품종', width: '17%'},
    { key: 'sex', label: '성별', width: '12%'},
    { key: 'action', label: '고객매칭', width: '10%'},
]

</script>

<template>
    <template v-if="!isMobile">
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
                                class="btn btn--size-24 btn--black-outline"
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

    <template v-else>
        <!-- 검색영역 -->
        <div class="d-flex align-center gap-8">
            <div style="min-width: 80px;">
                <CustomSingleSelect 
                    v-model="selectedSearchType"
                    :options="searchTypeOptions"
                    placeholder="선택"
                    select-height="40px"
                />
            </div>
            <FilterKeyword 
                :is-mobile="isMobile"
                placeholder="고객명, 동물명, 전화번호 검색"
                v-model="searchKeyword" 
                @search="handleSearch"
            />
        </div>

        <!-- 리스트 -->
        <div v-if="customerList.length > 0" class="list-wrapper">
            <div v-for="row in customerList" class="list-item" :class="row.isMatched ? 'matched' : ''">
                <div class="list-item__content">
                    <p class="list-item__title">고객정보</p>
                    <div class="list-item__info">
                        <p class="name">{{ row.userName }} ({{ row.userNo }})</p>
                        <div class="sub-info">
                            <span>{{ row.userTel }}</span>
                            <span class="bar"></span>
                            <span>최근 방문일 {{ formatDate(row.lastVisitDate) }}</span>
                        </div>
                    </div>
                </div>
    
                <div class="list-item__content">
                    <p class="list-item__title">동물정보</p>
                    <div class="list-item__info">
                        <p class="name">{{ row.petName }} ({{ row.petNo }})</p>
                        <div class="sub-info">
                            <span>{{ row.speciesName }}</span>
                            <span class="bar"></span>
                            <span>{{ row.breed }}</span>
                            <span class="bar"></span>
                            <span>{{ row.sex }}</span>
                        </div>
                    </div>
                </div>
    
                <button 
                    class="btn btn--size-40" 
                    :class="row.isMatched ? 'btn--blue-outline' : 'btn--black-outline'"
                    @click="toggleCustomerMatch(row)
                ">
                    <img :src="row.isMatched ? icLinkBlue : icLinkBlack" alt="매칭">
                    {{ row.isMatched ? '고객 매칭 해제' : '고객 매칭' }}
                </button>
            </div>
        </div>

        <div v-else class="list-wrapper empty-box">
            <img :src="icEmpty" alt="비어있음 아이콘">
            <span>검색결과가 없습니다.</span>
        </div>

        <div class="bottom-button-wrapper">
            <button 
                class="btn btn--size-48 btn--blue-outline"
                @click="handleNewPetRegistration"
            >
                신규 동물 등록
            </button>
            <button 
                class="btn btn--size-48 btn--blue"
                @click="handleSelectPet"
                :disabled="!selectedCustomer"
            >
                선택 동물로 접수
            </button>
        </div>
    </template>
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

// 모바일용 바텀시트 slot css
.bottom-sheet__content {overflow-y: visible;}
.list-wrapper {
    height: 400px;
    margin-top:24px;
    display: flex;
    flex-direction: column;
    gap:8px;
    overflow-y: auto;

    .list-item {
        padding: 20px;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap:16px;

        border-radius: 8px;
        background-color: $gray-50;

        &.matched {background-color: $primary-50;}

        &__content {
            display: flex;
            gap:8px;
            align-items: flex-start;
        }

        &__title {
            height: 22px;
            display: flex;
            align-items: center;
            white-space: nowrap;
            color: $primary-700;
            @include typo($caption-mobile-size, $caption-mobile-weight, $caption-mobile-spacing, $caption-mobile-line);
        }

        &__info {
            flex:1 0 0;
            display: flex;
            flex-direction: column;
            gap:2px;

            .name {
                height: 22px;
                display: flex;
                align-items: center;
                color: $gray-800;
                @include typo($title-m-mobile-size, $title-m-mobile-weight, $title-m-mobile-spacing, $title-m-mobile-line);
            }

            .sub-info {
                display: flex;
                flex-wrap:wrap;
                align-items: center;
                gap: 8px;
                color: $gray-500;
                @include typo($caption-mobile-size, $caption-mobile-weight, $caption-mobile-spacing, $caption-mobile-line);
            }
            .bar {
                width:1px;
                height: 12px;
                background-color: $gray-300;
            }
        }
    }
}
.bottom-button-wrapper {
    width: calc(100% + 40px);
    margin: 0 -20px;
    padding: 20px;
    border-top: 1px solid $gray-200;
    display: flex;
    gap: 8px;
    background-color: $gray-00;

    button {flex:1;}
}
</style>