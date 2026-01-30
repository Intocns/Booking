<!-- 플레이스 설정 > 알림설정탭 -->
<script setup>
// 컴포넌트
import Modal from '@/components/common/Modal.vue';
import TextAreaBox from '@/components/common/TextAreaBox.vue';
// 아이콘
import icPlus from '@/assets/icons/ic_plus_black.svg'
import icClose from '@/assets/icons/ic_btn_close_b.svg'

import { onMounted, ref } from 'vue';
// 스토어
import { useModalStore } from '@/stores/modalStore';
import { usePlaceStore } from '@/stores/placeStore';

import { showAlert } from '@/utils/ui';

const modalStore = useModalStore();
const placeStore = usePlaceStore();

//  리마인드 알림 설정 상태값
const remindType = ref('today'); // 'today' or 'yesterday'
const defaultConfirmIndex = ref(0);
const defaultCancelIndex = ref(0);
const confirmGuides = ref([
    { id: 1, text: '예약이 확정되었습니다. 감사합니다.' },
]);
const cancelGuides = ref([
    { id: 1, text: '재료 소진으로 인해 예약이 취소되었습니다.' },
]);
// 모달 제어 상태
const currentGuideType = ref(''); // 'confirm' 또는 'cancel'
const guideInputText = ref(''); // TextArea에 입력된 값


// 문구 삭제 함수
const removeGuide = (type, index) => {
    const targetList = type === 'confirm' ? confirmGuides : cancelGuides;
    targetList.value.splice(index, 1);
};

// 모달 열기 함수
const openGuideModal = (type) => {
    const targetList = type === 'confirm' ? confirmGuides : cancelGuides;
    if (targetList.value.length >= 10) return showAlert('최대 10개까지 등록 가능합니다.');
    
    currentGuideType.value = type;
    guideInputText.value = ''; // 초기화
    modalStore.bookingGuideTextModal.setTitle(type === 'confirm' ? '예약 확정 시 안내' : '예약 취소 시 안내');
    modalStore.bookingGuideTextModal.openModal()
};

// 등록 완료 함수
const handleGuideSubmit = () => {
    if (!guideInputText.value.trim()) return showAlert('내용을 입력해주세요.');
    
    const targetList = currentGuideType.value === 'confirm' ? confirmGuides : cancelGuides;
    targetList.value.push({ 
        id: Date.now(), 
        text: guideInputText.value 
    });
    
    modalStore.bookingGuideTextModal.closeModal()
};

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
                            <input type="radio" value="today" v-model="remindType"/>
                            <span class="circle"></span>
                            <span class="label">당일 방문 시각 3시간 전 발송</span>
                        </label>
                    </div>
                    <div class="option-row">
                        <label class="radio">
                            <input type="radio" value="yesterday" v-model="remindType"/>
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
                            @click="openGuideModal('confirm')" :disabled="confirmGuides.length >= 10">
                            <img :src="icPlus"> 안내 문구 추가({{ confirmGuides.length }}/10)
                        </button>
    
                        <!-- 추가 문구 리스트 -->
                        <ul class="guide-list">
                            <li v-for="(guide, index) in confirmGuides" :key="guide.id" class="guide-list__item">
                                <label class="radio">
                                    <input type="radio" :value="index" v-model="defaultConfirmIndex" />
                                    <span class="circle"></span>
                                    <span class="label">{{ guide.text }}</span>
                                </label>
                                <button class="delete-btn" @click="removeGuide('confirm', index)">
                                    <img :src="icClose" alt="삭제">
                                </button>
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
                            @click="openGuideModal('cancel')" :disabled="cancelGuides.length >= 10">
                            <img :src="icPlus"> 안내 문구 추가({{ cancelGuides.length }}/10)
                        </button>
    
                        <!-- 추가 문구 리스트 -->
                        <ul class="guide-list">
                            <li v-for="(guide, index) in cancelGuides" :key="guide.id" class="guide-list__item">
                                <label class="radio">
                                    <input type="radio" :value="index" v-model="defaultCancelIndex" />
                                    <span class="circle"></span>
                                    <span class="label">{{ guide.text }}</span>
                                </label>
                                <button class="delete-btn" @click="removeGuide('cancel', index)">
                                    <img :src="icClose" alt="삭제">
                                </button>
                            </li>
                        </ul>
    
                    </div>
                </div>
            </li>
        </ul>
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
            <TextAreaBox :max-length="500" v-model="guideInputText"/>
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
        }
    }
</style>