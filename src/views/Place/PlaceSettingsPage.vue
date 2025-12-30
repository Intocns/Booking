<!-- 네이버 플레이스 관리 > 플레이스 설정 -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import PlaceSettingTabOperation from './PlaceSettingTabOperation.vue';
import PlaceSettingTabNotification from './PlaceSettingTabNotification.vue';
import PlaceSettingTabRequest from './PlaceSettingTabRequest.vue';
// 아이콘
import icEmpty from '@/assets/icons/ic_empty.svg'

import { ref } from 'vue';
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';

// 스토어

const tabs = [
  { id: 'operation', label: '운영설정' },
  { id: 'notification', label: '알림설정' },
  { id: 'request', label: '예약자 정보 요청' },
];

const currentTab = ref('operation'); // 탭 버튼
</script>

<template>
    <PageTitle title="플레이스 설정" />

    <div class="contents-flex-row-layout">
        <div class="left">
            <!-- 상단 버튼 -->
            <div class="top-bar">
                <div class="button-group">
                    <button 
                        v-for="tab in tabs" 
                        :key="tab.id"
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === tab.id }"
                        @click="currentTab = tab.id"
                    >
                        {{ tab.label }}
                    </button>
                </div>
            </div>

            <!--  운영설정 -->
            <template v-if="currentTab === 'operation'">
                <PlaceSettingTabOperation />
            </template>

            <!-- 알림설정 -->
            <template v-if="currentTab === 'notification'">
                <PlaceSettingTabNotification />
            </template>

            <!-- 예약자 정보 요청 -->
            <template v-if="currentTab == 'request'">
                <PlaceSettingTabRequest />
            </template>
        </div>

        <!-- 미리보기 -->
        <template v-if="currentTab == 'request'">
            <div class="right">
                <div class="preview-wrapper">
                    <div class="preview-title">
                        <p class="heading-s">미리보기</p>
                    </div>
                    <div class="preview-contents">
                        <div class="preview-section">
                            
                            <!-- 추가정보 영역 -->
                            <div class="request-section">
                                <p class="title-l">추가정보</p>
                                <!-- 동물이름 -->
                                <div class="request-section__item">
                                    <div class="request-section__title">
                                        <p class="title-m">동물 이름을 입력해주세요</p>
                                        <span class="required">필수</span>
                                    </div>

                                    <TextAreaBox />
                                </div>
                                <!-- 종 선택 -->
                                <div class="request-section__item">
                                    <div class="request-section__title">
                                        <p class="title-m">종을 선택해 주세요.</p>
                                        <span class="required">필수</span>
                                    </div>

                                    <CustomSingleSelect />
                                </div>
                                <!-- 품종 선택 -->
                                <div class="request-section__item">
                                    <div class="request-section__title">
                                        <p class="title-m">품종을 선택해 주세요.</p>
                                        <span class="required">필수</span>
                                    </div>

                                    <CustomSingleSelect />
                                </div>
                                <!-- 성별 선택 -->
                                <div class="request-section__item">
                                    <div class="request-section__title">
                                        <p class="title-m">성별을 선택해 주세요.</p>
                                        <span class="required">필수</span>
                                    </div>

                                    <CustomSingleSelect />
                                </div>
                                <!-- 복수 선택 가능한 옵션 -->
                                <div class="request-section__item">
                                    <div class="request-section__title">
                                        <p class="title-m">복수 선택 가능한 옵션</p>
                                    </div>

                                    <div class="options-list">
                                        <label class="checkbox">
                                            <input type="checkbox" />
                                            <span class="box-naver"></span>
                                            <span class="label">옵션1</span>
                                        </label>
                                        <label class="checkbox">
                                            <input type="checkbox" />
                                            <span class="box-naver"></span>
                                            <span class="label">옵션2</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- 예약자 정보 영역 -->
                            <div  class="request-section">
                                <p class="title-l">예약자 정보</p>

                                <div class="request-section__item">
                                    <div class="request-section__title">
                                        <p class="title-m">요청사항</p>
                                    </div>

                                    <TextAreaBox />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
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
        flex: 1;
        min-width: 0;
        
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .right {
        // flex: 1;
        width: 400px;
        flex: 0 0 400px;
        height: 100%;
        min-height: 0;

        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .preview-wrapper {
        display: flex;
        flex-direction: column;
        gap:16px;
        height: 100%;
        padding: 16px;

        border-radius: 8px;
        border: 1px solid $gray-200;
        background-color: $gray-00;
    }
     // 미리보기
    .preview-contents {
        // height: 100%;
        display:flex;
        flex-direction: column;
        gap: 16px;
        overflow-y: auto;

        .select {width: 100%;}

        .preview-section {
            height: 100%;
            padding: 24px;
            min-height: 0;
            overflow-y: auto;

            border-top: 1px solid $gray-200;
        }
    }

    // 미리보기 > 정보 요청 영역
    .request-section {
        display: flex;
        flex-direction: column;
        gap: 16px;

        padding: 24px 0;
        border-bottom: 1px solid $gray-200;

        &:nth-child(1) {padding-top: 0;}
        &:nth-child(2) {padding-bottom: 0; border-bottom: 0;}

        &__item {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        &__title {
            display: flex;
            align-items: center;
            gap: 4px;

            .required {
                @include typo($title-xs-size, $title-xs-weight, $title-xs-spacing, $title-xs-line);
                color: $brand-naver;
            }
        }
    }

    .options-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
</style>