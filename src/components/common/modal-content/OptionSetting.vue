<script setup>
// 컴포넌트
import InputTextBox from '@/components/common/InputTextBox.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';
// 스토어
import { useModalStore } from '@/stores/modalStore';
import { useOptionStore } from '@/stores/optionStore';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
// 유틸
import { formatDate } from '@/utils/dateFormatter.js';
import { formatPrice, parsePrice } from '@/utils/priceFormatter.js';

import { ref, computed, onMounted, onUnmounted, defineProps, nextTick, watch } from 'vue';

const props = defineProps({
    isEdit: {
        type: Boolean,
        default: false
    }
});

const modalStore = useModalStore();
const optionStore = useOptionStore();
const productStore = useProductStore();
const categoryStore = useCategoryStore();

/**
 * 화면 모드 상태 관리
 * OPTION: 옵션 관리 목록
 * CONNECT : 옵션-상품 연결
 */
const mode = ref('OPTION');

// 상태 관리
const selectedHour = ref(0); // 시간 
const selectedMinute = ref(0); // 분
const isHourOpen = ref(false); // 시간 셀렉트 노출/미노출
const isMinuteOpen = ref(false); // 분 셀렉트 노출/미노출
// 토글 상태 관리
const isStockEnabled = ref(false);    // 재고 토글
const isPriceEnabled = ref(false);    // 가격 토글
const isPeriodEnabled = ref(false);   // 운영기간 토글
const isImp = ref(1);                 // 노출설정 (기본값: 1, 복사 시 원본 값 사용)

// 카테고리 선택 (단일 선택)
const selectedCategory = ref('');
// 카테고리 옵션 변환 (CustomSingleSelect용)
const categoryOptions = computed(() => {
    return categoryStore.categoryList.map(cat => ({
        label: cat.name,
        value: cat.categoryId
    }));
});

// 선택된 카테고리가 체크형인지 확인
const isCheckTypeCategory = computed(() => {
    if (!selectedCategory.value) return false;
    const category = categoryStore.categoryList.find(cat => cat.categoryId === selectedCategory.value);
    return category?.selectionTypeCode === 'CHECK';
});

// 입력 필드 데이터
const optionName = ref(''); // 옵션명
const optionDesc = ref(''); // 옵션 설명
const minCount = ref(''); // 최소 수량
const maxCount = ref(''); // 최대 수량
const stockCount = ref(''); // 재고 수
const price = ref(''); // 판매가
const normalPrice = ref(''); // 정가
const priceDesc = ref(''); // 가격 부가설명
const periodDate = ref(null); // 운영기간 (Date 배열)

const categorySelectRef = ref(null);
const optionNameInputRef = ref(null);
const stockCountInputRef = ref(null);
const priceInputRef = ref(null);

// 숫자만 입력 허용 핸들러
const handleNumberInput = (value, field) => {
    // 숫자만 추출 (콤마 제거 후 숫자만)
    const numericValue = parsePrice(value);
    if (field === 'minCount') {
        minCount.value = numericValue;
    } else if (field === 'maxCount') {
        maxCount.value = numericValue;
    } else if (field === 'stockCount') {
        stockCount.value = numericValue;
    } else if (field === 'price') {
        price.value = numericValue;
    } else if (field === 'normalPrice') {
        normalPrice.value = numericValue;
    }
};

// 포맷팅된 가격 표시용 computed
const formattedPrice = computed({
    get: () => formatPrice(price.value),
    set: (value) => {
        price.value = parsePrice(value);
    }
});

const formattedNormalPrice = computed({
    get: () => formatPrice(normalPrice.value),
    set: (value) => {
        normalPrice.value = parsePrice(value);
    }
});

// 상품 연결 리스트 (productStore에서 직접 사용)
const productList = ref([]);
// 초기 연결 상태 추적 (수정 모드에서 변경사항 비교용)
const initialConnectedProductIds = ref([]);

// 상품 리스트 초기화 (productStore의 데이터를 기반으로)
watch(() => productStore.productList, (newList) => {
    if (newList && newList.length > 0) {
        productList.value = newList.map(product => ({
            id: product.bizItemId || product.id || product.idx, // bizItemId를 우선으로 사용 (connectedProductIds와 매칭을 위해)
            name: product.name || '',
            isConnected: false // 기본값: 미연결 (추후 API 응답에 연결 상태 포함 여부 확인)
        }));
        
        // 수정 모드이고 optionData가 있으면 연결 상태 업데이트
        if (props.isEdit && modalStore.optionSettingModal.isVisible) {
            const optionData = modalStore.optionSettingModal.data?.optionData;
            if (optionData && optionData.connectedProductIds) {
                const connectedProductIds = optionData.connectedProductIds || [];
                productList.value.forEach(product => {
                    // 타입 변환하여 비교 (문자열/숫자 모두 처리)
                    const productId = String(product.id);
                    const isConnected = connectedProductIds.some(connectedId => String(connectedId) === productId);
                    product.isConnected = isConnected;
                });
            }
        }
    }
}, { immediate: true });

