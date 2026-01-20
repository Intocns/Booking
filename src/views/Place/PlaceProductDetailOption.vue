<script setup>
// 스토어
import { useOptionStore } from '@/stores/optionStore';
// 아이콘
import icDropDown from '@/assets/icons/ic_arrow_down_b.svg'
import icDragHandel from '@/assets/icons/ic_drag_handel.svg'
import icCheckOff from '@/assets/icons/ic_check_mark_off.svg'
import icEmpty from '@/assets/icons/ic_empty.svg'

import { onMounted, computed } from 'vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const optionStore = useOptionStore();
const router = useRouter();

//PlaceProductDetail.vue에서 선언한component 옵션 사용
const props = defineProps({
    savedItemId: {type: [ String, Number ]},
    isSavedSchedule: {type: Boolean},
    viewType: {type: String, default:null},
    previewName: { type: String },
    previewDesc: { type: String },
    previewDetails: { type: Array },
    previewNotice: { type: String }
})

// 현재 어떤 카테고리가 열려있는지 index를 저장 (null이면 모두 닫힘)
const expandedIndexes = ref([]); // 열려있는 인덱스들을 담는 배열

// 아코디언 토글 함수
const toggleAccordion = (index) => {
    const findIdx = expandedIndexes.value.indexOf(index);
    
    if (findIdx > -1) {
        // 이미 배열에 있으면 제거 (닫기)
        expandedIndexes.value.splice(findIdx, 1);
    } else {
        // 배열에 없으면 추가 (열기)
        expandedIndexes.value.push(index);
    }
};

// 특정 인덱스가 열려있는지 확인하는 함수 (템플릿 바인딩용)
const isOpen = (index) => expandedIndexes.value.includes(index);

//옵션 연결 > 저장 버튼
const saveItemOption = (async() => {
    let params = optionStore.optionList.flatMap(category =>
                category.options
                // .filter(option => option.checked)
                .map(option => ({
                    categoryId : category.categoryId,
                    optionId : option.optionId,
                    useFlag : option.checked ? 1 : 0,
                    itemIds : props.savedItemId
                })
            )
    )

    let response = await optionStore.addOptionMapping(params);

    if(response.status_code <= 300){
        alert('저장이 완료되었습니다.');
        router.push({ name: 'placeProduct' });
    }else{
        alert('오류가 발생했습니다. 관리자에게 문의해주세요.');
    }
})

onMounted(async() => {
    const selectedData =  await optionStore.getOptionListByItemId(props.savedItemId);
    await optionStore.getOptionList()

    const selectedOptionMap = {};

    //선택한 옵션값 가져오기
    selectedData.data.forEach(({ categoryId, optionId }) => {
        selectedOptionMap[categoryId] ??= []
        selectedOptionMap[categoryId].push(optionId)
    })

    //카테고리/옵션 구성 및 선택한 옵션 check 값 true로 변경
    optionStore.optionList = (optionStore.optionList ?? []).map(item => ({
        ...item,
        options : item.options.map(detail => ({
            ...detail,
            checked : selectedOptionMap[item.categoryId]?.includes(detail.optionId) ?? false
        }))
    }))

    //아코디언 토글 디폴트로 열어주기 위함
    expandedIndexes.value = (optionStore.optionList ?? []).map((_, index) => index)
})

//옵션이 하나라도 선택되면 카테고리도 선택
const isCategoryChecked = (category) => computed(() => category.options.some(c => c.checked))

//카테고리 체크박스 선택 시
const changeCategoryChecked = (category) => {
    const newVal = !isCategoryChecked(category).value
    category.options.forEach(c => c.checked = newVal)
}

// 옵션 아이템 클릭 시 토글 함수 추가
const toggleOption = (optionDetail) => {
    optionDetail.checked = !optionDetail.checked;
}
</script>

