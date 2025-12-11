<!-- 테이블 컴포넌트 -->
<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    columns: { type: Array, required: true },   // [{ key:'name', label:'이름', width:'100px' }]
    rows: { type: Array, required: true },      // [{ name:'철이', phone:'010...' }]
})
</script>

<template>
    <div class="table-section">
        <div class="table-wrapper">
            <table class="table">
                <!-- thead -->
                <thead>
                    <tr>
                        <th v-for="col in columns" :key="col.key" :style="{ width: col.width || 'auto' }">
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
                        >
                            <!-- 기본 데이터 출력 -->
                            <span v-if="!$slots[col.key]">{{ row[col.key] }}</span>

                            <!-- 커스텀 슬롯 존재 시 -->
                            <slot
                                v-else
                                :name="col.key"
                                :row="row"
                                :value="row[col.key]"
                                :rowIndex="rIndex"
                            />
                        </td>

                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.table-section {
    width: 100%;
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid $gray-200;
    background-color: $gray-00;
}

.table-wrapper {
    width: 100%;
    flex: 1 1 auto;
    height: 100%;
    overflow-y: auto;
    border-bottom: 1px solid $gray-100;
    border-top: 2px solid $gray-700;
}

.table {
    width: 100%;
    border-spacing: 0;
    border-collapse: collapse;
    
    thead {
        position: sticky;
        top: 0;
        z-index: 5;
        background-color: $gray-50;
        border-bottom: 1px solid $gray-50;

        tr { height: 40px; }
    }

    tbody tr { 
        height: 40px;

        &:hover {background-color: $primary-50}

        &--canceled {
            td { color: $gray-400; }
        }
    }

    th {
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
        color: $gray-700;
        border-bottom: 1px solid $gray-100;
        text-align: left;
        padding: 0 8px;
        text-align: center;
        white-space: nowrap;

        &--text-left { text-align: left}
    }

    td {
        @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
        color: $gray-900;
        border-bottom: 1px solid $gray-100;
        padding: 0 8px;
        text-align: center;
        white-space: nowrap;
    }
}
</style>