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
import { usePlaceStore } from '@/stores/placeStore';

import { ref, reactive, watch, onMounted, computed, nextTick } from 'vue';
import draggable from 'vuedraggable'; 
import { showAlert } from '@/utils/ui';

const modalStore = useModalStore();
const placeStore = usePlaceStore();

/**
 * 상태관리
 */
const isReorderMode = ref(false); // 순서 변경 모드 여부
const optionInputs = ref([]); // 질문 추가 > 옵션 추가시 옵션 인풋박스 포커싱을 위한 요소 배열

// 순서 변경 모드 토글
const toggleReorderMode = async () => {
    if (isReorderMode.value) {
        // '순서 변경 완료'를 눌렀을 때 실행될 로직
        await saveReorderedList();
    }
    isReorderMode.value = !isReorderMode.value;
};

// 순서 변경 저장 API 호출
const saveReorderedList = async () => {
    // 현재 리스트의 인덱스를 기반으로 questionOrder 재할당
    const reorderedList = questions.value.map((q, idx) => ({
        questionIdx: q.questionIdx,
        questionName: q.questionTitle,
        order: idx + 1
    }));

    // console.log(reorderedList);
    // return false;
    await placeStore.modifyQuestionOrder(reorderedList);
    
    showAlert('순서가 변경되었습니다.');
    // 데이터 새로고침
    await placeStore.getQuestionList();
};

// 질문 리스트
const questions = computed({
    get: () => placeStore.questionList,
    set: (val) => { placeStore.questionList = val }
});
// 기타요청사항 받는지 여부 기본값 0 (아니요)
const requestMessageUsed = computed({
    get: () => placeStore.isRequestMessageUsed,
    set: (val) => { placeStore.isRequestMessageUsed = val }
})

// 모달 내 입력 폼 상태
const newQuestion = reactive({
    title: '',
    type: 'SELECT', // 1.단수선택형("SELECT"), 2.복수선택형("CHECKBOX"), 3.직접입력형("TEXTAREA")
    options: [
        { optionIdx: null, optionName: '', optionOrder: 1 } // 기본 구조
    ],
    isRequired: 0,
    defaultFlag: false,
});

// 질문 추가 모달 열기 (10개 제한)
const handleAddQuestion = () => {
    if (questions.value.length >= 10) {
        showAlert('질문은 최대 10개까지만 등록 가능합니다.');
        return;
    }
    
    // 폼 초기화
    newQuestion.title = '';
    newQuestion.type = 'SELECT';
    newQuestion.options = [
        { optionIdx: null, optionName: '', optionOrder: 1 } // 기본 구조
    ];
    newQuestion.isRequired = 0;
    newQuestion.questionOrder = questions.value.length + 1;
    
    modalStore.addRequestModal.openModal();
};

// 답변 항목 추가/삭제
const addOption = async() => {
    // 옵션 10개까지만 추가 가능
    if(newQuestion.options.length >= 10) {
        showAlert('답변 항목은 최대 10개까지만 등록 가능합니다.');
        return;
    }
    // 항목추가
    newQuestion.options.push({
        optionIdx: null, 
        optionName: '', 
        optionOrder: newQuestion.options.length + 1
    })

    // 옵션 추가시, 해당 옵션 인풋박스 포커싱 처리
    await nextTick();

    const lastIndex = newQuestion.options.length - 1;
    const targetComponent = optionInputs.value[lastIndex];

    if (targetComponent) {
        // InputTextBox 컴포넌트($el) 내부에서 실제 input 태그를 찾아 포커스
        const inputEl = targetComponent.$el.querySelector('input');
        inputEl?.focus();
    }
}
// 옵션 삭제
const removeOption = (index) => newQuestion.options.splice(index, 1);

// 답변 방식(type)이 변경될 때마다 초기화(필요없으면 삭제)
watch(() => newQuestion.type, (newType) => {
    if (newType === 'text') {
        // 직접입력형일 경우 항목 자체가 필요 없으므로 빈 배열로 초기화
        newQuestion.options = [];
    } else {
        // 단수/복수 선택형일 경우 사용자가 입력할 수 있도록 기본 입력칸 1개 생성
        newQuestion.options = [
            { optionIdx: null, optionName: '', optionOrder: 1 } // 기본 구조
        ]
    }

});

