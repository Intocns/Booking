<script setup>
import icInformation from '@/assets/icons/ic_information_blue.svg'

// props
const props = defineProps({
    title: { type: String }, // 페이지 제목
    total: { type: Number }, // total
    details: {
        type: Array,
        default: () => [], // 예: [{label:'확정', value: 15}]
    },
    helperText: { type: String, default: ""}, // 안내 문구 (파란색, 인포 아이콘)
    descText: { type: String, default: ""}, // 회색 무눅
})
</script>

<template>
    <div class="page-header">
        <!-- Page Title -->
        <h1 class="page-title heading-m">
            {{ title }}
        </h1>

        <!-- Summary -->
        <div v-if="total" class="page-summary">

            <!-- Total -->
            <div class="page-summary__total">
                <span class="page-summary__total-label title-m">TOTAL</span>
                <span class="page-summary__total-data title-m">{{ total }}</span>
            </div>

            <div class="page-summary__line"></div>
            
            <!-- Detail -->
            <div class="page-summary__detail">
                <div
                    class="page-summary__detail-item"
                    v-for="(item, idx) in details"
                    :key="idx"
                >
                    <span class="page-summary__detail-item-label body-l">
                    {{ item.label }}
                        </span>

                    <!-- value 스타일 (warning이면 빨간색) -->
                    <span
                        class="page-summary__detail-item-data title-m"
                        :class="{ warning: item.warning }"
                    >
                        {{ item.value }}
                    </span>
                </div>
            </div>

        </div>

        <!-- desc text -->
        <div v-if="descText" class="page-header__desc">
            <span class="body-l">{{ descText }}</span>
        </div>

        <!-- Helper -->
        <div v-if="helperText" class="page-header__helper">
            <img :src="icInformation" alt="안내아이콘" class="helper__icon">
            <span class="body-s helper__text">
                {{ helperText }}
            </span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .page-header {
        width: 100%;
        display: flex;
        gap: 16px;
        // justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .page-title {
            color: $gray-900;
        }

        .page-summary {
            display: flex;
            align-items: center;
            gap: 16px;
            flex:2;

            &__total {
                @include flex-center;
                gap: 8px;
            }
            &__total-label {
                overflow: hidden;
                color: $gray-900;
                text-align: center;
                text-overflow: ellipsis;
            }
            &__total-data {
                overflow: hidden;
                color: $primary-700;
                text-align: center;
                text-overflow: ellipsis;
            }

            &__line {
                width: 1px;
                height: 22px;
                background-color: $gray-200;
            }

            &__detail {
                display: flex;
                gap: 16px;
            }

            &__detail-item {
                display: flex;
                gap: 4px;
            }
            &__detail-item-label {
                overflow: hidden;
                text-align: right;
                text-overflow: ellipsis;
                color: $gray-700;
            }
            &__detail-item-data {
                overflow: hidden;
                text-align: right;
                text-overflow: ellipsis;
                color: $gray-900;
                &.warning {color: $warning-500;}
            }
        }

        &__desc {
            color: $gray-700;
        }

        &__helper {
            display: flex;
            align-items: center;
            gap: 3px;

            .helper__icon { width: 16px; }
            .helper__text { color: $primary-700; }
        }
    }
</style>