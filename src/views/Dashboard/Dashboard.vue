<script setup>
// 아이콘
import icTotal from '@/assets/icons/ic_total.svg'
import icWaiting from '@/assets/icons/ic_waiting.svg'
import icNaver from '@/assets/icons/ic_naver_w.svg'
import icInto from '@/assets/icons/ic_into_w.svg'
import icIntoPet from '@/assets/icons/ic_intoPet_w.svg'
// 컴포넌트
import CommonTable from '@/components/common/CommonTable.vue'
import CommonHorizontalTable from '@/components/common/CommonHorizontalTable.vue'

import { onMounted, ref } from 'vue'
import { useReservationStore } from '@/stores/reservationStore'
import { useHospitalStore } from '@/stores/hospitalStore'
import { storeToRefs } from 'pinia'

const todayDate = ref(''); // 오늘 날짜 저장

const getTodayDate = () => { // 날짜 형식 포맷팅
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}.${month}.${day}`
}

const reservationStore = useReservationStore();
const hospitalStore = useHospitalStore();

// storeToRefs를 사용하여 reserveCount를 반응형 ref로 가져옴
const { reserveCount: count } = storeToRefs(reservationStore); // 'count'라는 이름으로 사용
// TODO: 기본 두자리수 표기, 세자리수 까지 표기, 세자리수 넘어가면 +999 로 표기

// 대기중인 예약 테이블 col 정의
const columns = [
    { key: 'idx', label: 'No.', width: '5%' },
    { key: 're_time', label: '예약일자', width: '10%' },
    { key: '', label: '예약시간', width: '5%' },
    { key: '', label: '상품명/진료실명', width: '10%' },
    { key: 'user_name', label: '고객명', width: '10%' },
    { key: 'phone', label: '전화번호', width: '15%' },
    { key: 'pet_name', label: '동물명', width: '15%' },
    { key: 'species_name', label: '종', width: '10%' },
    { key: '', label: '고객 메모', width: '20%' },
    { key: '', label: '예약경로', width: '10%' },
    { key: '', label: '접수일시', width: '15%' },
    { key: '', label: '관리', width: '15%' },
]

// 병원정보 테이블 데이터 (임시)
// const hospitalDetails = [
//     { label: '병원명', value: '인투씨엔에스 동물병원' },
//     { label: '전화번호', value: '064-1234-5678' },
//     { label: '주소', value: '경기도 용신시 수지구123' },
//     { label: '상세주소', value: 'A동 678호', },
//     // <th>가 없는 경우 (hideLabel: true 사용)
// ];
const hospitalDetails = [
    { key: 'name', label: '병원명' },
    { key: 'tel', label: '전화번호' },
    { key: 'addr', label: '주소' },
    { key: '', label: '상세주소' },
    // <th>가 없는 경우 (hideLabel: true 사용)
];

// 공지사항 테이블 데이터 (임시)
const noticeDetails = [
    { label: '2023-09-01', value: '인투씨엔에스 예약 시스템 오픈 안내', hideLabel: true },
    { label: '2023-08-15', value: '시스템 점검 안내', hideLabel: true },
    { label: '2023-07-30', value: '신규 기능 업데이트 안내', hideLabel: true },
];

onMounted(() => {
    // 예약별 카운트
    reservationStore.getReserveCount();

    // 대기 예약 리스트 불러오기
    reservationStore.getPendingList();

    // 병원 정보 가져오기
    hospitalStore.getHospitalInfo();

    todayDate.value = getTodayDate();
})
</script>

<template>
    <!-- header -->
    <div class="summary--header">
        <!-- today -->
        <div class="summary--header__section">
            <div class="summary--header__today">
                <p class="title heading-s">TODAY</p>
                <h2 class="date">{{ todayDate }}</h2>
            </div>

            <!-- 예약별 count -->
            <div class="summary--header__counts">
                <!-- total -->
                <div class="count-card count-card--total">
                    <div class="count-card__title">
                        <div class="icon_wrapper">
                            <img :src="icTotal" alt="total icon">
                        </div>
                        <span class="body-m">Total</span>
                    </div>

                    <div class="count-card__value">
                        <p class="val blue">{{ count.total_cnt }}</p>
                        <span class="txt">건</span>
                    </div>
                </div>

                <!-- waiting -->
                <div class="count-card count-card--waiting">
                    <div class="count-card__title">
                        <div class="icon_wrapper">
                            <img :src="icWaiting" alt="waiting icon">
                        </div>
                        <span class="body-m">Waiting</span>
                    </div>

                    <div class="count-card__value">
                        <p class="val blue">{{ count.cnt_1 }}</p>
                        <span class="txt">건</span>
                    </div>
                </div>

                <!-- naver -->
                <div class="count-card count-card--waiting">
                    <div class="count-card__title">
                        <div class="icon_wrapper naver">
                            <img :src="icNaver" alt="waiting icon">
                        </div>
                        <span class="body-m">Naver</span>
                    </div>

                    <div class="count-card__value">
                        <p class="val">{{ count.cnt_2 }}</p>
                        <span class="txt">건</span>
                    </div>
                </div>

                <!-- intoVetGE -->
                <div class="count-card count-card--waiting">
                    <div class="count-card__title">
                        <div class="icon_wrapper into">
                            <img :src="icInto" alt="waiting icon">
                        </div>
                        <span class="body-m">IntoVet GE</span>
                    </div>

                    <div class="count-card__value">
                        <p class="val">{{ count.cnt_3 }}</p>
                        <span class="txt">건</span>
                    </div>
                </div>

                <!-- intoPEt -->
                <div class="count-card count-card--waiting">
                    <div class="count-card__title">
                        <div class="icon_wrapper pet">
                            <img :src="icIntoPet" alt="waiting icon">
                        </div>
                        <span class="body-m">IntoPet</span>
                    </div>

                    <div class="count-card__value">
                        <p class="val">{{ count.cnt_4 }}</p>
                        <span class="txt">건</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 대기중인 예약 -->
    <div class="dashboard--table-wrapper">
        <CommonTable 
            title="대기중인 예약"
            :table-route="{ name: 'pendingList' }"
            :columns="columns" 
            :rows="reservationStore.reservePendingList"
        />
    </div>

    <!-- 병원정보 && 공지사항 표시 -->
    <div class="dashboard--bottom">
        <div class="dashboard--bottom__left">
            <!-- 병원 정보 -->
            <CommonHorizontalTable
                title="병원정보"
                :table-link="'https://intolink.co.kr/mylink/hospital'"
                :details="[hospitalStore.hospitalInfo]"
                :max-height="150"
            />
        </div>
        <div class="dashboard--bottom__right">
            <!-- 공지사항 -->
            <CommonHorizontalTable 
                title="공지사항"
                :table-link="'https://intolink.co.kr/cscenter/notice'"
                :details="[]"
                :max-height="150"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .summary--header {
        width: 100%;

        &__section {
            width: 100%;
            display: flex;
            gap: 16px;
        }

        &__today {
            display: flex;
            flex-direction: column;
            justify-content: space-between;

            .title {color: $gray-900;}
            .date {
                color: $gray-900;
                font-size: 48px;
                font-weight: 100;
                line-height: 140%;
                letter-spacing: -0.96;
            }
        }

        &__counts {
            flex: 2;
            display: flex;
            gap: 16px;

            .count-card {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 8px;
                height: 120px;

                border-radius: 28px 8px 8px 8px;
                border: 1px solid $gray-200;
                background-color: $gray-00;

                &__title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                &__value {
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    padding: 0 16px 12px 0;
                    gap: 4px;
                    
                    color: $gray-700;

                    .val {
                        font-size: 40px;
                        font-weight: 700;
                        line-height: 90%;
                        letter-spacing: -0.8px;

                        &.blue {color: $primary-700;}
                    }
                    .txt {
                        font-size: 16px;
                        font-weight: 400;
                        letter-spacing: -0.32px;
                    }
                }
            }
        }
    }

    .dashboard--table-wrapper {
        flex: 2;
        min-height: 0;
    }

    .dashboard--bottom {
        width: 100%;
        flex: 1;
        min-height: 0;
        display: flex;
        gap: 16px;

        &__left {
            flex:1;
        }
        &__right {
            flex:2;
        }
    }

    .icon_wrapper {
        @include flex-center;
        width: 40px;
        height: 40px;
        padding: 2px 8px;
        border-radius: 28px;
        background-color: $primary-50;

        &.naver {background-color: $brand-naver;}
        &.into {background-color: $primary-700;}
        &.pet {background-color: $brand-intoPet;}
    }
</style>