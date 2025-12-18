<!-- 상품관리 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue';

import icList from '@/assets/icons/ic_list.svg';
import icSetting from '@/assets/icons/ic_setting.svg';
import icEdit from '@/assets/icons/ic_edit.svg';
import icPlusW from '@/assets/icons/ic_plus_w.svg';
import icCopy from '@/assets/icons/ic_copy.svg';
import icDel from '@/assets/icons/ic_del.svg';
</script>

<template>
    <PageTitle title="상품 관리" />

    <!-- 상단 바 -->
    <div class="top-bar">
        <div class="d-flex gap-16 align-center">

            <p class="title-m total-wrapper">전체 <span class="total-num">987</span></p>

            <div class="line"></div>

            <label class="checkbox">
                <input type="checkbox" />
                <span class="box"></span>
                <span class="label">미노출 제외</span>
            </label>

        </div >

        <!-- 버튼들 -->
        <div class="button-group">
            <button class="btn btn--size-32 btn--black-outline">
                <img :src="icList" alt="리스트 아이콘" />
                순서
            </button>
            <button class="btn btn--size-32 btn--black-outline">
                <img :src="icSetting" alt="설정 아이콘">
                설정
            </button>
            <button class="btn btn--size-32 btn--black-outline">
                <img :src="icEdit" alt="편집 아이콘">
                정보변경
            </button>
            <button class="btn btn--size-32 btn--blue-outline">
                인투펫 진료실 불러오기
            </button>
            <button class="btn btn--size-32 btn--blue">
                <img :src="icPlusW" alt="플러스 아이콘">
                예약상품 등록하기
            </button>
        </div>
    </div> 

    <div class="contents-wrapper">
        <div class="grid-wrapper">
            <!-- 상품 리스트 테이블 -->
            <div class="item-box">
                <!-- top -->
                <div class="top">
                    <div class="item-box__img"><img src="" alt="상품이미지"></div>

                    <div class="d-flex align-center justify-between">
                        <p class="body-l">노출중</p>
    
                        <label class="toggle"> 
                            <input type="checkbox" />
                            <span class="toggle-img"></span>
                        </label>
                    </div>
    
                    <span class="item-box__sub-text body-xs">관리자 확인 후 확정</span>
                </div>

                <!-- bottom -->
                <div class="bottom">
                    <div class="d-flex gap-16">
                        <button><img :src="icEdit" alt="수정아이콘" width="16"></button>
                        <button><img :src="icCopy" alt="복사아이콘"></button>
                        <button><img :src="icDel" alt="삭제 아이콘"></button>
                    </div>

                    <div>
                        <button class="btn btn--size-24 btn--black-outline">미리보기</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped> 
    .line {
        width: 1px;
        height: 16px;
        background-color: $gray-200;
    }
    .total-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;

        .total-num {
            color: #3D56F0;
        }
    }

    .grid-wrapper {
        display: grid;
        grid-template-columns: repeat(6, 1fr); // 한 줄에 6개, 동일한 너비로
        gap: 16px;
    }

    .item-box {
        display: flex;
        flex-direction: column;

        padding: 16px;

        border: 1px solid $gray-200;
        border-radius: 8px;
        background-color: $gray-00;

        .top {
            display: flex;
            flex-direction: column;
        }

        &__img {
            height: 168px;
            @include flex-center;
            overflow: hidden;
            margin-bottom: 8px;

            border-radius: 4px;
            border: 1px solid $gray-200;
        }
        &__sub-text {
            margin: 4px 0;
            color: $gray-500;
        }

        .bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;

            border-top: 1px solid $gray-200;
        }
    }
</style>