<!-- 카테고리 관리 -->
<script setup>
import { ref, watch, onMounted, onUnmounted, reactive } from 'vue';
// 컴포넌트
import InputTextBox from '@/components/common/InputTextBox.vue';
import CustomSelect from '@/components/common/CustomSelect.vue'
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import icDel from '@/assets/icons/ic_del.svg';
// 스토어
import { useModalStore } from '@/stores/modalStore';
import { useCategoryStore } from '@/stores/categoryStore'
//util
import { CATEGORY_TYPE_OPTIONS} from "@/utils/category";

const modalStore = useModalStore();
const categoryStore = useCategoryStore();

/**
 * 화면 모드 상태 관리
 * LIST: 카테고리 관리 목록
 * REGISTER: 새 카테고리 등록 폼
 */
const mode = ref('LIST');

const categoryRegisterData = reactive({ name: '', type: '' })

// 모드 변경 감시 -> 스토어 타이틀 업데이트
watch(mode, (newMode) => {
    if (newMode === 'LIST') {
        modalStore.categorySettingModal.setTitle('카테고리 관리');

        //모달창 구성될 때 카테고리 조회
        categoryStore.getCategoryList();
    } else {
        modalStore.categorySettingModal.setTitle('카테고리 등록');
    }
}, { immediate: true });

// 컴포넌트가 꺼질 때 타이틀을 기본값으로 복구
onUnmounted(() => {
    modalStore.categorySettingModal.setTitle('카테고리 관리');
});

/**
 * 핸들러 함수
 */
const goRegister = () => { mode.value = 'REGISTER'; };
const goList = () => { mode.value = 'LIST'; };
const handleApply = async() => {
    let category_list = categoryStore.categoryList;
    let params = [];

    // 빈 값이 있거나 10자를 초과하는 항목이 하나라도 있는지 확인
    const hasError = category_list.some(item => 
        !item.name || item.name.trim().length === 0 || item.name.length > 10
    );

    if (hasError) {
        modalStore.confirmModal.openModal({
            text: '입력하신 카테고리 명을 확인해주세요.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: (() => {modalStore.confirmModal.closeModal()})
        })
        return;
    }

    category_list.forEach(item => {
        params.push({
                "name": item.name,
                "selectionTypeCode": item.selection_type_code, //NUMBER, CHECK
                "categoryId": item.categoryId,
                "useFlag": item.use_flag, //1:수정일 시, 0:삭제일 시
                "idx": item.idx,
                "order": item.order
        })
    })

    params = JSON.stringify(params);
    let response = await categoryStore.modifyCategory(params);

    if(response.status_code <= 300){
        modalStore.categorySettingModal.closeModal();
    }
};
const handleSave = async() => {
    // 1. 유효성 검사
    const name = categoryRegisterData.name;
    const type = categoryRegisterData.type;

    const confirmMsg = ref(
        !name || name.trim().length === 0 ? '카테고리명을 입력해 주세요.' : '카테고리명을 확인해 주세요.'
    );
    
    if (!name || name.trim().length === 0 || name.length > 10) {
        modalStore.confirmModal.openModal({
            text: confirmMsg,
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: (() => {modalStore.confirmModal.closeModal()})
        })
        return;
    }

    if (!type) {
        modalStore.confirmModal.openModal({
            text: '유형을 선택해주세요.',
            confirmBtnText: '확인',
            noCancelBtn: true,
            onConfirm: (() => {modalStore.confirmModal.closeModal()})
        })
        return;
    }

    let params = {
        "name": categoryRegisterData.name,
        "selectionTypeCode": categoryRegisterData.type, //NUMBER, CHECK
    }
    
    let response = await categoryStore.addCategory(params);

    // 성공 시 다시 리스트 모드로 이동
    if(response.status_code <= 300){
        categoryRegisterData.name = ''; // 데이터 초기화
        categoryRegisterData.type = '';
        goList();
    }
};

const deleteCategoryData = ref({});//삭제 아이콘 클릭 시 해당 데이터 저장

const openConfirmDeleteModal = (category) => {
    deleteCategoryData.value = category;
    modalStore.confirmModal.openModal({ // confirmModal에 데이터 전달
        title: '카테고리 삭제',
        text: `[${category.name}] 카테고리를 삭제하시겠습니까?\n삭제할 경우 해당 카테고리에 포함된\n모든 옵션이 삭제되며 복원되지 않습니다.`,
        subText: '해당카테고리의 옵션을 계속 사용 하시려면\n삭제 전 옵션을 다른 카테고리로 이동해주세요.',
        confirmBtnText: '삭제',
        onConfirm: () => {
            handleDelete();
        }
    })

}

const handleDelete = async() => {
    // modalStore.confirmModal.closeModal()

    let categoryInfo = deleteCategoryData.value;

    let params = {
        "categoryId": categoryInfo.categoryId,
        "idx": categoryInfo.idx
    }

    let response = await categoryStore.deleteCategory(params);

    // 삭제 성공 시 다시 리스트 모드로 이동
    if(response.status_code <= 300){
        await categoryStore.getCategoryList();
        goList();
    }
}

