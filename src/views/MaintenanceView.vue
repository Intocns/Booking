<!-- 서비스 점검 페이지 -->
<script setup>
import sidebarLogo from '@/assets/images/sidebar_logo.svg'
</script>

<template>
    <div class="maintenance-view">
        <div class="maintenance-wrapper">
            <div class="header">
                <img :src="sidebarLogo" alt="인투링크 예약 서비스 로고" />
            </div>

            <div class="maintenance-content">
                <h1 class="title-xl text-blue">서비스 점검 안내</h1>
                <div class="message">
                    <p class="body-l">안정적인 서비스 제공을 위해 서비스를 점검중입니다.</p>
                    <p class="body-l">점검 시간 동안 일시적인 서비스 이용이 제한되는 점 양해 부탁드립니다.</p>
                </div>
        
                <div class="details">
                    <span class="body-s">0월 0일(월) 오후 24:00 ~ 0월 0일(화) 오전 06:00 (6시간)</span>
                    <span class="body-s">점검 내용: 시스템 업데이트 및 보안 패치</span>
                </div>

                <span class="caption">*작업 완료 시간은 변경될 수 있습니다.</span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .maintenance-view {
        width: 100%;
        height: 100%;
        @include flex-center;
        
        .maintenance-wrapper {
            border: 1px solid $gray-100;
            border-radius: 15px;
            box-shadow: rgba(0,0,0,0.1) 0px 4px 12px;
            overflow: hidden;

            .header {
                background-color: $primary-700;
                width: 100%;
                height: 60px;
                @include flex-center;
            }

        }

        .maintenance-content {
            @include flex-center;
            flex-direction: column;
            gap: 30px;
            padding: 40px 30px;
            background-color: $gray-00;
            .message {
                display: flex;
                flex-direction: column;
                gap: 4px;
                text-align: center;
                
                color: $gray-700;
            }

            .details {
                display: flex;
                flex-direction: column;
                gap: 4px;
                text-align: center;
            }
        }

        .caption {
            color: $gray-500;
        }
    }
</style>