// 상품 연결 상태 토글 핸들러
const toggleProductConnection = (product) => {
    product.isConnected = !product.isConnected;
};

// 필수 필드 검증 공통 함수
const validateRequiredFields = async () => {
    // 카테고리 검증
    if (!selectedCategory.value) {
        alert('카테고리를 선택해주세요.');
        await nextTick();
        if (categorySelectRef.value) {
            const selectBox = categorySelectRef.value.$el?.querySelector('.select__box');
            if (selectBox) {
                selectBox.click();
            }
        }
        return false;
    }
    
    // 옵션명 검증
    if (!optionName.value || optionName.value.trim() === '') {
        alert('옵션명을 입력해주세요.');
        await nextTick();
        if (optionNameInputRef.value) {
            const inputElement = optionNameInputRef.value.$el?.querySelector('input[type="text"]');
            if (inputElement) {
                inputElement.focus();
            }
        }
        return false;
    }
    
    // 재고 수 검증 (재고 토글이 켜져 있을 때)
    if (isStockEnabled.value && (!stockCount.value || stockCount.value.trim() === '')) {
        alert('재고 수를 입력해주세요.');
        await nextTick();
        if (stockCountInputRef.value) {
            const inputElement = stockCountInputRef.value.$el?.querySelector('input[type="text"]');
            if (inputElement) {
                inputElement.focus();
            }
        }
        return false;
    }
    
    // 판매가 검증 (가격 토글이 켜져 있을 때)
    if (isPriceEnabled.value && (!price.value || price.value.trim() === '')) {
        alert('판매가를 입력해주세요.');
        await nextTick();
        if (priceInputRef.value) {
            const inputElement = priceInputRef.value.$el?.querySelector('input[type="text"]');
            if (inputElement) {
                inputElement.focus();
            }
        }
        return false;
    }
    
    return true;
};

// 수정/등록 버튼 클릭 핸들러
const handleSubmit = () => {
    if (props.isEdit) {
        handleUpdate();
    } else {
        handleSave();
    }
};

// 옵션 데이터로 필드 채우기 함수
const fillOptionData = (optionData) => {
    if (!optionData) return;
    
    // 기본 정보
    selectedCategory.value = optionData.categoryId || '';
    optionName.value = optionData.name || '';
    optionDesc.value = optionData.desc || '';
    
    // 선택 가능 수량 (체크형은 1로 고정)
    if (isCheckTypeCategory.value) {
        minCount.value = '1';
        maxCount.value = '1';
    } else {
        minCount.value = optionData.minBookingCount !== null && optionData.minBookingCount !== undefined 
            ? String(optionData.minBookingCount) : '';
        maxCount.value = optionData.maxBookingCount !== null && optionData.maxBookingCount !== undefined 
            ? String(optionData.maxBookingCount) : '';
    }
    
    // 재고 설정
    if (optionData.stock !== null && optionData.stock !== undefined) {
        isStockEnabled.value = true;
        stockCount.value = String(optionData.stock);
    } else {
        isStockEnabled.value = false;
        stockCount.value = '';
    }
    
    // 가격 설정
    if (optionData.price !== null && optionData.price !== undefined) {
        isPriceEnabled.value = true;
        price.value = String(optionData.price);
        normalPrice.value = optionData.normalPrice ? String(optionData.normalPrice) : '';
        priceDesc.value = optionData.priceDesc || '';
    } else {
        isPriceEnabled.value = false;
        price.value = '';
        normalPrice.value = '';
        priceDesc.value = '';
    }
    
    // 운영기간 설정
    if (optionData.startDate && optionData.endDate) {
        isPeriodEnabled.value = true;
        periodDate.value = [
            new Date(optionData.startDate),
            new Date(optionData.endDate)
        ];
    } else {
        isPeriodEnabled.value = false;
        periodDate.value = null;
    }
    
    // 소요시간 설정
    if (optionData.serviceDuration !== null && optionData.serviceDuration !== undefined) {
        const hours = Math.floor(optionData.serviceDuration / 60);
        const minutes = optionData.serviceDuration % 60;
        selectedHour.value = hours;
        selectedMinute.value = minutes;
    } else {
        selectedHour.value = 0;
        selectedMinute.value = 0;
    }
    
    // 노출설정 복사
    isImp.value = optionData.isImp !== null && optionData.isImp !== undefined ? optionData.isImp : 1;
    
    // 상품 연결 상태 설정
    const connectedProductIds = optionData.connectedProductIds || [];
    // 초기 연결 상태 저장 (변경사항 비교용)
    initialConnectedProductIds.value = connectedProductIds.map(id => String(id));
    
    if (productList.value.length > 0) {
        productList.value.forEach(product => {
            // 타입 변환하여 비교 (문자열/숫자 모두 처리)
            const productId = String(product.id);
            const isConnected = connectedProductIds.some(connectedId => String(connectedId) === productId);
            product.isConnected = isConnected;
        });
    }
};