/**
 * 고정 카테고리인지 확인
 * @param {Object} category - 카테고리 객체
 * @param {String} type - 'name' (카테고리명/삭제) 또는 'type' (유형)
 * @returns {Boolean}
 * 
 * requiredType == 0 : 카테고리 미지정 (카테고리명/삭제만 고정, 유형 변경 가능)
 * requiredType == 1 : 예약 필수 메뉴 (모두 고정, 유형은 체크형으로 고정)
 * requiredType == 2 : 사용자 생성 (모두 수정 가능)
 */
const isFixedCategory = (category, type = 'name') => {
    if (type === 'type') {
        // 유형 변경 불가: 예약 필수 메뉴만 (requiredType === 1)
        return category.requiredType === 1;
    } else {
        // 카테고리명/삭제 불가: 카테고리 미지정, 예약 필수 메뉴 (requiredType < 2)
        return category.requiredType < 2;
    }
};
</script>

<template>
    <!-- 카테고리 관리 -->
    <template v-if="mode == 'LIST'">
        <div class="modal-contents-inner">
            <div class="category-manager">
                <div class="category-manager__header">
                    <p class="body-m">카테고리를 추가하거나 기존 카테고리 설정을 변경할 수 있습니다.</p>
                    <button class="btn btn--size-32 btn--black" @click="goRegister">카테고리 등록</button>
                </div>
        
                <div class="category-manager__list">
                    <div v-for="category in categoryStore.categoryList" class="category-item">
                        <div class="category-item__title">
                            <p class="title-m">{{category.name}}</p>
        
                            <!-- 삭제버튼 -->
                            <button v-if="!isFixedCategory(category)" class="btn btn--size-24 btn--black-outline" @click="openConfirmDeleteModal(category)">
                                <img :src="icDel" alt="삭제" width="14">
                                <span>삭제</span>
                            </button>
                        </div>
        
                        <div class="category-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label">카테고리명</p>
                                <div class="setting-row__content">
                                    <InputTextBox
                                        v-model="category.name"
                                        :max-length="10"
                                        :is-error="!category.name || category.name.length > 10"
                                        :error-message="!category.name ? '카테고리명을 입력해주세요.' : '10자까지만 입력 가능합니다.'"
                                        :disabled="isFixedCategory(category)"
                                    />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">유형</p>
                                <div class="setting-row__content">
                                    <CustomSingleSelect
                                        v-model="category.selectionTypeCode"
                                        :options="CATEGORY_TYPE_OPTIONS"
                                        class="select"
                                        :disabled="isFixedCategory(category, 'type')"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- 버튼 -->
        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue-outline" @click="modalStore.categorySettingModal.closeModal()">취소</button>
                <button class="btn btn--size-32 btn--blue" @click="handleApply">적용</button>
            </div>
        </div>
    </template>

    <!-- 카테고리 등록 -->
    <template v-else>
        <div class="modal-contents-inner">
            <div class="category-manager">
                <div class="category-manager__register-form">
                    <div class="category-item__settings">
                        <div class="setting-row">
                            <p class="title-s setting-row__label">카테고리명</p>
                            <div class="setting-row__content">
                                <InputTextBox 
                                    v-model="categoryRegisterData.name" 
                                    placeholder="카테고리명을 입력해주세요."
                                    :max-length="10" 
                                    :is-error="categoryRegisterData.name.length > 10"
                                    :error-message="'10자까지만 입력 가능합니다.'"
                                />
                            </div>
                        </div>
                        <div class="setting-row">
                            <p class="title-s setting-row__label">유형</p>
                            <div class="setting-row__content">
                                <CustomSingleSelect 
                                    v-model="categoryRegisterData.type"
                                    :options="CATEGORY_TYPE_OPTIONS"
                                    class="select" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 버튼 -->
        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue-outline" @click="goList">이전으로</button>
                <button class="btn btn--size-32 btn--blue" @click="handleSave">등록</button>
            </div>
        </div>
    </template>
</template>

<style lang="scss" scoped>
.modal-contents-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
    padding: 20px; // 기본 24px에서 각 4px씩 줄임
}

.category-manager {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    // 상단 영역
    &__header {
        display: flex;
        gap: 16px;
        word-break: keep-all;
        padding-bottom: 16px;
        border-bottom: 1px solid $gray-200;
        flex-shrink: 0; // 고정
        padding-right: 4px; // 스크롤바 공간 확보
        
        p { flex: 1; }
    }

    // 리스트 컨테이너
    &__list {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        // padding-top: 16px;
        padding-right: 4px;
        
        // 스크롤바 스타일 조정 (더 얇게)
        scrollbar-width: thin; // Firefox
        scrollbar-gutter: stable; // 스크롤바 공간 확보
        
        &::-webkit-scrollbar {
            width: 1px; // Chrome, Safari
        }
        
        &::-webkit-scrollbar-track {
            background: transparent;
        }
        
        &::-webkit-scrollbar-thumb {
            background-color: $gray-300;
            border-radius: 3px;
            
            &:hover {
                background-color: $gray-400;
            }
        }
    }
}

.category-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid $gray-200;

    &__title {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__settings {
        display: flex;
        flex-direction: column;
        gap: 6px;
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
    }

    &__content {
        flex: 1;
        width: 100%;

        // :deep(.caption) {
        //     width: 100%;
        //     text-align: right;
        // }
    }
}

// 셀렉트 박스 너비 확장
.select {
    width: 100%;
}
</style>