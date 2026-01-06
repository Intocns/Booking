<!-- 인투펫 관리 > 진료실 관리 -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import InputTextBox from '@/components/common/InputTextBox.vue';
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import HolidayForm from '../Place/HolidayForm.vue';
import TimeSelect from '@/components/common/TimeSelect.vue';
import ClinicOperationTimeForm from '../Place/ClinicOperationTimeForm.vue';
// 아이콘
import icSet from '@/assets/icons/ic_setting.svg'
import icAddBtn from '@/assets/icons/ic_add_btn.svg'
import icDel from '@/assets/icons/ic_del.svg'
import icCopy from '@/assets/icons/ic_copy.svg'
import icClear from '@/assets/icons/ic_clear.svg'
import icDragHandel from '@/assets/icons/ic_drag_handel.svg'
import icInfo from '@/assets/icons/ic_infomation_b.svg'

import { onMounted, ref } from 'vue';

// 자식에게 넘겨줄 설정 데이터 초기값
const operationConfig = ref({
    operatingMode: 'all', // 초기 모드 설정 ('all', 'split', 'daily')

    // [모든 영업일 동일] 관련
    allDaysTime: [{ start: '09:00', end: '18:00' }],
    allDeadline: '17:30',

    // [평일/주말 구분] 관련
    splitTime: {
        weekday: [{ start: '09:00', end: '18:00' }],
        weekend: [{ start: '09:00', end: '13:00' }]
    },
    splitDeadline: { 
        weekday: '17:30', 
        weekend: '12:30' 
    },

    // [요일별 설정] 관련
    dailyGroups: [
        { 
            selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri'], 
            times: [{ start: '09:00', end: '18:00' }], 
            deadline: '17:30' 
        }
    ]
});

// 상태관리
const isHolidayEnabled = ref(false)
</script>

<template>
    <PageTitle title="진료실 관리" helperText="인투펫 앱 예약 시, 등록한 진료실 목록이 선택항목으로 노출됩니다." />

    <div class="top-bar">
        <button class="btn btn--size-32 btn--black-outline">
            <img :src="icSet" alt="아이콘">
            진료실 설정
        </button>
    </div>

    <div class="contents-wrapper">
        <!-- 인투펫 진료실 목록 -->
        <div class="room-buttons">
            <div class="room-button">
                <div class="room-index">
                    <span class="title-m">1</span>
                </div>
                <span class="room-name title-m ">김정은 수의사 : 뱀/카멜레온 등 다양한 파충류 진료 가능 뿅뿅뿅</span>
            </div>
            <div class="room-button">
                <div class="room-index">
                    <span class="title-m">1</span>
                </div>
                <span class="room-name title-m ">김정은 수의사 : 뱀/카멜레온 등 다양한 파충류 진료 가능 뿅뿅뿅</span>
            </div>
            <div class="room-button add-room-button">
                <img :src="icAddBtn" alt="">
                <span class="title-m">진료실 추가</span>
            </div>
        </div>

        <!-- 진료실 정보  -->
        <ul class="form-container">

            <li class="form-item form-header">
                <div class="d-flex align-center gap-8">
                    <div class="room-index"><span class="title-m">1</span></div>
                    <span class="title-m room-title">진료실</span>
                </div>

                <div class="d-flex gap-8">
                    <button class="btn btn--size-24 btn--black-outline">
                        <img :src="icDel" alt="아이콘" width="14">진료실 삭제</button>
                    <button class="btn btn--size-24 btn--black-outline">
                        <img :src="icCopy" alt="아이콘">진료실 복제</button>
                </div>
            </li>

            <!-- 진료실 명/진료실 사용 -->
            <li class="form-item">
                <div class="form-label required">진료실 명</div>
                <div class="form-content">
                    <InputTextBox />
                </div>

                <div class="form-label required">진료실 사용</div>
                <div class="form-content">
                    <label class="toggle">
                        <input type="checkbox" />
                        <img class="toggle-img" />
                    </label>
                </div>
            </li>

            <!-- 진료실 메모 -->
            <li class="form-item">
                <div class="form-label">진료실 메모</div>
                <div class="form-content">
                    <TextAreaBox />
                </div>
            </li>
            
            <!-- 사용자 설정 -->
            <li class="form-item">
                <div class="form-label required">사용자 설정</div>
                <div class="form-content ">
                    <div class="d-flex align-center gap-4">
                        <CustomSingleSelect />
                        <span class="body-s">진료실과 연결할 사용자를 선택해주세요.</span>
                        <div class="helper">
                            <img :src="icInfo" alt="아이콘">
    
                            <div class="tooltip-content">
                                <ul>
                                    <li>현장 데스크(관리자)로 설정할 경우, 현장 데스크에서 담당 수의사를 지정합니다. 검진명이나 진료과목명으로 진료실을 등록한 경우, 현장 데스크(관리자) 항목을 선택하시면 관리가 용이합니다.단, 해당 진료실은 모든 예약이 관리자 확인 후 승인 가능한 상태로 설정됩니다.</li>
                                    <li>특정 사용자 설정 시, 연결된 사용자(담당자)로 예약이 등록됩니다. 원장님별로 진료실을 등록한 경우, 해당 원장님을 사용자로 선택하시면 관리가 용이합니다.</li>
                                    <li>'사용자 설정'에 제공되는 목록은 IntoVetGE 병원차트에 등록된 사용자 이름이 노출됩니다. 사용자 리스트를 추가/수정/삭제 하시려면, 차트 프로그램 에서 진행해주세요.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </li>

            <!-- 사진 -->
            <li class="form-item">
                <div class="form-label">사진</div>
                <div class="form-content">
                    <div class="photo-upload__grid">
                        <label class="photo-upload__btn">
                            <input 
                                type="file" 
                                hidden 
                                multiple 
                                accept="image/*"
                            >
                            <img :src="icAddBtn" alt="추가" class="icon-plus" width="32">
                        </label>

                        <div class="photo-upload__item">
                            <img src="" alt="업로드 이미지" class="preview-img"> 
                            <!-- 드래그핸들 -->
                            <div class="drag-handle"><img :src="icDragHandel" alt="드래그아이콘"></div>
                            <!-- 삭제 버튼 -->
                            <button class="delete-btn">
                                <img :src="icClear" alt="삭제" width="20">
                            </button>
                            <!-- 대표 이미지의 경우 -->
                            <div class="main-badge">
                                <span class="caption">대표이미지</span>
                            </div>
                        </div>
                    </div>
                </div>
            </li>

            <!-- 모바일 예약 운영 시간 설정 -->
            <li class="form-item">
                <div class="form-label">모바일 예약 운영 시간 설정</div>
                <div class="form-content">
                    <ClinicOperationTimeForm v-model="operationConfig" />
                </div>
            </li>

            <!-- 휴무일 설정 -->
            <li class="form-item">
                <div class="form-label">휴무일 설정</div>
                <div class="form-content">
                    <label class="toggle">
                        <input type="checkbox" v-model="isHolidayEnabled" />
                        <img class="toggle-img" />
                    </label>
                </div>
            </li>

            <!-- 휴무일 설정 on 의 경우 설정 영역 보여줌 -->
            <li class="form-item"  v-if="isHolidayEnabled">
                <div class="form-label"></div>
                <div class="form-content">
                    <HolidayForm />
                </div>
            </li>    
        </ul>

        <div class="button-wrapper">
            <button class="btn btn--size-40 btn--blue">저장</button>
        </div>

    </div>
