<!-- 상품 미리보기 -->
<script setup>
import icInfo from '@/assets/icons/Ic_round_warning.svg';
import icImg from '@/assets/icons/ic_image.svg';

const props = defineProps({
    previewData: {
        type: Object,
        required: true,
        default: () => ({ name: '', desc: '', details: [], notice: '' })
    }
});
</script>

<template>
    <div class="preview-wrapper">
        <div class="preview-title">
            <p class="heading-s">미리보기</p>
        </div>

        <div class="preview-contents">
            <div class="preview-card">
                <div class="preview-card__header">
                    <div class="header-text">
                        <h4 class="product-name">{{ previewData.name }}</h4>
                        <p class="product-summary">{{ previewData.desc }}</p>
                    </div>
                    <div class="header-image">
                        <img :src="icImg" alt="이미지" class="img-ic">
                    </div>
                </div>

                <div class="preview-card__body">
                    <p v-if="previewData.details.length > 0" class="title-l">상세정보</p>
                    <div v-for="(item, idx) in previewData.details.slice(0, 3)" :key="idx" class="detail-row">
                        <span class="detail-label">{{ item.title }}</span>
                        <p class="detail-value">{{ item.context }}</p>
                    </div>
                </div>

                <div class="preview-card__footer">
                    <div class="notice-box">
                        <div class="notice-title">
                            <img :src="icInfo" alt="알림"> 알립니다.
                        </div>
                        <p class="notice-desc">{{ previewData.notice || '유의사항이 보여집니다.' }}</p>
                    </div>
                </div>
            </div>
            <p class="preview-guide-text">※ 줄바꿈은 해상도에 따라 다르게 보여집니다.</p>
        </div>
    </div>
</template>

<style lang="scss" scoped>
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

                .product-name {
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
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    overflow: hidden;

                    border-radius: 4px;
                    background-color: $gray-00;
                    border: 1px solid $gray-200;

                    .img-obj { width: 100%; height: 100%; object-fit: cover; }
                    .img-ic {width: 40px;}
                }
            }

            // 바디: Key-Value 리스트
            &__body {
                margin-top: 20px;

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
                        white-space: pre-wrap;
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
                        white-space: pre-wrap;
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