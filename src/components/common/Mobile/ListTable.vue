<!-- 모바일 환경 > 전체예약조회, 대기예약조회의 리스트 테이블 -->
<script setup>
import { RESERVE_STATUS_OPTIONS, RESERVE_ROUTE_OPTIONS, PET_GENDER_SHORT_MAP, RESERVE_STATUS_SHORT_MAP, RESERVE_STATUS_CLASS_MAP } from "@/constants";

import { useModalStore } from "@/stores/modalStore";
import { useReservationStore } from "@/stores/reservationStore";

// 예약 경로 아이콘
import icNaver from '@/assets/icons/mobile/ic_res_naver.svg'
import icIntoPet from '@/assets/icons/mobile/ic_res_intoPet.svg'
import icIntoLink from '@/assets/icons/mobile/ic_res_intolink.svg'
import icEmpty from '@/assets/icons/ic_empty.svg'

const reservationStore = useReservationStore();

// 예약 경로 아이콘 매핑
const pathIcons = {
    1: icIntoLink,
    2: icIntoPet,
    4: icNaver,
};

const props = defineProps({
    rows: {type: Array, default: null},
})

const handelReserveDetail = (row) => {
    reservationStore.getReserveInfo(row.idx);
};

// clinicType별 표시 항목 정의
const showTime = (type) => type === '개인일정' || type === '일반예약';
const showPetName = (type) => type !== '개인일정';
const showUserName = (type) => type !== '개인일정';
const showPhone = (type) => type !== '개인일정';
const showSpecies = (type) => type !== '미용' && type !== '미용예약' && type !== '개인일정';
const showBreed = (type) => type === '진료예정' || type === '일반예약';
const showHospitalMemo = (type) => type === '진료예정' || type === '미용' || type === '미용예약' || type === '개인일정';
</script>

<template>
    <div class="mobile-list-table-wrapper">
        <div v-for="row in rows" class="list" @click="handelReserveDetail(row)">
            <!-- 상단: 날짜 + 시간(개인일정/일반예약만) + 상태 -->
            <div class="list__top">
                <div class="time title-s-mobile">
                    <span>{{ row.reTimeTxt }}</span>
                    <span v-if="showTime(row.clinicType) && row.reTimeHisTxt">{{ row.reTimeHisTxt }} - {{ row.reTimeAndTxt }}</span>
                </div>

                <div class="flag" :class="RESERVE_STATUS_CLASS_MAP[row.inState]">
                    {{ RESERVE_STATUS_SHORT_MAP[row.inState] }}
                </div>
            </div>

            <div class="list__bottom">
                <!-- 고객/동물 정보 (개인일정은 미표시) -->
                <div v-if="showPetName(row.clinicType) || showUserName(row.clinicType)" class="list__bottom__top">
                    <div class="reserve-info">
                        <div class="info">
                            <span v-if="showPetName(row.clinicType)" class="name pet">{{ row.petName }}</span>
                            <span v-if="showPetName(row.clinicType) && showUserName(row.clinicType) && row.userName" class="dot"></span>
                            <span v-if="showUserName(row.clinicType)" class="name user">{{ row.userName }}</span>
                        </div>

                        <span v-if="showPhone(row.clinicType) && row.phoneTxt" class="phone">{{ row.phoneTxt }}</span>
                        <img v-if="pathIcons[row.reRoute]" :src="pathIcons[row.reRoute]" alt="">
                    </div>

                    <!-- 종/품종 -->
                    <div v-if="showSpecies(row.clinicType)" class="pet-info">
                        <span>{{ row.speciesName }}</span>
                        <template v-if="showBreed(row.clinicType) && row.breedName">
                            <span class="dot"></span>
                            <span>{{ row.breedName }}</span>
                        </template>
                    </div>
                </div>

                <div class="border"></div>

                <!-- 예약 내용 / 담당의 / 메모 -->
                <div class="list__bottom__bottom">
                    <div class="product-info">
                        <span class="room-name">{{ row.clinicType === '개인일정' ? '개인일정' : row.clinicType === '일반예약' ? '일반 예약' : row.roomName }}</span>
                        <span class="doctor">{{ row.doctor }}</span>
                    </div>
                    <!-- 병원 메모 (진료예정/미용/개인일정만) -->
                    <div v-if="showHospitalMemo(row.clinicType) && row.geReMemo" class="memo-wrapper">
                        <p class="memo">{{ row.geReMemo }}</p>
                    </div>
                </div>

                <div class="created">
                    <span>접수</span>
                    <span>{{ row.createdAtTxt }}</span>
                </div>
            </div>
        </div>

        <div v-if="rows.length == 0" class="empty-wrapper">
            <div class="empty-box">
                <img :src="icEmpty" alt="">
                <span>조회 내역이 없습니다.</span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.mobile-list-table-wrapper {
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.list {
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    border: 1px solid $gray-200;
    background-color: $gray-00;
    overflow: hidden;

    &__top {
        padding: 12px 16px;
        display: flex;
        border-radius: 8px 8px 0 0;
        justify-content: space-between;
        align-items: center;
        background-color: $gray-50;

        .time {
            @include flex-center;
            gap: 8px;
            color: $gray-800;
        }
    }

    &__bottom {
        @include flex-center;
        flex-direction: column;
        padding:16px;
        gap:16px;

        &__top {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width:100%;

            .reserve-info {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 8px;

                .info {
                    flex: 1 0 0;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 6px;
                    row-gap:0;

                    .name {
                        @include typo($title-l-mobile-size, $title-l-mobile-weight, $title-l-mobile-spacing, $title-l-mobile-line);
                    }
                }

                .phone {
                    color: $gray-700;
                    @include typo($body-m-mobile-size, $body-m-mobile-weight, $body-m-mobile-spacing, $body-m-mobile-line);
                    white-space: nowrap;
                }
            }

            .pet-info {
                width: 100%;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
                row-gap:0;

                color: $gray-700;
                @include typo($body-m-mobile-size, $body-m-mobile-weight, $body-m-mobile-spacing, $body-m-mobile-line);
            }
        }

        .border {
            width: 100%;
            height: 1px;
            background-color: $gray-100;
        }

        &__bottom {
            width: 100%;
            
            .product-info {
                display: flex;
                gap:8px;
                @include typo($caption-mobile-size, $caption-mobile-weight, $caption-mobile-spacing, $caption-mobile-line);
                
                .room-name {
                    flex: 2 0 0;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .doctor {
                    flex:1;
                    text-align: right;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 65px;
                }
            }
            .memo {
                width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                color: $gray-600;
                @include typo($caption-mobile-size, $caption-mobile-weight, $caption-mobile-spacing, $caption-mobile-line);
            }
        }

        .created {
            width: 100%;
            display: flex;
            gap:12px;

            @include typo($caption-mobile-size, $caption-mobile-weight, $caption-mobile-spacing, $caption-mobile-line);
            color: $gray-400;
        }
    }
}

.empty-wrapper {
    width: 100%;
    height: 100%;
    @include flex-center;

    .empty-box {
        gap:16px;
        height: 400px;
        
        color: $gray-400;
        @include typo($body-m-mobile-size, $body-m-mobile-weight, $body-m-mobile-spacing, $body-m-mobile-line);
    }
}

.dot {
    width: 2px;
    height: 2px;
    background-color: $gray-500;
    display: block;
}
</style>