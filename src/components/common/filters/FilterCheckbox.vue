<!-- 체크박스 필터 -->
<script setup>
import { showAlert } from '@/utils/ui';

const props = defineProps({
    options: { type: Array, default: () => [] }, // [{ label, value }]
    modelValue: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const toggle = (value) => {
    const current = [...props.modelValue];
    const idx = current.indexOf(value);
    if (idx > -1) {
        if (current.length === 1) {
            showAlert('조회할 예약 항목을 최소 1개 이상 선택해주세요.');
            return;
        }
        current.splice(idx, 1);
    } else {
        current.push(value);
    }
    emit('update:modelValue', current);
}

const isChecked = (value) => props.modelValue.includes(value);
</script>

<template>
    <div class="filter-checkbox">
        <label
            v-for="option in options"
            :key="option.value"
            class="checkbox"
            @click.prevent="toggle(option.value)"
        >
            <input type="checkbox" :checked="isChecked(option.value)" />
            <span class="box"></span>
            <span class="label">{{ option.label }}</span>
        </label>
    </div>
</template>

<style lang="scss" scoped>
.filter-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    white-space: nowrap;
}
</style>