// 옵션 데이터 생성
const hourOptions = Array.from({ length: 6 }, (_, i) => i);
const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

// 시간/분 선택 핸들러
const selectHour = (h) => {
    selectedHour.value = h;
    isHourOpen.value = false;
};
const selectMinute = (m) => {
    selectedMinute.value = m;
    isMinuteOpen.value = false;
};

// 외부 클릭 시 닫기 로직
const closeAll = (e) => {
    if (!e.target.closest('.time-unit')) {
        isHourOpen.value = false;
        isMinuteOpen.value = false;
    }
};

/**
 * 핸들러 함수
 */
const goConnect = () => { 
    mode.value = 'CONNECT';
};
const goOption = () => { mode.value = 'OPTION'; };
const handleNext = () => {
    // mode watch에서 validation 처리하므로 여기서는 바로 이동
    goConnect();
}
const handlePrev = () => {
    goOption();
}

const handleSave = async () => {
    // 필수 필드 검증
    const isValid = await validateRequiredFields();
    if (!isValid) {
        return;
    }

    // 소요시간 계산 (분 단위)
    const serviceDuration = selectedHour.value * 60 + selectedMinute.value;

    // 엔티티 형태로 데이터 매핑
    const optionData = {
        categoryId: selectedCategory.value,
        name: optionName.value.trim(),
        serviceDuration: serviceDuration > 0 ? serviceDuration : null,
        desc: optionDesc.value.trim() || null,
        minBookingCount: isCheckTypeCategory.value ? 1 : (minCount.value ? parseInt(minCount.value) : null),
        maxBookingCount: isCheckTypeCategory.value ? 1 : (maxCount.value ? parseInt(maxCount.value) : null),
        stock: isStockEnabled.value && stockCount.value ? parseInt(stockCount.value) : null,
        price: isPriceEnabled.value && price.value ? parseInt(parsePrice(price.value)) : null,
        normalPrice: isPriceEnabled.value && normalPrice.value ? parseInt(parsePrice(normalPrice.value)) : null,
        priceDesc: isPriceEnabled.value && priceDesc.value.trim() ? priceDesc.value.trim() : null,
        startDate: isPeriodEnabled.value && periodDate.value && periodDate.value[0] 
            ? formatDate(periodDate.value[0]) || null
            : null,
        endDate: isPeriodEnabled.value && periodDate.value && periodDate.value[1] 
            ? formatDate(periodDate.value[1]) || null
            : null,
        isImp: isImp.value, // 복사 모드일 때 원본의 isImp 값 사용
        useFlag: 1,
    };

    try {
        // 1. 옵션 등록
        const optionResponse = await optionStore.addOption(optionData);
        
        // 옵션 등록 성공 시 optionId 추출
        // 응답 구조: {status_code: 201, data: '{"optionId":21299980,"url":"..."}'}
        // optionResponse.data가 문자열이므로 JSON 파싱 필요
        let parsedData;
        if (typeof optionResponse.data === 'string') {
            try {
                parsedData = JSON.parse(optionResponse.data);
            } catch (e) {
                console.error('JSON 파싱 실패:', e);
                throw new Error('응답 데이터 파싱 실패');
            }
        } else {
            parsedData = optionResponse.data;
        }
        
        const optionId = parsedData?.optionId;
        
        if (!optionId) {
            throw new Error('옵션 ID를 받아오지 못했습니다.');
        }

        // 2. 옵션-상품 매핑 저장
        // 연결된 상품 ID 목록 추출
        const connectedItemIds = productList.value
            .filter(product => product.isConnected)
            .map(product => product.id);
        
        // ItemOptionMappingListDto 형태로 데이터 구성 (List로 전송)
        const mappingDataList = connectedItemIds.length > 0 ? [{
            useFlag: 1, // 기본값 (사용 중)
            categoryId: selectedCategory.value,
            optionId: optionId,
            itemIds: connectedItemIds.join(',')
        }] : [];

        // 연결된 상품이 있는 경우에만 매핑 저장
        if (mappingDataList.length > 0) {
            await optionStore.addOptionMapping(mappingDataList);
        }

        // 옵션 리스트 새로고침
        if (selectedCategory.value) {
            // await optionStore.getOptionListByCategoryId(selectedCategory.value);
            await optionStore.getOptionListByCategory();
        }

        alert('옵션이 등록되었습니다.');
        modalStore.optionSettingModal.closeModal();
    } catch (error) {
        console.error('옵션 등록 실패:', error);
        alert('옵션 등록 중 오류가 발생했습니다.');
    }
};
const handleUpdate = async () => {
    // 필수 필드 검증 (등록과 동일)
    const isValid = await validateRequiredFields();
    if (!isValid) {
        return;
    }

    // 소요시간 계산 (분 단위)
    const serviceDuration = selectedHour.value * 60 + selectedMinute.value;

    try {
        const optionDataFromModal = modalStore.optionSettingModal.data?.optionData;
        if (!optionDataFromModal || !optionDataFromModal.idx) {
            throw new Error('옵션 ID를 찾을 수 없습니다.');
        }

        // 엔티티 형태로 데이터 매핑
        const optionData = {
            idx: optionDataFromModal.idx, // 옵션 ID를 idx에 포함
            categoryId: selectedCategory.value,
            name: optionName.value.trim(),
            serviceDuration: serviceDuration > 0 ? serviceDuration : null,
            desc: optionDesc.value.trim() || null,
            minBookingCount: isCheckTypeCategory.value ? 1 : (minCount.value ? parseInt(minCount.value) : null),
            maxBookingCount: isCheckTypeCategory.value ? 1 : (maxCount.value ? parseInt(maxCount.value) : null),
            stock: isStockEnabled.value && stockCount.value ? parseInt(stockCount.value) : null,
            price: isPriceEnabled.value && price.value ? parseInt(parsePrice(price.value)) : null,
            normalPrice: isPriceEnabled.value && normalPrice.value ? parseInt(parsePrice(normalPrice.value)) : null,
            priceDesc: isPriceEnabled.value && priceDesc.value.trim() ? priceDesc.value.trim() : null,
            startDate: isPeriodEnabled.value && periodDate.value && periodDate.value[0] 
                ? formatDate(periodDate.value[0]) || null
                : null,
            endDate: isPeriodEnabled.value && periodDate.value && periodDate.value[1] 
                ? formatDate(periodDate.value[1]) || null
                : null,
            isImp: 1,
            useFlag: 1,
        };

        // 1. 옵션 수정
        // const updateResponse = await optionStore.updateOption(optionDataFromModal.idx, optionData);
        const updateResponse = await optionStore.updateOption(optionDataFromModal.optionId, optionData);
        
        // 옵션 ID 추출 (rawData에 저장된 optionId 사용)
        const optionId = optionDataFromModal.optionId;
        if (!optionId) {
            throw new Error('옵션 ID를 찾을 수 없습니다.');
        }

        // 2. 옵션-상품 매핑 저장/업데이트
        // 백엔드 로직: useFlag 1 = 연결, useFlag 0 = 연결 해제
        const currentConnectedItemIds = productList.value
            .filter(product => product.isConnected)
            .map(product => String(product.id));
        
        const initialConnectedIds = initialConnectedProductIds.value || [];
        
        // 연결된 상품 (useFlag: 1)
        const connectedItemIds = productList.value
            .filter(product => product.isConnected)
            .map(product => String(product.id));
        
        // 연결 해제된 상품 (기존에 연결되어 있었지만 현재는 해제됨)
        const disconnectedItemIds = initialConnectedIds.filter(id => !currentConnectedItemIds.includes(id));
        
        const mappingDataList = [];
        
        // 연결된 상품이 있으면 useFlag: 1로 전송
        if (connectedItemIds.length > 0) {
            mappingDataList.push({
                useFlag: 1,
                categoryId: selectedCategory.value,
                optionId: optionId,
                itemIds: connectedItemIds.join(',')
            });
        }
        
        // 연결 해제된 상품이 있으면 useFlag: 0으로 전송
        if (disconnectedItemIds.length > 0) {
            mappingDataList.push({
                useFlag: 0,
                categoryId: selectedCategory.value,
                optionId: optionId,
                itemIds: disconnectedItemIds.join(',')
            });
        }

        // 변경사항이 있으면 매핑 업데이트
        if (mappingDataList.length > 0) {
            await optionStore.addOptionMapping(mappingDataList);
        }

        // 옵션 리스트 새로고침
        if (selectedCategory.value) {
            // await optionStore.getOptionListByCategoryId(selectedCategory.value);
            await optionStore.getOptionListByCategory();
        }

        alert('옵션이 수정되었습니다.');
        modalStore.optionSettingModal.closeModal();
    } catch (error) {
        console.error('옵션 수정 실패:', error);
        alert('옵션 수정 중 오류가 발생했습니다.');
    }
};


