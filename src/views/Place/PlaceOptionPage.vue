<script setup>
import PageTitle from '@/components/common/PageTitle.vue';
import CustomSelect from '@/components/common/CustomSelect.vue';
import CommonTable from '@/components/common/CommonTable.vue';
import Modal from '@/components/common/Modal.vue';

import icSettingW from '@/assets/icons/ic_setting_w.svg'
import icSetting from '@/assets/icons/ic_setting.svg'
import icArrowLeft from '@/assets/icons/ic_arrow_left.svg'
import icArrowRight from '@/assets/icons/ic_arrow_right.svg'
import icEmpty from '@/assets/icons/ic_empty.svg'

import { ref, computed } from 'vue';

// 카테고리 목록
const categories = [
    { id: 'unassigned', label: '카테고리 미지정' },
    { id: 'required', label: '예약 필수 메뉴' },
    { id: 'new', label: '신규 생성 카테고리' }
];

// 현재 선택된 카테고리
const activeTab = ref('unassigned');

const currentIndex = computed(() => 
    categories.findIndex(cat => cat.id === activeTab.value)
);

// 이전 버튼 핸들러
const prevTab = () => {
    if (currentIndex.value > 0) {
        activeTab.value = categories[currentIndex.value - 1].id;
    }
};

// 다음 버튼 핸들러
const nextTab = () => {
    if (currentIndex.value < categories.length - 1) {
        activeTab.value = categories[currentIndex.value + 1].id;
    }
};

// key값 임시..
const optionTableColumns = [
    { key: 'optionName', label: '옵션명' },
    { key: 'price', label: '판매가' },
    { key: 'count', label: '재고 수' },
    { key: '1', label: '선택가능' },
    { key: '2', label: '운영기간' },
    { key: '3', label: '노출설정' },
    { key: '4', label: '상품연결' },
    { key: 'settingBtn', label: '설정' },
]

// 데이터 임시..
const dataMap = {
    unassigned: [
        { optionName: '증명서 발급', price: '-', count: '제한 없음', 1: '1개!', 2: '상시운영', 3: '', 4: '연결하기' }
    ],
    required: [
        { optionName: '기본 진료비', price: '10,000', count: '999', 1: '필수', 2: '상시운영', 3: '노출', 4: '연결됨' }
    ],
    new: [] // 비어있는 경우
};

// 선택된 카테고리에 따라 rows반환
const currentRows = computed(() => {
    return dataMap[activeTab.value] || [];
});

// 탭버튼 변경
const setTab = (tabId) => {
    activeTab.value = tabId;
};
</script>

<template>
    <PageTitle title="옵션 관리" />

    <div class="contents-flex-row-layout">
        <div class="left">
            <!-- 상단 바 -->
            <div class="top-bar">
                <div class="button-group">
                    <!-- 카테고리 버튼 -->
                    <button 
                        v-for="cat in categories" 
                        :key="cat.id"
                        class="tab-btn btn--size-32"
                        :class="{ 'active': activeTab === cat.id }" 
                        @click="setTab(cat.id)"
                    >
                        {{ cat.label }}
                    </button>
                </div>
        
                <div class="button-group">
                    <button 
                        class="btn btn--size-32 btn--black-outline"
                        @click="prevTab"
                        :disabled="currentIndex === 0"
                    >
                        <img :src="icArrowLeft" alt="이전">
                    </button>
                    <button 
                        class="btn btn--size-32 btn--black-outline"
                        @click="nextTab"
                        :disabled="currentIndex === categories.length - 1"
                    >
                        <img :src="icArrowRight" alt="다음">
                    </button>
                    <button class="btn btn--size-32 btn--blue">
                        <img :src="icSettingW" alt="r관리아이콘">
                        카테고리 관리
                    </button>
                </div>
            </div>

            <div class="table-wrapper">
                <CommonTable
                    title="등록된 옵션"
                    :columns="optionTableColumns" 
                    :rows="currentRows"
                    :has-info-icons="true"
                    table-empty-text="등록된 옵션이 없습니다."
                    table-empty-sub-text="예약 상품에 연결해 함께 예약할 옵션 상품이 있다면 등록해주세요."
                >
                    <template #right>
                        <div class="d-flex gap-16 align-center table-title-right">
                            <div class="d-flex gap-8 align-center">
                                <span class="title-m">수량형</span>
                                <div>
                                    <span class="title-m">2</span>
                                    <span class="title-m"> 개</span>
                                </div>
                            </div>
                            <div class="line"></div>
                            <button class="btn btn--size-32 btn--black">옵션등록</button>
                        </div>
                    </template>


                    <!-- TODO: 커스텀 슬롯 노출설정, 상품연결 -->
                    
                    <!-- 설정버튼 커스텀 슬롯 td -->
                    <template #settingBtn="{ row, rowIndex }">
                        <button class="btn btn--size-24 btn--black-outline">
                            <img :src="icSetting" alt="설정">
                        </button>
                    </template>
                </CommonTable>
            </div>
        </div>

        <!-- 미리보기 영역 -->
        <div class="right">
            <div class="preview-wrapper">
                <div class="preview-title">
                    <p class="heading-s">미리보기</p>
                </div>
                <div class="preview-contents">
                    <!-- 선택 -->
                    <CustomSelect />

                    <!-- 미리보기 -->
                    <div class="preview-section">
                        <!-- TODO: 옵션 화면 -->
                        
                        <!-- 옵션 없는 경우 -->
                        <div class="empty-box">
                            <img :src="icEmpty" alt="비어있음 아이콘">
                            <span class="title-s">선택한 옵션이 없습니다.</span>
                            <p class="body-m">상품과 함께 예약 받을 옵션을 선택해 주세요.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <Modal
        v-if="false"
        size="s"
        title="카테고리 관리"
    >
    <!-- TODO: 카테고리 관리 팝업 -->
    </Modal>
</template>

<style lang="scss" scoped>
    .contents-flex-row-layout {
        width: 100%;
        height: 100%;
        display: flex;
        gap:16px;
    }

    .left {
        flex: 2;

        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .right {
        flex: 1;

        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .table-wrapper {
        height: 100%;
    }

    .preview-wrapper {
        display: flex;
        flex-direction: column;
        gap:16px;
        height: 100%;
        // width: 400px;
        padding: 16px;

        border-radius: 8px;
        border: 1px solid $gray-200;
        background-color: $gray-00;
    }

    .table-title-right {
        .line {
            width: 1px;
            height: 22px;

            background-color: $gray-200;
        }
    }


    // 미리보기
    .preview-contents {
        height: 100%;
        display:flex;
        flex-direction: column;
        gap: 16px;

        .select {width: 100%;}

        .preview-section {
            height: 100%;
            padding: 24px;
            min-height: 0;
            overflow-y: auto;

            border-top: 1px solid $gray-200;

            .empty-box {
                height: 100%;
            }
        }
    }
</style>