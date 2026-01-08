<script setup>
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import icEmpty from '@/assets/icons/ic_empty.svg';
import icArrowLeft from '@/assets/icons/ic_arrow_left.svg';
import icArrowRight from '@/assets/icons/ic_arrow_right.svg';
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
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

// 옵션 데이터 매핑 헬퍼 함수
const mapOptionData = (option, includeQuantityFields = false) => {
    const baseData = {
        optionId: option.optionId,
        idx: option.optionId,
        price: option.optionPrice || null,
        comment: option.optionComment || '',
        categoryId: option.categoryId,
        categoryName: option.categoryName
    };
    
    if (includeQuantityFields) {
        baseData.minBookingCount = option.minBookingCount || 0;
        baseData.maxBookingCount = option.maxBookingCount || null;
    }
    
    if (option.categoryType) {
        baseData.categoryType = option.categoryType;
    }
    
    return {
        optionName: option.optionName || '',
        rawData: baseData
    };
};

// 미리보기: 수량형 옵션 (requiredType이 1이 아닌 카테고리만)
const quantityOptions = computed(() => {
    if (!selectedProductModel.value || !previewOptions.value.length) {
        return [];
    }
    
    // categoryType이 'NUMBER'이고 requiredType이 1이 아닌 옵션만 필터링
    let filtered = previewOptions.value.filter(option => 
        option.categoryType === 'NUMBER' && option.requiredType !== 1
    );
    
    // 선택된 카테고리가 있으면 해당 카테고리의 옵션만 표시
    if (selectedCategory.value) {
        filtered = filtered.filter(option => option.categoryId === selectedCategory.value);
    }
    
    return filtered.map(option => mapOptionData(option, true));
});

// 미리보기: 체크형 옵션 (requiredType이 1이 아닌 카테고리만)
const checkOptions = computed(() => {
    if (!selectedProductModel.value || !previewOptions.value.length) {
        return [];
    }
    
    // categoryType이 'CHECK'이고 requiredType이 1이 아닌 옵션만 필터링
    let filtered = previewOptions.value.filter(option => 
        option.categoryType === 'CHECK' && option.requiredType !== 1
    );
    
    // 선택된 카테고리가 있으면 해당 카테고리의 옵션만 표시
    if (selectedCategory.value) {
        filtered = filtered.filter(option => option.categoryId === selectedCategory.value);
    }
    
    return filtered.map(option => mapOptionData(option));
});

// 미리보기: 필수 항목 옵션 (requiredType이 1인 카테고리의 모든 옵션)
const requiredOptions = computed(() => {
    if (!selectedProductModel.value || !previewOptions.value.length) {
        return [];
    }
    
    // requiredType이 1인 카테고리의 모든 옵션 (NUMBER, CHECK 모두 포함)
    return previewOptions.value
        .filter(option => option.requiredType === 1)
        .map(option => mapOptionData(option));
});

// 선택된 카테고리 (NUMBER, CHECK 공통)
const selectedCategory = ref(null);

// 미리보기 옵션의 카테고리 목록 (requiredType이 1이 아닌 카테고리만, 중복 제거)
const previewCategories = computed(() => {
    if (!previewOptions.value.length) {
        return [];
    }
    
    const categoryMap = new Map();
    previewOptions.value.forEach(option => {
        // requiredType이 1인 카테고리는 카테고리 버튼에서 제외
        if (option.requiredType !== 1 && !categoryMap.has(option.categoryId)) {
            categoryMap.set(option.categoryId, {
                category_id: option.categoryId,
                name: option.categoryName || '',
                categoryType: option.categoryType,
                requiredType: option.requiredType
            });
        }
    });
    
    return Array.from(categoryMap.values());
});

// 필수 항목 섹션 표시 여부 (requiredType이 1인 옵션이 있을 때만)
const hasRequiredOptions = computed(() => requiredOptions.value.length > 0);

// 수량형 옵션의 선택 수량 관리
const optionQuantities = ref({}); // { optionId: quantity }

// 옵션 ID 가져오기 헬퍼 함수
const getOptionId = (option) => {
    return option.rawData?.optionId || option.idx;
};

// 수량 증가
const increaseQuantity = (option) => {
    const optionId = getOptionId(option);
    const currentQty = getQuantity(option);
    const maxCount = option.rawData?.maxBookingCount;
    
    if (maxCount === null || maxCount === undefined || currentQty < maxCount) {
        optionQuantities.value[optionId] = currentQty + 1;
    }
};

