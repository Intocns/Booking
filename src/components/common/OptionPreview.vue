<script setup>
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import icEmpty from '@/assets/icons/ic_empty.svg';
import icArrowLeft from '@/assets/icons/ic_arrow_left.svg';
import icArrowRight from '@/assets/icons/ic_arrow_right.svg';
import { ref, computed, watch } from 'vue';
import { useOptionStore } from '@/stores/optionStore';
import { useProductStore } from '@/stores/productStore';
import { useDragScroll } from '@/composables/useDragScroll';

// 미리보기 옵션 데이터
const previewOptions = ref([]);
const isLoading = ref(false);

const optionStore = useOptionStore();
const productStore = useProductStore();

// Props
const props = defineProps({
    selectedProduct: {
        type: [String, Number],
        default: ''
    }
});

// Emits
const emit = defineEmits(['update:selectedProduct']);

// 상품 리스트를 CustomSelect용 options로 변환
const productOptions = computed(() => {
    return (productStore.productList || []).map(product => ({
        label: product.name || '',
        value: product.id || product.bizItemId || product.idx
    }));
});

// 선택된 상품 (v-model)
const selectedProductModel = computed({
    get: () => props.selectedProduct,
    set: (value) => emit('update:selectedProduct', value)
});

// 미리보기: 수량형 옵션
const quantityOptions = computed(() => {
    if (!selectedProductModel.value || !previewOptions.value.length) {
        return [];
    }
    
    // categoryType이 'NUMBER'인 옵션만 필터링
    let filtered = previewOptions.value.filter(option => option.categoryType === 'NUMBER');
    
    // 선택된 카테고리가 있으면 해당 카테고리의 옵션만 표시
    if (selectedQuantityCategory.value) {
        filtered = filtered.filter(option => option.categoryId === selectedQuantityCategory.value);
    }
    
    return filtered.map(option => ({
        optionName: option.optionName || '',
        rawData: {
            optionId: option.optionId,
            idx: option.optionId, // idx가 없으면 optionId 사용
            desc: option.optionDesc || '',
            price: option.optionPrice || null,
            minBookingCount: option.minBookingCount || 0,
            maxBookingCount: option.maxBookingCount || null,
            categoryId: option.categoryId,
            categoryName: option.categoryName
        }
    }));
});

// 미리보기: 체크형 옵션
const checkOptions = computed(() => {
    if (!selectedProductModel.value || !previewOptions.value.length) {
        return [];
    }
    
    // categoryType이 'CHECK'인 옵션만 필터링
    return previewOptions.value
        .filter(option => option.categoryType === 'CHECK')
        .map(option => ({
            optionName: option.optionName || '',
            rawData: {
                optionId: option.optionId,
                idx: option.optionId, // idx가 없으면 optionId 사용
                desc: option.optionDesc || '',
                price: option.optionPrice || null,
                categoryId: option.categoryId,
                categoryName: option.categoryName
            }
        }));
});

// 수량형 옵션에서 선택된 카테고리
const selectedQuantityCategory = ref(null);

// 수량형 옵션의 카테고리 목록 (API 응답에서 추출)
const quantityCategories = computed(() => {
    if (!previewOptions.value.length) {
        return [];
    }
    
    // 수량형 옵션의 카테고리만 추출 (중복 제거)
    const categoryMap = new Map();
    previewOptions.value
        .filter(option => option.categoryType === 'NUMBER')
        .forEach(option => {
            if (!categoryMap.has(option.categoryId)) {
                categoryMap.set(option.categoryId, {
                    category_id: option.categoryId,
                    name: option.categoryName || ''
                });
            }
        });
    
    return Array.from(categoryMap.values());
});

// 수량형 옵션의 선택 수량 관리
const optionQuantities = ref({}); // { optionId: quantity }

// 수량 증가
const increaseQuantity = (option) => {
    const optionId = option.rawData?.optionId || option.idx;
    const currentQty = getQuantity(option);
    const maxCount = option.rawData?.maxBookingCount;
    
    if (maxCount === null || maxCount === undefined || currentQty < maxCount) {
        optionQuantities.value[optionId] = currentQty + 1;
    }
};

