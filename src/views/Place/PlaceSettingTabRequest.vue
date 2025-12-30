<!-- 플레이스 설정 > 예약자 정보 요청 탭 -->
<script setup>
// 아이콘
import icClose from '@/assets/icons/ic_btn_close_b.svg'
import icPlus from '@/assets/icons/ic_plus_black.svg'
import icDel from '@/assets/icons/ic_del.svg'
import icDragHandel from '@/assets/icons/ic_drag_handel.svg'
// 컴포넌트
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import InputTextBox from '@/components/common/InputTextBox.vue';
import Modal from '@/components/common/Modal.vue';
// 스토어
import { useModalStore } from '@/stores/modalStore';

import { ref, reactive, watch } from 'vue';

const modalStore = useModalStore();

// 질문 리스트 데이터 (예시)
const questions = ref([
    { id: 1, title: '동물 이름을 입력해 주세요.', isRequired: true, type: 'text', options: [] },
    { id: 2, title: '병원에서 추가하는 질문', isRequired: true, type: 'single', options: ['항목1'] }
]);

// 모달 내 입력 폼 상태
const newQuestion = reactive({
    title: '',
    type: 'single', // 1.단수선택형(single), 2.복수선택형(multiple), 3.직접입력형(text)
    options: [''],
    isRequired: false
});

// 질문 추가 모달 열기 (10개 제한)
const handleAddQuestion = () => {
    if (questions.value.length >= 10) {
        alert('질문은 최대 10개까지만 등록 가능합니다.');
        return;
    }
    
    // 폼 초기화
    newQuestion.title = '';
    newQuestion.type = 'single';
    newQuestion.options = [''];
    newQuestion.isRequired = false;
    
    modalStore.addRequestModal.openModal();
};

// 답변 항목 추가/삭제
const addOption = () => newQuestion.options.push('');
const removeOption = (index) => newQuestion.options.splice(index, 1);

// 답변 방식(type)이 변경될 때마다 초기화(필요없으면 삭제)
watch(() => newQuestion.type, (newType) => {
    if (newType === 'text') {
        // 직접입력형일 경우 항목 자체가 필요 없으므로 빈 배열로 초기화
        newQuestion.options = [];
    } else {
        // 단수/복수 선택형일 경우 사용자가 입력할 수 있도록 기본 입력칸 1개 생성
        newQuestion.options = [''];
    }

    });

// 저장 로직
const saveQuestion = () => {
    if (!newQuestion.title) return alert('질문을 입력하세요.');
    
    questions.value.push({
        id: Date.now(),
        ...JSON.parse(JSON.stringify(newQuestion)) // 깊은 복사
    });
    
    modalStore.addRequestModal.closeModal();
};

// 답변 방식 옵션 (CustomSingleSelect용)
const answerTypes = [
    { value: 'single', label: '단수선택형' },
    { value: 'multiple', label: '복수선택형' },
    { value: 'text', label: '직접입력형' }
];

// TODO: 순서변경
// TODO: 미리보기
</script>

