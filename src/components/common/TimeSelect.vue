<script setup>
import icClear from '@/assets/icons/ic_clear.svg'
import icClock from '@/assets/icons/ic_clock.svg'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    modelValue: {
        type: String, // 'HH:mm' 형식
        default: '',
    },
});

const emit = defineEmits(['update:modelValue']);

// 플레이스 홀더 고정
const DEFAULT_PLACEHOLDER = '시간 선택';

// --- UI 상태 관리 ---
const isDropdownVisible = ref(false); // 드롭다운 표시 상태
const wrapperRef = ref(null); // 컴포넌트 외부 클릭 감지를 위한 ref

// --- 임시 선택 상태 (취소/적용 로직용) ---
const tempSelectedHour = ref('00');
const tempSelectedMinute = ref('00');

// --- 시간/분 옵션 생성 ---
const hourOptions = computed(() => {
    return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')); // 00 ~ 23
});
const minuteOptions = computed(() => {
    // 30분 단위 옵션
    return ['00', '30']; 
});

// --- ModelValue 파싱 및 임시 상태 초기화/업데이트 ---

// modelValue가 변경될 때 임시 상태 업데이트
watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        const [h, m] = newValue.split(':');
        tempSelectedHour.value = h;
        tempSelectedMinute.value = minuteOptions.value.includes(m) ? m : minuteOptions.value[0];
    } else {
        // modelValue가 비어있을 때 임시 시간을 기본값(00:00)으로 설정
        tempSelectedHour.value = '00';
        tempSelectedMinute.value = minuteOptions.value[0];
    }
}, { immediate: true });

// 입력 필드 클릭 (드롭다운 토글)
const toggleDropdown = () => {
    isDropdownVisible.value = !isDropdownVisible.value;
};

// --- 액션 버튼 핸들러 ---
const applySelection = () => {
    const newTime = `${tempSelectedHour.value}:${tempSelectedMinute.value}`;
    emit('update:modelValue', newTime);
    isDropdownVisible.value = false;
};

const cancelSelection = () => {
    if (props.modelValue) {
        // modelValue에 값이 있을 때만 split을 사용해 임시 상태를 되돌림
        const [h, m] = props.modelValue.split(':');
        tempSelectedHour.value = h;
        tempSelectedMinute.value = m;
    } 
    // modelValue가 ''라면, 임시 상태는 이미 watch에 의해 '00:00'으로 초기화된 상태이므로
    // 그대로 두고 드롭다운만 닫음 (다음 오픈 시 '00:00'부터 시작)

    isDropdownVisible.value = false;
};

// 입력 값 초기화 함수 
const clearTime = (event) => {
    // 이벤트 전파를 막아 드롭다운이 닫히는 것을 방지하거나 (여기서는 toggleDropdown이 호출되지 않도록)
    // input-display의 @click 이벤트가 동시에 발생하지 않도록.
    event.stopPropagation(); 
    emit('update:modelValue', ''); // modelValue 초기화
    isDropdownVisible.value = false; // 드롭다운 닫기
};

