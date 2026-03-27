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
</script>

<template>
    <div class="mobile-list-table-wrapper">
        <div v-for="row in rows" class="list" @click="handelReserveDetail(row)">
            <div class="list__top">
                <div class="time title-s-mobile">
                    <span>{{ row.reTimeTxt }}</span>
                    <span>{{ row.reTimeHisTxt }}</span>
                </div>

                <div class="flag" :class="RESERVE_STATUS_CLASS_MAP[row.inState]">
                    {{ RESERVE_STATUS_SHORT_MAP[row.inState] }}
                </div>
            </div>
            <div class="list__bottom">
                <div class="list__bottom__top">
                    <div class="reserve-info">
                        <div class="info"> 
                            <span class="name pet">{{ row.petName }}</span>
                            <span class="dot"></span>
                            <span class="name user">{{ row.userName }}</span>
                            <span class="phone">{{ row.phoneTxt }}</span>
                        </div>
    
                        <img :src="pathIcons[row.reRoute]" alt="">
                    </div>
    
                    <div class="pet-info">
                        <span>{{ row.speciesName }}</span>
                        <span class="dot"></span>
                        <span>{{ PET_GENDER_SHORT_MAP[row.petSex] }}</span>
                    </div>
                </div>
                
                <div class="border"></div>

                <div class="list__bottom__bottom">
                    <div class="product-info">
                        <span class="room-name">{{ row.roomName }}</span>
                        <span class="doctor">{{ row.doctor }}</span>
                    </div>
                    <div class="memo-wrapper">
                        <p class="memo"{{ row.reMemo }}></p>
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
                gap:16px;
    
                .info {
                    flex: 1 0 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
    
                    .name { 
                        @include typo($title-l-mobile-size, $title-l-mobile-weight, $title-l-mobile-spacing, $title-l-mobile-line);
                        text-overflow: ellipsis;
                        overflow: hidden;
                        white-space: nowrap;
                        &.pet {max-width: 80px;}
                        &.user {max-width: 60px;}
                    }
                    .phone {
                        @include typo($body-m-mobile-size, $body-m-mobile-weight, $body-m-mobile-spacing, $body-m-mobile-line);
                        text-overflow: ellipsis;
                        // overflow: hidden;
                        white-space: nowrap;
                        // max-width: 110px;
                    }
                }
            }
    
            .pet-info {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 8px;
    
                color: $gray-700;
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
                    flex: 1 0 0;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
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