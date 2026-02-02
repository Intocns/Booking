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

import { ref, reactive } from 'vue';
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';

// 스토어
import { usePlaceStore } from '@/stores/placeStore';

const placeStore = usePlaceStore();

// 미리보기 사용 상태관리
const previewValues = reactive({});
const requestMessageValue = ref('');

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
                            <div v-if="placeStore.questionList.length > 0" class="request-section">
                                <p class="title-l">추가정보</p>

                                <div 
                                    v-for="q in placeStore.questionList"
                                    :key="q.questionIdx"
                                    class="request-section__item"
                                >
                                    <div class="request-section__title">
                                        <p class="title-m">{{ q.questionTitle }}</p>
                                        <span v-if="q.questionRequiredFlag == 1" class="required">필수</span>
                                    </div>

                                    <template v-if="q.questionType == 'TEXTAREA'">
                                        <TextAreaBox v-model="previewValues[q.questionIdx]" />
                                    </template>

                                    <template v-if="q.questionType == 'SELECT'">
                                        <CustomSingleSelect 
                                            v-model="previewValues[q.questionIdx]" 
                                            :options="q.uiQuestionOptions" 
                                        />
                                    </template>

                                    <template v-if="q.questionType == 'CHECKBOX'">
                                        <ul v-for="opt in q.options">
                                            <li class="options-list">
                                                <label class="checkbox">
                                                    <input type="checkbox" />
                                                    <span class="box-naver"></span>
                                                    <span class="label">{{ opt.optionName }}</span>
                                                </label>
                                            </li>
                                        </ul>
                                    </template>
                                </div>
                            </div>

                            <!-- 추가 정보 없을 때 -->
                            <div v-else class="empty-box request-section">
                                <img :src="icEmpty" alt="비어있음 아이콘">
                                <span class="title-s">등록된 질문이 없습니다.</span>
                                <p class="body-m">예약자에게 요청할 정보를 추가해 주세요.</p>
                            </div>

                            <!-- 예약자 정보 영역 -->
                            <div v-if="placeStore.isRequestMessageUsed" class="request-section">
                                <p class="title-l">예약자 정보</p>

                                <div class="request-section__item">
                                    <div class="request-section__title">
                                        <p class="title-m">요청사항</p>
                                    </div>

                                    <TextAreaBox v-model="requestMessageValue" />
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
        border-top: 1px solid $gray-200;

        &:nth-child(1) {padding-top: 0; border-top: 0;}
        &:nth-child(2) {padding-bottom: 0;}

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