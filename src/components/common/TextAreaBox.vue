<!-- 공통 textarea -->
<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    // v-model을 위한 기본 값
    modelValue: {
        type: String,
        default: '',
    },
    placeholder: {
        type: String,
        default: '내용을 입력해주세요.',
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    // 최소 글자 수
    minLength: {
        type: Number,
        default: 0
    },
    // 최대 글자 수
    maxLength: {
        type: Number,
        default: 0, // 0이면 무제한
    },
    // 하단 캡션 텍스트
    caption: {
        type: String,
        default: '',
    },
    height: {
        type: String,
        default: '80px',
    },
    isError: {
        type: Boolean,
        default: false,
    },
    errorMessage: {
        type: String,
        default: '',
    }
});

const emit = defineEmits(['update:modelValue', 'focus', 'blur']);

// --- 상태 관리 ---
const isFocused = ref(false);

// 현재 값 길이 계산
const currentLength = computed(() => {
    return props.modelValue ? props.modelValue.length : 0;
});

// 값이 있는지 여부 (스타일링용)
const hasValue = computed(() => {
    return props.modelValue && props.modelValue.length > 0;
});

// 화면에 표시할 최종 메시지
const displayMessage = computed(() => {
    if (props.isError && props.errorMessage) return props.errorMessage;
    return props.caption;
});

// --- 이벤트 핸들러 ---

// 입력 값 업데이트 및 글자 수 제한 로직 처리
const updateValue = (event) => {
    let value = event.target.value;

    if (props.maxLength > 0 && value.length > props.maxLength) {
        // 최대 길이 초과 시 자르기
        value = value.substring(0, props.maxLength);
    }
    
    // v-model 업데이트
    emit('update:modelValue', event.target.value);
};

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
    <div class="text-area-box-wrapper" :style="{ height: height }">
        <div 
            class="text-area-box"
            :class="{ 
                '--focused': isFocused,
                '--disabled': disabled,
                '--has-value': hasValue,
                '--is-error': isError,
            }"
            :style="{ height: height }"
        >
            <textarea 
                :value="modelValue"
                :disabled="disabled"
                :placeholder="placeholder"
                @input="updateValue"
                @focus="handleFocus"
                @blur="handleBlur"
            ></textarea>

            <!-- 글자 수 영역 -->
            <span 
                class="text-area-box__char-count"
                :class="{ '--error': isError }"
                v-if="maxLength > 0"
            >
                {{ currentLength }} / {{ maxLength }} {{ minLength > 0 ? '(최소' + minLength + '자)' : '' }}
            </span>
        </div>

        <!-- 힌트 메세지 -->
        <span 
            v-show="displayMessage" 
            class="caption"
            :class="{ '--error': isError }"
        >
            {{ displayMessage }}
        </span>
    </div>
</template>

<style lang="scss" scoped>
.text-area-box-wrapper {
    // 캡션과의 레이아웃 처리를 위한 래퍼
    width: 100%;
    flex:1;
}

.text-area-box {
    display: flex;
    flex-direction: column; // 글자수 카운터가 아래에 위치하도록
    // gap:10px;
    position: relative;
    width: 100%;
    min-height: 60px; // 최소 높이 지정

    border-radius: 4px;
    border: 1px solid $gray-200;
    background-color: $gray-00;
    padding: 10px;
    
    transition: border-color 0.2s, box-shadow 0.2s;

    // --- 상태별 스타일 ---
    
    &.--focused {
        border-color: $gray-900;
        box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.06);
    }

    &.--disabled {
        background-color: $gray-50;
        // pointer-events: none;
        cursor: default;
    }

    &.--is-error {
        border-color: $warning-500;
    }
}

textarea {
    flex-grow: 1; // 남은 공간을 모두 차지
    width: 100%;
    // min-height: 100%; // textarea 최소 높이
    
    border: none;
    resize: none; // 크기 조절 방지
    outline: none; // 포커스 시 브라우저 기본 아웃라인 제거
    background: transparent;
    overflow-y: auto;

    color: $gray-900;
    @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
    
    // 플레이스홀더 스타일
    &::placeholder {
        color: $gray-400;
    }

    // 비활성화 시 텍스트 색상
    &:disabled {
        color: $gray-700;
        pointer-events: auto; // disabled여도 스크롤 가능
    }
}

.text-area-box__char-count {
    align-self: flex-end; // 오른쪽 하단에 위치
    // margin-top: 4px;
    
    @include typo($caption-size, $caption-weight, $caption-spacing, $caption-line);
    color: $gray-500;

    &.--error {
        color: $warning-500;
    }
}

.caption {
    display: block;
    width: 100%;
    // max-width: 280px;
    margin-top: 4px;
    @include typo($caption-size, $caption-weight, $caption-spacing, $caption-line);
    color: $gray-600;

    &.--error {
        color: $warning-500;
    }
}
</style>