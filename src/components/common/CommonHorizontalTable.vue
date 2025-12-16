<!-- Horizontal table -->
<script setup>
import { defineProps } from 'vue';
import icEmpty from '@/assets/icons/ic_empty.svg'
import icMore from '@/assets/icons/ic_more_btn.svg'

const props = defineProps({
    title: { type: String, default: '' },
    tableRoute: { type: [String, Object], default: null }, // 타이틀 화살표 버튼으로 이동하는 route 경로
    tableLink: { type: String }, // 타이틀 화살표 버튼으로 이동하는 url link 경로
    details: { type: Array }, // 배열 요소는 { label: string, value: any, class?: string, hideLabel?: boolean } 형태
    maxHeight: { type: Number, default: null } // 테이블 최대 높이 설정 (px 단위)
})
</script>

<template>
    <div class="table-section">
        <!-- 테이블 타이틀 있는 경우  -->
        <div v-if="title" class="table-title">
            <p class="heading-s">{{ title }}</p>
            <RouterLink v-if="tableRoute" :to="tableRoute" class="table-link">
                <img :src="icMore" alt="더보기">
            </RouterLink>
            <a v-if="tableLink" :href="tableLink" target="_blank" class="table-link">
                <img :src="icMore" alt="더보기">
            </a>
        </div>

        <div class="table-wrapper" :style="{ maxHeight: maxHeight ? `${maxHeight}px` : 'auto' }">
            <table v-if="details.length > 0" class="table">
                <tbody>
                    <tr v-for="(item, index) in details" :key="index">
                        <th v-if="!item.hideLabel">
                            {{ item.label }}
                        </th>
                        
                        <td :colspan="item.hideLabel ? 2 : 1">
                            <template v-if="item.html">
                                <span v-html="item.value"></span>
                            </template>
                            <template v-else>
                                {{ item.value }}
                            </template>
                        </td>
                    </tr>
                </tbody>
            </table>

            <template v-else>
                <div class="empty-box">
                    <img :src="icEmpty" alt="비어있음 아이콘">
                    <span>해당 정보가 없습니다.</span>
                </div>
            </template>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.table-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid $gray-200;
    background-color: $gray-00;
}
.table-title {
    display: flex;
    align-items: center;
    gap: 8px;
}
.table-wrapper {
    width: 100%;
    flex: 1 1 auto;
    height: 100%;
    overflow-y: auto;
    // border-bottom: 1px solid $gray-300;
    border-top: 2px solid $gray-700;
    background-color: $gray-00;
}
.table {
    width: 100%;
    border-spacing: 0;
    border-collapse: collapse;
    table-layout: fixed;

    th {
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
        color: $gray-700;
        background-color: $gray-50;
        border-bottom: 1px solid $gray-300;
        text-align: left;
        padding: 0 10px;
        white-space: nowrap;

        &--text-left { text-align: left}
    }

    td {
        @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
        color: $gray-900;
        border-bottom: 1px solid $gray-300;
        padding: 0 8px;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        background-color: $gray-00;
    }

    tbody tr { 
        height: 36px;

        &:hover td {background-color: $primary-50}

        &--canceled {
            td { color: $gray-400; }
        }

        // &:last-child th, &:last-child td {border-bottom: none;}
    }
}
.empty-box {
    height: 100%;
    background-color: $gray-00;
}
</style>