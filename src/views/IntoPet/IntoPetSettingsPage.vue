<!-- 인투펫 관리 > 운영 설정 -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import InputTextBox from '@/components/common/InputTextBox.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
// 아이콘
import icHint from '@/assets/icons/ic_hint.svg'
import icInfo from '@/assets/icons/ic_infomation_b.svg'
import icArrowR from '@/assets/icons/ic_arrow_right_blue.svg'
import icPlus from '@/assets/icons/ic_plus_black.svg'
import icDel from '@/assets/icons/ic_del.svg'
import icSms from '@/assets/icons/ic_sms.svg'

import { ref } from 'vue';
import { showAlert } from '@/utils/ui';

const MAX_PURPOSES = 6;

// 방문 목적 데이터 리스트
const purPoseIdx = ref(1);
const visitPurposes = ref([
    { id: 0, title: '', approvalType: 'admin' } // 기본 항목 1
])
// 알림톡 수신번호 데이터 
const receiverIdx = ref(1);
const receiverPhones = ref([
    { id: 0, phone: '' } // 기본 번호 1
]);

const selectedAnimalCount = ref(null); // 예약 가능 동물 수 선택
// 예약 가능 동물 수 (임시 1~10)
const animalCountOptions = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

// 항목 추가
const addPurpose = () => {
    if (visitPurposes.value.length >= MAX_PURPOSES) {
        showAlert(`방문 목적은 최대 ${MAX_PURPOSES}개까지만 설정할 수 있습니다.`);
        return;
    }

    visitPurposes.value.push({
        id: purPoseIdx.value++,
        title: '',
        approvalType: 'admin'
    });
};

// 항목 삭제
const removePurpose = (id) => {
    if (visitPurposes.value.length > 1) {
        visitPurposes.value = visitPurposes.value.filter(item => item.id !== id);
    }
};

// 번호 추가
const addReceiver = () => {
    receiverPhones.value.push({
        id: receiverIdx.value++,
        phone: ''
    });
};

// 번호 삭제
const removeReceiver = (id) => {
    if (receiverPhones.value.length > 1) {
        receiverPhones.value = receiverPhones.value.filter(item => item.id !== id);
    }
};
</script>