// 모달이 열릴 때 데이터 초기화 및 수정 모드일 때 데이터 채우기
watch(() => modalStore.optionSettingModal.isVisible, async (isVisible) => {
    if (isVisible) {
        await nextTick(); // DOM 업데이트 대기
        
        // initialTab이 있으면 해당 탭으로 이동 (props.isEdit 조건 제거)
        const initialTab = modalStore.optionSettingModal.data?.initialTab;
        if (initialTab) {
            mode.value = initialTab;
        } else {
            mode.value = 'OPTION'; // 기본값은 상세정보 탭
        }
        
        if (props.isEdit) {
            // 수정 모드: 전달받은 데이터로 필드 채우기
            const optionData = modalStore.optionSettingModal.data?.optionData;
            if (optionData) {
                fillOptionData(optionData);
            }
        } else {
            // 등록 모드 또는 복사 모드
            const isCopy = modalStore.optionSettingModal.data?.isCopy;
            if (isCopy) {
                // 복사 모드: 전달받은 데이터로 필드 채우기 (옵션명은 제외하거나 수정 가능하도록)
                const optionData = modalStore.optionSettingModal.data?.optionData;
                if (optionData) {
                    fillOptionData(optionData);
                    // 복사 시 옵션명에 "복사" 추가 (선택사항)
                    // optionName.value = (optionData.name || '') + ' 복사';
                }
            } else {
                // 등록 모드: 필드 초기화
                selectedCategory.value = modalStore.optionSettingModal.data?.categoryId || '';
                optionName.value = '';
                optionDesc.value = '';
                // 체크형 카테고리면 1로 고정, 아니면 빈 값
                if (isCheckTypeCategory.value) {
                    minCount.value = '1';
                    maxCount.value = '1';
                } else {
                    minCount.value = '';
                    maxCount.value = '';
                }
                stockCount.value = '';
                price.value = '';
                normalPrice.value = '';
                priceDesc.value = '';
                periodDate.value = null;
                selectedHour.value = 0;
                selectedMinute.value = 0;
                isStockEnabled.value = false;
                isPriceEnabled.value = false;
                isPeriodEnabled.value = false;
                isImp.value = 1; // 등록 모드일 때 기본값 1
                
                // 상품 연결 초기화
                initialConnectedProductIds.value = [];
                if (productList.value.length > 0) {
                    productList.value.forEach(product => {
                        product.isConnected = false;
                    });
                }
            }
        }
    } else {
        // 모달이 닫힐 때 mode와 초기 연결 상태 초기화
        mode.value = 'OPTION';
        initialConnectedProductIds.value = [];
    }
});

