<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
import icSelectBoxOpenClosed from '@/assets/icons/ic_selectbox_OpenClosed.svg';

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
const dropdownRef = ref(null); // 드롭다운 ref
const optionRefs = ref([]);

const scrollToSelected = async () => {
    await nextTick();
    
    // 현재 선택된 값의 인덱스 찾기
    const selectedIndex = props.options.findIndex(opt => opt.value === props.modelValue);
    
    // 선택된 항목이 있고, 해당 DOM 요소가 존재할 경우
    if (selectedIndex !== -1 && optionRefs.value[selectedIndex]) {
        optionRefs.value[selectedIndex].scrollIntoView({
            block: 'start', // 상단
        });
    }
};

/* 토글 */
const toggle = () => {
    if (!props.disabled) {
        isOpen.value = !isOpen.value;
        if(isOpen.value) {
            updatePosition();
            scrollToSelected();
        }
    }
};

// 현재 선택된 옵션의 라벨 찾기
const selectedLabel = computed(() => {
    const selectedOption = props.options.find(opt => opt.value == props.modelValue);
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

const triggerRef = ref(null); // .select__box를 참조
const dropdownStyle = ref({
    position: 'absolute',
    top: '0px',
    left: '0px',
    width: '0px',
    zIndex: 9999
});

const updatePosition = async () => {
    await nextTick();
    if (triggerRef.value) {
        const rect = triggerRef.value.getBoundingClientRect();
        const dropdownHeight = 220; // 드롭다운의 최대 높이 (CSS max-height와 맞추도록)
        const windowHeight = window.innerHeight;
        
        // 하단 공간이 부족한지 확인 (여유공간 10px 추가)
        const spaceBelow = windowHeight - rect.bottom;
        const showUpward = spaceBelow < dropdownHeight + 10;

        if (showUpward) {
            // 위로 띄우기
            dropdownStyle.value = {
                position: 'fixed',
                bottom: `${windowHeight - rect.top}px`, // 셀렉트박스 상단에 맞춤
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                top: 'auto' // 기존 top 값 제거
            };
        } else {
            // 아래로 띄우기
            dropdownStyle.value = {
                position: 'fixed',
                top: `${rect.bottom}px`,
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                bottom: 'auto' // 기존 bottom 값 제거
            };
        }
    }
};
onMounted(() => {
    document.addEventListener("click", handleClickOutside, true);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside, true);
});
</script>

<template>
    <div 
        class="select" 
        :class="{ disabled }" 
        ref="wrapper" 
        :style="{ width: selectWidth }"
    >
        <div 
            class="select__box" 
            :class="{ open: isOpen }" 
            @click="toggle" 
            ref="triggerRef"
        >
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

        <teleport to='body'>
            <div 
                class="select__dropdown teleported-dropdown" 
                v-if="isOpen" 
                ref="dropdownRef" 
                :style="dropdownStyle"
            >
                <div 
                    v-for="(opt, index) in options" 
                    :key="opt.value"
                    :ref="el => { if (el) optionRefs[index] = el }"
                    class="select__option"
                    :class="{ selected: modelValue === opt.value }"
                    @click.stop="selectOption(opt.value)"
                >
                    <span class="label body-m">{{ opt.label }}</span>
                </div>
            </div>
        </teleport>
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
            color: $gray-700;
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
        z-index: 100;
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