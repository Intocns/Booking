<!-- 플레이스 설정 > 운영설정탭 -->
<script setup>
// 컴포넌트
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import Modal from '@/components/common/Modal.vue';
// 아이콘
import icArrowRightB from '@/assets/icons/ic_arrow_right_blue.svg'
import icInfo from '@/assets/icons/ic_information_blue.svg'
import toggleOn from '@/assets/icons/toggle_on.svg'
import toggleOff from '@/assets/icons/toggle_off.svg'
// 이미지
import imgPlaceOpen from '@/assets/images/img_place_open_preview.png'
import imgPlaceClose from '@/assets/images/img_place_closed_preview.png'

import { ref } from 'vue';
// 스토어
import { useModalStore } from '@/stores/modalStore';

const modalStore = useModalStore()

// 각 설정의 토글 상태 (기본값 true 또는 false)
const isAcceptingReservation = ref(true); // 예약 받기
const isTodayReservationEnabled = ref(true); // 당일 예약
// TODO: 당일 예약 마감 시간 옵션 (임시)
const todayReserveTimeOptions = [
    { label: '이전까지', value: '0' },
    { label: '1시간 전', value: '1' },
    { label: '2시간 전', value: '2' },
    { label: '3시간 전', value: '3' },
];
// 선택된 값을 저장할 변수
const selectedTime = ref('');

// TODO: 노출이력
</script>

<template>
    <ul class="setting-list">
        <li class="setting-item">
            <div class="setting-item__header">
                <div class="setting-item__title-area">
                    <p class="title-m">예약 받기</p>
                    <button class="text-button text-button--blue" @click="modalStore.bookingGuideModal.openModal()">
                        자세히
                        <img :src="icArrowRightB" alt="아이콘">
                    </button>
                </div>

                <label class="toggle">
                    <input type="checkbox" v-model="isAcceptingReservation" />
                    <img class="toggle-img" />
                </label>
            </div>

            <div class="setting-item__content">
                <div class="status-box">
                    <span class="body-m">
                        {{ isAcceptingReservation 
                            ? '서비스가 노출 상태이므로 예약을 받을 수 있습니다.' 
                            : '서비스가 미노출 상태이므로. 예약을 받을 수 없습니다.' 
                        }}
                    </span>
                    <button class="btn btn--size-24 btn--black-outline">노출 이력</button>
                </div>
            </div>
        </li>

        <li class="setting-item">
            <div class="setting-item__header">
                <div class="setting-item__title-area helper">
                    <p class="title-m">당일예약</p>
                    <img :src="icInfo" alt="안내아이콘" class="helper__icon">
                    <div class="tooltip-content">
                        이용 당일에도 예약신청을 받을지 설정합니다.
                    </div>
                </div>

                <label class="toggle">
                    <input type="checkbox" v-model="isTodayReservationEnabled" />
                    <img class="toggle-img" />
                </label>
            </div>

            <div class="setting-item__content">
                <template v-if="isTodayReservationEnabled">
                    <div class="option-row">
                        <span class="body-m">당일 예약 시 이용시간</span>
                        <CustomSingleSelect :options="todayReserveTimeOptions" select-width="100px" v-model="selectedTime" />
                        <span class="body-m">까지 예약을 받습니다.</span>
                    </div>
                    <p class="setting-item__caption caption"> 
                        [예시] 이용시간이 오후 5시인 경우, 오후 4시까지 예약 가능
                    </p>
                </template>

                <template v-else>
                    <div class="option-row">
                        <p class="body-m">이용 당일에는 예약을 받지 않습니다.</p>
                    </div>
                </template>
            </div>
        </li>
    </ul>

    <!-- 예약 받기 자세히 모달 -->
    <Modal
        v-if="modalStore.bookingGuideModal.isVisible"
        title="예약받기"
        size="s"
        :modal-state="modalStore.bookingGuideModal"
    >
        <div class="modal-contents-inner">
            <div class="booking-guide">
                <!-- left -->
                <div class="booking-guide__section">
                    <div class="d-flex justify-between">
                        <p class="modal-contents-title">시작 상태</p>
                        <img :src="toggleOn" alt="토글스위치">
                    </div>
    
                    <p class="modal-contents-body">
                        서비스 화면이 정상적으로 노출되며, 예약 신청이 가능합니다.
                    </p>
    
                    <img class="preview-img" :src="imgPlaceOpen" alt="예약받기 미리보기">
                </div>
                <!-- right -->
                <div class="booking-guide__section">
                    <div class="d-flex justify-between">
                        <p class="modal-contents-title">중지 상태</p>
                        <img :src="toggleOff" alt="토글스위치">
                    </div>
    
                    <p class="modal-contents-body">
                        서비스 화면이 미노출 되며, 예약 신청이 불가능 합니다.
                    </p>
    
                    <img class="preview-img" :src="imgPlaceClose" alt="예약중지 미리보기">
                </div>
            </div>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
    .setting-list {
        width: 50%;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .setting-item {
        padding: 8px 16px;
        border: 1px solid $gray-200;
        border-radius: 4px;

        &__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        &__title-area {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        &__content {
            
            .status-box {
                display: flex;
                align-items: center;
                gap: 12px;
                color: $gray-700;
            }

            .option-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;

                color: $gray-700;
            }
        }

        &__caption {
            color: $gray-500;
            display: block;
        }
    }

    .booking-guide {
        display: flex;
        gap: 16px;

        &__section {
            flex: 1;
            padding: 24px 24px 0;

            border-radius: 8px;
            background-color: $gray-50;
            
            .preview-img {margin-top: 16px;}
        }
    }
</style>                                      