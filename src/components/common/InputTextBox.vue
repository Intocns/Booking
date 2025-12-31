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
    // 최대 글자 수
    maxLength: {
        type: Number,
        default: 0, // 0이면 무제한
    },
    // 최소 글자 수
    minLength: {
        type: Number,
        default: 0,
    }
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
    let value = event.target.value;

    if (props.maxLength > 0 && value.length > props.maxLength) {
        // 최대 길이 초과 시 자르기
        value = value.substring(0, props.maxLength);
    }
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

// 현재 값 길이 계산
const currentLength = computed(() => {
    return props.modelValue.length;
});

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
        
        <template v-if="caption || maxLength"> 
            <div class="input-text-box__bottom">
                <!-- 힌트 메세지 -->
                <span class="caption">{{ caption }}</span>
                <!-- 글자 수 영역 -->
                <span 
                    class="input-text-box__char-count"
                    v-show="maxLength > 0"
                >
                    {{ currentLength }} / {{ maxLength }} {{ minLength > 0 ? '(최소' + minLength + '자)' : '' }}
                </span>
            </div>
        </template>
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
        width: 16px;
        display: flex;
    }

    &__bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;

        padding: 0 10px;
    }

    &__char-count {
        align-self: flex-end; // 오른쪽 하단에 위치
        margin-top: 4px;
        
        @include typo($caption-size, $caption-weight, $caption-spacing, $caption-line);
        color: $gray-500;
    }
}
.caption {color: $gray-700; }
</style>