<template>
    <PageTitle title="운영 설정" helperText="모바일 예약 운영 관련 항목을 설정해주세요. 설정된 방식대로 모바일 앱 예약 기능이 적용됩니다." />

    <div class="top-bar">
        <div class="d-flex gap-16 align-center">
            <p class="title-m">모바일 예약</p>
            <div class="line"></div>
            <div class="d-flex align-center gap-16">
                <label class="radio">
                    <input type="radio" />
                    <span class="circle"></span>
                    <span class="label">운영</span>
                </label>
                <label class="radio">
                    <input type="radio" />
                    <span class="circle"></span>
                    <span class="label">중지</span>
                </label>
            </div>
            <span class="caption">※ 모바일 예약 설정 완료 후 ‘운영'으로 변경해주세요. ‘운영'으로 변경된 시점부터 인투펫 앱 예약이 가능합니다.</span>
        </div>
    </div>

    <div class="contents-wrapper">
        <ul class="form-container">
            <!-- 예약 승인방식 -->
            <li class="form-item">
                <div class="form-label helper">
                    예약 승인방식
                    <div class="help">
                        <img :src="icHint" alt="아이콘">
    
                        <div class="tooltip-content">
                            방문 목적에 따라 예약 승인방식을 선택할 수 있습니다.
                        </div>
                    </div>
                </div>
                <div class="form-content">

                    <div class="purpose-list">
                        <div v-for="(item, index) in visitPurposes" :key="item.id" class="purpose-item">
                            <div class="purpose-input-group">
                                <span class="title-s">방문목적 {{ index + 1 }}</span>
                                <InputTextBox v-model="item.title" placeholder="방문 목적 입력" />
                            </div>

                            <div class="purpose-radio-group">
                                <label class="radio">
                                    <input type="radio" :name="'approval-' + item.id" value="admin" v-model="item.approvalType" />
                                    <span class="circle"></span>
                                    <span class="label">관리자 승인</span>
                                </label>
                                <label class="radio">
                                    <input type="radio" :name="'approval-' + item.id" value="instant" v-model="item.approvalType" />
                                    <span class="circle"></span>
                                    <span class="label">즉시 승인</span>
                                </label>
                            </div>

                            <div class="purpose-action">
                                <button v-if="index === 0" class="btn btn--size-24 btn--black-outline" @click="addPurpose">
                                    <img :src="icPlus" alt="아이콘">항목 추가
                                </button>
                                <button v-else class="btn btn--size-24 btn--black-outline" @click="removePurpose(item.id)">
                                    <img :src="icDel" alt="아이콘" width="14">삭제
                                </button>
                            </div>

                        </div>

                    </div>

                </div>
            </li>

            <!-- 예약가능 동물 수 -->
            <li class="form-item">
                <div class="form-label">예약가능 동물 수</div>
                <div class="form-content">
                    <div class="d-flex align-center gap-16">
                        <div class="d-flex align-center gap-4 body-s">
                            매 30분 마다 최대
                            <CustomSingleSelect 
                                v-model="selectedAnimalCount" 
                                :options="animalCountOptions" 
                                select-width="63px" 
                                placeholder="0" 
                            />
                            마리까지 예약 가능
                        </div>
                        <span class="caption">
                            ※ 예약 가능한 동물 수는 IntoVet GE, 인투펫 예약 데이터와 연동되어 제공되는 기능입니다.
                        </span>
                    </div>
                </div>
            </li>

            <!-- 알림톡 수신번호 설정 -->
            <li class="form-item">
                <div class="form-label">알림톡 수신번호 설정</div>
                <div class="form-content" >

                    <div class="receiver-header">
                        <div class="d-flex align-center gap-10">
                            <span class="body-s">서비스 이용 ON</span>
                            <label class="toggle">
                                <input type="checkbox" />
                                <img class="toggle-img" />
                            </label>
                        </div>
                        <div class="d-flex align-center gap-8">
                            <button class="text-button text-button--blue">잔여건수: 16,000</button>
                            <button class="btn btn--size-24 btn--black-outline">
                                <img :src="icSms" alt="아이콘" width="14">SMS 충전하기</button>
                        </div>
                    </div>

                    <div class="receiver-body">
                        <div class="info-box">
                            <p class="body-xs">인투펫 모바일 예약이 접수되면, 예약 현황을 카카오 알림톡으로 전달드려요.<br/>알림톡은 IntoVetGE SMS 충전 건수에서 차감되어 메세지가 전송되는 유료 서비스입니다.(알림톡 1건 당 문자 1건 차감) 충전 건수가 부족하면 알림톡이 발송되지 않을 수 있어요 :(</p>
                        </div>

                        <div class="receiver-list">
                            <div v-for="(item, index) in receiverPhones" :key="item.id" class="receiver-item">
                                <div class="receiver-input-group">
                                    <span class="title-s">번호 {{ index + 1 }}</span>
                                    <InputTextBox v-model="item.phone" />
                                </div>

                                <div class="receiver-action">
                                    <button v-if="index === 0" class="btn btn--size-24 btn--black-outline" @click="addReceiver">
                                        <img :src="icPlus" alt="아이콘">번호 추가
                                    </button>
                                    <button v-else class="btn btn--size-24 btn--black-outline" @click="removeReceiver(item.id)">
                                        <img :src="icDel" alt="아이콘" width="14">삭제
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </li>

            <!-- 안내사항 -->
            <li class="form-item form-footer">
                <div class="d-flex align-center gap-4">
                    <img :src="icInfo" alt="아이콘">
                    <span class="body-s">카카오 알림톡을 이용하지 않아도 예약 현황을 무료로 안내받을 수 있는 서비스가 있어요!</span>
                </div>

                <div class="footer-action">
                    <a href="https://intolink.co.kr/cscenter/noticeDet/18" target="_blank" class="title-xs">Push 알림 기능 이용법 알아보기</a>
                    <img :src="icArrowR" alt="아이콘">
                </div>
            </li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
    .caption {
        color: $gray-500;
    }
    .line {
        width: 1px;
        height: 22px;
        background-color: $gray-200;
    }
    .form-label {
        width: 133px;
    }
    .info-box {
        padding: 15px;

        border-radius: 5px;
        background-color: $primary-50;
        color: $gray-700;

        p.body-xs {
            line-height: 17px;
        }
    }
    .footer-action {
        display: flex;
        align-items: center;
        gap: 4px;
        color: $primary-700;
        
        a {
            line-height: 1;
        }
    }

    .purpose-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .purpose-item {
            display: flex;
            align-items: center;
            gap: 16px;

            .purpose-input-group {
                display: flex;
                align-items: center;
                gap: 8px;
                
                .title-s {
                    min-width: 65px; 
                }
            }

            .purpose-radio-group {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .purpose-action {
                display: flex;
                align-items: center;
            }
        }
    }

    .receiver-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 570px;
    }

    .receiver-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 570px;
    }

    .receiver-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .receiver-item {
            display: flex;
            align-items: center;
            gap: 16px;

            .receiver-input-group {
                display: flex;
                align-items: center;
                gap: 8px;
                
                .title-s {
                    min-width: 60px;
                }
            }

            .receiver-action {
                display: flex;
                align-items: center;
            }
        }
    }
</style>