<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

import icSelectBoxOpenClosed from '@/assets/icons/Ic_selectbox_OpenClosed.svg';


const props = defineProps({
    modelValue: { type: Array, default: () => [] },  // 선택된 value 목록
    options: { type: Array, default: () => [] },     // { label, value }
    placeholder: { type: String, default: "선택" },
    disabled: Boolean,
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const wrapper = ref(null);

/* 토글 */
const toggle = () => {
    if (!props.disabled) isOpen.value = !isOpen.value;
};

const selectedLabels = computed(() => {
    return props.options
            .filter(opt => props.modelValue.includes(opt.value))
            .map(opt => opt.label)
})

/* 🔹 옵션 선택 */
const selectOption = (value) => {
    const exists = props.modelValue.includes(value);

    if (exists) {
        emit(
        "update:modelValue",
        props.modelValue.filter((v) => v !== value)
        );
    } else {
        emit("update:modelValue", [...props.modelValue, value]);
    }
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
    <div class="select" :class="{ disabled }" ref="wrapper">

        <!-- select box -->
        <div class="select__box" :class="{ open: isOpen }" @click="toggle">
            <span 
                class="select__text"
                :class="{'is-placeholder' : !selectedLabels.length }"
            >
                {{ selectedLabels.length ? selectedLabels.join(', ') : placeholder }}
            </span>

            <span class="select__icon" :class="{'rotate': isOpen}">
                <img :src="icSelectBoxOpenClosed" alt="셀렉트박스 토글 아이콘">
            </span>
        </div>

        <!-- Dropdown -->
        <div class="select__dropdown" v-if="isOpen">
            <div 
                v-for="opt in options" 
                :key="opt.value"
                class="select__option"
                :class="{ selected: modelValue.includes(opt.value) }"
                @click.stop="selectOption(opt.value)"
            >
                <label class="checkbox">
                    <input 
                        type="checkbox" 
                        :checked="modelValue.includes(opt.value)"
                        @click.stop.prevent
                    />
                    <span class="box"></span>
                    <span class="label body-m">{{ opt.label }}</span>
                </label>

            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .select {
        width: 120px;
        position: relative;

        &.disabled {
            opacity: 0.5;
            pointer-events: none;
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
            font-size: 12px;
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
            padding: 10px;
            max-height: 220px;
            overflow-y: auto;
            z-index: 50;
        }

        &__option {
            width: 100%;
            height: 32px;
            padding: 0 4px;
            display: flex;
            align-items: center;
            gap: 4px;

            border-radius: 4px;

            label {width:100%;}
            &:hover {
                background-color: $gray-50;
            }

            &.selected {
                background-color: $gray-50;
            }
        }
    }
</style>
