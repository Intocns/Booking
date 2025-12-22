<script setup>
// 컴포넌트
import InputTextBox from '@/components/common/InputTextBox.vue';
import CustomSelect from '@/components/common/CustomSelect.vue';
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';
// 스토어
import { useModalStore } from '@/stores/modalStore';

import { ref, onMounted, onUnmounted, defineProps } from 'vue';

const props = defineProps({
    isEdit: {
        type: Boolean,
        default: false
    }
});

const modalStore = useModalStore();

/**
 * 화면 모드 상태 관리
 * OPTION: 옵션 관리 목록
 * CONNECT : 옵션-상품 연결
 */
const mode = ref('OPTION');

// 상태 관리
const selectedHour = ref(0); // 시간 
const selectedMinute = ref(0); // 분
const isHourOpen = ref(false); // 시간 셀렉트 노출/미노출
const isMinuteOpen = ref(false); // 분 셀렉트 노출/미노출
// 토글 상태 관리
const isStockEnabled = ref(false);    // 재고 토글
const isPriceEnabled = ref(false);    // 가격 토글
const isPeriodEnabled = ref(false);   // 운영기간 토글

// 옵션 데이터 생성
const hourOptions = Array.from({ length: 6 }, (_, i) => i);
const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

// 시간/분 선택 핸들러
const selectHour = (h) => {
    selectedHour.value = h;
    isHourOpen.value = false;
};
const selectMinute = (m) => {
    selectedMinute.value = m;
    isMinuteOpen.value = false;
};

// 외부 클릭 시 닫기 로직
const closeAll = (e) => {
    if (!e.target.closest('.time-unit')) {
        isHourOpen.value = false;
        isMinuteOpen.value = false;
    }
};

/**
 * 핸들러 함수
 */
const goConnect = () => { mode.value = 'CONNECT'; };
const goOption = () => { mode.value = 'OPTION'; };
const handleNext = () => {
    // TODO: 옵션 저장 로직
    goConnect();
}
const handlePrev = () => {
    goOption();
}
const handleSave = () => {
    // TODO: 등록 로직
    console.log('등록')
    modalStore.optionSettingModal.closeModal();
};
const handleUpdate = () => {
    console.log('수정 API 호출');
    modalStore.optionSettingModal.closeModal();
};

onMounted(() => window.addEventListener('click', closeAll));
onUnmounted(() => window.removeEventListener('click', closeAll));
</script>

