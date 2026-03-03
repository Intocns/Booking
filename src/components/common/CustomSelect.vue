<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue';
import { formatSelectedLabels } from '@/utils/selectFormatter';
import icSelectBoxOpenClosed from '@/assets/icons/ic_selectbox_OpenClosed.svg';


const props = defineProps({
    modelValue: { type: Array, default: () => [] },  // 선택된 value 목록
    options: { type: Array, default: () => [] },     // { label, value }
    placeholder: { type: String, default: "선택" },
    disabled: Boolean,
    caption: {type: String, default: ''},
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const wrapper = ref(null);
const localSelected = ref([...props.modelValue]); // 내부 임시 값 (부모의 modelValue와 별개로 움직임)

// 'all' 옵션을 제외한 순수한 옵션들의 value 목록
const individualOptionValues = computed(() => {
    // 'all' 옵션을 제외한 모든 옵션의 value만 추출
    return props.options
        .filter(opt => opt.value !== 'all')
        .map(opt => opt.value);
});

/* 토글 */
const toggle = (e) => {
    if (props.disabled) return;

    if (e) e.stopPropagation();

    if (isOpen.value) {
        // 이미 열려있는데 다시 누르면 '닫기' 이므로 확정 로직 실행
        isOpen.value = false;
        emit("update:modelValue", localSelected.value);
    } else {
        // 열 때는 값 동기화 후 열기만 함
        isOpen.value = true;
        updatePosition();
    }
};

// select box에 표시할 라벨 계산 
const selectedLabels = computed(() => {
    // modelValue가 없거나 빈 배열인 경우
    if (!props.modelValue || props.modelValue.length === 0) {
        return [];
    }
    
    // 1. modelValue가 ['all']인 경우, '전체' 옵션의 라벨을 찾아 반환
    if (props.modelValue.includes('all') && props.modelValue.length === 1) {
        const allOption = props.options.find(opt => opt.value === 'all');
        // '전체' 옵션이 있다면 그 라벨을 표시하고, 없다면 '전체'라고 표시
        return allOption ? [allOption.label] : ['전체'];
    }

    // 2. 그 외의 경우 (개별 선택)
    const labels = props.options
        .filter(opt => props.modelValue && props.modelValue.includes(opt.value))
        .map(opt => opt.label);
    
    return labels;
})

const displayText = computed(() => {
    return formatSelectedLabels(selectedLabels.value, props.placeholder);
});

/* 🔹 옵션 선택 */
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

/* 외부 클릭 → 닫기 */
const handleClickOutside = (e) => {
    if (!isOpen.value) return;

    // wrapper(셀렉트 박스 본체) 안을 눌렀는지 확인
    const isInsideWrapper = wrapper.value && wrapper.value.contains(e.target);
    // dropdownRef(텔레포트된 드롭다운) 안을 눌렀는지 확인
    const isInsideDropdown = dropdownRef.value && dropdownRef.value.contains(e.target);

    if (!isInsideWrapper && !isInsideDropdown) {
        isOpen.value = false;
        
        // 창이 닫힐 때 최종적으로 부모에게 업데이트
        emit("update:modelValue", localSelected.value); 
    }
};

const triggerRef = ref(null); // .select__box 참조
const dropdownRef = ref(null);
const dropdownStyle = ref({
    position: 'fixed',
    top: '0px',
    left: '0px',
    width: '0px',
    zIndex: 9999
});

const updatePosition = async () => {
    await nextTick();
    if (triggerRef.value) {
        const rect = triggerRef.value.getBoundingClientRect();
        const dropdownHeight = 220; 
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - rect.bottom;
        const showUpward = spaceBelow < dropdownHeight + 10;

        dropdownStyle.value = {
            position: 'fixed',
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            top: showUpward ? 'auto' : `${rect.bottom}px`,
            bottom: showUpward ? `${windowHeight - rect.top}px` : 'auto',
            zIndex: 9999
        };
    }
};

// 스크롤 시 닫기
const handleScroll = (e) => {
    if (dropdownRef.value && dropdownRef.value.contains(e.target)) return;
    if (isOpen.value) isOpen.value = false;
};

onMounted(() => {
    document.addEventListener("click", handleClickOutside, true);
    window.addEventListener("scroll", handleScroll, true);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside, true);
    window.removeEventListener("scroll", handleScroll, true);
});
</script>

<template>
    <div class="select" :class="{ disabled }" ref="wrapper">

        <!-- select box -->
        <div class="select__box" :class="{ open: isOpen }" @click="toggle" ref="triggerRef">
            <span 
                class="select__text"
                :class="{'is-placeholder' : !selectedLabels.length }"
            >
                {{ displayText }}
            </span>

            <span class="select__icon" :class="{'rotate': isOpen}">
                <img :src="icSelectBoxOpenClosed" alt="셀렉트박스 토글 아이콘">
            </span>
        </div>

        <!-- 힌트 메세지 -->
        <span v-show="caption" class="caption">{{ caption }}</span>

        <teleport to="body">
            <!-- Dropdown -->
            <div class="select__dropdown" v-if="isOpen" ref="dropdownRef" :style="dropdownStyle">
                <div 
                    v-for="opt in options" 
                    :key="opt.value"
                    class="select__option"
                    :class="{ selected: localSelected.includes(opt.value) || (localSelected.includes('all') && opt.value !== 'all') }"
                    @click.stop="selectOption(opt.value)"
                >
                    <label class="checkbox">
                        <input 
                            type="checkbox" 
                            :checked="localSelected.includes(opt.value) || (localSelected.includes('all') && opt.value !== 'all')"
                            @click.stop.prevent
                        />
                        <span class="box"></span>
                        <span class="label body-m">{{ opt.label }}</span>
                    </label>
    
                </div>
            </div>
        </teleport>
    </div>
</template>

<style lang="scss" scoped>
    .select {
        flex: 1;
        min-width: 120px;
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
            max-width: 100%;

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

    .caption {color: $gray-700; padding: 0 10px;}
</style>