// 수량 감소
const decreaseQuantity = (option) => {
    const optionId = getOptionId(option);
    const currentQty = getQuantity(option);
    const minCount = option.rawData?.minBookingCount || 0;
    
    if (currentQty > minCount) {
        optionQuantities.value[optionId] = currentQty - 1;
    }
};

// 수량 가져오기
const getQuantity = (option) => {
    const optionId = getOptionId(option);
    // 이미 설정된 값이 있으면 그 값 사용
    if (optionQuantities.value[optionId] !== undefined) {
        return optionQuantities.value[optionId];
    }
    // 초기값은 minBookingCount 또는 0
    const minCount = option.rawData?.minBookingCount || 0;
    return minCount;
};

// 총액 계산 (가격 * 수량)
const getTotalPrice = (option) => {
    const quantity = getQuantity(option);
    const price = option.rawData?.price;
    if (price && quantity > 0) {
        return price * quantity;
    }
    return 0;
};

// 체크형 옵션의 선택 상태 관리
const checkedOptions = ref({}); // { optionId: boolean }

// 체크박스 토글
const toggleCheckOption = (option) => {
    const optionId = getOptionId(option);
    checkedOptions.value[optionId] = !checkedOptions.value[optionId];
};

// 체크박스 상태 가져오기
const isChecked = (option) => {
    const optionId = getOptionId(option);
    return checkedOptions.value[optionId] || false;
};

