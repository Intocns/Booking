<!-- 플레이스 설정 > 알림설정탭 -->
<script setup>
// 컴포넌트
import Modal from '@/components/common/Modal.vue';
import TextAreaBox from '@/components/common/TextAreaBox.vue';
// 아이콘
import icPlus from '@/assets/icons/ic_plus_black.svg'
import icClose from '@/assets/icons/ic_btn_close_b.svg'
import icEdit from '@/assets/icons/ic_edit.svg'

import { onMounted, ref, nextTick } from 'vue';
// 스토어
import { useModalStore } from '@/stores/modalStore';
import { usePlaceStore } from '@/stores/placeStore';

import { showAlert } from '@/utils/ui';
import { getFieldError } from '@/utils/common';

const modalStore = useModalStore();
const placeStore = usePlaceStore();

// 모달 제어 상태
const currentGuideType = ref(''); // 'confirm' 또는 'cancel'
const guideInputText = ref(''); // TextArea에 입력된 값
const textAreaRef = ref(null); // TextArea 컴포넌트를 참조할 ref

const isEditMode = ref(false); // 안내 문구 수정 mode인지 체크
const editIndex = ref(null); // 수정하는 문구 index 저장

// 문구 삭제 버튼 이벤트 핸들러
const handelRemoveGuide = (type, index) => {
    modalStore.confirmModal.openModal({
        text: '해당 안내 문구를 삭제하시겠습니까?',
        confirmBtnText: '삭제',
        onConfirm: () => removeGuide(type, index),
    })
}

// 문구 삭제 함수 => 260206 JJB 저장 통합으로 합치면서 아래 저장 부분 주석처리
const removeGuide = async(type, index) => {
    const targetList = type === 'confirm' ? placeStore.guideList : placeStore.cancelGuideList;
    targetList.splice(index, 1);

    // const params = targetList.map(item => ({
    //     words: item.words,
    //     isActive: item.isActive ? 1 : 0
    // }));

    // if (type === 'confirm') {
    //     await placeStore.modifyAlarmGuide(params);
    // } else {
    //     await placeStore.modifyAlarmCancelGuide(params);
    // }

    // await placeStore.getAlarmInfo();
};

// 모달 열기 함수
const openGuideModal = async(type, index = null) => {
    const targetList = type === 'confirm' ? placeStore.guideList : placeStore.cancelGuideList;
    currentGuideType.value = type;

    if(index != null) {
        // 수정
        isEditMode.value = true;
        editIndex.value = index;
        guideInputText.value = targetList[index].words; // 기존 문구 세팅
        modalStore.bookingGuideTextModal.setTitle(type === 'confirm' ? '예약 확정 문구 수정' : '예약 취소 문구 수정');
    } else {
        // 등록
        if (targetList.length >= 10) return showAlert('최대 10개까지 등록 가능합니다.');
        isEditMode.value = false;
        editIndex.value = null;
        guideInputText.value = ''; // 초기화
        modalStore.bookingGuideTextModal.setTitle(type === 'confirm' ? '예약 확정 시 안내' : '예약 취소 시 안내');
    }

    modalStore.bookingGuideTextModal.openModal();

    await nextTick();
    if (textAreaRef.value) {
        const el = textAreaRef.value.$el.querySelector('textarea') || textAreaRef.value.$el;
        el.focus();
    }
};

// 등록 완료 함수 => 260206 JJB 저장 통합으로 합치면서 아래 저장 부분 주석처리
const handleGuideSubmit = async() => {
    if (!guideInputText.value.trim()) return showAlert('내용을 입력해주세요.');

    const textError = getFieldError(guideInputText.value, 0, 50);
    if (textError.isError) {
        showAlert(`입력하신 안내 문구를 확인해주세요.`);
        return false;
    }
    
    const targetList = currentGuideType.value === 'confirm' ? placeStore.guideList : placeStore.cancelGuideList;

    if (isEditMode.value && editIndex.value !== null) {
        // 수정일 경우 해당 인덱스의 문구만 교체
        targetList[editIndex.value].words = guideInputText.value;
    } else {
        // 신규일 경우 푸시
        targetList.push({
            words: guideInputText.value,
            isActive: false,
        });
    }

    // 서버로 보낼 때는 타입을 숫자로 변환 
    // const params = targetList.map(item => ({
    //     words: item.words,
    //     isActive: item.isActive ? 1 : 0 // true -> 1, false -> 0으로 치환
    // }));

    modalStore.bookingGuideTextModal.closeModal();

    // if(currentGuideType.value === 'confirm') {
    //     await placeStore.modifyAlarmGuide(params);
    // } else {
    //     await placeStore.modifyAlarmCancelGuide(params);
    // }

    // modalStore.bookingGuideTextModal.closeModal();
    // placeStore.getAlarmInfo();
};