// 카테고리가 변경되면 체크형인지 확인하고 수량 필드 조정
watch(selectedCategory, () => {
    if (isCheckTypeCategory.value) {
        minCount.value = '1';
        maxCount.value = '1';
    }
});

// 수정 모드 또는 복사 모드일 때 optionData가 설정되면 필드 채우기 (watch가 늦게 실행될 경우 대비)
watch(() => modalStore.optionSettingModal.data?.optionData, async (optionData) => {
    if (optionData && modalStore.optionSettingModal.isVisible) {
        const isEdit = props.isEdit;
        const isCopy = modalStore.optionSettingModal.data?.isCopy;
        if (isEdit || isCopy) {
            await nextTick();
            fillOptionData(optionData);
        }
    }
}, { immediate: true });

// initialTab이 설정되면 해당 탭으로 이동 (props.isEdit가 true가 된 후에도 확인)
watch(() => [modalStore.optionSettingModal.data?.initialTab, modalStore.optionSettingModal.isVisible, props.isEdit], async ([initialTab, isVisible, isEdit]) => {
    if (initialTab && isVisible && isEdit) {
        await nextTick();
        mode.value = initialTab;
    }
}, { immediate: true });

// props.isEdit가 변경될 때도 initialTab 확인
watch(() => props.isEdit, async (isEdit) => {
    if (isEdit && modalStore.optionSettingModal.isVisible) {
        const initialTab = modalStore.optionSettingModal.data?.initialTab;
        if (initialTab) {
            await nextTick();
            mode.value = initialTab;
        }
    }
});

