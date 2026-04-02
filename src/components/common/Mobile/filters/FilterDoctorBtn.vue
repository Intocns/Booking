<!-- 담당의 선택 검색필터 버튼 -->
<script setup>
import { ref, computed, watch } from 'vue';

import icDoctorB from '@/assets/icons/mobile/ic_doctor_b.svg'
import icDoctorW from '@/assets/icons/mobile/ic_doctor_w.svg'
import icClose from '@/assets/icons/mobile/ic_close_b.svg'
import icArrowLeft from '@/assets/icons/ic_arrow_left.svg'

const props = defineProps({
    modelValue: { type: Array, default: () => ['all'] },
    options: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:modelValue']);
const isOpen = ref(false);
const localSelected = ref([...props.modelValue]); // 내부 임시 값 (부모의 modelValue와 별개로 움직임)

// 'all' 옵션을 제외한 순수한 옵션들의 value 목록
const individualOptionValues = computed(() => {
    // 'all' 옵션을 제외한 모든 옵션의 value만 추출
    return props.options
        .filter(opt => opt.value !== 'all')
        .map(opt => opt.value);
});

const isActive = computed(() => {
    // modelValue가 ['all'] 이거나 개별 ID가 들어있을 때 true
    return props.modelValue && props.modelValue.length > 0;
});

const selectOption = (value) => {
    // modelValue가 없거나 undefined인 경우 빈 배열로 초기화
    const currentValue = localSelected.value || [];
    let newValue = [...currentValue];

    if (value === 'all') {
        // --- 'all' 옵션을 클릭한 경우 ---
        const isAllCurrentlySelected = newValue.includes('all');

        if (isAllCurrentlySelected) {
            // 현재 'all'이 선택되어 있으면 -> 전부 해제 (['all'] 제거)
            // 빈 배열 대신 최소한 빈 배열을 유지 (null 방지)
            newValue = [];
        } else {
            // 현재 'all'이 선택되어 있지 않으면 -> 'all'만 선택 (다른 모든 개별 항목을 대체)
            newValue = ['all'];
        }

    } else {
        // --- 개별 옵션을 클릭한 경우 (value !== 'all') ---
        const exists = newValue.includes(value);

        // 1. 'all'이 현재 선택된 상태였으면, 'all'을 먼저 해제하고 개별 선택 시작
        if (newValue.includes('all')) {
            // '전체' 상태에서 개별을 클릭하면 해당 값만 선택 상태로 전환
            newValue = [value];
        } else {
            // 2. 일반적인 토글 로직
            if (exists) {
                // 해제
                newValue = newValue.filter((v) => v !== value);
            } else {
                // 선택
                newValue = [...newValue, value];
            }
        }
        
        // 3. 개별 옵션 선택/해제 후, 모든 개별 옵션이 선택되었는지 확인
        const isAllIndividualSelected = individualOptionValues.value.length > 0 &&
                                       newValue.length > 0 &&
                                       individualOptionValues.value.every(val => newValue.includes(val));

        // 모든 개별 옵션이 선택되었다면, 'all'로 대체하여 값을 통일
        if (isAllIndividualSelected) {
            newValue = ['all'];
        }
    }

    // 빈 배열도 정상적으로 emit (null이 아닌 빈 배열)
    localSelected.value = newValue;
};

// 모달이 열릴 때 부모의 값을 임시 값으로 복사 (동기화)
watch(isOpen, (newVal) => {
    if (newVal) {
        localSelected.value = [...props.modelValue];
    }
});

const handleComplete = () => {
    // 임시로 들고 있던 값을 부모에게 전달 (확정)
    emit('update:modelValue', localSelected.value);
    isOpen.value = false;
};

// 전체 선택
const selectAll = () => {
    localSelected.value = ['all'];
};

// 전체 해제
const deselectAll = () => {
    localSelected.value = [];
};

// 화면 리스트에 보여줄 리스트 추출 ('all' 제외)
const filteredOptions = computed(() => {
    return props.options.filter(opt => opt.value !== 'all');
});

// 배경 스크롤 방지 로직
watch(() => isOpen.value, (val) => {
    if (val) {
        // 열리면 배경 스크롤 고정
        document.body.style.overflow = 'hidden';
    } else {
        // 닫히면 배경 스크롤 해제
        document.body.style.overflow = '';
    }
}, { immediate: true });
</script>

<template>
    <div 
        class="btn btn--mobile-option" 
        :class="{ 'selected': isActive }"
        @click="isOpen = true"
    >
        <img :src="isActive ? icDoctorW : icDoctorB" alt="담당의">
        <span>담당의</span>
    </div>

    <div v-if="isOpen" class="mobile-full-page">
        <header class="mobile-full-page-header">
            <button @click="isOpen = false">
                <img :src="icArrowLeft" alt="닫기" width="20">
            </button>
            <div class="header-title">
                <h2>담당의 선택</h2>
            </div>
        </header>

        <div class="mobile-full-page-content">
            <div class="d-flex gap-8 align-center justify-end">
                <button class="select-button" @click="selectAll">전체 선택</button>
                <div class="line"></div>
                <button class="select-button" @click="deselectAll">전체 해제</button>
            </div>
    
            <ul class="doctor-list-mobile">
                <li 
                    v-for="(doc, index) in filteredOptions" 
                    :key="doc.value"
                    :class="{ selected: localSelected.includes(doc.value) || (localSelected.includes('all') && doc.value !== 'all') }"
                    @click.stop="selectOption(doc.value)"
                    >
                    <label class="checkbox">
                        <input 
                            type="checkbox" 
                            :checked="localSelected.includes(doc.value) || (localSelected.includes('all') && doc.value !== 'all')"
                            @click.stop.prevent
                        >
                        <span class="box"></span>
                        <span class="label body-m">{{ doc.label }}</span>
                    </label>
                </li>
            </ul>
        </div>

        <div class="mobile-full-page-button-wrapper">
            <button class="btn btn--size-48 btn--blue" @click="handleComplete">확인</button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.select-button {
    color: $gray-700;
    @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
}
.line {
    width:1px;
    height: 12px;
    background-color: $gray-300;
}
.doctor-list-mobile {
    display: flex;
    flex-direction: column;
    gap:16px;
    min-height: 0;
    overflow-y: auto;
    padding: 16px;
    border-radius: 8px;
    background-color: $gray-50;
}
</style>