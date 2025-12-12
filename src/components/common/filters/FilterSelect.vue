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
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
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
</style>