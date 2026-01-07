<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import icSelectBoxOpenClosed from '@/assets/icons/Ic_selectbox_OpenClosed.svg';

const props = defineProps({
    modelValue: { type: [String, Number], default: '' }, // 단일 값 (문자열 또는 숫자)
    options: { type: Array, default: () => [] },        // { label, value }
    placeholder: { type: String, default: "선택" },
    disabled: Boolean,
    caption: { type: String, default: '' },
    selectWidth: {type: [String, Number], default: 'auto'},
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const wrapper = ref(null);

/* 토글 */
const toggle = () => {
    if (!props.disabled) isOpen.value = !isOpen.value;
};

// 현재 선택된 옵션의 라벨 찾기
const selectedLabel = computed(() => {
    const selectedOption = props.options.find(opt => opt.value === props.modelValue);
    return selectedOption ? selectedOption.label : '';
});

/* 🔹 옵션 선택 */
const selectOption = (value) => {
    emit("update:modelValue", value);
    isOpen.value = false; // 단일 선택 시 바로 닫기
};

/* 외부 클릭 → 닫기 */
const handleClickOutside = (e) => {
    if (wrapper.value && !wrapper.value.contains(e.target)) {
        isOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
    <div class="select" :class="{ disabled }" ref="wrapper" :style="{ width: selectWidth }">
        <div class="select__box" :class="{ open: isOpen }" @click="toggle">
            <span 
                class="select__text"
                :class="{'is-placeholder' : !selectedLabel }"
            >
                {{ selectedLabel ? selectedLabel : placeholder }}
            </span>

            <span class="select__icon" :class="{'rotate': isOpen}">
                <img :src="icSelectBoxOpenClosed" alt="토글 아이콘">
            </span>
        </div>

        <span v-show="caption" class="caption">{{ caption }}</span>

        <div class="select__dropdown" v-if="isOpen">
            <div 
                v-for="opt in options" 
                :key="opt.value"
                class="select__option"
                :class="{ selected: modelValue === opt.value }"
                @click.stop="selectOption(opt.value)"
            >
                <span class="label body-m">{{ opt.label }}</span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
/* 기존 스타일과 거의 동일하되, 체크박스 관련 스타일만 제거 */
.select {
    // flex: 1;
    // min-width: 120px;
    position: relative;

    &.disabled {
        pointer-events: none;
        background-color: $gray-50;

        .select__box {
            background-color: $gray-50;
            color: $gray-500;
        }
    }

    &__box {
        display: flex;
        height: 32px;
        padding: 0 10px;
        align-items: center;
        gap: 10px;
        border-radius: 4px;
        border: 1px solid $gray-200;
        background-color: $gray-00;
        cursor: pointer;
        transition: 0.15s;

        &.open {
            border-color: $gray-900;
            box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.06);
        }
    }

    &__text {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);

        &.is-placeholder {
            color: $gray-400;
        }
    }

    &__icon {
        transition: transform 0.2s ease;
        &.rotate {
            transform: rotate(180deg);
        }
    }

    &__dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        width: 100%;
        background: $gray-00;
        border: 1px solid $gray-200;
        border-radius: 4px;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.06);
        padding: 5px;
        max-height: 220px;
        overflow-y: auto;
        z-index: 50;
    }

    &__option {
        width: 100%;
        height: 32px;
        padding: 0 8px;
        display: flex;
        align-items: center;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
            background-color: $gray-50;
        }

        &.selected {
            background-color: $primary-100;
            color: $primary-700;
        }
    }
}
.caption { color: $gray-700; padding: 0 10px; font-size: 12px; }
</style>