// 수량 감소
const decreaseQuantity = (option) => {
    const optionId = option.rawData?.optionId || option.idx;
    const currentQty = getQuantity(option);
    const minCount = option.rawData?.minBookingCount || 0;
    
    if (currentQty > minCount) {
        optionQuantities.value[optionId] = currentQty - 1;
    }
};

// 수량 가져오기
const getQuantity = (option) => {
    const optionId = option.rawData?.optionId || option.idx;
    // 이미 설정된 값이 있으면 그 값 사용
    if (optionQuantities.value[optionId] !== undefined) {
        return optionQuantities.value[optionId];
    }
    // 초기값은 minBookingCount 또는 0
    const minCount = option.rawData?.minBookingCount || 0;
    return minCount;
};

// 체크형 옵션의 선택 상태 관리
const checkedOptions = ref({}); // { optionId: boolean }

// 체크박스 토글
const toggleCheckOption = (option) => {
    const optionId = option.rawData?.optionId || option.idx;
    checkedOptions.value[optionId] = !checkedOptions.value[optionId];
};

// 체크박스 상태 가져오기
const isChecked = (option) => {
    const optionId = option.rawData?.optionId || option.idx;
    return checkedOptions.value[optionId] || false;
};

// 선택된 상품이 변경되면 수량/체크 상태 초기화 및 옵션 데이터 로드
watch(selectedProductModel, async (newValue) => {
    optionQuantities.value = {};
    checkedOptions.value = {};
    previewOptions.value = [];
    
    if (newValue) {
        try {
            isLoading.value = true;
            const response = await optionStore.getOptionPreviewByItemId(newValue);
            
            // API 응답 구조: response.data.data 배열
            const data = response?.data?.data || response?.data || [];
            
            if (Array.isArray(data)) {
                previewOptions.value = data;
                
                // 수량형 옵션이 있으면 첫 번째 카테고리 자동 선택
                const numberOptions = data.filter(option => option.categoryType === 'NUMBER');
                if (numberOptions.length > 0) {
                    selectedQuantityCategory.value = numberOptions[0].categoryId;
                }
            }
        } catch (error) {
            console.error('미리보기 옵션 로드 실패:', error);
            previewOptions.value = [];
        } finally {
            isLoading.value = false;
        }
    }
});

// 카테고리 버튼 스크롤 컨테이너 참조 및 드래그 스크롤 기능
const { scrollRef: categoryScrollRef, handleMouseDown } = useDragScroll({
    buttonSelector: '.category-btn'
});

// 카테고리 버튼 좌우 스크롤 함수
const scrollCategoryLeft = () => {
    if (categoryScrollRef.value) {
        categoryScrollRef.value.scrollBy({ left: -100, behavior: 'smooth' });
    }
};

const scrollCategoryRight = () => {
    if (categoryScrollRef.value) {
        categoryScrollRef.value.scrollBy({ left: 100, behavior: 'smooth' });
    }
};
</script>

