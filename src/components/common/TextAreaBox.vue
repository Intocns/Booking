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
});

const emit = defineEmits(['update:modelValue', 'focus', 'blur']);

// --- 상태 관리 ---
const isFocused = ref(false);

// 현재 값 길이 계산
const currentLength = computed(() => {
    return props.modelValue.length;
});

// 값이 있는지 여부 (스타일링용)
const hasValue = computed(() => {
    return props.modelValue && props.modelValue.length > 0;
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
    emit('update:modelValue', value);
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
    <div class="text-area-box-wrapper">
        <div 
            class="text-area-box"
            :class="{ 
                '--focused': isFocused,
                '--disabled': disabled,
                '--has-value': hasValue,
            }"
            :style="{ minHeight: height }"
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
                v-if="maxLength > 0"
            >
                {{ currentLength }} / {{ maxLength }}
            </span>
        </div>

        <!-- 힌트 메세지 -->
        <span v-show="caption" class="caption">{{ caption }}</span>
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
    gap:10px;
    position: relative;
    width: 100%;
    min-height: 80px; // 최소 높이 지정

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
        cursor: not-allowed;
    }
}

textarea {
    flex-grow: 1; // 남은 공간을 모두 차지
    width: 100%;
    min-height: 60px; // textarea 최소 높이
    
    border: none;
    resize: none; // 크기 조절 방지
    outline: none; // 포커스 시 브라우저 기본 아웃라인 제거
    background: transparent;

    color: $gray-900;
    @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
    
    // 플레이스홀더 스타일
    &::placeholder {
        color: $gray-400;
    }

    // 비활성화 시 텍스트 색상
    &:disabled {
        color: $gray-700;
        cursor: not-allowed;
    }
}

.text-area-box__char-count {
    align-self: flex-end; // 오른쪽 하단에 위치
    margin-top: 4px;
    
    @include typo($caption-size, $caption-weight, $caption-spacing, $caption-line);
    color: $gray-500;
}

.caption {
    margin-top: 4px;
    @include typo($caption-size, $caption-weight, $caption-spacing, $caption-line);
    color: $gray-600;
}
</style>