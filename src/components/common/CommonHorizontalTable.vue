<!-- 단일 데이터 테이블 (대시보드 > 공지사항) --> 
<script setup>
import { defineProps } from 'vue';
import icEmpty from '@/assets/icons/ic_empty.svg'
import icMore from '@/assets/icons/ic_more_btn.svg'

const props = defineProps({
    title: { type: String, default: '' },
    tableLink: { type: String }, 
    // columns: 보여주고 싶은 필드들 정의 
    // [{ key: 'name', label: '병원명' }, { key: 'tel', label: '전화번호' } ...]
    columns: { type: Array, default: () => [] }, 
    data: { type: Object, default: () => ({}) }, 
    maxHeight: { type: Number, default: null }
})

const openTarget = (tableLink) => {
    window.open(tableLink)
}
</script>

<template>
    <div class="table-section">
        <div v-if="title" class="table-title">
            <p class="heading-s">{{ title }}</p>
            <!-- <a v-if="tableLink" :href="tableLink" target="_blank" class="table-link">
                <img :src="icMore" alt="더보기">
            </a> -->
            <div v-if="tableLink" class="table-link" @click="openTarget(tableLink)">
                <img :src="icMore" alt="더보기">
            </div>
        </div>

        <div class="table-wrapper" :style="{ maxHeight: maxHeight ? `${maxHeight}px` : 'auto' }">
            <table v-if="data && Object.keys(data).length > 0" class="table">
                <tbody>
                    <tr v-for="col in columns" :key="col.key">
                        <th :style="{ width: col.width }">
                            {{ col.label }}
                        </th>
                        
                        <td>
                            <slot :name="col.key" :value="data[col.key]" :data="data">
                                {{ data[col.key] || '-' }}
                            </slot>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div v-else class="empty-box">
                <img :src="icEmpty" alt="비어있음 아이콘">
                <span>정보가 없습니다.</span>
            </div>
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
.table-link {
    cursor: pointer;
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