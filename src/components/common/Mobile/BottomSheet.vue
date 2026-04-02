<script setup>
import { ref , watch} from 'vue';

import icReset from '@/assets/icons/mobile/ic_reset.svg'

const props = defineProps({
    bottomSheetTitle: {type: String, default: "조회 필터 설정"},
    saveBtnText: { type: String, default: '저장'},
    modelValue: { type: Boolean, default: false }, // 'isOpen' 대신 'modelValue' 사용
    showResetBtn: { type: Boolean, default: false },
    showCloseBtn: { type: Boolean, default: false },
    closeBtnText: {type: String, default: '닫기'},
    hideBottomSheetBtn: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save', 'reset']);

// --- 드래그 닫기 로직 ---
const startY = ref(0); // 터치 시작 지점
const currentY = ref(0); // 현재 터치 지점
const isDragging = ref(false);
const translateY = ref(0); // 실제 시트가 움직일 거리

const onTouchStart = (e) => {
    startY.value = e.touches[0].clientY;
    isDragging.value = true;
};

const onTouchMove = (e) => {
    if (!isDragging.value) return;

    // 추가: 브라우저의 Pull-to-refresh 및 전체 스크롤 방지
    if (e.cancelable) e.preventDefault();
    
    const deltaY = e.touches[0].clientY - startY.value;
    // 위로 드래그하는 것은 막고, 아래로 드래그할 때만 숫자가 커지도록
    if (deltaY > 0) {
        translateY.value = deltaY;
    }
};

const onTouchEnd = () => {
    isDragging.value = false;
    // 일정 거리 이상 내려가면 닫기, 아니면 다시 제자리로
    if (translateY.value > 150) {
        closeSheet();
    }
    translateY.value = 0; // 초기화
};

const closeSheet = () => {
    // 부모에게 닫아달라고 요청
    emit('update:modelValue', false)
}

const handleReset = () => {
    emit('reset')
}

const handleSave = () => {
    emit('save') // 저장 버튼 클릭 시 부모에게 알림
}

// 배경 스크롤 방지 로직
watch(() => props.modelValue, (val) => {
    if (val) {
        // 열리면 배경 스크롤 고정
        document.body.style.overflow = 'hidden';
    } else {
        // 닫히면 배경 스크롤 해제
        document.body.style.overflow = '';
    }
}, { immediate: true });
</script>

<template>
    <teleport to="body">
        <Transition name="slide">
            <div v-if="modelValue" class="bottom-sheet-overlay" @click.self="closeSheet">
                <div 
                    class="bottom-sheet" 
                    @click.stop
                    :style="{ 
                        transform: `translateY(${translateY}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease-out' 
                    }"
                >
                    <div 
                        class="bottom-sheet__header" 
                        @touchstart="onTouchStart"
                        @touchmove="onTouchMove"
                        @touchend="onTouchEnd"
                    >
                        <div class="handle"></div>
                        <span class="title-xl-mobile">{{ bottomSheetTitle }}</span>
                        <!-- <button class="close-btn" @click.self="closeSheet">✕</button> -->
                    </div>
                    
                    <div class="bottom-sheet__content">
                        <slot name="content"></slot>
                    </div>

                    <div v-show="!hideBottomSheetBtn" class="bottom-sheet__footer">
                        <button v-if="showCloseBtn" class="btn btn--size-48 btn--blue-outline btn2" @click="closeSheet">{{ closeBtnText }}</button>
                        <button v-if="showResetBtn" class="btn btn--size-48 btn--blue-outline btn1" @click="handleReset"><img :src="icReset" alt="reset">초기화</button>
                        <button class="btn btn--size-48 btn--blue btn-save btn2" @click="handleSave">{{ saveBtnText }}</button>
                    </div>
                </div>
            </div>
        </Transition>
    </teleport>
</template>

<style lang="scss" scoped>
/* 오버레이와 바텀 시트 기본 스타일 유지 */
.bottom-sheet-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9000;
    display: flex;
    align-items: flex-end;
}

.bottom-sheet {
    display: flex;
    flex-direction: column;
    width: 100%;
    background: $gray-00;
    border-radius: 16px 16px 0 0;
    border: 1px solid $gray-200;
    max-height: 650px;
    // overflow-y: auto;

    &__header {
        @include flex-center;
        flex-direction: column;
        gap: 24px;
        padding: 16px 0 24px;
        // 추가: 브라우저의 기본 터치 액션(새로고침, 스크롤 등)을 막고 JS 로직만 허용
        touch-action: none;

        .handle {
            width: 56px;
            height: 4px;
            background: $gray-200;
            border-radius: 100px;
        }
    }

    &__content {
        padding: 0 20px;
        flex: 1;
        min-height: 0;
        overflow-y: auto;

        // 추가: 콘텐츠 영역 끝에서 드래그 시 새로고침 방지
        overscroll-behavior-y: contain;
    }

    &__footer {
        @include flex-center;
        gap:8px;
        padding: 20px;
        border-top: 1px solid $gray-200;

        button {
            height: 48px;
        }
        .btn1 {flex:1;}
        .btn2 {flex:2;}
    }
}

// 모바일용 바텀 시트 
/* Transition 스타일 */
.slide-enter-active,
.slide-leave-active {
    transition: opacity 0.3s ease;

    .bottom-sheet {
        transition: transform 0.3s ease-out;
    }
}

/* 시작 및 종료 상태 */
.slide-enter-from,
.slide-leave-to {
    opacity: 0;

    .bottom-sheet {
        transform: translateY(100%);
    }
}

/* 활성화 상태 (열려있을 때) */
.slide-enter-to,
.slide-leave-from {
    opacity: 1;

    .bottom-sheet {
        transform: translateY(0);
    }
}
</style>