<template>
    <div class="preview-wrapper">
        <div class="preview-title">
            <p class="heading-s">미리보기</p>
        </div>
        <div class="preview-contents">
            <!-- 선택 -->
            <CustomSingleSelect 
                v-model="selectedProductModel"
                :options="productOptions"
                placeholder="상품을 선택해주세요"
            />

            <!-- 미리보기 -->
            <div class="preview-section">
                <!-- 상품이 선택되지 않은 경우 -->
                <div v-if="!selectedProductModel" class="empty-box">
                    <img :src="icEmpty" alt="비어있음 아이콘">
                    <span class="title-s">상품을 선택해주세요.</span>
                    <p class="body-m">상품을 선택하면 연결된 옵션을 확인할 수 있습니다.</p>
                </div>
                
                <!-- 옵션 선택 섹션 -->
                <div v-else class="preview-options-wrapper">
                    <!-- 수량형 옵션 섹션 -->
                    <div class="preview-options-section">
                        <div class="preview-section-title">
                            <p class="body-m">함께 예약가능한 옵션이니 필요한 경우 선택하세요.</p>
                        </div>
                        
                        <!-- 카테고리 버튼들 (수량형) -->
                        <div v-if="quantityOptions.length > 0" class="category-buttons-wrapper">
                            <button 
                                class="category-scroll-btn"
                                @click="scrollCategoryLeft"
                            >
                                <img :src="icArrowLeft" alt="이전">
                            </button>
                            <div 
                                class="category-buttons" 
                                ref="categoryScrollRef"
                                @mousedown="handleMouseDown"
                            >
                                <button 
                                    v-for="category in quantityCategories" 
                                    :key="category.category_id"
                                    class="category-btn"
                                    :class="{ 'active': selectedQuantityCategory === category.category_id }"
                                    @click="selectedQuantityCategory = category.category_id"
                                >
                                    {{ category.name }}
                                </button>
                            </div>
                            <button 
                                class="category-scroll-btn"
                                @click="scrollCategoryRight"
                            >
                                <img :src="icArrowRight" alt="다음">
                            </button>
                        </div>
                        
                        <!-- 수량형 옵션 리스트 -->
                        <div class="option-list quantity-list">
                            <div 
                                v-for="option in quantityOptions" 
                                :key="option.rawData?.optionId || option.idx"
                                class="option-item quantity-option"
                            >
                                <div class="option-info">
                                    <p class="option-name title-m">{{ option.optionName }}</p>
                                    <p v-if="option.rawData?.desc" class="option-desc body-xs">{{ option.rawData.desc }}</p>
                                    <p v-if="option.rawData?.price" class="option-price title-m">
                                        {{ option.rawData.price.toLocaleString() }}원
                                    </p>
                                </div>
                                
                                <div class="quantity-selector">
                                    <button 
                                        class="quantity-btn"
                                        :disabled="getQuantity(option) <= (option.rawData?.minBookingCount || 0)"
                                        @click="decreaseQuantity(option)"
                                    >
                                        -
                                    </button>
                                    <span class="quantity-value title-m">{{ getQuantity(option) }}</span>
                                    <button 
                                        class="quantity-btn"
                                        :disabled="option.rawData?.maxBookingCount !== null && option.rawData?.maxBookingCount !== undefined && getQuantity(option) >= option.rawData.maxBookingCount"
                                        @click="increaseQuantity(option)"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 체크형 옵션 섹션 -->
                    <div class="preview-options-section">
                        <div class="preview-section-title">
                            <p class="body-m">필수 항목을 확인해 주세요.</p>
                            <p class="body-xs">필수 메뉴는 예약 시 필수로 포함되는 메뉴입니다.</p>
                        </div>
                        
                        <!-- 체크형 옵션 리스트 -->
                        <div class="option-list check-list">
                            <div 
                                v-for="option in checkOptions" 
                                :key="option.rawData?.optionId || option.idx"
                                class="option-item check-option"
                            >
                                <label class="checkbox">
                                    <input 
                                        type="checkbox" 
                                        :checked="isChecked(option)"
                                        @change="toggleCheckOption(option)"
                                    />
                                    <span class="box"></span>
                                </label>
                                
                                <div class="option-info">
                                    <p class="option-name title-m">{{ option.optionName }}</p>
                                    <p v-if="option.rawData?.desc" class="option-desc body-xs">{{ option.rawData.desc }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.preview-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    min-height: 0;
    max-height: 100%;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid $gray-200;
    background-color: $gray-00;
    overflow: hidden;
}

