<!-- 인풋 텍스트 박스 컴포넌트 (검색필터 텍스트박스 x) -->
<script setup>
import icClear from '@/assets/icons/ic_clear.svg'
import icCheck from '@/assets/icons/Ic_round_check.svg'
import icWarning from '@/assets/icons/Ic_round_warning.svg'

import { ref, computed } from 'vue';

const props = defineProps({
    modelValue: {
        type: [ String, Number ],
        default: '',
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    placeholder: {
        type: String,
        default: '',
    },
    caption: {
        type: String,
        default: '',
    },
    height: {
        type: String,
        default: '32px',
    },
    // TODO: status (success, error 등) prop 추가 가능
})

const emit = defineEmits(['update:modelValue', 'change', 'focus', 'blur']);

// 포커스 상태 관리
const isFocused = ref(false);

// computed: 값 존재 여부 (클리어 버튼 표시 기준)
const hasValue = computed(() => {
    return props.modelValue !== null && props.modelValue !== undefined && String(props.modelValue).length > 0;
});

// 입력 값 변경 처리 (부모에게 전달)
const updateValue = (event) => {
    //  v-model 업데이트를 위한 이벤트 발생
    emit('update:modelValue', event.target.value);
};

// 클리어 버튼 클릭 처리
const clearInput = () => {
    // 값을 빈 문자열로 초기화하고 부모에게 전달
    emit('update:modelValue', '');
    // 추가로 change 이벤트를 발생시켜야 한다면 emit('change')
};

// 포커스/블러 이벤트 처리
const handleFocus = () => {
    isFocused.value = true;
    emit('focus');
};
const handleBlur = () => {
    isFocused.value = false;
    emit('blur');
};
</script>

<template>
    <div class="input-text-box-wrapper">
        <div 
            class="input-text-box"
            :class="{ 
                '--focused': isFocused,
                '--disabled': disabled,
                '--has-value': hasValue,
            }"
        >
            <input 
                type="text"
                :value="modelValue"
                :disabled="disabled"
                :placeholder="placeholder"
                @input="updateValue"
                @focus="handleFocus"
                @blur="handleBlur"
            >
    
            <!-- 아이콘 -->
            <span class="input-text-box__icons">
                <!-- clear icon: 값 있을 때만 표시 -->
                <img
                    v-if="hasValue && !disabled"
                    :src="icClear" 
                    alt="입력 삭제 아이콘"
                    class="clear-icon"
                    @click="clearInput"
                >
                <!-- <img 
                    :src="icCheck" 
                    alt="입력 확인 아이콘"
                    class="clear-icon"
                >
                <img 
                    :src="icWarning" 
                    alt="입력  아이콘"
                    class="clear-icon"
                > -->
            </span>
        </div>
        <span v-show="caption" class="caption">{{ caption }}</span>
    </div>
</template>

<style lang="scss" scoped>
.input-text-box-wrapper {
    display: flex;
    flex:1;
    flex-direction: column;
    gap: 4px;
}
// 인풋 텍스트 박스 구조
.input-text-box {
    display: flex;
    align-items: center;
    height: 32px;
    padding: 0 10px;

    border-radius: 4px;
    background-color: $gray-00;
    border: 1px solid $gray-200;

    &.--focused {
        border-color: $gray-900;
        box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.06);
    }
    &.--disabled {
        background-color: $gray-50;
        cursor: not-allowed;
    }

    input[type="text"] {
        flex: 1;
        height: 100%;
        border: none;
        background-color: transparent;

        &:focus {
            outline: none;
        }    
        &::placeholder {
            color: $gray-400;
            @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
        }

        &:read-only {
            cursor: not-allowed;
            color: $gray-700;
        }
        &:disabled {
            cursor: not-allowed;
            color: $gray-700;
        }
    }

    &__icons {
        display: flex;
    }
}
.caption {color: $gray-700; padding: 0 10px;}
</style>