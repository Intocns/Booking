<script setup>

import { VueDatePicker } from '@vuepic/vue-datepicker';
import { ko } from 'date-fns/locale'
import { format, isBefore, startOfDay } from "date-fns";
import { formatDate } from '@/utils/dateFormatter.js';

import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue';
// 아이콘
import icBtnClose from '@/assets/icons/ic_btn_close_w.svg'

const props = defineProps({
    isModalOpen: {type: Boolean, default: false},
    repeatMode: { type: String, default: 'all' }, // 인투펫 관리 > 진료실 관리에서 사용하는 mode 체크 위한 값
    showRepeatOptions: { type: Boolean, default: true }, // 주기 선택 영역 노출 여부
    title: { type: String, default: '' },               // 모달 상단 타이틀
    initialDate: { type: [Date, String, null], default: null }, // 초기 선택 날짜 (Date 또는 'yyyy-MM-dd' 형식 문자열)
})

const emit = defineEmits(['close', 'add']);

/**
 * 상태 관리
 */
const selectedDate = ref(null); // 데이트피커 선택 값
const repeatType = ref('DAILY'); // 'YEARLY', 'MONTHLY', 'DAILY'

// 부모가 넘겨준 mode에 따라 화면에 보여줄 라디오 버튼 필터링
const displayOptions = computed(() => {
    const options = [
        { label: '매년', value: 'YEARLY' },
        { label: '매달', value: 'MONTHLY' },
        { label: '한번만', value: 'DAILY' }
    ];

    if (props.repeatMode === 'annual') { // 인투펫 관리 > 진료실 관리에서는 한번만, 매년 두가지 옵션만 사용.
        return options.filter(opt => opt.value !== 'MONTHLY');
    }
    if (props.repeatMode === 'none') {
        return [];
    }
    return options; // 'all'인 경우 전체 반환
});

// 모달이 열릴 때 부모가 넘겨준 이전 날짜를 세팅
watch(() => props.isModalOpen, async (newVal) => {
    if (newVal) {
        // 기존 날짜 세팅 로직
        if (props.initialDate) {
            selectedDate.value = new Date(props.initialDate);
        } else {
            selectedDate.value = null;
        }

        // DOM이 렌더링된 후 휠 이벤트 차단
        await nextTick();
        const menu = document.querySelector('.dp__menu');
        if (menu) {
            menu.addEventListener('wheel', preventScroll, { 
                passive: false, 
                capture: true 
            });
        }
    } else {
        // 모달 닫힐 때 이벤트 제거
        const menu = document.querySelector('.dp__menu');
        if (menu) {
            menu.removeEventListener('wheel', preventScroll, { capture: true });
        }
    }
});

// 1. 과거 날짜 선택 방지 (오늘 이전 날짜 비활성화)
const disabledDates = (date) => {
    return isBefore(date, startOfDay(new Date()));
};

// 2. 선택된 날짜 및 주기에 따른 텍스트 계산
const formattedDisplayText = computed(() => {
    if (!selectedDate.value) return '날짜를 선택해 주세요';

    const d = selectedDate.value;
    
    // 기간 선택(Range)일 경우를 대비한 로직 (현재는 단일 선택 기준)
    if (repeatType.value === 'YEARLY') {
        return `매년 ${format(d, 'M월 d일')}`;
    } 
    
    if (repeatType.value === 'MONTHLY') {
        return `매달 ${format(d, 'd일')}`;
    }
    
    if (repeatType.value === 'DAILY') {
        // 만약 DatePicker가 range 모드라면 여기서 분기 처리가 필요합니다.
        // 현재는 단일 날짜 선택 기준으로 작성합니다.
        return format(d, 'yyyy년 MM월 dd일');
    }

    return '';
});

// 3. 적용 버튼 활성화 여부
const isDisableApply = computed(() => {
    return !selectedDate.value || !repeatType.value;
});

