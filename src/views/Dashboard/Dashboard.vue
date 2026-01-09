<script setup>
// 아이콘
import icTotal from '@/assets/icons/ic_total.svg'
import icWaiting from '@/assets/icons/ic_waiting.svg'
import icNaver from '@/assets/icons/ic_naver_w.svg'
import icInto from '@/assets/icons/ic_into_w.svg'
import icIntoPet from '@/assets/icons/ic_intoPet_w.svg'
import icSms from '@/assets/icons/ic_sms.svg'
// 컴포넌트
import CommonTable from '@/components/common/CommonTable.vue'
import CommonHorizontalTable from '@/components/common/CommonHorizontalTable.vue'
import Modal from '@/components/common/Modal.vue'
import ReserveInfo from '@/components/common/modal-content/ReserveInfo.vue'
import SearchCustomer from '@/components/common/modal-content/SearchCustomer.vue'
import SendSmsTalk from '@/components/common/modal-content/SendSmsTalk.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

import { onMounted, ref } from 'vue'
import { useReservationStore } from '@/stores/reservationStore'
import { useHospitalStore } from '@/stores/hospitalStore'
import { useNoticeStore } from '@/stores/noticeStore'
import { storeToRefs } from 'pinia'
import { formatCount } from '@/utils/countFormatter'
import { formatDateDot } from '@/utils/dateFormatter'

// 스토어
import { useModalStore } from '@/stores/modalStore'

const modalStore = useModalStore();

const todayDate = ref(''); // 오늘 날짜 저장

const getTodayDate = () => { // 날짜 형식 포맷팅
    return formatDateDot(new Date());
}

const reservationStore = useReservationStore();
const hospitalStore = useHospitalStore();
const noticeStore = useNoticeStore();

// storeToRefs를 사용하여 reserveCount를 반응형 ref로 가져옴
const { reserveCount: count } = storeToRefs(reservationStore); // 'count'라는 이름으로 사용

// 대기중인 예약 테이블 col 정의
const columns = [
    { key: 'idx', label: 'No.', width: '6%' },
    { key: 'reTimeTxt', label: '예약일자', width: '7%' },
    { key: 'reTimeHisTxt', label: '예약시간', width: '5%' },
    { key: 'roomName', label: '상품명/진료실명', width: '12%' },
    { key: 'userName', label: '고객명', width: '7%' },
    { key: 'phoneTxt', label: '전화번호', width: '10%' },
    { key: 'petName', label: '동물명', width: '8%' },
    { key: 'speciesName', label: '종', width: '6%' },
    { key: 'reMemo', label: '고객 메모', width: '12%' },
    { key: 'reRouteTxt', label: '예약경로', width: '7%' },
    { key: 'createdAtTxt', label: '접수일시', width: '10%' },
    { key: 'actions', label: '관리', width: '7%' }, // 커스텀 슬롯
]

// 병원 정보 th col 정의
const hospitalColumns = [
    { key: 'name', label: '병원명', width: '120px' },
    { key: 'tel', label: '전화번호', width: '120px' },
    { key: 'addr', label: '주소', width: '120px' },
];

// 공지사항 테이블 col (임시)
const noticeColumns = [
    { key: 'title', label: '제목', width: '90%', text_align: 'left'},
    { key: 'createdAtTxt', label: '작성일', width: '10%'},
];

//공지사항 클릭 이벤트 => 이동
const openNoticeDetail = (row) => {
  window.open('https://intolink.co.kr/cscenter/noticeDet/'+row.idx)
}

// 예약 상세보기 핸들러
const handelReserveDetail = (reserveIdx) => {
    reservationStore.getReserveInfo(reserveIdx)
}

onMounted(() => {
    // 예약별 카운트
    reservationStore.getReserveCount();

    // 대기 예약 리스트 불러오기
    reservationStore.getPendingList();

    // 병원 정보 가져오기
    hospitalStore.getHospitalInfo();

    // 공지사항 리스트 가져오기
    noticeStore.getNoticeList();

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
                        <p class="val blue">{{ formatCount(count.total_cnt) }}</p>
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
                        <p class="val blue">{{ formatCount(count.cnt1) }}</p>
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
                        <p class="val">{{ formatCount(count.cnt2) }}</p>
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
                        <p class="val">{{ formatCount(count.cnt3) }}</p>
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
                        <p class="val">{{ formatCount(count.cnt4) }}</p>
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
        >
            <!-- 예약경로 앞에 dot -->
            <template #re_route_txt="{ row, value }">
                <div class="status-cell">
                    <span class="dot" :class="`dot--route-${row.reRoute}`"></span>
                    {{ value }}
                </div>
            </template>
            
            <!-- 버튼 -->
            <template #actions="{ row, rowIndex }">
                <button class="btn btn--size-24 btn--black-outline" @click="handelReserveDetail(row.idx)">
                    상세
                </button>
                <button class="btn btn--size-24 btn--black-outline" @click="modalStore.smsModal.openModal()">
                    <img :src="icSms" alt="SMS">
                </button>
            </template>

        </CommonTable>
    </div>

    <!-- 병원정보 && 공지사항 표시 -->
    <div class="dashboard--bottom">
        <div class="dashboard--bottom__left">
            <!-- 병원 정보 -->
            <CommonHorizontalTable
                title="병원정보"
                :columns="hospitalColumns"
                :table-link="'https://intolink.co.kr/mylink/hospital'"
                :data="hospitalStore.hospitalInfo"
                :max-height="150"
            />
        </div>
        <div class="dashboard--bottom__right">
            <!-- 공지사항 -->
            <CommonTable 
                title="공지사항"
                :table-link="'https://intolink.co.kr/cscenter/notice'"
                :columns="noticeColumns"
                :rows="noticeStore.noticeList"
                @row-click="openNoticeDetail"
                :no-thead="true"
            />
        </div>
    </div>

    <!-- 예약 정보 안내 모달 -->
    <Modal
        v-if="modalStore.reserveInfoModal.isVisible"
        size="m"
        title="고객 예약 정보"
        :modalState="modalStore.reserveInfoModal"
    >
        <ReserveInfo />
    </Modal>

    <!--  고객 예약 정보 > 고객 검색 모달 -->
    <Modal
        v-if="modalStore.searchCustomerModal.isVisible"
        size="m"
        title="고객 검색"
        :modalState="modalStore.searchCustomerModal"
    >
        <SearchCustomer />
    </Modal>

    <!-- 문자 발송 모달 -->
    <Modal 
        v-if="modalStore.smsModal.isVisible"
        size="s"
        title="문자 발송"
        :modalState="modalStore.smsModal"
    >
        <SendSmsTalk />
    </Modal>

    <!-- 문자 발송 확인 모달 -->
    <ConfirmModal />
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