<template>
    <div class="contents-wrapper">
        <div style="flex: 1; min-height: 0; overflow-y: auto;">
            <div class="info-box">
                <p class="body-xs">
                    픽업 여부, 도착 시간 등 사전에 예약자에게 요청할 정보가 있다면 미리 등록해 두세요.
                    <br/>
                    차량번호, 생일, 성별, 나이 등 <span class="strong">개인 정보를 입력받는 행위는 제한</span>되며 개인 정보 수집으로 인한 책임은 예약 서비스를 제공하는 사업자에게 존재합니다.
                </p>
            </div>
        
            <ul class="setting-list">
                <li class="setting-item">
                    <div class="setting-item__header">
                        <div class="setting-item__title-area">
                            <p class="title-m">예약자에게 요청할 정보가 있나요?</p>
                            <span class="caption">기본 요청 정보는 수정 및 삭제가 불가합니다.</span>
                        </div>
        
                        <div class="buttons">
                            <button class="btn btn--size-32 btn--black-outline" @click="handleAddQuestion">
                                <img :src="icPlus" alt="">질문 추가 ({{ questions.length }}/10)
                            </button>
                            <button class="btn btn--size-32 btn--black-outline">순서 변경</button>
                        </div>
                    </div>
        
                    <div class="setting-item__content">
                        <ul class="guide-list">
                            <li 
                                v-for="(q, idx) in questions" 
                                :key="q.id" 
                                class="guide-item" 
                                :class="{ required: q.isRequired }"
                            >
                                <div>
                                    <p class="label title-m">{{ q.title }}</p>
                                    <span v-if="q.isRequired" class="body-xs">필수</span>
                                </div>
                                <!-- TODO: 기본요청 정보만 삭제 불가능하도록 수정해야함 -->
                                <div v-if="idx > 0" class="btn-del" @click="questions.splice(idx, 1)">
                                    <img :src="icClose" alt="">
                                </div>
                            </li>
                        </ul>
                    </div>
                </li>
        
                <li class="setting-item">
                    <div class="setting-item__header">
                        <div class="setting-item__tile-area">
                            <p class="title-m">예약자로부터 기타 요청사항을 받으시겠어요?</p>
                        </div>
                    </div>
        
                    <div class="setting-item__content">
                        <div class="option-row">
                            <label class="radio">
                                <input type="radio" />
                                <span class="circle"></span>
                                <span class="label">네. 요청사항 입력란을 노출할게요.</span>
                                <span class="caption">예약자가 사업주에게 개별적으로 전달하고 싶은 내용을 입력할 수 있습니다.</span>
                            </label>
                        </div>
        
                        <div class="option-row">
                            <label class="radio">
                                <input type="radio"/>
                                <span class="circle"></span>
                                <span class="label">아니요.</span>
                            </label>
                        </div>
        
                    </div>
                </li>
            </ul>
        </div>

        <div class="buttons-wrapper">
            <button class="btn btn--size-40 btn--blue">저장</button>
        </div>
    </div>

    <!-- 질문 추가 모달창 -->
    <Modal
        v-if="modalStore.addRequestModal.isVisible"
        size="xs"
        title="질문 추가하기"
        :modal-state="modalStore.addRequestModal"
    >
        <div class="modal-contents-inner">
            <div class="d-flex flex-col gap-16">
                <div class="d-flex flex-col gap-8">
                    <p class="modal-contents-subTitle">
                        예약자에게 요청할 질문을 입력하세요.
                        <span class="required">*</span>
                    </p>
                    <InputTextBox v-model="newQuestion.title" :max-length="50" placeholder="질문을 입력해 주세요." />
                </div>
                <div class="d-flex flex-col gap-8">
                    <p class="modal-contents-subTitle">답변 방식을 선택하세요.</p>
                    <CustomSingleSelect
                        v-model="newQuestion.type" 
                        :options="answerTypes"
                    />
                </div>
                <div v-if="newQuestion.type !== 'text'" class="d-flex flex-col gap-8">
                    <p class="modal-contents-subTitle">
                        예약자가 선택할 수 있는 항목을 입력하세요.
                        <span class="required">*</span>
                    </p>
                    <button class="btn btn--size-32 btn--black-outline" @click="addOption">항목 추가</button>
                    <div v-for="(opt, index) in newQuestion.options" :key="index" class="d-flex gap-4">
                        <button class="btn btn--size-32 btn--black-outline drag-handel">
                            <img :src="icDragHandel" alt="드래그핸들">
                        </button>
                        <InputTextBox v-model="newQuestion.options[index]" :max-length="30" />
                        <button class="btn btn--size-32 btn--black-outline" @click="removeOption(index)">
                            <img :src="icDel" alt="삭제 아이콘">
                        </button>
                    </div>
                </div>
                <div>
                    <label class="checkbox">
                        <input type="checkbox" v-model="newQuestion.isRequired" />
                        <span class="box"></span>
                        <span class="label">필수 답변 여부</span>
                    </label>
                </div>
            </div>
        </div>
        
        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue-outline" @click="modalStore.addRequestModal.closeModal()">취소</button>
                <button class="btn btn--size-32 btn--blue" @click="saveQuestion">저장</button>
            </div>
        </div>
    </Modal>

    <!-- 순서 변경 모달창 -->
</template>

<style lang="scss" scoped>
    .info-box {
        width: 50%;
        padding: 15px;
        margin-bottom: 8px;

        border-radius: 5px;
        background-color: $primary-50;
        color: $gray-700;

        .strong {color: $primary-700; }
    }
    .setting-list {
        width: 50%;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .setting-item {
        display: flex;
        flex-direction: column;
        gap: 8px;

        padding: 8px 16px;
        border: 1px solid $gray-200;
        border-radius: 4px;

        &__header {
            display: flex;
            flex-direction: column;
            gap: 8px;
            
            .buttons {
                display: flex;
                gap: 8px;

                button:nth-child(1) {flex: 1;}
            }
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

    .guide-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .guide-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;

        border-radius: 4px;
        border: 1px solid $gray-200;
        background-color: $gray-00;

        &.required {background-color: $gray-50;}

        .label {color: $gray-900;}
    }

    .btn-del {
        cursor: pointer;
    }

    .buttons-wrapper {
        width: 50%;
        display: flex;
        margin-top: 16px;

        button {flex: 1;}
    }
</style>