<template>
    <!-- 탭 메뉴 -->
    <div v-if="isEdit" class="tab-menu">
        <div class="tab">
            <input type="radio" id="tab1" v-model="mode" value="OPTION">
            <label for="tab1" class="tab--radio_btn"><span>상세정보</span></label>
        </div>
        <div class="tab">
            <input type="radio" id="tab2" v-model="mode" value="CONNECT">
            <label for="tab2" class="tab--radio_btn"><span>상품연결</span></label>
        </div>
    </div>
    
    <!-- 옵션 등록 -->
    <template v-if="mode == 'OPTION'">
        <div class="modal-contents-inner">
            <div class="option-manager">
                <div class="option-manager__list">
                    <!-- 정보 -->
                    <div class="option-item">
                        <div class="option-item__title">
                            <p class="title-m">정보</p>
                        </div>
    
                        <div class="option-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label required">카테고리</p>
                                <div class="setting-row__content">
                                    <CustomSelect class="select" />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label required">옵션명</p>
                                <div class="setting-row__content">
                                    <InputTextBox />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">소요시간</p>
                                <div class="setting-row__content">
                                    <div class="time-picker-input">
                                        <div class="time-unit">
                                            <div class="value-trigger" @click.stop="isHourOpen = !isHourOpen">
                                                {{ selectedHour }}
                                            </div>
                                            <span class="unit-label">시간</span>
                                            
                                            <ul v-if="isHourOpen" class="time-dropdown">
                                                <li v-for="h in hourOptions" :key="h" @click="selectHour(h)">{{ h }}</li>
                                            </ul>
                                        </div>
    
                                        <div class="time-unit">
                                            <div class="value-trigger" @click.stop="isMinuteOpen = !isMinuteOpen">
                                                {{ String(selectedMinute).padStart(2, '0') }}
                                            </div>
                                            <span class="unit-label">분 소요</span>
    
                                            <ul v-if="isMinuteOpen" class="time-dropdown">
                                                <li v-for="m in minuteOptions" :key="m" @click="selectMinute(m)">
                                                    {{ String(m).padStart(2, '0') }}
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">옵션 설명</p>
                                <div class="setting-row__content">
                                    <TextAreaBox />
                                </div>
                            </div>
    
                        </div>
                    </div>
    
                    <!-- 예약 가능 수량 -->
                    <div class="option-item">
                        <div class="option-item__title">
                            <p class="title-m">예약 가능 수량</p>
                        </div>
    
                        <div class="option-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label">최소 수량</p>
                                <div class="setting-row__content">
                                    <InputTextBox />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">최대 수량</p>
                                <div class="setting-row__content">
                                    <InputTextBox />
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <!-- 재고 -->
                    <div class="option-item">
                        <div class="option-item__title">
                            <p class="title-m">재고</p>
    
                            <label class="toggle"> 
                                <input type="checkbox" v-model="isStockEnabled"/>
                                <span class="toggle-img"></span>
                            </label>
                        </div>
    
                        <div v-if="isStockEnabled" class="option-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label required">재고 수</p>
                                <div class="setting-row__content">
                                    <InputTextBox placeholder="개수 입력" />
                                </div>
                            </div>
                        </div>
                        <p v-else class="body-m">제공 가능한 수량 제한이 없습니다.</p>
                    </div>
    
                    <!-- 가격 -->
                    <div class="option-item">
                        <div class="option-item__title">
                            <p class="title-m">가격</p>
    
                            <label class="toggle"> 
                                <input type="checkbox" v-model="isPriceEnabled" />
                                <span class="toggle-img"></span>
                            </label>
                        </div>
    
                        <div v-if="isPriceEnabled" class="option-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label required">판매가</p>
                                <div class="setting-row__content">
                                    <InputTextBox placeholder="판매가 입력" />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">정가</p>
                                <div class="setting-row__content">
                                    <InputTextBox placeholder="정가 입력" />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">가격 부가설명</p>
                                <div class="setting-row__content">
                                    <TextAreaBox placeholder="가격 부가설명을 입력해주세요." />
                                </div>
                            </div>
                        </div>
                        <p v-else class="body-m">별도 가격을 표시하지 않습니다.</p>
                    </div>
    
                    <!-- 운영기간 -->
                    <div class="option-item">
                        <div class="option-item__title">
                            <p class="title-m">운영기간</p>
    
                            <label class="toggle"> 
                                <input type="checkbox" v-model="isPeriodEnabled" />
                                <span class="toggle-img"></span>
                            </label>
                        </div>
    
                        <div v-if="isPeriodEnabled" class="option-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label required">기간</p>
                                <div class="setting-row__content">
                                    <CustomDatePicker />
                                </div>
                            </div>
                        </div>
                        <p v-else class="body-m">제공 가능한 기간 제한이 없습니다.</p>
                    </div>
                </div>
            </div>
        </div>
        <!-- 버튼 -->
        <div class="modal-button-wrapper">
            <button class="btn btn--size-32 btn--blue-outline" @click="modalStore.optionSettingModal.closeModal()">취소</button>
            <button class="btn btn--size-32 btn--blue" @click="handleNext">다음</button>
        </div>
    </template>

    <!-- 옵션등록 > 옵션연결 -->
    <template v-else>
        <div class="modal-contents-inner">
            <div class="option-manager">
                <div class="option-manager__header">
                    <p class="body-m"><span class="title-s">증명서 발급</span> 옵션과 연결할 상품을 설정해주세요.</p>
                </div>

                <div class="option-manager__list">
                    <div class="list-item">
                        <div class="d-flex gap-4 align-center">
                            <span class="body-m">건강검진1</span>
                            <span class="flag flag--basic">연결</span>
                        </div>

                        <label class="toggle"> 
                            <input type="checkbox" v-model="isStockEnabled"/>
                            <span class="toggle-img"></span>
                        </label>
                    </div>
                    <div class="list-item">
                        <div class="d-flex gap-4 align-center">
                            <span class="body-m">건강검진2</span>
                            <span class="flag flag--disabled">미연결</span>
                        </div>

                        <label class="toggle"> 
                            <input type="checkbox" v-model="isStockEnabled"/>
                            <span class="toggle-img"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
        <!-- 버튼 -->
        <div class="modal-button-wrapper">
            <button class="btn btn--size-32 btn--blue-outline" @click="handlePrev">이전으로</button>
            <button class="btn btn--size-32 btn--blue-outline" @click="modalStore.optionSettingModal.closeModal()">취소</button>
            <button class="btn btn--size-32 btn--blue" @click="handleSave">등록</button>
        </div>
    </template>
