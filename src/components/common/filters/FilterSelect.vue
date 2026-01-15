<!-- 라벨 + 셀렉트 필터 -->
<script setup>
import CustomSelect from '../CustomSelect.vue';

import { ref, computed, defineProps } from 'vue';

const props = defineProps({
    label: String,
    options: { type: Array, default: () => []},
    modelValue: { type: Array, default: () => []},
    placeholder: { type: String, default: '선택'}
})

const emit = defineEmits(['update:modelValue'])

const localValue = computed({
    get: () => {
        // modelValue가 없거나 undefined/null인 경우에만 빈 배열 반환
        // 빈 배열 자체는 그대로 반환
        if (Array.isArray(props.modelValue)) {
            return props.modelValue;
        }
        return [];
    },
    set: (v) => {
        // 빈 배열도 정상적으로 전달
        if (Array.isArray(v)) {
            emit('update:modelValue', v);
        } else {
            emit('update:modelValue', []);
        }
    }
})
</script>

<template>
    <div class="search-filter__section">
        <span class="search-filter__label title-s">{{ label }}</span>
        <CustomSelect
            v-model="localValue"
            :options="options"
            :placeholder="placeholder"
        />
</div>
</template>

<style lang="scss" scoped>
    .search-filter__section {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    :deep(.select__box) {max-width: 120px;}
</style>