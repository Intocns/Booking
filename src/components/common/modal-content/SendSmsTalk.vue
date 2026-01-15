<!-- sms, 알림톡 발송 모달 콘텐츠 -->
<script setup>
import icTooltip from '@/assets/icons/ic_tooltip.svg'
import icEmpty from '@/assets/icons/ic_empty.svg'
import CustomSelect from '../CustomSelect.vue';
import TalkPreview from '../TalkPreview.vue';

import { ref } from 'vue';
import { useModalStore } from '@/stores/modalStore';
import { api } from '@/api/axios';

const modalStore = useModalStore();

const activeTab = ref('talk');
const smsRemainingCount = ref(null);
const isLoadingSmsPoint = ref(false);
const cocode = '2592'; // TODO: 임시

const getSmsPointInfo = async () => {
    if (isLoadingSmsPoint.value) return;
    
    smsRemainingCount.value = null;
    isLoadingSmsPoint.value = true;
    try {
        const response = await api.get(`/api/${cocode}/sms/point`);
        if (response.status <= 300 && response.data?.status_code === 200) {
            const data = response.data.data;
            if (data?.message?.sms_cnt_float !== undefined) {
                smsRemainingCount.value = Number(data.message.sms_cnt_float);
            } 
        }
    } catch (error) {
        console.error('SMS 포인트 정보 조회 오류:', error);
        smsRemainingCount.value = null;
    } finally {
        isLoadingSmsPoint.value = false;
    }
};

// 부모 컴포넌트에서 호출할 수 있도록 함수 노출
defineExpose({
    getSmsPointInfo
});

// 툴팁용
const isSmsTooltipVisible = ref(false);
const isTalkTooltipVisible = ref(false);
const tooltipCoords = ref({ x: 0, y: 0 });

const handleMouseMove = (event, type) => {
    tooltipCoords.value = { 
        x: event.clientX, 
        y: event.clientY 
    };

    if (type === 'sms') {
        isSmsTooltipVisible.value = true;
    } else if (type === 'talk') {
        isTalkTooltipVisible.value = true;
    }
}

const hideTooltip = (type) => {
    if (type === 'sms') {
        isSmsTooltipVisible.value = false;
    } else if (type === 'talk') {
        isTalkTooltipVisible.value = false;
    }
};
</script>