// 옵션 데이터 로드 함수
const loadPreviewOptions = (data) => {
    if (Array.isArray(data)) {
        previewOptions.value = data;
        
        // 옵션이 있으면 첫 번째 카테고리 자동 선택 (NUMBER, CHECK 공통)
        const categories = Array.from(
            new Map(
                data.map(option => [option.categoryId, {
                    category_id: option.categoryId,
                    name: option.categoryName || '',
                    categoryType: option.categoryType
                }])
            ).values()
        );
        
        if (categories.length > 0) {
            selectedCategory.value = categories[0].category_id;
        }
    }
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
            const data = response?.data?.data || response?.data || [];
            loadPreviewOptions(data);
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

// 카테고리 좌우 이동 버튼 노출 여부
const showCategoryNav = ref(false);

// 카테고리 스크롤 영역이 넘칠 때만 버튼 노출
const updateCategoryNavVisibility = () => {
    nextTick(() => {
        const el = categoryScrollRef.value;
        if (!el) {
            showCategoryNav.value = false;
            return;
        }
        const overflow = el.scrollWidth - el.clientWidth;
        showCategoryNav.value = overflow > 2;
    });
};

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

// 카테고리 목록이 변할 때 버튼 노출 여부 재계산
watch(previewCategories, () => updateCategoryNavVisibility(), { immediate: true });

// 리사이즈 대응
const handleResize = () => updateCategoryNavVisibility();
onMounted(() => {
    updateCategoryNavVisibility();
    window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});
</script>

<template>
    <div class="preview-wrapper">
        <div class="preview-title">
            <p class="heading-s">미리보기</p>
        </div>
        <div class="preview-contents">
            <!-- 선택 -->
            <div class="select-wrapper">
                <CustomSingleSelect 
                    v-model="selectedProductModel"
                    :options="productOptions"
                    placeholder="상품을 선택해주세요"
                />
            </div>

            <!-- 미리보기 -->
            <div class="preview-section">
                <!-- 상품이 선택되지 않고 옵션도 없는 경우 -->
                <div v-if="!selectedProductModel && previewOptions.length === 0" class="empty-box">
                    <img :src="icEmpty" alt="비어있음 아이콘">
                    <span class="title-s">상품을 선택해주세요.</span>
                    <p class="body-m">상품을 선택하면 연결된 옵션을 확인할 수 있습니다.</p>
                </div>
                
                <!-- 옵션 선택 섹션 -->
                <div v-else-if="previewOptions.length > 0" class="preview-options-wrapper">
                    <!-- 수량형 옵션 섹션 (일반 옵션이 있을 때만 표시) -->
                    <div v-if="quantityOptions.length > 0 || checkOptions.length > 0" class="preview-options-section">
                        <div class="preview-section-title">
                            <p class="title-m option-select-title">옵션을 선택해 주세요</p>
                            <p class="body-m">함께 예약가능한 옵션이니 필요한 경우 선택하세요.</p>
                        </div>
                        
                        <!-- 카테고리 버튼들 (NUMBER, CHECK 공통) -->
                        <div v-if="previewCategories.length > 0" class="category-buttons-wrapper" :class="{ 'has-check-only': quantityOptions.length === 0 && checkOptions.length > 0 }">
                            <button 
                                v-if="showCategoryNav"
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
                                    v-for="category in previewCategories" 
                                    :key="category.category_id"
                                    class="category-btn"
                                    :class="{ 'active': selectedCategory === category.category_id }"
                                    @click="selectedCategory = category.category_id"
                                >
                                    {{ category.name }}
                                </button>
                            </div>
                            <button 
                                v-if="showCategoryNav"
                                class="category-scroll-btn"
                                @click="scrollCategoryRight"
                            >
                                <img :src="icArrowRight" alt="다음">
                            </button>
                        </div>
                        
                        <!-- 수량형 옵션 리스트 -->
                        <div v-if="quantityOptions.length > 0" class="option-list quantity-list">
                            <div 
                                v-for="option in quantityOptions" 
                                :key="option.rawData?.optionId || option.idx"
                                class="option-item quantity-option"
                            >
                                <div class="option-info">
                                    <p class="option-name title-m">{{ option.optionName }}</p>
                                    <p v-if="option.rawData?.comment" class="option-desc body-xs">{{ option.rawData.comment }}</p>
                                    <p v-if="option.rawData?.price" class="option-price title-m">
                                        {{ option.rawData.price.toLocaleString() }}원
                                    </p>
                                </div>
                                
                                <div class="quantity-selector-wrapper">
                                    <div class="quantity-selector">
                                        <button 
                                            class="quantity-btn quantity-btn--minus"
                                            :disabled="getQuantity(option) <= (option.rawData?.minBookingCount || 0)"
                                            @click="decreaseQuantity(option)"
                                        >
                                            -
                                        </button>
                                        <span class="quantity-value title-m">{{ getQuantity(option) }}</span>
                                        <button 
                                            class="quantity-btn quantity-btn--plus"
                                            :disabled="option.rawData?.maxBookingCount !== null && option.rawData?.maxBookingCount !== undefined && getQuantity(option) >= option.rawData.maxBookingCount"
                                            @click="increaseQuantity(option)"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p v-if="option.rawData?.price && getQuantity(option) > 0" class="total-price body-xs">
                                        {{ getTotalPrice(option).toLocaleString() }}원
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 체크형 옵션 리스트 (같은 섹션 내) -->
                        <div v-if="checkOptions.length > 0" class="option-list check-list">
                            <div 
                                v-for="option in checkOptions" 
                                :key="getOptionId(option)"
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
                                    <p v-if="option.rawData?.comment" class="option-desc body-xs">{{ option.rawData.comment }}</p>
                                    <p v-if="option.rawData?.price" class="option-price title-m">
                                        {{ option.rawData.price.toLocaleString() }}원
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 필수 항목 섹션 (requiredType이 1인 카테고리의 옵션들) -->
                    <div v-if="hasRequiredOptions" class="preview-options-section">
                        <div class="preview-section-title">
                            <p class="title-m">필수 항목을 확인해 주세요.</p>
                            <p class="body-xs">필수 메뉴는 예약 시 필수로 포함되는 메뉴입니다.</p>
                        </div>
                        
                        <!-- 필수 항목 옵션 리스트 -->
                        <div class="option-list check-list">
                            <div 
                                v-for="option in requiredOptions" 
                                :key="getOptionId(option)"
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
                                    <p v-if="option.rawData?.comment" class="option-desc body-xs">{{ option.rawData.comment }}</p>
                                    <p v-if="option.rawData?.price" class="option-price title-m">
                                        {{ option.rawData.price.toLocaleString() }}원
                                    </p>
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
    gap: 0;
    height: 100%;
    min-height: 0;
    max-height: 100%;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid $gray-200;
    background-color: $gray-00;
    overflow: hidden;
}

.preview-title {
    flex-shrink: 0;
    margin-bottom: 16px;
}

