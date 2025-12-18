<!-- 테이블 컴포넌트 -->
<script setup>
import { defineProps } from 'vue';
import icEmpty from '@/assets/icons/ic_empty.svg'
import icMore from '@/assets/icons/ic_more_btn.svg'
import icInformation from '@/assets/icons/ic_information_blue.svg'

const props = defineProps({
    title: { type: String, default: '' },
    tableRoute: { type: [String, Object], default: null },  // 타이틀 화살표 버튼으로 이동하는 route 경로
    tableLink: { type: String }, // 타이틀 화살표 버튼으로 이동하는 url link 경로
    columns: { type: Array },   // [{ key:'name', label:'이름', width:'100px' }]
    rows: { type: Array},      // [{ name:'철이', phone:'010...' }]
    tableEmptyText: { type: String, default: '검색 결과가 없습니다.' }, // 테이블이 비었을 때 보여줄 서브 텍스트
    tableEmptySubText: { type: String, default: '' }, // 테이블이 비었을 때 보여줄 서브 텍스트
    noThead: {type: Boolean, default: false}, // thead 노출 여부
    hasInfoIcons: {type: Boolean, default: false },
})
</script>

<template>
    <div class="table-section">

        <!-- 테이블 타이틀 있는 경우  -->
        <div v-if="title" class="table-title">
            <div class="title-wrapper">
                <p class="heading-s d-flex gap-8">
                    {{ title }}
                    <img v-if="hasInfoIcons" :src="icInformation" alt="안내아이콘" class="helper__icon">
                </p>
                <RouterLink v-if="tableRoute" :to="tableRoute" class="table-link">
                    <img :src="icMore" alt="더보기">
                </RouterLink>
                <a v-if="tableLink" :href="tableLink" target="_blank" class="table-link">
                    <img :src="icMore" alt="더보기">
                </a>
            </div>

            <slot name="right"></slot>
        </div>

        <div class="table-wrapper">
            <table class="table">
                <colgroup>
                    <col v-for="(col, idx) in columns" :key="idx" :width="col.width">
                </colgroup>
                <!-- thead -->
                <thead v-show="!noThead">
                    <tr>
                        <th v-for="col in columns" :key="col.key" :style="{ textAlign: col.text_align }">
                            {{ col.label }}
                        </th>
                    </tr>
                </thead>
                <!-- tbody -->
                <tbody>
                    <tr v-for="(row, rIndex) in rows" :key="rIndex">
                        
                        <td
                            v-for="col in columns"
                            :key="col.key"
                            :style="{ textAlign: col.text_align }"
                        >
                            <!-- 기본 데이터 출력 -->
                            <span v-if="!$slots[col.key]">{{ row[col.key] }}</span>

                            <!-- 커스텀 슬롯 존재 시 -->
                            <div v-else class="d-flex justify-center gap-4">
                                <slot
                                    :name="col.key"
                                    :row="row"
                                    :value="row[col.key]"
                                    :rowIndex="rIndex"
                                />
                            </div>
                        </td>

                    </tr>
                </tbody>
            </table>

            <template v-if="rows.length == 0">
                <div class="empty-box">
                    <img :src="icEmpty" alt="비어있음 아이콘">
                    <span class="title-s">{{ tableEmptyText }}</span>
                    <p class="body-m">{{ tableEmptySubText }}</p>
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
    justify-content: space-between;
    

    .title-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
    }
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
    
    thead {
        position: sticky;
        top: 0;
        z-index: 5;
        background-color: $gray-50;
        border-bottom: 1px solid $gray-300;

        tr { height: 40px; }
    }

    th {
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
        color: $gray-700;
        border-bottom: 1px solid $gray-300;
        text-align: left;
        padding: 0 8px;
        text-align: center;
        white-space: nowrap;

        &--text-left { text-align: left}
    }

    td {
        @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
        color: $gray-900;
        border-bottom: 1px solid $gray-300;
        padding: 0 8px;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    tbody tr { 
        height: 36px;
        background-color: $gray-00;

        &:hover {background-color: $primary-50}

        &--canceled {
            td { color: $gray-400; }
        }

        // &:last-child td {border-bottom: none;}
    }

}

.empty-box {
    height: calc(100% - 41px);
    background-color: $gray-00;
}
</style>