<template>
    <div class="modal-contents-inner">
        <div class="tab-content-wrapper">
            <div class="tab-menu">
                <div class="tab-menu__left">
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
                        </label>
                    </div>
                </div>
                <div class="tab-menu__right">
                    <div class="sms-remaining-count" v-if="smsRemainingCount !== null">
                        <span class="body-m">잔여건수: </span>
                        <span class="body-m count-value">{{ smsRemainingCount.toLocaleString() }}건</span>
                    </div>
                    <div class="sms-remaining-count" v-else-if="isLoadingSmsPoint">
                        <span class="body-m">잔여건수 조회 중...</span>
                    </div>
                </div>
            </div>

            <div class="content-talk" v-if="activeTab === 'talk'">
                <div class="content-talk__top">
                    <div class="content-talk__templates-wrapper">
                        <div class="content-talk__templates-wrapper-type">
                            <span class="title-s">템플릿 유형</span>
                            <CustomSelect />
                        </div>

                        <div class="content-talk__templates">
                            <p class="title-m">템플릿 목록</p>

                            <div class="content-talk__templates-empty" style="display: none;">
                                <p class="empty-box">
                                    <img :src="icEmpty" alt="비어있음 아이콘">
                                    <span>템플릿 목록이 없습니다.</span>
                                </p>
                            </div>
    
                            <ul class="content-talk__templates-list">
                                <li class="btn btn--size-32 btn--black-outline">템플릿 1</li>
                            </ul>
                        </div>
                    </div>

                    <div class="content-talk__preview">
                        <TalkPreview />
                    </div>
                </div>

                <div class="content-talk__form">
                    <div class="content-talk__form-row">
                        <span class="title-s helper">
                            수신번호
                        </span>
                        <input class="input-text" type="text" name="" id="">
                    </div>
                </div>

                <div class="tooltip-box">
                    <ul>
                        <li>해당 알림톡은 인투링크 프로필로 발송됩니다.</li>
                    </ul>
                </div>

            </div>

            <div class="content-sms" v-if="activeTab === 'sms'">
                <div class="content-sms__top">
                    <div class="content-sms__templates">
                        <p class="title-m">템플릿 목록</p>
    
                        <div class="content-sms__templates-empty">
                            <p class="empty-box">
                                <img :src="icEmpty" alt="비어있음 아이콘">
                                <span>템플릿 목록이 없습니다.</span>
                            </p>
                        </div>
    
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
                    
                    <div class="content-sms__editor">
    
                        <div class="content-sms__editor-input">
                            <span class="title-s">(광고) </span>
                            <span class="body-m">문자 내용 입력란</span>
                            <p>문자 내용..</p>
                        </div>
    
                        <div class="content-sms__editor-byte">
                            <p class="body-m">100 Byte / 3건</p>
                        </div>
    
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
                        <span class="title-s d-flex gap-4 helper">
                            문자 발신번호
                            <img :src="icTooltip" alt="툴팁아이콘">
                            <div class="tooltip-content">
                                ※ 전기통신사업법에 의거하여 거짓으로 표기된 전화번호로 인한 이용자 피해 예방을 위해서 발신번호 사전등록제가 시행  됩니다. 발신번호는 개인 또는 기업이 소유한 유효 전화번호를 사용해야하며, 사전등록이 안된 발신번호는 문자 메시지 발송이 차단됩니다.
                            </div>
                        </span>
                        <input class="input-text" type="text" name="" id="">
                    </div>
                </div>

                <div class="tooltip-box">
                    <ul>
                        <li>80Byte 이상 시 LMS로 발송되어 문자 건수가 2건씩 차감됩니다.</li>
                        <li>문자 발송 상태 확인까지 시간이 소요될 수 있으며, 확인 전까지 ‘대기’ 상태로 표시됩니다. 발송 내역은 ‘SMS 발송내역’ 메뉴에서 확인할 수 있습니다.</li>
                    </ul>
                </div>

            </div>
            
            <div class="content-talk__buttons">
                <button class="btn btn--size-40 btn--blue-outline modal-btn" @click="modalStore.smsModal.closeModal()">취소</button>
                <button class="btn btn--size-40 btn--blue modal-btn">발송</button>
            </div>
        </div>

        <div 
            class="tooltip-content" 
            v-show="isSmsTooltipVisible || isTalkTooltipVisible"
            :style="{ 
                left: `${tooltipCoords.x}px`,
                top: `${tooltipCoords.y + 10}px`
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
    .modal-contents-inner {
        display: flex;
        flex-direction: column;
        gap: 16px;
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
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid $gray-200;

        &__left {
            display: flex;
        }

        &__right {
            @include flex;
            align-items: center;
            padding-right: 8px;

            .sms-remaining-count {
                @include flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                border-radius: 4px;
                background-color: $primary-50;
                border: 1px solid $primary-200;
                color: $primary-700;
                font-weight: 600;

                .count-value {
                    color: $primary-700;
                    font-weight: 700;
                }
            }
        }
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
            cursor: pointer;
            transition: all 0.2s ease;

            @include typo($title-m-size, $title-m-weight, $title-m-spacing, $title-m-line);
            border-bottom: 2px solid $gray-00;

            span { color: $gray-400; }

            &:hover {
                background-color: $primary-50;
                border-bottom: 2px solid $primary-200;
                
                span { 
                    color: $primary-700; 
                }
            }
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

            .title-s {
                width: 100px;
            }
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