/**
 * 액션 핸들러
 */
const handleAdd = () => {
    if (isDisableApply.value) return;

    // 부모에게 주기 유형과 날짜 원본 데이터를 전달
    emit('add', {
        type: repeatType.value,
        date: selectedDate.value,
        text: formattedDisplayText.value // 부모에서 보여줄 텍스트까지 미리 전달
    });
    
    handleClose();
};

const handleClose = () => {
    emit('close');
    // 닫을 때 초기화
    selectedDate.value = null;
    repeatType.value = 'DAILY';
};

// 모달이 열릴 때 오늘 날짜 기본 선택 (선택 사항)
// watch(() => props.isModalOpen, (newVal) => {
//     if (newVal) {
//         selectedDate.value = new Date();
//     }
// });

// 스크롤 방지 핸들러
const preventScroll = (e) => {
    // 월/년 선택 오버레이 내부 스크롤은 허용하기 위해
    const isOverlay = e.target.closest('.dp__overlay');
    if (!isOverlay) {
        e.preventDefault();
        e.stopPropagation();
    }
};

onBeforeUnmount(() => {
    const menu = document.querySelector('.dp__menu');
    if (menu) {
        menu.removeEventListener('wheel', preventScroll, { capture: true });
    }
});
</script>

<template>
    <teleport to="#app">
        <div v-if="isModalOpen" class="modal-backdrop" @click="handleClose">
            <div class="modal-container" @click.stop style="min-width: 240px;">
                <div class="modal-header"></div>
                <div class="modal-contents">
                    <div v-if="title" class="modal-header-custom">
                        <p class="title-s">{{ title }}</p>
                    </div>

                    <div class="modal-contents-inner">
                        <VueDatePicker
                            v-model="selectedDate"
                            inline
                            auto-apply
                            :hide-input="true"
                            :time-config="{ enableTimePicker: false }"
                            :locale="ko"
                            week-start="0"
                            :disabled-dates="disabledDates"
                        />

                        <div class="select-date-option">

                            <!-- 매년/매달/한번만 선택 -->
                            <div v-if="showRepeatOptions && displayOptions.length > 0" class="segment-wrapper">
                                <label v-for="opt in displayOptions" :key="opt.value" class="segment">
                                    <input type="radio" v-model="repeatType" :value="opt.value" />
                                    <span class="label">{{ opt.label }}</span>
                                </label>
                            </div>
        
                            <!-- 선택 날짜 보여주는 영역 -->
                            <div class="selected-date-view">
                                <span>{{ formattedDisplayText }}</span>
                            </div>

                        </div>

                        <div class="modal-datepicker-buttons">
                            <button class="btn btn--size-24 btn--black-outline" @click="handleClose">취소</button>
                            <button 
                                class="btn btn--size-24 btn--black" 
                                :disabled="isDisableApply"
                                @click="handleAdd"
                            >
                                적용
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </teleport>
</template>

<style lang="scss" scoped>
    .modal-header {
        display: none;
        // background-color: $gray-00;
    }
    .modal-contents {
        border-radius: 4px;
    }
    .modal-header-custom {
        padding: 20px 20px 0px 20px;
    }
    .modal-contents-inner {
        padding: 0;
        overflow-y:visible
    }
    .select-date-option {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px;
    }
    .selected-date-view {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        padding: 0 8px;

        border-radius: 5px;
        border: 1px solid $primary-200;
        background-color: $primary-50;
        @include typo($title-xs-size, $title-xs-weight, $title-xs-spacing, $title-xs-line);
        color: $primary-700;
        line-height: 1;
    }

    .modal-datepicker-buttons {
        display: flex;
        padding: 8px;
        justify-content: flex-end;
        gap: 4px;

        border-top: 1px solid $gray-200;
    }
    :deep(.dp__menu) {
        border-radius: 4px 4px 0 0;
        border: none;
    }
</style>