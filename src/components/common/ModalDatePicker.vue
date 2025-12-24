<script setup>

import { VueDatePicker } from '@vuepic/vue-datepicker';
import { ko } from 'date-fns/locale'
import { format, isBefore, startOfDay } from "date-fns";
import { formatDate } from '@/utils/dateFormatter.js';

import { ref, computed, watch } from 'vue';
// 아이콘
import icBtnClose from '@/assets/icons/ic_btn_close_w.svg'

const props = defineProps({
    isModalOpen: {type: Boolean, default: false},
})

const emit = defineEmits(['close', 'add']);

/**
 * 상태 관리
 */
const selectedDate = ref(null); // 데이트피커 선택 값
const repeatType = ref('once'); // 'yearly', 'monthly', 'once'

// 1. 과거 날짜 선택 방지 (오늘 이전 날짜 비활성화)
const disabledDates = (date) => {
    return isBefore(date, startOfDay(new Date()));
};

// 2. 선택된 날짜 및 주기에 따른 텍스트 계산
const formattedDisplayText = computed(() => {
    if (!selectedDate.value) return '날짜를 선택해 주세요';

    const d = selectedDate.value;
    
    // 기간 선택(Range)일 경우를 대비한 로직 (현재는 단일 선택 기준)
    if (repeatType.value === 'yearly') {
        return `매년 ${format(d, 'M월 d일')}`;
    } 
    
    if (repeatType.value === 'monthly') {
        return `매달 ${format(d, 'd일')}`;
    }
    
    if (repeatType.value === 'once') {
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
    selectedDate.ref = null;
    repeatType.value = 'once';
};

// 모달이 열릴 때 오늘 날짜 기본 선택 (선택 사항)
// watch(() => props.isModalOpen, (newVal) => {
//     if (newVal) {
//         selectedDate.value = new Date();
//     }
// });
</script>

<template>
    <teleport to="#app">
        <div v-if="isModalOpen" class="modal-backdrop" @click="handleClose">
            <div class="modal-container" @click.stop style="min-width: 240px;">
                <div class="modal-header"></div>
                <div class="modal-contents">
                    <div class="modal-contents-inner">
                        <VueDatePicker
                            v-model="selectedDate"
                            inline
                            auto-apply
                            :hide-input="true"
                            :time-config="{ enableTimePicker: false }"
                            :locale="ko"
                            :disabled-dates="disabledDates"
                        />

                        <div class="select-date-option">

                            <!-- 매년/매달/한번만 선택 -->
                            <div class="segment-wrapper">
                                <label class="segment">
                                    <input type="radio" v-model="repeatType" value="yearly" />
                                    <span class="label">매년</span>
                                </label>
                                <label class="segment">
                                    <input type="radio" v-model="repeatType" value="monthly" />
                                    <span class="label">매달</span>
                                </label>
                                <label class="segment">
                                    <input type="radio" v-model="repeatType" value="once" />
                                    <span class="label">한번만</span>
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