// 질문 추가(단건) 저장 로직
const saveQuestion = async() => {
    if (!newQuestion.title) return showAlert('질문을 입력하세요.');

    if (newQuestion.type !== 'TEXTAREA' && newQuestion.options.some(opt => {
        const val = typeof opt === 'object' ? opt.optionName : opt;
        return !val || !val.trim(); 
    })) {
        return showAlert('답변 항목을 모두 입력해주세요.');
    }

    const params = {
        questionIdx: newQuestion.questionIdx || null, // 신규 생성은 idx:null로 고정
        questionTitle: newQuestion.title,
        questionType: newQuestion.type,
        // 신규일 때만 마지막 순서로 배치, 수정일 때는 기존 순서 유지
        questionOrder: newQuestion.questionOrder,
        questionRequiredFlag: newQuestion.isRequired ? 1 : 0,
        options: newQuestion.type === 'TEXTAREA' ? null : newQuestion.options.map((opt, idx) => {
            return {
                optionIdx: opt.optionIdx || null,
                optionName: opt.optionName,
                optionOrder: idx + 1
            };
        })
    }

    // console.log(params)
    // return false;

    if (params.questionIdx) {
        // 수정 API 호출
        await placeStore.modifyQuestion(params); 
    } else {
        // 신규 추가 API 호출
        await placeStore.addQuestion(params);
    }
    
    modalStore.addRequestModal.closeModal();
    showAlert('저장 되었습니다.')
    // 데이터 새로고침
    await placeStore.getQuestionList();
};

// 질문 수정 모달 열기 
const handleEditQuestion = (question) => {
    //  질문 데이터를 넘김
    modalStore.addRequestModal.openModal(question);
};

// 질문 수정 모달 데이터 감시
watch(() => modalStore.addRequestModal.data, (newData) => {
    if (newData) {
        // 수정 모드: 전달받은 데이터로 폼 채우기
        newQuestion.questionIdx = newData.questionIdx; // 수정 시 필요
        newQuestion.title = newData.questionTitle;
        newQuestion.type = newData.questionType;
        newQuestion.isRequired = newData.questionRequiredFlag;
        newQuestion.questionOrder = newData.questionOrder;
        
        // 옵션 데이터 복사 (TEXTAREA가 아닐 경우)
        if (newData.options) {
            newQuestion.options = newData.options.map(opt => opt.optionName);
        } else {
            newQuestion.options = [
                { optionIdx: null, optionName: '', optionOrder: 1 } // 기본 구조
            ]
        }
    } else {
        // 신규 등록 모드: 초기화 (handleAddQuestion에서도 처리하지만 안전하게 한 번 더)
        newQuestion.questionIdx = null;
        newQuestion.title = '';
        newQuestion.type = 'SELECT';
        newQuestion.options = [
            { optionIdx: null, optionName: '', optionOrder: 1 } // 기본 구조
        ];
        newQuestion.isRequired = 0;
        newQuestion.questionOrder = questions.value.length + 1;
    }
}, { deep: true });

// 전체저장
const saveAllData = async() => {
    if(isReorderMode.value) {
        showAlert('순서 변경을 완료 후 저장해 주세요.');
        return;
    }
    const params = {
        isRequestMessageUsed: requestMessageUsed.value, // '네/아니오' 라디오 버튼 값 (Computed getter 이용)
        questionList: questions.value, // 현재 화면에 표시된 질문 리스트 전체 (순서가 포함된 최신 상태)
    }

    // console.log(params);
    // return false;
    await placeStore.setQuestion(params);

    showAlert('저장 되었습니다.')
    // 데이터 새로고침
    await placeStore.getQuestionList();
}

// 답변 방식 옵션 (CustomSingleSelect용)
const answerTypes = [
    { value: 'SELECT', label: '단수선택형' },
    { value: 'CHECKBOX', label: '복수선택형' },
    { value: 'TEXTAREA', label: '직접입력형' }
];

