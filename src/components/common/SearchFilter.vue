<!-- 검색필터 컴포넌트 -->
<script setup>
import CustomSelect from './CustomSelect.vue';
import FilterDate from './filters/FilterDate.vue';
import FilterSelect from './filters/FilterSelect.vue';
import FilterKeyword from './filters/FilterKeyword.vue';

import { ref, computed } from 'vue';

const props = defineProps({
    showKeyword: Boolean,
})

// 담당의 예시
const doctors = [
    { label: '담당1', value : '1'},
    { label: '담당2', value : '2'},
]
const selectedDoctors = ref([])

const statusOptions = [
  { label: '예약확정', value: 1 },
  { label: '예약대기', value: 2 },
  { label: '예약취소', value: 3 }
];
const filters = ref({
  status: [0],
})
</script>

<template>
    <div class="search-filter-wrapper">
        <div class="search-filter">

            <!-- 일자 필터 -->
            <FilterDate />

            <!-- 예약상태 -->
            <FilterSelect
                label="예약상태"
                :options="statusOptions"
                v-model="filters.status"
            />

            <!-- 담당의 -->
            <FilterSelect
                label="담당의"
                :options="doctors"
                v-model="selectedDoctors"
            />

            <!-- 검색 -->
            <FilterKeyword v-if="showKeyword" />

            <!-- 초기화 버튼 -->
            <div class="search-filter__actions">
                <button class="btn btn--size-32 btn--blue">초기화</button>
            </div>
        </div>
    </div>
</template>