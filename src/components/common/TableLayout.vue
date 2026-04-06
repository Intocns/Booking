<script setup>
import SearchFilter from './SearchFilter.vue';
import CommonTable from './CommonTable.vue';
import { ref } from 'vue';

const props = defineProps({
    isMobile: {type:Boolean, default: false},
})

const emit = defineEmits(['row-click', 'search'])
defineOptions({
    inheritAttrs: false
})
// const props = defineProps({
//     columns: { type: Array },
//     rows: { type: Array },
//     // filterOptions와 같이 TableLayout이 직접 필요로 하는 props만 여기서 정의
// });

</script>

<template>
    <div v-if="!isMobile" class="table-content">
        <div class="search-filter-wrapper">
            <div class="search-filter">
                <slot name="filter"></slot>
            </div>
        </div>

        <slot name="table"></slot>
    </div>

    <div v-else class="table-content mobile">
        <div class="mobile-search-filter">
            <slot name="filter"></slot>
        </div>

        <div class="border"></div>

        <slot name="table"></slot>
    </div>
</template>

<style lang="scss" scoped>
    .table-content {
        width: 100%;
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        gap: 16px;
        min-height: 0;

        &.mobile {
            padding: 24px 0 20px 0;
            border-radius: 16px;
            border: 1px solid $gray-200;
            background-color: $gray-00;
            height: auto;
            flex:none;

            .mobile-search-filter {
                padding: 0 20px;
            }

            .border {
                width: 100%;
                height: 1px;
                background-color: $gray-100;
            }
        }
    }

    .search-filter-wrapper {
        display: flex;
        padding: 20px 16px;
        align-items: flex-start;
        gap: 10px;
        border-radius: 8px;
        border: 1px solid $gray-200;
        background-color: $gray-00;
        width: 100%;
    }

    .search-filter {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
    }
</style>