onMounted(() => {
    placeStore.getQuestionList();
})
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
                            <button 
                                class="btn btn--size-32" 
                                :class="isReorderMode ? 'btn--blue' : 'btn--black-outline'"
                                @click="toggleReorderMode"
                            >
                                {{ isReorderMode ? '순서 변경 완료' : '순서 변경' }}
                            </button>
                        </div>
                    </div>
        
                    <div class="setting-item__content">
                        <draggable
                            v-model="questions"
                            item-key="questionIdx"
                            handle=".drag-handle"
                            :disabled="!isReorderMode"
                            tag="ul"
                            class="guide-list"
                            :force-fallback="true" 
                            :scroll="true"
                            :scroll-sensitivity="100"
                            :animation="200"
                            ghost-class="sortable-ghost"
                            drag-class="drag-item-moving" 
                        >
                            <template #item="{element: q, index}">
                                <li 
                                    class="guide-item" 
                                    :class="{ required: q.questionRequiredFlag == 1, 'reorder-active': isReorderMode }"
                                >
                                    <div class="d-flex align-center gap-8">
                                        <div v-if="isReorderMode" class="drag-handle" style="cursor: grab;">
                                            <img :src="icDragHandel" alt="드래그핸들">
                                        </div>
                                        <div>
                                            <p class="label title-m">{{ q.questionTitle }}</p>
                                            <span v-if="q.questionRequiredFlag == 1" class="body-xs">필수</span>
                                        </div>
                                    </div>
                                    
                                    <!-- 기본 정보요청는 수정/삭제 못함 -->
                                    <div v-if="!isReorderMode && q.questionDefaultFlag !== 1" class="d-flex gap-4 align-center" >
                                        <button 
                                            class="btn btn--size-24 btn--black-outline"
                                            @click="handleEditQuestion(q)"
                                        >
                                            수정
                                        </button>
                                        <div class="btn-del" @click="questions.splice(index, 1)">
                                            <img :src="icClose" alt="삭제아이콘">
                                        </div>
                                    </div>
                                </li>
                            </template>
                        </draggable>                                                             
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
                                <input 
                                    type="radio" 
                                    name="requestMessage" 
                                    :value="1"
                                    v-model="requestMessageUsed"
                                />
                                <span class="circle"></span>
                                <span class="label">네. 요청사항 입력란을 노출할게요.</span>
                                <span class="caption">예약자가 사업주에게 개별적으로 전달하고 싶은 내용을 입력할 수 있습니다.</span>
                            </label>
                        </div>
        
                        <div class="option-row">
                            <label class="radio">
                                <input 
                                    type="radio" 
                                    name="requestMessage"
                                    :value="0"
                                    v-model="requestMessageUsed"
                                />
                                <span class="circle"></span>
                                <span class="label">아니요.</span>
                            </label>
                        </div>
        
                    </div>
                </li>
            </ul>
        </div>

        <div class="buttons-wrapper">
            <button class="btn btn--size-40 btn--blue" @click="saveAllData">저장</button>
        </div>
    </div>

    <!-- 질문 추가 모달창 -->
    <Modal
        v-if="modalStore.addRequestModal.isVisible"
        size="xs"
        title="질문 추가하기"
        :modal-state="modalStore.addRequestModal"
    >
        <div class="modal-contents-inner add-question-modal">
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
                <div v-if="newQuestion.type !== 'TEXTAREA'" class="d-flex flex-col gap-8">
                    <p class="modal-contents-subTitle">
                        예약자가 선택할 수 있는 항목을 입력하세요.
                        <span class="required">*</span>
                    </p>
                    <button 
                        class="btn btn--size-32 btn--black-outline"
                        @click="addOption"
                    >
                        항목 추가
                    </button>

                    <draggable
                        v-model="newQuestion.options"
                        item-key="optionOrder"
                        handel=".option-drag-handel"
                        :animation="200"
                        tag="div"
                        class="d-flex flex-col gap-8"
                    >
                        <template #item="{ element: opt, index}">
                            <div class="d-flex gap-4">
                                <button
                                    v-if=" newQuestion.options.length > 1"
                                    class="btn btn--size-32 btn--black-outline drag-handel"
                                    style="cursor:grab;"
                                >
                                    <img :src="icDragHandel" alt="드래그핸들">
                                </button>
                                <InputTextBox 
                                    v-model="opt.optionName" 
                                    :max-length="30"
                                    placeholder="답변 항목을 입력해 주세요."
                                    :ref="el => { if (el) optionInputs[index] = el }"
                                />
                                <button 
                                    v-if=" newQuestion.options.length > 1"
                                    class="btn btn--size-32 btn--black-outline" 
                                    @click="removeOption(index)"
                                >
                                    <img :src="icDel" alt="삭제 아이콘">
                                </button>
                            </div>
                        </template>
                    </draggable>

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

    /* 드래그 중인 아이템 스타일 */
    .sortable-ghost {
        opacity: 0.5;
        background: $primary-50 !important;
        border: 1px dashed $primary-500 !important;
    }
    /* 실제로 마우스에 붙어 움직이는 요소 */
    .drag-item-moving {
        opacity: 1 !important; // 투명도 방지
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        border: 1px solid $primary-500 !important;
        z-index: 9999;
    }

    // 모달
    .add-question-modal {
        .required {color: $primary-700;}
    }
</style>