// 탭 변경 시 validation 처리 (상세정보 → 상품연결로 이동할 때)
// 등록 모드의 "다음" 버튼과 수정/복사 모드의 탭 클릭 모두 처리
watch(mode, async (newMode, oldMode) => {
    // 상세정보 탭에서 상품연결 탭으로 이동할 때만 validation 수행
    // oldMode가 undefined이거나 null인 경우는 초기 렌더링이므로 제외
    if (oldMode && oldMode === 'OPTION' && newMode === 'CONNECT') {
        const isValid = await validateRequiredFields();
        if (!isValid) {
            // validation 실패 시 탭을 원래대로 되돌림
            await nextTick();
            mode.value = 'OPTION';
        }
    }
});

// categoryOptions가 준비된 후에도 카테고리 선택 확인
watch(categoryOptions, async (options) => {
    if (options.length > 0 && modalStore.optionSettingModal.isVisible && !props.isEdit) {
        const categoryId = modalStore.optionSettingModal.data?.categoryId;
        if (categoryId && !selectedCategory.value) {
            await nextTick();
            const exists = options.some(opt => opt.value === categoryId);
            if (exists) {
                selectedCategory.value = categoryId;
            }
        }
    }

    // 상품 리스트는 PlaceOptionPage에서 미리 로드됨
}, { immediate: true });

onMounted(() => window.addEventListener('click', closeAll));
onUnmounted(() => window.removeEventListener('click', closeAll));
</script>

