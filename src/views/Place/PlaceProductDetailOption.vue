<script setup>
// 스토어
import { useOptionStore } from '@/stores/optionStore';
// 아이콘
import icDropDown from '@/assets/icons/ic_arrow_down_b.svg'
import icDragHandel from '@/assets/icons/ic_drag_handel.svg'
import icCheckOff from '@/assets/icons/ic_check_mark_off.svg'
import { onMounted } from 'vue';

import { ref } from 'vue';

const optionStore = useOptionStore();

// 현재 어떤 카테고리가 열려있는지 index를 저장 (null이면 모두 닫힘)
const expandedIndexes = ref([]); // 열려있는 인덱스들을 담는 배열

// 카테고리 > 옵션 데이터 (임시)
const tempOptionList = [
    { id: '1', name: '신규 방문', desc: '처음 방문하시거나, 새로운 동물과 방문하시는 경우 선택해 주세요.', selected: true },
    { id: '2', name: '재방문', desc: '동일한 동물과 재방문 하시는 경우 선택해 주세요.', selected: true }
]
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

onMounted(() => {
    optionStore.getCategoryList()
})
</script>

<template>
    <p class="heading-s">예약받을 옵션을 선택 해 주세요.</p>

    <div class="product-detail-option-wrapper">
        <!-- left -->
        <div class="option-selection-container">
    
            <div class="category-section">
    
                <div 
                    v-for="(category, cIdx) in optionStore.categoryList" 
                    :key="category.id"
                    class="category-item"
                >
                    <div class="category-header" @click="toggleAccordion(cIdx)">
                        <div class="d-flex align-center gap-8">
                            <label class="checkbox" @click.stop>
                                <input type="checkbox" v-model="category.checked" />
                                <span class="box"></span>
                                <span class="label">{{ category.name }}</span>
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
                            <li v-for="option in tempOptionList" :key="option.id" class="option-item">
                                <div class="drag-handle">
                                    <img :src="icDragHandel" alt="정렬" />
                                </div>
                                
                                <div class="option-info">
                                    <p class="option-name title-m">{{ option.name }}</p>
                                    <p class="option-desc body-xs">{{ option.desc }}</p>
                                </div>
    
                                <div class="option-status">
                                    <img :src="icCheckOff" v-if="option.selected" />
                                </div>
                            </li>
                        </ul>
    
                    </div>
                </div>
    
            </div>
    
        </div>
        
        <div class="button-wrapper">
            <button class="btn btn--size-40 btn--black">목록으로</button>
            <button class="btn btn--size-40 btn--blue">저장</button>
        </div>
    </div>
    
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
</style>