</template>

<style lang="scss" scoped>
    .form-header {
        padding: 0 10px;
        align-items: center;
        justify-content: space-between;

        background-color: $primary-50;

        .room-index {
            @include flex-center;
            flex-shrink: 0;
            width: 24px;
            padding: 1px 8px;
    
            border-radius: 50%;
            background-color: $primary-100;
            border: 1px solid $primary-200;
            color: $primary-700;
        }
        .room-title {color: $primary-700;}
    }
    .form-label {width: 165px;}
    .button-wrapper {
        padding-top: 16px;
        // padding-top: 40px;
        display: flex;
        justify-content: center;
        gap: 8px;

        background-color: $gray-00;

        button {
            width: 400px;
        }
    }

    // 진료실 버튼 리스트
    .room-buttons {
        display: grid;
        grid-template-columns: repeat(4, 1fr); 
        gap: 8px;
        width: 100%;
        margin-bottom: 16px;
    }
    .room-button {
        height: 48px;
        display: flex;
        align-items: center;
        padding: 8px 12px;
        gap: 8px;
        min-width: 0;

        border-radius: 100px;
        background-color: $primary-50;
        cursor: pointer;

        .room-index {
            @include flex-center;
            flex-shrink: 0;
            width: 24px;
            padding: 1px 8px;
    
            border-radius: 50%;
            background-color: $primary-100;
            border: 1px solid $primary-200;
            color: $primary-700;
        }
    
        .room-name {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: $gray-700;
        }

        &.disabled {
            cursor: default;
            background-color: $gray-100;
            .room-index {
                color: $gray-400;
                border-color: $gray-200;
                background-color: $gray-50;
            }
            .room-name {color: $gray-400;}
        }

        &.active {
            background-color: $primary-700;
            .room-index {
                border-color: $gray-00;
                background-color: $gray-00;
            }
            .room-name {color: $gray-00;}
        }
    }
    .add-room-button {
        justify-content: center;

        border: 1px solid $gray-200;
        background-color: $gray-00;
        color: $gray-400;
    }
</style>