<template>
    <!-- 탭 메뉴 (수정 모드 또는 복사 모드일 때 표시) -->
    <div v-if="isEdit || modalStore.optionSettingModal.data?.isCopy" class="tab-menu">
        <div class="tab">
            <input type="radio" id="tab1" v-model="mode" value="OPTION">
            <label for="tab1" class="tab--radio_btn"><span>상세정보</span></label>
        </div>
        <div class="tab">
            <input type="radio" id="tab2" v-model="mode" value="CONNECT">
            <label for="tab2" class="tab--radio_btn"><span>상품연결</span></label>
        </div>
    </div>
    
    <!-- 옵션 등록 -->
    <template v-if="mode == 'OPTION'">
        <div class="modal-contents-inner">
            <div class="option-manager">
                <div class="option-manager__list">
                    <!-- 정보 -->
                    <div class="option-item">
                        <div class="option-item__title">
                            <p class="title-m">정보</p>
                        </div>
    
                        <div class="option-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label required">카테고리</p>
                                <div class="setting-row__content">
                                    <CustomSingleSelect 
                                        ref="categorySelectRef"
                                        class="select" 
                                        v-model="selectedCategory"
                                        :options="categoryOptions"
                                        placeholder="카테고리 선택"
                                    />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label required">옵션명</p>
                                <div class="setting-row__content">
                                    <InputTextBox ref="optionNameInputRef" v-model="optionName" :max-length="30" />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">소요시간</p>
                                <div class="setting-row__content">
                                    <div class="time-picker-input">
                                        <div class="time-unit">
                                            <div class="value-trigger" @click.stop="isHourOpen = !isHourOpen">
                                                {{ selectedHour }}
                                            </div>
                                            <span class="unit-label">시간</span>
                                            
                                            <ul v-if="isHourOpen" class="time-dropdown">
                                                <li v-for="h in hourOptions" :key="h" @click="selectHour(h)">{{ h }}</li>
                                            </ul>
                                        </div>
    
                                        <div class="time-unit">
                                            <div class="value-trigger" @click.stop="isMinuteOpen = !isMinuteOpen">
                                                {{ String(selectedMinute).padStart(2, '0') }}
                                            </div>
                                            <span class="unit-label">분 소요</span>
    
                                            <ul v-if="isMinuteOpen" class="time-dropdown">
                                                <li v-for="m in minuteOptions" :key="m" @click="selectMinute(m)">
                                                    {{ String(m).padStart(2, '0') }}
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">옵션 설명</p>
                                <div class="setting-row__content">
                                    <TextAreaBox v-model="optionDesc" :max-length="300" />
                                </div>
                            </div>
    
                        </div>
                    </div>
    
                    <!-- 예약 가능 수량 -->
                    <div class="option-item">
                        <div class="option-item__title">
                            <p class="title-m">예약 가능 수량</p>
                        </div>
    
                        <div class="option-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label">최소 수량</p>
                                <div class="setting-row__content">
                                    <div class="input-with-unit">
                                        <InputTextBox 
                                            :model-value="minCount" 
                                            @update:model-value="handleNumberInput($event, 'minCount')"
                                            :disabled="isCheckTypeCategory"
                                        />
                                        <span class="unit">개</span>
                                    </div>
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">최대 수량</p>
                                <div class="setting-row__content">
                                    <div class="input-with-unit">
                                        <InputTextBox 
                                            :model-value="maxCount" 
                                            @update:model-value="handleNumberInput($event, 'maxCount')"
                                            :disabled="isCheckTypeCategory"
                                        />
                                        <span class="unit">개</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <!-- 재고 -->
                    <div class="option-item">
                        <div class="option-item__title">
                            <p class="title-m">재고</p>
    
                            <label class="toggle"> 
                                <input type="checkbox" v-model="isStockEnabled"/>
                                <span class="toggle-img"></span>
                            </label>
                        </div>
    
                        <div v-if="isStockEnabled" class="option-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label required">재고 수</p>
                                <div class="setting-row__content">
                                    <div class="input-with-unit">
                                        <InputTextBox 
                                            ref="stockCountInputRef"
                                            :model-value="stockCount" 
                                            @update:model-value="handleNumberInput($event, 'stockCount')"
                                            placeholder="개수 입력" 
                                        />
                                        <span class="unit">개</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p v-else class="body-m">제공 가능한 수량 제한이 없습니다.</p>
                    </div>
    
                    <!-- 가격 -->
                    <div class="option-item">
                        <div class="option-item__title">
                            <p class="title-m">가격</p>
    
                            <label class="toggle"> 
                                <input type="checkbox" v-model="isPriceEnabled" />
                                <span class="toggle-img"></span>
                            </label>
                        </div>
    
                        <div v-if="isPriceEnabled" class="option-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label required">판매가</p>
                                <div class="setting-row__content">
                                    <div class="input-with-unit">
                                        <InputTextBox 
                                            ref="priceInputRef"
                                            v-model="formattedPrice"
                                            placeholder="판매가 입력" 
                                        />
                                        <span class="unit">원</span>
                                    </div>
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">정가</p>
                                <div class="setting-row__content">
                                    <div class="input-with-unit">
                                        <InputTextBox 
                                            v-model="formattedNormalPrice"
                                            placeholder="정가 입력" 
                                        />
                                        <span class="unit">원</span>
                                    </div>
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">가격 부가설명</p>
                                <div class="setting-row__content">
                                    <TextAreaBox v-model="priceDesc" placeholder="가격 부가설명을 입력해주세요." :max-length="300" />
                                </div>
                            </div>
                        </div>
                        <p v-else class="body-m">별도 가격을 표시하지 않습니다.</p>
                    </div>
    
                    <!-- 운영기간 -->
                    <div class="option-item">
                        <div class="option-item__title">
                            <p class="title-m">운영기간</p>
    
                            <label class="toggle"> 
                                <input type="checkbox" v-model="isPeriodEnabled" />
                                <span class="toggle-img"></span>
                            </label>
                        </div>
    
                        <div v-if="isPeriodEnabled" class="option-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label required">기간</p>
                                <div class="setting-row__content">
                                    <CustomDatePicker v-model="periodDate" />
                                </div>
                            </div>
                        </div>
                        <p v-else class="body-m">제공 가능한 기간 제한이 없습니다.</p>
                    </div>
                </div>
            </div>
        </div>
        <!-- 버튼 -->
        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue-outline" @click="modalStore.optionSettingModal.closeModal()">취소</button>
                <button class="btn btn--size-32 btn--blue" @click="handleNext">다음</button>
            </div>
        </div>
    </template>

    <!-- 옵션등록 > 옵션연결 -->
    <template v-else>
        <div class="modal-contents-inner">
            <div class="option-manager">
                <div class="option-manager__header">
                    <p class="body-m"><span class="title-s">{{ optionName || '옵션' }}</span> 옵션과 연결할 상품을 설정해주세요.</p>
                </div>

                <div class="option-manager__list">
                    <div 
                        v-for="product in productList" 
                        :key="product.id"
                        class="list-item"
                    >
                        <div class="d-flex gap-4 align-center">
                            <span class="body-m">{{ product.name }}</span>
                            <span 
                                class="flag"
                                :class="product.isConnected ? 'flag--basic' : 'flag--disabled'"
                            >
                                {{ product.isConnected ? '연결' : '미연결' }}
                            </span>
                        </div>

                        <label class="toggle"> 
                            <input 
                                type="checkbox" 
                                :checked="product.isConnected"
                                @change="toggleProductConnection(product)"
                            />
                            <span class="toggle-img"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
        <!-- 버튼 -->
        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue-outline" @click="handlePrev">이전으로</button>
                <button class="btn btn--size-32 btn--blue-outline" @click="modalStore.optionSettingModal.closeModal()">취소</button>
                <button class="btn btn--size-32 btn--blue" @click="handleSubmit">
                    {{ props.isEdit ? '수정' : (modalStore.optionSettingModal.data?.isCopy ? '복사' : '등록') }}
                </button>
            </div>
        </div>
    </template>