.preview-contents {
    flex: 1;
    min-height: 0;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;

    .select {
        width: 100%;
        flex-shrink: 0;
    }

    .preview-section {
        flex: 1;
        min-height: 0;
        max-height: 100%;
        padding: 24px 16px;
        overflow-y: auto;
        overflow-x: hidden;
        border-top: 1px solid $gray-200;

        .empty-box {
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            
            img {
                margin-bottom: 8px;
            }
        }
        
        .preview-options-wrapper {
            display: flex;
            flex-direction: column;
            gap: 32px;
        }
        
        .preview-options-section {
            display: flex;
            flex-direction: column;
            gap: 16px;
            
            .preview-section-title {
                display: flex;
                flex-direction: column;
                gap: 4px;
                
                p {
                    color: $gray-600;
                    
                    &.body-xs {
                        color: $gray-500;
                    }
                }
            }
            
            .category-buttons-wrapper {
                display: flex;
                align-items: center;
                gap: 4px;
                
                .category-scroll-btn {
                    flex-shrink: 0;
                    width: 20px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    border-radius: 0;
                    background-color: transparent;
                    cursor: pointer;
                    padding: 0;
                    
                    &:hover {
                        background-color: $gray-50;
                        border-radius: 4px;
                    }
                    
                    img {
                        width: 12px;
                        height: 12px;
                    }
                }
                
                .category-buttons {
                    flex: 1;
                    display: flex;
                    gap: 6px;
                    overflow-x: auto;
                    overflow-y: hidden;
                    white-space: nowrap;
                    padding: 0;
                    min-width: 0;
                    cursor: grab;
                    
                    /* 스크롤바 숨기기 */
                    scrollbar-width: none; // Firefox
                    &::-webkit-scrollbar {
                        display: none; // Chrome, Safari
                    }
                    
                    &:active {
                        cursor: grabbing;
                    }
                    
                    .category-btn {
                        flex-shrink: 0;
                        padding: 8px 16px;
                        border: 1px solid $gray-200;
                        border-radius: 20px;
                        background-color: $gray-00;
                        color: $gray-700;
                        cursor: pointer;
                        @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
                        white-space: nowrap;
                        
                        &:hover {
                            background-color: $gray-50;
                        }
                        
                        &.active {
                            border-color: $gray-800;
                            background-color: $gray-800;
                            color: $gray-00;
                        }
                    }
                }
            }
            
            .option-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
                
                &.quantity-list {
                    margin-top: 8px;
                }
                
                &.check-list {
                    margin-top: 8px;
                }
                
                .option-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                    border-radius: 8px;
                    border: 1px solid $gray-200;
                    background-color: $gray-00;
                    
                    &.quantity-option {
                        justify-content: space-between;
                        align-items: center;
                        
                        .option-info {
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                            gap: 4px;
                            
                            .option-name {
                                color: $gray-900;
                            }
                            
                            .option-desc {
                                color: $gray-600;
                            }
                            
                            .option-price {
                                color: $gray-900;
                                margin-top: 4px;
                            }
                        }
                        
                        .quantity-selector {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            
                            .quantity-btn {
                                width: 32px;
                                height: 32px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                border: 1px solid #00c73c;
                                border-radius: 4px;
                                background-color: #00c73c;
                                cursor: pointer;
                                color: $gray-900;
                                
                                &:hover:not(:disabled) {
                                    background-color: #00c73c;
                                    border-color: #00c73c;
                                }
                                
                                &:disabled {
                                    opacity: 0.5;
                                    cursor: not-allowed;
                                    background-color: $gray-200;
                                    border-color: $gray-300;
                                }
                            }
                            
                            .quantity-value {
                                min-width: 24px;
                                text-align: center;
                                color: $gray-900;
                            }
                        }
                    }
                    
                    &.check-option {
                        .checkbox {
                            margin-top: 2px;
                            
                            .box {
                                width: 18px;
                                height: 18px;
                                border: 2px solid #00c73c;
                                border-radius: 4px;
                                background-color: $gray-00;
                                position: relative;
                                background-image: none;
                                
                                &::after {
                                    content: '';
                                    position: absolute;
                                    left: 50%;
                                    top: 50%;
                                    width: 4px;
                                    height: 8px;
                                    border: solid $gray-00;
                                    border-width: 0 2px 2px 0;
                                    transform: translate(-50%, -60%) rotate(45deg);
                                    opacity: 0;
                                    transition: opacity 0.2s;
                                }
                            }
                            
                            input:checked + .box {
                                background-color: #00c73c;
                                border-color: #00c73c;
                                background-image: none;
                                
                                &::after {
                                    opacity: 1;
                                    border-color: $gray-00;
                                }
                            }
                        }
                        
                        .option-info {
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                            gap: 4px;
                            
                            .option-name {
                                color: $gray-900;
                            }
                            
                            .option-desc {
                                color: $gray-600;
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>

