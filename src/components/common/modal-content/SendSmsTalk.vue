<!-- sms, 알림톡 발송 모달 콘텐츠 -->
<script setup>
import icTooltip from '@/assets/icons/ic_tooltip.svg'
import icEmpty from '@/assets/icons/ic_empty.svg'
import CustomSelect from '../CustomSelect.vue';
import TalkPreview from '../TalkPreview.vue';

import { ref } from 'vue';

const activeTab = ref('sms');

// 툴팁용
const isSmsTooltipVisible = ref(false); // sms탭 툴팁
const isTalkTooltipVisible = ref(false); // 수신번호 옆 툴팁
// 툴팁 핸들러
const showTooltip = (type) => {
    if (type === 'sms') {
        isSmsTooltipVisible.value = true;
    } else if (type === 'talk') {
        isTalkTooltipVisible.value = true;
    }
}

// 마우스 좌표 상태 추가 (툴팁 위치 제어용)
const tooltipCoords = ref({ x: 0, y: 0 });

// 마우스 이동 시 좌표 업데이트 및 툴팁 표시
const handleMouseMove = (event, type) => {
    // 툴팁 박스가 마우스 커서를 따라다니도록 좌표 업데이트
    tooltipCoords.value = { 
        x: event.clientX, 
        y: event.clientY 
    };

    // 툴팁 표시 상태 업데이트
    if (type === 'sms') {
        isSmsTooltipVisible.value = true;
    } else if (type === 'talk') {
        isTalkTooltipVisible.value = true;
    }
}

// 마우스 이탈 시 툴팁 숨김
const hideTooltip = (type) => {
    if (type === 'sms') {
        isSmsTooltipVisible.value = false;
    } else if (type === 'talk') {
        isTalkTooltipVisible.value = false;
    }
};
</script>