<template>
    <p class="heading-s">예약받을 옵션을 선택 해 주세요.</p>

    <template v-if="(optionStore.optionList ?? []).length > 0">
        <div class="product-detail-option-wrapper">
            <!-- left -->
            <div class="option-selection-container">
        
                <div class="category-section">
        
                    <div 
                        v-for="(option, cIdx) in optionStore.optionList" 
                        :key="option.categoryId"
                        class="category-item"
                        :class="{ 'is-active': isCategoryChecked(option).value }"
                    >
                        <div class="category-header" @click="toggleAccordion(cIdx)">
                            <div class="d-flex align-center gap-8">
                                <label class="checkbox" @click.stop>
                                    <input type="checkbox" 
                                        :checked="isCategoryChecked(option).value"
                                        @change="() => changeCategoryChecked(option)" />
                                    <span class="box"></span>
                                    <span class="label">{{ option.name }}</span>
                                </label>
                            </div>
                            <img 
                                :src="icDropDown" 
                                class="arrow-icon" 
                                :class="{ 'is-rotated': isOpen(cIdx) }"
                                alt="열기"
                            />
                        </div>
        
                        <div v-show="isOpen(cIdx)" class="category-contents">
                            <ul class="option-list">
                                <li 
                                    v-for="optionDetail in option.options"
                                    :key="optionDetail.optionId"
                                    class="option-item"
                                    :class="{ 'is-selected': optionDetail.checked }"
                                    @click="toggleOption(optionDetail)"
                                >
                                    <div class="drag-handle" @click.stop>
                                        <img :src="icDragHandel" alt="정렬" />
                                    </div>
                                    
                                    <div class="option-info">
                                        <p class="option-name title-m">{{ optionDetail.name }}</p>
                                        <p class="option-desc body-xs">{{ optionDetail.desc }}</p>
                                    </div>
        
                                    <div class="option-status">
                                        <label class="checkbox" @click.stop>
                                            <input type="checkbox" v-model="optionDetail.checked" />
                                            <span class="checkMark"></span>
                                        </label>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
        
            </div>
            
            <div class="button-wrapper">
                <button class="btn btn--size-40 btn--black" @click="router.push({ name: 'placeProduct'})">목록으로</button>
                <button class="btn btn--size-40 btn--blue" @click="saveItemOption()">저장</button>
            </div>
        </div>
    </template>
    
    <template v-else>
        <div class="empty-option-wrapper">
            <div class="empty-box">
                <img :src="icEmpty" alt="비어있음 아이콘">
                <span class="title-s">등록된 옵션이 없습니다.</span>
                <p class="body-m">예약 상품에 연결할 옵션을 등록 후 연결해주세요.</p>
                <button class="btn btn--size-32 btn--black" @click="router.push({ name: 'placeOption'})">옵션 등록</button>
            </div>
        </div>

        <div class="empty-button-wrapper">
            <button class="btn btn--size-40 btn--black" @click="router.push({ name: 'placeProduct'})">목록으로</button>
        </div>
    </template>
</template>

<style lang="scss" scoped>
.product-detail-option-wrapper {
    margin-top: 8px;
    min-height: 0;
    height: 100%;

    display: flex;
    flex-direction: column;
}
.option-selection-container {
    width: 50%;
    min-height: 0;
    height: 100%;
    overflow-y: auto;
}
.category-section {
    min-height: 0;
    height: 100%;
    overflow-y: auto;
}
.category-item {
    margin-bottom: 12px;
    overflow: hidden;

    border: 1px solid $gray-200;
    border-radius: 8px;
    background-color: $gray-00;

    &.is-active {
        border-color: $primary-700;
    }
    .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        cursor: pointer;
        
        .arrow-icon {
            transition: transform 0.3s ease;
            &.is-rotated { transform: rotate(180deg); }
        }
    }

    .category-contents {
        padding: 0 16px 16px 16px;
    }
}

.option-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .option-item {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        border: 1px solid $gray-200;
        border-radius: 4px;
        
        // 드래그 중인 아이템 스타일 (vuedraggable 기능)
        &.sortable-ghost { opacity: 0.5; background: $primary-50; }

        .drag-handle {
            cursor: grab;
            margin-right: 10px;
            display: flex;
            align-items: center;
        }

        .option-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex: 1;

            .option-desc { color: $gray-700; }
        }

        &.is-selected {
            border-color: $primary-700;
            background-color: $primary-50;

            color: $primary-700;
        }
    }
}

.button-wrapper {
    width: 50%;
    padding-top: 16px;
    // padding-top: 40px;
    display: flex;
    gap: 8px;

    background-color: $gray-00;

    button {
        flex: 1;
    }
}

.empty-option-wrapper {
    display: flex;
    height: 100%;
    @include flex-center;

    .empty-box {
        button {margin-top: 16px;}
    }
}
.empty-button-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;

    button { width: 400px; }
}
</style>