// 문구 라디오버튼 선택 시 상태 변경 및 저장 => 260206 JJB 저장 통합으로 합치면서 아래 저장 부분 주석처리
const handleStatusChange = async(type, selectedIndex) => {
    const targetList = type === 'confirm' ? placeStore.guideList : placeStore.cancelGuideList;

    const params = targetList.map((item, index) => ({
        words: item.words,
        isActive: index === selectedIndex ? 1 : 0
    }));

    // if (type === 'confirm') {
    //     await placeStore.modifyAlarmGuide(params);
    // } else {
    //     await placeStore.modifyAlarmCancelGuide(params);
    // }

    // await placeStore.getAlarmInfo();
}

// 리마인드 알림 설정 변경 => 260206 JJB 저장 통합으로 합치면서 아래 저장 부분 주석처리
// const handleSetRemindType = async(value) => {
//     await placeStore.setRemindAlarm(value);
//     await placeStore.getAlarmInfo();
// }

const saveNotificationSetting = async(type, selectedIndex) => {
    const toMsgPayload = list =>
        list.map(({ words, isActive }) => ({
            words,
            isActive: Number(isActive) // true -> 1
        }));

    const params = {
        guideMsg: toMsgPayload(placeStore.guideList),
        cancelMsg: toMsgPayload(placeStore.cancelGuideList),
        remind: placeStore.remindType
    };

    const response = await placeStore.setNotificationSetting(params);

    if(response.status_code <= 300){
        showAlert('저장 되었습니다.');
    }

    // if (type === 'confirm') {
    //     await placeStore.modifyAlarmGuide(params);
    // } else {
    //     await placeStore.modifyAlarmCancelGuide(params);
    // }

    // await placeStore.getAlarmInfo();
}

onMounted(() => {
    placeStore.getAlarmInfo();
})
</script>