<template>
    <div class="modal-content-inner">
        <div class="tab-content-wrapper">
            <!-- 탭 메뉴 -->
            <div class="tab-menu">
                <div class="tab">
                    <input 
                        type="radio" 
                        name="tab_menu" 
                        id="tab_talk" 
                        v-model="activeTab"
                        value="talk"
                    >
                    <label for="tab_talk" class="tab--radio_btn">
                        <span>알림톡</span>
                    </label>
                </div>
                <div class="tab">
                    <input 
                        type="radio" 
                        name="tab_menu" 
                        id="tab_sms" 
                        v-model="activeTab"
                        value="sms"
                    >
                    <label for="tab_sms" class="tab--radio_btn">
                        <span>SMS</span>
                        <img 
                            class="icon-img" 
                            :src="icTooltip" 
                            alt="툴팁"
                            @mouseenter="handleMouseMove($event, 'sms')"
                            @mouseleave="hideTooltip('sms')"
                        >
                    </label>
                </div>
            </div>

            <!-- 알림톡 -->
            <div class="content-talk"  v-if="activeTab === 'talk'">
                <div class=" content-talk__top">
                    <!-- 템플릿 선택 -->
                    <div class="content-talk__templates-wrapper">
                        <div class="content-talk__templates-wrapper-type">
                            <span class="title-s">템플릿 유형</span>
                            <CustomSelect />
                        </div>

                        <div class="content-talk__templates">
                            <p class="title-m">템플릿 목록</p>

                            <!-- 템플릿 없음 -->
                            <div class="content-talk__templates-empty" style="display: none;">
                                <p class="empty-box">
                                    <img :src="icEmpty" alt="비어있음 아이콘">
                                    <span>템플릿 목록이 없습니다.</span>
                                </p>
                            </div>
    
                            <!-- 템플릿 있음 -->
                            <ul class="content-talk__templates-list">
                                <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                            </ul>
                        </div>
                    </div>

                    <!-- 알림톡 미리보기 -->
                    <div class="content-talk__preview">
                        <TalkPreview />
                    </div>
                </div>

                <div class="content-talk__form">
                    <div class="content-talk__form-row">
                        <span class="title-s">
                            수신번호
                            <img 
                                class="icon-img" 
                                :src="icTooltip" 
                                alt="툴팁"
                                @mouseenter="handleMouseMove($event,'talk')"
                                @mouseleave="hideTooltip('talk')"
                            >
                        </span>
                        <input class="input-text" type="text" name="" id="">
                    </div>
                </div>

            </div>

            <!-- sms -->
            <div class="content-sms"  v-if="activeTab === 'sms'">
                <div class="content-sms__top">
                    <!-- 템플릿 목록 -->
                    <div class="content-sms__templates">
                        <p class="title-m">템플릿 목록</p>
    
                        <!-- 템플릿 없음 -->
                        <div class="content-sms__templates-empty">
                            <p class="empty-box">
                                <img :src="icEmpty" alt="비어있음 아이콘">
                                <span>템플릿 목록이 없습니다.</span>
                            </p>
                        </div>
    
                        <!-- 템플릿 있음 -->
                        <ul class="content-sms__templates-list" style="display: none;">
                            <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                            <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                            <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                            <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                            <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                            <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                            <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                            <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                            <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                            <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                        </ul>
                    </div>
                    
                    <!-- 문자 내용 -->
                    <div class="content-sms__editor">
    
                        <!-- 문자 내용 입력란 -->
                        <div class="content-sms__editor-input">
                            <span class="title-s">(광고) </span>
                            <span class="body-m">문자 내용 입력란</span>
    
                            <p>문자 내용..</p>
                        </div>
    
                        <!-- byte 카운트 -->
                        <div class="content-sms__editor-byte">
                            <p class="body-m">100 Byte / 3건</p>
                        </div>
    
                        <!-- 문구 추가 체크박스 -->
                        <div class="content-sms__editor-options">
                            <label class="checkbox">
                                <input type="checkbox" />
                                <span class="box"></span>
                                <span class="label">광고/무료수신거부 문구 추가</span>
                            </label>
                        </div>
    
                    </div>
                </div>

                <div class="content-sms__form">
                    <div class="content-sms__form-row">
                        <span class="title-s">문자 수신번호</span>
                        <input class="input-text" type="text" name="" id="">
                    </div>
                    <div class="content-sms__form-row">
                        <span class="title-s">문자 발신번호</span>
                        <input class="input-text" type="text" name="" id="">
                    </div>
                </div>

                <div class="content-sms__notice">
                    <p class="tooltip">
                        ※ 전기통신사업법에 의거하여 거짓으로 표기된 전화번호로 인한 이용자 피해 예방을 위해서 발신번호 사전등록제가 
                        시행  됩니다. 발신번호는 개인 또는 기업이 소유한 유효 전화번호를 사용해야하며, 사전등록이 안된 발신번호는 문자 
                        메시지 발송이 차단됩니다.
                    </p>
                </div>

            </div>
            
            <!-- 버튼영역 -->
            <div class="content-talk__buttons">
                <button class="btn btn--size-40 btn--blue-outline modal-btn">취소</button>
                <button class="btn btn--size-40 btn--blue modal-btn">발송</button>
            </div>
        </div>

        <div 
            class="tooltip-content" 
            v-show="isSmsTooltipVisible || isTalkTooltipVisible"
            :style="{ 
                left: `${tooltipCoords.x }px`, /* 마우스 커서 오른쪽 10px */
                top: `${tooltipCoords.y + 10}px`  /* 마우스 커서 아래 10px */
            }"
        >
            <p class="body-s" v-if="isSmsTooltipVisible">
                - 80Byte 이상 시 LMS로 발송되어 문자 건수가 2건씩 차감됩니다.<br/>
                - 문자 발송 상태 확인까지 시간이 소요될 수 있으며, 확인 전까지 ‘대기’ 상태로 표시됩니다.
                발송 내역은 ‘SMS 발송내역’ 메뉴에서 확인할 수 있습니다.
            </p>
            <p class="body-s" v-else-if="isTalkTooltipVisible">
                해당 알림톡은 인투링크 프로필로 발송됩니다
            </p>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .modal-content-inner {
        width: 592px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        // height: 705px;
    }

    .tab-content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    // 탭 메뉴
    .tab-menu {
        display: flex;
        width: 100%;
        
        border-bottom: 1px solid $gray-200;
    }

    .tab {
        width: 80px;
        background-color: $gray-00;

        input {display: none;}

        &--radio_btn {
            width: 80px;
            height: 32px;
            @include flex-center;
            gap: 2px;
            padding: 0 8px;

            @include typo($title-m-size, $title-m-weight, $title-m-spacing, $title-m-line);
            border-bottom: 2px solid $gray-00;

            span { color: $gray-400; }
        }

        input:checked + &--radio_btn {
            border-bottom: 2px solid $primary-700;
            span { color: $gray-900; }
        }
    }

    // talk
    .content-talk {
        display: flex;
        flex-direction: column;
        gap: 16px;

        &__top {
            display: flex;
            gap: 24px;
        }
        &__templates-wrapper {
            display: flex;
            flex-direction: column;
            gap: 16px;

            &-type {
                @include flex-center;
                gap: 8px;

                .select {flex: 1;}
            }
        }

        &__templates {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 247px;
            height: 440px;
            padding: 16px;
            overflow-y: auto;
        
            border-radius: 8px;
            background-color: $gray-50;

            &-empty {
                margin: auto;
            }

            &-list {
                display: flex;
                flex-direction: column;
                height: 100%;
                gap: 4px;
            } 
            
        }

        &__form {
            display: flex;
            flex-direction: column;
            gap: 8px;

            &-row {
                display: flex;
                align-items: center;
                gap: 60px;

                span {display: flex; align-items: center; gap: 4px;}
                input {flex:1;}
            }
        }

        &__buttons {
            width: 100%;
            display:flex;
            gap: 8px;
            justify-content: flex-end;
        }
    }

    // SMS
    .content-sms {
        display: flex;
        flex-direction: column;
        gap: 16px;
        
        &__top {
            @include flex-center;
            gap: 24px;
        }

        &__templates {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 247px;
            height: 440px;
            padding: 16px;
            overflow-y: auto;
        
            border-radius: 8px;
            background-color: $gray-50;

            &-empty {
                margin: auto;
            }
        
            &-list {
                display: flex;
                flex-direction: column;
                height: 100%;
                gap: 4px;
        
            } 
        }

        // 문자 내용 입력
        &__editor {
            display: flex;
            width: 320px;
            height: 440px;
            flex-direction: column;
            padding: 16px;
            gap: 8px;
    
            border-radius: 8px;
            border: 1px solid $gray-300;
            background-color: $gray-00;
    
            &-input {flex: 1;}
    
            &-byte {
                @include flex;
                justify-content: flex-end;
                padding: 8px;
    
                border-bottom: 1px solid $gray-100;
                color: $gray-500;
            }
    
            &-options {padding: 8px 0 0;}
        }

        &__form {
            display: flex;
            flex-direction: column;
            gap: 8px;

            &-row {
                display: flex;
                align-items: center;
                gap: 60px;

                input {flex:1;}
            }
        }

        &__notice {
            padding: 16px;
            border-radius: 5px;
            background-color: $primary-50;

            .tooltip {color: $gray-700;}
        }

        &__buttons {
            width: 100%;
            display:flex;
            gap: 8px;
            justify-content: flex-end;
        }
    }

</style>