.preview-contents {
    flex: 1;
    min-height: 0;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;

    .select-wrapper {
        flex-shrink: 0;
        
        .select {
            width: 100%;
        }
    }

    .preview-section {
        flex: 1;
        min-height: 0;
        max-height: 100%;
        padding: 0;
        overflow-y: auto;
        overflow-x: hidden;
        border-top: 1px solid $gray-200;
        
        /* 스크롤바 숨기기 */
        scrollbar-width: none; // Firefox
        &::-webkit-scrollbar {
            display: none; // Chrome, Safari
        }

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
            gap: 24px;
            padding: 24px 12px;
        }
        
            .preview-options-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
            
            .preview-section-title {
                display: flex;
                flex-direction: column;
                gap: 4px;
                
                .option-select-title,
                p.title-m {
                    color: $gray-900;
                    font-weight: 600;
                    margin-bottom: 0;
                }
                
                p {
                    color: $gray-600;
                    
                    &.body-m {
                        color: $gray-600;
                    }
                    
                    &.body-xs {
                        color: $gray-500;
                    }
                }
            }
            
            .category-buttons-wrapper {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 0;
                
                // 체크형 옵션만 있을 때 간격 조정
                &.has-check-only {
                    margin-bottom: 0;
                }
                
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
                gap: 0;
                
                &.quantity-list {
                    margin-top: 8px;
                }
                
                &.check-list {
                    margin-top: 8px;
                    
                    // 수량형 옵션 다음에 오는 체크형 옵션의 경우 간격 더 줄임
                    &:not(:first-child) {
                        margin-top: 0;
                    }
                }
                
                // 카테고리 버튼 바로 다음에 오는 체크형 옵션 리스트 간격 조정 (수량형 옵션이 없을 때)
                .category-buttons-wrapper.has-check-only + .option-list.check-list {
                    margin-top: 4px;
                }
                
                .option-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px 0;
                    border-bottom: 1px solid $gray-200;
                    background-color: $gray-00;
                    border-radius: 0;
                    
                    &:last-child {
                        border-bottom: none;
                    }
                    
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
                                font-weight: 500;
                            }
                            
                            .option-desc {
                                color: $gray-600;
                                line-height: 1.5;
                            }
                            
                            .option-price {
                                color: $gray-900;
                                margin-top: 4px;
                                font-weight: 500;
                            }
                        }
                        
                        .quantity-selector {
                            display: flex;
                            align-items: stretch;
                            gap: 0;
                            border: 1px solid $gray-200;
                            border-right: none;
                            border-radius: 0;
                            
                            .quantity-btn {
                                width: 32px;
                                height: 32px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                border: none;
                                border-radius: 0;
                                cursor: pointer;
                                font-size: 20px;
                                font-weight: 500;
                                transition: background-color 0.2s;
                                flex-shrink: 0;
                                
                                &--minus {
                                    background-color: $gray-00;
                                    color: $gray-700;
                                    
                                    &:hover:not(:disabled) {
                                        background-color: $gray-50;
                                    }
                                    
                                    &:disabled {
                                        opacity: 0.5;
                                        cursor: not-allowed;
                                        background-color: $gray-00;
                                        color: $gray-400;
                                    }
                                }
                                
                                &--plus {
                                    background-color: #00c73c;
                                    color: $gray-00;
                                    border-top: none;
                                    border-right: none;
                                    border-bottom: none;
                                    
                                    &:hover:not(:disabled) {
                                        background-color: #00b035;
                                    }
                                    
                                    &:disabled {
                                        opacity: 0.5;
                                        cursor: not-allowed;
                                        background-color: $gray-200;
                                        color: $gray-500;
                                    }
                                }
                            }
                            
                            .quantity-value {
                                min-width: 40px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                background-color: $gray-00;
                                border-left: 1px solid $gray-200;
                                border-right: 1px solid $gray-200;
                                color: $gray-400;
                                font-weight: 400;
                            }
                        }
                        
                        .quantity-selector-wrapper {
                            display: flex;
                            flex-direction: column;
                            align-items: flex-end;
                            gap: 4px;
                            
                            .total-price {
                                color: $gray-600;
                                text-align: right;
                            }
                        }
                    }
                    
                    &.check-option {
                        align-items: flex-start;
                        
                        .checkbox {
                            margin-top: 2px;
                            flex-shrink: 0;
                            
                            .box {
                                width: 20px;
                                height: 20px;
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
                                    width: 5px;
                                    height: 10px;
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
                                font-weight: 500;
                            }
                            
                            .option-desc {
                                color: $gray-600;
                                line-height: 1.5;
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>