<template>
    <div class="contents-wrapper">
        <ul class="setting-list">
            <!-- 예약자 리마인드 알림 -->
            <li class="setting-item">
                <div class="setting-item__header">
                    <div class="setting-item__title-area">
                        <p class="title-m">예약자 리마인드 알림</p>
                        <span class="caption">예약자가 잊지 않고 방문할 수 있도록 방문 전에 리마인드 알림을 발송합니다.</span>
                    </div>
                </div>
    
                <div class="setting-item__content">
                    <div class="option-row">
                        <label class="radio">
                            <input 
                                type="radio" 
                                :value="0" 
                                v-model="placeStore.remindType" 
                            />
                            <span class="circle"></span>
                            <span class="label">당일 방문 시각 3시간 전 발송</span>
                        </label>
                    </div>
                    <div class="option-row">
                        <label class="radio">
                            <input 
                                type="radio" 
                                :value="1" 
                                v-model="placeStore.remindType" 
                            />
                            <span class="circle"></span>
                            <span class="label">방문 전일 오전 9시 발송</span>
                        </label>
                    </div>
                </div>
            </li>
    
            <!-- 예약자 안내 문구 설정 -->
            <li class="setting-item">
                <div class="setting-item__header">
                    <div class="setting-item__title-area">
                        <p class="title-m">예약자 안내 문구 설정</p>
                    </div>
                </div>
    
                <div class="setting-item__content">
                    <!-- 예약 확정 시 안내 문구 설정 -->
                    <div class="setting-item__guide-content">
                        <div class="d-flex gap-8">
                            <p class="title-s">예약 확정 시 안내</p>
                            <span class="caption">예약 확정시 예약자에게 추가로 안내할 내용을 최대 10개까지 미리등록 할 수 있습니다.<br/>등록한 안내 사항 중 1개를 기본으로 지정하여 확정 처리 시 자동 선택되도록 할 수 있습니다.</span>
                        </div>
    
                        <button class="btn btn--size-32 btn--black-outline add-guide-btn" 
                            @click="openGuideModal('confirm')" :disabled="placeStore.guideList.length >= 10">
                            <img :src="icPlus"> 안내 문구 추가({{ placeStore.guideList.length }}/10)
                        </button>
    
                        <!-- 추가 문구 리스트 -->
                        <ul class="guide-list">
                            <li v-for="(guide, index) in placeStore.guideList" :key="index" class="guide-list__item">
                                <label class="radio">
                                    <input 
                                        type="radio" 
                                        :name="'confirm-radio-group'"
                                        :checked="guide.isActive" 
                                        @change="handleStatusChange('confirm', index)"
                                    />
                                    <span class="circle"></span>
                                    <span class="label">{{ guide.words }}</span>
                                </label>

                                <div class="d-flex align-center gap-4">
                                    <button class="btn btn--size-24 btn--black-outline" @click="openGuideModal('confirm', index)">
                                        수정
                                    </button>
                                    <button class="delete-btn" @click="handelRemoveGuide('confirm', index)">
                                        <img :src="icClose" alt="삭제">
                                    </button>
                                </div>
                            </li>
                        </ul>
    
                    </div>
    
                    <!-- 예약 취소 시 안내 문구 설정 -->
                    <div class="setting-item__guide-content">
                        <div class="d-flex gap-8">
                            <p class="title-s">예약 취소 시 안내</p>
                            <span class="caption">예약 확정시 예약자에게 추가로 안내할 내용을 최대 10개까지 미리등록 할 수 있습니다.<br/>등록한 안내 사항 중 1개를 기본으로 지정하여 확정 처리 시 자동 선택되도록 할 수 있습니다.</span>
                        </div>
    
                        <button class="btn btn--size-32 btn--black-outline add-guide-btn" 
                            @click="openGuideModal('cancel')" :disabled="placeStore.cancelGuideList.length >= 10">
                            <img :src="icPlus"> 안내 문구 추가({{ placeStore.cancelGuideList.length }}/10)
                        </button>
    
                        <!-- 추가 문구 리스트 -->
                        <ul class="guide-list">
                            <li v-for="(guide, index) in placeStore.cancelGuideList" :key="index" class="guide-list__item">
                                <label class="radio">
                                    <input 
                                        type="radio" 
                                        :name="'cancel-radio-group'"
                                        :checked="guide.isActive"
                                        @change="handleStatusChange('cancel', index)"
                                    />
                                    <span class="circle"></span>
                                    <span class="label">{{ guide.words }}</span>
                                </label>

                                <div class="d-flex align-center gap-4">
                                    <button class="btn btn--size-24 btn--black-outline" @click="openGuideModal('cancel', index)">
                                        수정
                                    </button>
                                    <button class="delete-btn" @click="handelRemoveGuide('cancel', index)">
                                        <img :src="icClose" alt="삭제" />
                                    </button>
                                </div>
                            </li>
                        </ul>
    
                    </div>
                </div>
            </li>
        </ul>

        <div class="button-wrapper">
            <button class="btn btn--size-40 btn--blue" @click="saveNotificationSetting()">저장</button>
        </div>
    </div>

    <!-- 예약 확정시 안내 문구 추가 모달 -->
    <Modal
        v-if="modalStore.bookingGuideTextModal.isVisible"
        :title="modalStore.bookingGuideTextModal.title"
        size="xs"
        :modal-state="modalStore.bookingGuideTextModal"
    >
        <div class="modal-contents-inner">
            <p class="modal-contents-body mt-0">안내 문구를 입력하거나 수정할 수 있습니다.</p>
            <TextAreaBox ref="textAreaRef" 
                :max-length="500" 
                v-model="guideInputText"
                :is-error="getFieldError(guideInputText, 0, 500).isError"
                :error-message="getFieldError(guideInputText, 0, 500).message"
            />
        </div>

        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue" @click="handleGuideSubmit">완료</button>
            </div>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
    .setting-list {
        width: 50%;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .setting-item {
        padding: 8px 16px;
        border: 1px solid $gray-200;
        border-radius: 4px;

        &__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        &__title-area {
            display: flex;
            align-items: center;
            gap: 8px;

            .caption {color: $gray-700;}
        }

        &__content {
            color: $gray-700;

            .status-box {
                display: flex;
                align-items: center;
                gap: 12px;
                color: $gray-700;
            }

            .option-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;

                color: $gray-700;

                &:last-child {margin-bottom: 0;}
            }

            .caption {color: $gray-500;}
        }

        &__caption {
            color: $gray-500;
            display: block;
        }
    }

    .add-guide-btn {
        width: 100%;
        margin-top: 8px;

    }

    .setting-item__guide-content {
        padding: 8px 0;
        border-bottom: 1px solid $gray-200;
        
        color: $gray-700;

        &:last-child {border-bottom: 0;}
    }

    .guide-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;

        &__item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px;

            border-radius: 4px;
            background-color: $gray-50;

            .label {
                white-space: pre-line;
                word-break: break-all;
                line-height: 1.4;
            }
        }
    }

    .button-wrapper {
        display: flex;
        width: 50%;

        .btn {flex:1;}
    }
</style>