// --- 외부 클릭 감지 (드롭다운 닫기) ---
const handleClickOutside = (event) => {
    if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
        // 임시 변경 사항을 롤백하고 닫기
        cancelSelection(); 
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
    <div class="custom-time-picker-wrapper" ref="wrapperRef">
        <div 
            class="input-display"
            :class="{ '--active': isDropdownVisible, '--placeholder': !modelValue }"
            @click="toggleDropdown"
        >
            <span class="display-text">
                {{ modelValue || DEFAULT_PLACEHOLDER }}
            </span>

            <div class="icon-area">
                <img 
                    v-if="!modelValue" 
                    :src="icClock" 
                    alt="시간 선택 아이콘" 
                    class="icon icon--clock"
                />

                <button 
                    v-else 
                    class="icon-button" 
                    @click="clearTime"
                    aria-label="선택 시간 초기화"
                >
                    <img :src="icClear" alt="초기화 아이콘" class="icon icon--clear" />
                </button>
            </div>
        </div>

        <div v-if="isDropdownVisible" class="time-picker-dropdown">
            <div class="time-columns-container">
                <ul class="time-column hour-column">
                    <li
                        v-for="hour in hourOptions"
                        :key="hour"
                        :class="{ 'selected': tempSelectedHour === hour }"
                        @click="tempSelectedHour = hour"
                    >
                        {{ hour }}
                    </li>
                </ul>
                
                <ul class="time-column minute-column">
                    <li
                        v-for="minute in minuteOptions"
                        :key="minute"
                        :class="{ 'selected': tempSelectedMinute === minute }"
                        @click="tempSelectedMinute = minute"
                    >
                        {{ minute }}
                    </li>
                </ul>
            </div>

            <div class="picker-footer">
                <button class="btn btn--size-24 btn--black-outline" @click.stop="cancelSelection">취소</button>
                <button class="btn btn--size-24 btn--black" @click.stop="applySelection">적용</button>
            </div>
        </div>
    </div>
</template>

/* CustomTimePicker.vue style */
<style lang="scss" scoped>
.custom-time-picker-wrapper {
    position: relative;
    flex: 1;
    min-width: 0;
}

// 1. 인풋 디스플레이 스타일 (기존 InputTextBox와 유사)
.input-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 32px;
    min-width: 0;
    width: 100%;
    min-width: 94px;
    padding: 8px;

    border-radius: 5px;
    border: 1px solid $gray-200;
    background-color: $gray-00;
    cursor: pointer;
    
    color: $gray-900;
    @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);

    // 텍스트 영역
    .display-text {
        flex-grow: 1; /* 텍스트가 남은 공간을 채우도록 */
        min-width: 0;
        padding-right: 8px; /* 아이콘과의 간격 */
        
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    // 아이콘 영역
    .icon-area {
        flex-shrink: 0; /* 아이콘 영역은 줄어들지 않음 */
        display: flex;
        align-items: center;
        width: 16px; /* 아이콘 크기에 맞춰 폭 고정 */
        height: 16px; 

        .icon-button {
            // 버튼 기본 스타일 초기화
            padding: 0;
            border: none;
            background: none;
            cursor: pointer;
        }

        .icon {
            width: 100%;
            height: 100%;
        }
    }

    &.--active {
        border-color: $gray-900; /* 활성화 시 보더 색상 */
        box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.06);
    }

    &.--placeholder {
        color: $gray-400; 
    }
}

// 2. 드롭다운 팝업 스타일
.time-picker-dropdown {
    position: absolute;
    z-index: 1000; // 다른 요소 위에 표시
    top: 35px; 
    left: 0;
    width: 100%; // 너비를 InputTextBox와 맞춤
    min-width: 94px;
    
    background-color: $gray-00;
    border: 1px solid $gray-200;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    overflow: hidden; /* 내부 스크롤을 위해 */
}

.time-columns-container {
    display: flex;
    height: 100px; /* 스크롤 영역의 높이 */
    border-bottom: 1px solid $gray-200;
}

.time-column {
    flex: 1;
    list-style: none;
    margin: 0;
    padding: 8px;
    overflow-y: auto; /* 스크롤 가능 */
    text-align: center;
    border-right: 1px solid $gray-200;

    &:last-child {
        border-right: none;
    }
    
    // 스크롤바 숨기기 (선택 사항)
    &::-webkit-scrollbar { display: none; }
    -ms-overflow-style: none;
    scrollbar-width: none;
    
    li {
        @include flex-center;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);

        &:hover {
            background-color: $gray-50;
        }
        &.selected {
            background-color: $primary-50;
            color: $primary-700;
            @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
        }
    }
}

// 3. 푸터 버튼 스타일
.picker-footer {
    display: flex;
    justify-content: flex-end;
    padding: 8px;
    gap: 8px;
}
</style>