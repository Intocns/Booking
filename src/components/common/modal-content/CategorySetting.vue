<!-- 카테고리 관리 -->
<script setup>
import { ref, watch, onUnmounted } from 'vue';
// 컴포넌트
import InputTextBox from '@/components/common/InputTextBox.vue';
import CustomSelect from '@/components/common/CustomSelect.vue'
import icClear from '@/assets/icons/ic_clear.svg'
// 스토어
import { useModalStore } from '@/stores/modalStore';

const modalStore = useModalStore();

/**
 * 화면 모드 상태 관리
 * LIST: 카테고리 관리 목록
 * REGISTER: 새 카테고리 등록 폼
 */
const mode = ref('LIST');

// 모드 변경 감시 -> 스토어 타이틀 업데이트
watch(mode, (newMode) => {
    if (newMode === 'LIST') {
        modalStore.categorySettingModal.setTitle('카테고리 관리');
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
const handleApply = () => {
    // TODO: 적용 로직
    modalStore.categorySettingModal.closeModal();
};
const handleSave = () => {
    // TODO: 등록 로직
    // 성공 시 다시 리스트 모드로 이동
    goList();
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
        
                    <div class="category-item">
                        <div class="category-item__title">
                            <p class="title-m">카테고리 미지정</p>
                        </div>
        
                        <div class="category-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label">카테고리명</p>
                                <div class="setting-row__content">
                                    <InputTextBox :max-length="10" />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">유형</p>
                                <div class="setting-row__content">
                                    <CustomSelect class="select" />
                                </div>
                            </div>
                        </div>
                    </div>
        
                    <div class="category-item">
                        <div class="category-item__title">
                            <p class="title-m">예약 필수 메뉴</p>
                        </div>
        
                        <div class="category-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label">카테고리명</p>
                                <div class="setting-row__content">
                                    <InputTextBox :max-length="10" />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">유형</p>
                                <div class="setting-row__content">
                                    <CustomSelect class="select" />
                                </div>
                            </div>
                        </div>
                    </div>
        
                    <div class="category-item">
                        <div class="category-item__title">
                            <p class="title-m">방문수단 선택</p>
        
                            <!-- 삭제버튼 -->
                            <div class="delete-btn" @click="() => console.log('삭제 클릭')">
                                <img :src="icClear" alt="삭제" class="icon-img">
                            </div>
                        </div>
        
                        <div class="category-item__settings">
                            <div class="setting-row">
                                <p class="title-s setting-row__label">카테고리명</p>
                                <div class="setting-row__content">
                                    <InputTextBox :max-length="10" />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">유형</p>
                                <div class="setting-row__content">
                                    <CustomSelect class="select" />
                                </div>
                            </div>
                        </div>
                    </div>
        
                </div>
            </div>
        </div>
            <!-- 버튼 -->
            <div class="modal-button-wrapper">
                <button class="btn btn--size-32 btn--blue-outline" @click="modalStore.categorySettingModal.closeModal()">취소</button>
                <button class="btn btn--size-32 btn--blue" @click="handleApply">적용</button>
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
                                    <InputTextBox placeholder="카테고리명을 입력해주세요." />
                                </div>
                            </div>
                            <div class="setting-row">
                                <p class="title-s setting-row__label">유형</p>
                                <div class="setting-row__content">
                                    <CustomSelect class="select" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 버튼 -->
            <div class="modal-button-wrapper">
                <button class="btn btn--size-32 btn--blue-outline" @click="goList">이전으로</button>
                <button class="btn btn--size-32 btn--blue" @click="handleSave">등록</button>
            </div>
        </template>
</template>

<style lang="scss" scoped>
.category-manager {

    // 상단 영역
    &__header {
        display: flex;
        gap: 16px;
        word-break: keep-all;
        padding-bottom: 16px;
        border-bottom: 1px solid $gray-200;
        
        p { flex: 1; }
    }

    // 리스트 컨테이너
    &__list {
        display: flex;
        flex-direction: column;
        
        min-height: 0;
        // max-height: 460px;
        // overflow-y: auto;
    }

    // 카테고리 등록
    &__register-form {

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