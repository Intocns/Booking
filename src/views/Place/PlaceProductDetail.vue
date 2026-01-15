<!-- 상품등록/수정 페이지  -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import ProductTabBasic from './PlaceProductDetailBasic.vue';
import ProductTabBooking from './PlaceProductDetailBooking.vue';
import ProductTabOption from './PlaceProductDetailOption.vue';
import PlaceProductPreview from './PlaceProductPreview.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
// 아이콘
import icInfo from '@/assets/icons/Ic_round_warning.svg'
import icImg from '@/assets/icons/ic_image.svg'

import { ref, reactive } from 'vue';
const currentTab = ref('basic'); // 탭 버튼
const savedItemId = ref(''); // 등록 후 서버에서 받은 ID를 저장할 변수

// 탭 변경 및 ID 저장을 처리하는 함수
const handleNextStep = (nextTab, bizItemId) => {
    currentTab.value = nextTab; // 
    if (bizItemId) {
        savedItemId.value = bizItemId; // 생성된 상품 ID 저장
    }
};

// 미리보기에 노출할 데이터 통합 관리
const previewData = reactive({
    mainImage: '', // 대표이미지
    name: '',    // 상품명
    desc: '',    // 상품소개
    details: [],  // 상세 설명 리스트
    notice: '', // 유의사항
});
</script>

<template>
    <PageTitle title="상품 등록" />

    <!-- 콘텐츠 영역 -->
    <div class="contents-flex-row-layout">

        <!-- left -->
        <div class="left">
            <div class="top-bar">
                <div class="button-group">
                    <button 
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === 'basic' }"
                        :disabled="true" 
                        style="pointer-events: none;"
                    >
                        기본 정보
                    </button>
                    <button 
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === 'booking' }" 
                        :disabled="true"
                        style="pointer-events: none;"
                    >
                        예약 정보
                    </button>
                    <button 
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === 'option' }" 
                        :disabled="true"
                        style="pointer-events: none;"
                    >
                        옵션 연결
                    </button>
                </div>
            </div>

            <div class="contents-wrapper">
                <!-- 등록화면의 경우 savedItemId의 초기값을 0으로 설정 -->
                <keep-alive>
                    <component 
                        :is="currentTab === 'basic' ? ProductTabBasic : currentTab === 'booking' ? ProductTabBooking : ProductTabOption" 
                        v-model:preview-name="previewData.name"
                        v-model:preview-desc="previewData.desc"
                        v-model:preview-details="previewData.details"
                        v-model:preview-notice="previewData.notice"
                        :saved-item-id="savedItemId"
                        @update:next-tab="handleNextStep"
                        @update:preview-main-image="previewData.mainImage = $event"
                    />
                </keep-alive>
            </div>
        </div>

        <!-- right -->
        <div class="right">
            <PlaceProductPreview :preview-data="previewData" />
        </div>
    </div>

    <!-- confirmModal -->
    <ConfirmModal />
</template>

<style lang="scss" scoped>
    .contents-flex-row-layout {
        width: 100%;
        height: 100%;
        min-height: 0;
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
        // flex: 1;
        width: 400px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
</style>