</template>

<style lang="scss" scoped>
// 탭 메뉴
.tab-menu {
    display: flex;
    width: 100%;
    padding: var(--modal-padding) var(--modal-padding) 0;
    
    border-bottom: 1px solid $gray-200;

}

.tab {
    width: 80px;
    background-color: $gray-00;

    input {display: none;}

    &--radio_btn {
        width: 80px;
        height: 32px;
        @include flex-center;
        gap: 2px;
        padding: 0 8px;

        @include typo($title-m-size, $title-m-weight, $title-m-spacing, $title-m-line);
        border-bottom: 2px solid $gray-00;

        span { color: $gray-400; }
    }

    input:checked + &--radio_btn {
        border-bottom: 2px solid $primary-700;
        span { color: $gray-900; }
    }
}

.option-manager {

    // 상단 영역
    &__header {
        display: flex;
        gap: 16px;
        word-break: keep-all;
        padding-bottom: 16px;
        border-bottom: 1px solid $gray-200;
        
        p { flex: 1; }
        span {color: $primary-700;}
    }

    // 리스트 컨테이너
    &__list {
        display: flex;
        flex-direction: column;
    }

}

.option-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid $gray-200;

    &__title {
        display: flex;
        align-items: center;
        justify-content: space-between;

    }

    &__settings {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    &:first-child {
        padding-top: 0;
    }
    &:last-child {
        border-bottom: none;
    }
}

// 개별 설정 줄 (카테고리명, 유형 공통)
.setting-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;

    &__label {
        display: flex;
        align-items: center;
        width: 68px;
        height: 32px; // 버튼이나 인풋 높이에 맞춤
        flex-shrink: 0;
        word-break: keep-all;

        &.required::after {
            content: '*';
            color: $primary-700;
            display: inline-block;
            margin-left: 2px;
        }
    }

    &__content {
        flex: 1;
        width: 100%;
    }
}

// 입력 필드와 단위 표시
.input-with-unit {
    position: relative;
    width: 100%;

    .input-text-box-wrapper {
        width: 100%;
    }

    // 단위를 입력 박스 내부 오른쪽에 배치
    .unit {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
        pointer-events: none;
        
        @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
        color: $gray-900;
        white-space: nowrap;
    }

    // input에 오른쪽 패딩 추가 및 우측 정렬
    :deep(.input-text-box) {
        position: relative;
        
        input[type="text"] {
            padding-right: 15px; // 단위 공간 확보
            text-align: right; // 숫자 우측 정렬
        }

        // X 아이콘을 단위 위에 배치하고 호버 시에만 표시
        .input-text-box__icons {
            position: absolute;
            right: 5px; // 단위와 같은 위치
            top: 50%;
            transform: translateY(-50%);
            z-index: 2;
            opacity: 0; // 기본적으로 숨김
            transition: opacity 0.2s;
        }

        // 호버 시 X 아이콘 표시
        &:hover .input-text-box__icons {
            opacity: 1;
        }
    }
}

// 셀렉트 박스 너비 확장
.select {
    width: 100%;
}

.time-picker-input {
    display: flex;
    align-items: center;
    gap: 8px;
    
    width: 100%;
    height: 32px;
    padding: 0 12px;
    border: 1px solid $gray-200;
    border-radius: 4px;
    background-color: #fff;

    .time-unit {
        position: relative; // 드롭다운 기준점
        display: flex;
        align-items: center;
        gap: 4px;

        // 파란색 숫자 박스
        .value-trigger {
            display: flex;
            align-items: center;
            justify-content: center;
            // height: 22px;
            padding: 1px 3px;
            
            background-color: $primary-100;
            color: $primary-700;       // 파란 글씨
            border-radius: 2px;
            cursor: pointer;

            @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line); 
        }

        .unit-label {
            font-size: 14px;
            color: $gray-900;
            white-space: nowrap;
        }
    }
}

// 드롭다운 레이어 스타일
.time-dropdown {
    position: absolute;
    top: 28px;
    left: 0;
    z-index: 10;
    
    // min-width: 40px;
    max-height: 160px;
    overflow-y: auto;
    
    background: #fff;
    border: 1px solid $gray-200;
    border-radius: 4px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    list-style: none;
    // padding: 2px 0;

    li {
        padding: 6px;
        font-size: 13px;
        text-align: center;
        cursor: pointer;

        &:hover {
            background-color: $gray-50;
            color: $primary-700;
        }
    }
}

.list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    height: 32px;
    margin-bottom: 12px;

    border-radius: 4px;
    border: 1px solid $gray-200;

    &:first-child {margin-top: 16px;}
    &:last-child {margin-bottom: 0;}
}
</style>