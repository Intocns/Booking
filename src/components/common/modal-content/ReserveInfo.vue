<!-- 고객 예약 정보 -->
<script setup>
import { VueDatePicker } from '@vuepic/vue-datepicker';
import { ko } from 'date-fns/locale'
import { startOfDay, subDays, differenceInDays } from "date-fns";
import { ref } from 'vue';

import InputTextBox from '@/components/common/InputTextBox.vue';
import TimeSelect from '@/components/common/TimeSelect.vue';
import icInformation from '@/assets/icons/ic_information_blue.svg'
import icSearchW from '@/assets/icons/ic_search_w.svg'
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';

import CommonTable from '@/components/common/CommonTable.vue';

import { useModalStore } from '@/stores/modalStore';

const modalStore = useModalStore();

const startTime = ref(null);
const endTime = ref(null);

// 예약 방문일 (단일 날짜)을 위한 ref 상태 정의
const reserveDate = ref(null);

// 고객정보 테이블 정의
const customerInfoColumns = [
    { key: 'idx', label: 'No.', width: '5%' },
    { key: 'user_num', label: '고객번호', width: '15%' },
    { key: 'user_name', label: '고객명', width: '15%' },
    { key: 'phone', label: '전화번호', width: '15%' },
    { key: 'pet_num', label: '동물번호', width: '15%' },
    { key: 'pet_name', label: '동물명', width: '15%' },
    { key: 'species_name', label: '종', width: '10%' },
    { key: 'breed', label: '품종', width: '10%'},
    { key: 'gender', label: '성별', width: '10%'},
    { key: 'last_visit_date', label: '최근방문일', width: '10%'},
    { key: 'action', label: '고객매칭', width: '10%'},
]
</script>

<template>
    <div class="modal-contents-inner">
        <!-- 예약 정보 -->
        <div class="d-flex flex-col gap-8">

            <!-- 타이틀 -->
            <div class="modal-content-title-wrapper">
                <div class="d-flex gap-8 align-items-center">
                    <p class="title-l">예약 정보</p>
                    
                    <div class="d-flex gap-4 align-center">
                        <p class="body-l">예약 상태</p>
                        <span class="flag flag--basic">상태</span>
                    </div>
                </div>
            </div>

            <!-- 정보 -->
            <div class="info-lists-wrapper">
                <!-- 왼쪽 -->
                <div class="info-list left">
                    <div class="info-item">
                        <p class="label">예약 고객명</p>
                        <InputTextBox 
                            placeholder="예약 고객명"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">고객 전화번호</p>
                        <InputTextBox 
                            placeholder="고객 전화번호"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">주소</p>
                        <InputTextBox 
                            placeholder="주소"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">상세 주소</p>
                        <InputTextBox 
                            placeholder="상세 주소"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">동물명</p>
                        <InputTextBox 
                            placeholder="동물명"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">종</p>
                        <InputTextBox 
                            placeholder="종"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">품종</p>
                        <InputTextBox 
                            placeholder="품종"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">성별</p>
                        <InputTextBox 
                            placeholder="성별"
                        />
                    </div>
                    <div class="info-item align-start">
                        <p class="label" style="padding-top: 10px;">고객 메모</p>
                        <TextAreaBox 
                            placeholder="고객 메모"/>
                    </div>
                </div>
    
                <!-- 오른쪽 -->
                <div class="info-list right">
                    <div class="info-item">
                        <p class="label">예약 경로</p>
                        <InputTextBox 
                            placeholder="예약 경로"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">상품명</p>
                        <InputTextBox 
                            placeholder="상품명"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">예약 방문일</p>
                        <div class="d-flex gap-8" style="flex:2;">
                            <CustomDatePicker v-model="reserveDate" :range="false" />

                            <!-- 시간 선택 ( 00: 00 ~ 00: 00) -->
                            <div class="d-flex align-center gap-4" style="flex:2;">
                                <TimeSelect v-model="startTime" class="time-select-wrap"/>
                                <span class="time-separator">-</span>
                                <TimeSelect v-model="endTime" class="time-select-wrap"/>
                            </div>
                        </div>
                    </div>
                    <div class="info-item">
                        <p class="label">담당의</p>
                        <InputTextBox 
                            placeholder="담당의"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">접수 일시</p>
                        <InputTextBox 
                            placeholder="접수 일시"
                        />
                    </div>
                    <div class="info-item">
                        <p class="label">확정 일시</p>
                        <InputTextBox 
                            placeholder="확정 일시"
                        />
                    </div>
                    <div class="info-item align-start">
                        <p class="label" style="padding-top: 10px;">병원 메모</p>
                        <TextAreaBox 
                            placeholder="병원 메모"
                            height="160px"
                        />
                    </div>
                </div>
            </div>

        </div>

        <!--고객정보 -->
        <div class="d-flex flex-col gap-8">

            <!-- 타이틀 -->
            <div class="modal-content-title-wrapper">
                <div class="d-flex gap-4 align-items-center">
                    <p class="title-l">고객 정보</p>
                    <div class="d-flex gap-4 align-center">
                        <img :src="icInformation" alt="안내아이콘" class="helper__icon">
                        <span class="body-s helper__text">
                            예약 고객 정보를 기준으로 검색했어요. 우리병원 차트에 등록된 고객과 매칭해주세요. 신규로 등록하는 경우 매칭없이 예약을 확정해주세요.
                        </span>
                    </div>
                </div>

                <!-- 고객 검색 버튼 -->
                <button class="btn btn--size-24 btn--black" @click="modalStore.searchCustomerModal.openModal()">
                    <img :src="icSearchW" alt="아이콘">
                    고객 검색
                </button>
            </div>

            <!-- 테이블 -->
            <div class="customer-info-table-wrapper">
                <CommonTable
                    :columns="customerInfoColumns"
                    :rows="[]"
                    table-empty-sub-text="예약 확정 시, 신규 고객으로 등록되어 예약이 접수됩니다."
                />
            </div>
        </div>

    </div>

    <!-- 버튼 -->
    <div class="modal-button-wrapper">
        <div class="buttons">
            <button class="btn btn--size-40 btn--blue-outline">예약취소</button>
            <button class="btn btn--size-40 btn--blue">예약 확정</button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .modal-contents-inner {
        display: flex;
        flex-direction: column;
        gap: 24px;

        flex-grow: 1;
        overflow-y: auto;
        min-height: 0;
    }

    .modal-content-title-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
    }

    .helper__text {color: $primary-700;}

    .info-lists-wrapper {display:flex; gap:8px;}

    .info-list {
        flex:1;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 20px 16px;

        border-radius: 8px;
        border: 1px solid $gray-200;
        background-color: $gray-00;

    }

    .info-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
            width: 80px;
            @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
            color: $gray-700;
        }
    }

    // .date-picker-wrap {flex:1; height: 32px;}
    :deep(.dp__input_wrap) {height: 32px !important;}
    :deep(.dp__input) {height: 32px !important;}

    .customer-info-table-wrapper { height: 200px; }
</style>