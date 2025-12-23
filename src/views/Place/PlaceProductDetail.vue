<!-- 상품등록/수정 페이지  -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import ProductTabBasic from './PlaceProductDetailBasic.vue';
import ProductTabBooking from './PlaceProductDetailBooking.vue';
import ProductTabOption from './PlaceProductDetailOption.vue';
// 아이콘
import icInfo from '@/assets/icons/Ic_round_warning.svg'

import { ref } from 'vue';

const currentTab = ref('basic'); // 탭 버튼
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
                        @click="currentTab = 'basic'"
                    >
                        기본 정보
                    </button>
                    <button 
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === 'booking' }" 
                        @click="currentTab = 'booking'"
                    >
                        예약 정보
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

            <div class="contents-wrapper">
                <keep-alive>
                    <component :is="currentTab === 'basic' ? ProductTabBasic : currentTab === 'booking' ? ProductTabBooking : ProductTabOption" />
                </keep-alive>
            </div>
        </div>

        <!-- right -->
        <div class="right">
            <div class="preview-wrapper">
                <div class="preview-title">
                    <p class="heading-s">미리보기</p>
                </div>
                
                <div class="preview-contents">
                    <div class="preview-card">
                        
                        <div class="preview-card__header">
                            <div class="header-text">
                                <h4 class="hospital-name">씨엔에스 병원</h4>
                                <p class="product-summary">상품설명을 변경하는 중이에요<br/>몇줄까지</p>
                            </div>
                            <div class="header-image">
                                <img src="" alt="상품 이미지" class="img-obj">
                            </div>
                        </div>

                        <div class="preview-card__body">
                            <div class="detail-row">
                                <span class="detail-label">상세정보</span>
                                <p class="detail-value">멍멍이 내과 진료</p>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">상세정보</span>
                                <p class="detail-value">멍멍이 내과 진료</p>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">상세정보</span>
                                <p class="detail-value">멍멍이 내과 진료</p>
                            </div>
                        </div>

                        <div class="preview-card__footer">
                            <div class="notice-box">
                                <div class="notice-title">
                                    <img :src="icInfo" alt="알림 아이콘"> 알립니다.
                                </div>
                                <p class="notice-desc">병원 방문 시 대기가 발생될 수 있습니다.</p>
                            </div>
                        </div>

                    </div>
                    
                    <p class="preview-guide-text">※ 줄바꿈은 해상도에 따라 다르게 보여집니다.</p>
                </div>
            </div>
        </div>
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

    // 오른쪽 미리보기 영역
    .preview-contents {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .preview-card {
            padding: 24px;
            display: flex;
            flex-direction: column;

            background-color: #fff;
            border: 1px solid $gray-200;
            border-radius: 16px;

            // 헤더: 텍스트와 이미지가 나란히
            &__header {
                display: flex;
                justify-content: space-between;
                gap: 16px;
                padding-bottom: 16px;

                border-bottom: 1px solid $gray-100;

                .hospital-name {
                    margin-bottom: 2px;

                    @include typo($title-l-size, $title-l-weight, $title-l-spacing, $title-l-line);
                    color: $gray-900;
                }
                .product-summary {
                    @include typo($body-l-size, $body-l-weight, $body-l-spacing, $body-l-line);
                    color: $gray-600;
                }
                .header-image {
                    width: 96px;
                    height: 96px;
                    flex-shrink: 0;
                    overflow: hidden;

                    border-radius: 4px;
                    background-color: $gray-00;
                    border: 1px solid $gray-200;

                    .img-obj { width: 100%; height: 100%; object-fit: cover; }
                }
            }

            // 바디: Key-Value 리스트
            &__body {
            
                .detail-row {
                    padding: 16px 0;
                    border-bottom: 1px solid $gray-50;
                    
                    .detail-label {
                        display: block;
                        margin-bottom: 2px;

                        @include typo($body-l-size, $body-l-weight, $body-l-spacing, $body-l-line);
                        color: $gray-900;
                    }
                    .detail-value {
                        @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
                        color: $gray-500;
                    }
                }
            }

            // 푸터: 강조 알림창
            &__footer {
                padding-top: 24px;
            
                .notice-box {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 15px;

                    border-radius: 5px;
                    background-color: #FFF5F4;

                    .notice-title {
                        display: flex;
                        align-items: center;
                        gap: 4px;

                        color: $warning-300;
                        @include typo($body-s-size, $body-s-weight, $body-s-spacing, $body-s-line);
                    
                    }
                    .notice-desc {
                        @include typo($body-s-size, $body-s-weight, $body-s-spacing, $body-s-line);
                        color: $gray-900;
                    }
                }
            }
        }

        .preview-guide-text {
            padding: 0 24px;

            @include typo($caption-size, $caption-weight, $caption-spacing, $caption-line); 
            color: $gray-500;
        }
    }
</style>