</template>

<style lang="scss" scoped>
// 탭 메뉴
.tab-menu {
    display: flex;
    width: 100%;
    margin-bottom: 16px;
    
    border-bottom: 1px solid $gray-200;
}

.tab {
    width: 80px;
    background-color: $gray-00;

    input {display: none;}

    &--radio_btn {
        width: 80px;
        height: 32px;
        @include flex-center;
        gap: 2px;
        padding: 0 8px;

        @include typo($title-m-size, $title-m-weight, $title-m-spacing, $title-m-line);
        border-bottom: 2px solid $gray-00;

        span { color: $gray-400; }
    }

    input:checked + &--radio_btn {
        border-bottom: 2px solid $primary-700;
        span { color: $gray-900; }
    }
}

.option-manager {

    // 상단 영역
    &__header {
        display: flex;
        gap: 16px;
        word-break: keep-all;
        padding-bottom: 16px;
        border-bottom: 1px solid $gray-200;
        
        p { flex: 1; }
        span {color: $primary-700;}
    }

    // 리스트 컨테이너
    &__list {
        display: flex;
        flex-direction: column;
    }

}

.option-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid $gray-200;

    &__title {
        display: flex;
        align-items: center;
        justify-content: space-between;

    }

    &__settings {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    &:first-child {
        padding-top: 0;
    }
    &:last-child {
        border-bottom: none;
    }
}

// 개별 설정 줄 (카테고리명, 유형 공통)
.setting-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;

    &__label {
        display: flex;
        align-items: center;
        width: 68px;
        height: 32px; // 버튼이나 인풋 높이에 맞춤
        flex-shrink: 0;
        word-break: keep-all;

        &.required::after {
            content: '*';
            color: $primary-700;
            display: inline-block;
            margin-left: 2px;
        }
    }

    &__content {
        flex: 1;
        width: 100%;

        :deep(.caption) {
            width: 100%;
            text-align: right;
        }
    }
}

// 셀렉트 박스 너비 확장
.select {
    width: 100%;
}

.time-picker-input {
    display: flex;
    align-items: center;
    gap: 8px;
    
    width: 100%;
    height: 32px;
    padding: 0 12px;
    border: 1px solid $gray-200;
    border-radius: 4px;
    background-color: #fff;

    .time-unit {
        position: relative; // 드롭다운 기준점
        display: flex;
        align-items: center;
        gap: 4px;

        // 파란색 숫자 박스
        .value-trigger {
            display: flex;
            align-items: center;
            justify-content: center;
            // height: 22px;
            padding: 1px 3px;
            
            background-color: $primary-100;
            color: $primary-700;       // 파란 글씨
            border-radius: 2px;
            cursor: pointer;

            @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line); 
        }

        .unit-label {
            font-size: 14px;
            color: $gray-900;
            white-space: nowrap;
        }
    }
}

// 드롭다운 레이어 스타일
.time-dropdown {
    position: absolute;
    top: 28px;
    left: 0;
    z-index: 10;
    
    // min-width: 40px;
    max-height: 160px;
    overflow-y: auto;
    
    background: #fff;
    border: 1px solid $gray-200;
    border-radius: 4px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    list-style: none;
    // padding: 2px 0;

    li {
        padding: 6px;
        font-size: 13px;
        text-align: center;
        cursor: pointer;

        &:hover {
            background-color: $gray-50;
            color: $primary-700;
        }
    }
}

.list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    height: 32px;
    margin-bottom: 12px;

    border-radius: 4px;
    border: 1px solid $gray-200;

    &:first-child {margin-top: 16px;}
    &:last-child {margin-bottom: 0;}
}
</style>