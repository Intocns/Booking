<script setup>
import icClear from '@/assets/icons/ic_clear.svg'
import icClock from '@/assets/icons/ic_clock.svg'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
    modelValue: {
        type: String, // 'HH:mm' 형식
        default: '',
    },
    autoApply: { // 시간 선택 시 즉시 적용 여부
        type: Boolean,
        default: true,
    },
    selectWidth: { // 선택 박스의 너비 설정
        type: String,
        default: '100%', // 기본값은 100%
    },
});

const emit = defineEmits(['update:modelValue']);

// 플레이스 홀더 고정
const DEFAULT_PLACEHOLDER = '시간 선택';

// --- UI 상태 관리 ---
const isDropdownVisible = ref(false); // 드롭다운 표시 상태
const wrapperRef = ref(null); // 컴포넌트 외부 클릭 감지를 위한 ref
const triggerRef = ref(null); // .input-display 참조
const dropdownRef = ref(null); // 드롭다운을 위한 ref
// --- 드론다운 스크롤 제어 ref ---
const hourColumnRef = ref(null); // ul 태그 참조
const minuteColumnRef = ref(null); // ul 태그 참조

// --- 임시 선택 상태 (취소/적용 로직용) ---
const tempSelectedHour = ref('00');
const tempSelectedMinute = ref('00');

const dropdownStyle = ref({
    position: 'fixed',
    top: '0px',
    left: '0px',
    width: '0px',
    zIndex: 100
});

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
    if (isDropdownVisible.value) {
        updatePosition(); // 위치 계산 추가
        scrollToSelected(); // 열릴 때 스크롤 실행
    }
};

// --- 액션 버튼 핸들러 ---
const applySelection = () => {
    const newTime = `${tempSelectedHour.value}:${tempSelectedMinute.value}`;
    emit('update:modelValue', newTime);
    // isDropdownVisible.value = false; // 시간,분을 선택해도 드롭다운은 닫히지 않도록 주석처리함 바깥영역 클릭시에만 닫힘 (요청사항) 261030 hyerin
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

// 시간/분 클릭 시 즉시 적용 (autoApply=true인 경우)
const handleHourClick = (hour) => {
    tempSelectedHour.value = hour;
    // autoApply가 true이고 시간과 분이 모두 선택된 경우에만 즉시 적용
    if (props.autoApply && tempSelectedMinute.value !== null && tempSelectedMinute.value !== undefined) {
        applySelection();
    }
};

const handleMinuteClick = (minute) => {
    tempSelectedMinute.value = minute;
    // autoApply가 true이고 시간과 분이 모두 선택된 경우에만 즉시 적용
    if (props.autoApply && tempSelectedHour.value !== null && tempSelectedHour.value !== undefined) {
        applySelection();
    }
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
    const isTriggerClick = wrapperRef.value && wrapperRef.value.contains(event.target);
    const isDropdownClick = dropdownRef.value && dropdownRef.value.contains(event.target);

    // 입력창 클릭도 아니고, 드롭다운 내부 클릭도 아닐 때만 닫기
    if (!isTriggerClick && !isDropdownClick) {
        cancelSelection();
    }
};

// 스크롤 이동 함수
const scrollToSelected = async () => {
    await nextTick(); // 렌더링 대기

    // 시간 컬럼 스크롤
    if (hourColumnRef.value) {
        const selected = hourColumnRef.value.querySelector('.selected');
        if (selected) {
            // 선택된 항목이 맨위로
            hourColumnRef.value.scrollTop = selected.offsetTop - 8; // 상단 패딩값 빼줌
        }
    }

    // 분 컬럼 스크롤
    if (minuteColumnRef.value) {
        const selected = minuteColumnRef.value.querySelector('.selected');
        if (selected) {
            // 선택된 항목이 맨위로
            minuteColumnRef.value.scrollTop = selected.offsetTop; // 상단 패딩값 빼줌
        }
    }
};

// 드롭다운 포지션 업데이트
const updatePosition = async () => {
    await nextTick();
    if (triggerRef.value) {
        const rect = triggerRef.value.getBoundingClientRect();
        const dropdownHeight = 180; 
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - rect.bottom;
        const showUpward = spaceBelow < dropdownHeight + 10;

        dropdownStyle.value = {
            position: 'fixed',
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            zIndex: 100,
            top: showUpward ? 'auto' : `${rect.bottom}px`,
            bottom: showUpward ? `${windowHeight - rect.top}px` : 'auto'
        };
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside, true);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside, true);
});
</script>

<template>
    <div class="custom-time-picker-wrapper" ref="wrapperRef">
        <div 
            class="input-display"
            :class="{ '--active': isDropdownVisible, '--placeholder': !modelValue }"
            @click="toggleDropdown"
            :style="{ width: selectWidth }"
            ref="triggerRef"
        >
            <span class="display-text">
                {{ modelValue || DEFAULT_PLACEHOLDER }}
            </span>

            <!-- 시계 아이콘 항상 표시되도록 수정 (요청사항) 260130 hyerin -->
            <div class="icon-area">
                <img 
                    :src="icClock" 
                    alt="시간 선택 아이콘" 
                    class="icon icon--clock"
                />

                <!-- 시간 선택 초기화 버튼 주석처리 (요청사항) 260130 hyerin -->
                <!-- <button 
                    v-else 
                    class="icon-button" 
                    @click="clearTime"
                    aria-label="선택 시간 초기화"
                >
                    <img :src="icClear" alt="초기화 아이콘" class="icon icon--clear" />
                </button> -->
            </div>
        </div>

        <teleport to='body'>
            <div v-if="isDropdownVisible" class="time-picker-dropdown" :style="dropdownStyle" ref="dropdownRef" @click.stop>
                <div class="time-columns-container">
                    <ul class="time-column hour-column" ref="hourColumnRef">
                        <li
                            v-for="(hour, index) in hourOptions"
                            :key="hour"
                            :class="{ 'selected': tempSelectedHour === hour }"
                            @click.stop="handleHourClick(hour)"
                        >
                            {{ hour }}
                        </li>
                    </ul>
                    
                    <ul class="time-column minute-column" ref="minuteColumnRef">
                        <li
                            v-for="(minute, index) in minuteOptions"
                            :key="minute"
                            :class="{ 'selected': tempSelectedMinute === minute }"
                            @click.stop="handleMinuteClick(minute)"
                        >
                            {{ minute }}
                        </li>
                    </ul>
                </div>
    
                <div v-if="!props.autoApply" class="picker-footer">
                    <button class="btn btn--size-24 btn--black-outline" @click.stop="cancelSelection">취소</button>
                    <button class="btn btn--size-24 btn--black" @click.stop="applySelection">적용</button>
                </div>
            </div>
        </teleport>
    </div>
</template>

<style lang="scss" scoped>
.custom-time-picker-wrapper {
    position: relative;
    flex: 1;
    min-width: 0;
}

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

// 드롭다운 팝업 스타일
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
    height: 180px; /* 스크롤 영역의 높이 */
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

// 푸터 버튼 스타일
.picker-footer {
    display: flex;
    justify-content: flex-end;
    padding: 8px;
    gap: 8px;
    border-top: 1px solid $gray-200;
}
</style>