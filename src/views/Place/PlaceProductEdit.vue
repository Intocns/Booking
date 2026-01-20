<!-- 상품관리 > 상품 수정 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue';
import ProductTabBasic from './PlaceProductDetailBasic.vue';
import ProductTabBookingCalendar from './PlaceProductDetailBookingCalendar.vue';
import ProductTabOption from './PlaceProductDetailOption.vue';
import PlaceProductDetailBookingSide from './PlaceProductDetailBookingSide.vue';
import PlaceProductPreview from './PlaceProductPreview.vue';

import { ref, reactive } from 'vue';
import { useRoute } from 'vue-router';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

const currentTab = ref('basic');

const route = useRoute();

const itemId = ref(route.params.id);

// 미리보기 데이터 통합 관리
const previewData = reactive({
    mainImage: '', // 대표이미지
    name: '',
    desc: '',
    details: [],
    notice: ''
});
</script>

<template>
    <PageTitle title="상품 수정" />

    <!-- 콘텐츠 영역 -->
    <div class="contents-flex-row-layout" :class="{ 'is-booking-mode': currentTab === 'booking' }">
        <!-- left -->
        <div class="left">
            <!-- 상단 탭메뉴 -->
            <div class="top-bar">
                <div class="button-group">
                    <button 
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === 'basic' }" 
                        @click="currentTab = 'basic'"
                    >
                        기본 정보
                    </button>
                    <button 
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === 'booking' }" 
                        @click="currentTab = 'booking'"
                    >
                        일정 설정
                    </button>
                    <button 
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === 'option' }" 
                        @click="currentTab = 'option'"
                    >
                        옵션 연결
                    </button>
                </div>
            </div>

            <!-- 콘텐츠 -->
            <div class="contents-wrapper">
                <keep-alive>
                    <component 
                        :is="currentTab === 'basic' ? ProductTabBasic : currentTab === 'booking' ? ProductTabBookingCalendar : ProductTabOption"
                        v-model:preview-name="previewData.name"
                        v-model:preview-desc="previewData.desc"
                        v-model:preview-details="previewData.details"
                        v-model:preview-notice="previewData.notice"
                        :saved-item-id="itemId"
                        :view-type="'update'"
                        @update:preview-main-image="previewData.mainImage = $event"
                    />
                </keep-alive>
            </div>
        </div>

        <!-- right -->
        <div class="right">
            <PlaceProductDetailBookingSide v-if="currentTab === 'booking'" :saved-item-id="itemId"/>
            <PlaceProductPreview v-else :preview-data="previewData" />
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

        &.is-booking-mode {
            .left { flex: 1; }
            .right { width: 650px; }
        }
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