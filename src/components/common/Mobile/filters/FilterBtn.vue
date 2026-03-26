<!-- 모바일 검색필터 버튼 (클릭시 바텀시트 > 검색 필터 선택 )-->
<script setup>
import { ref, watch } from 'vue';
import BottomSheet from '../BottomSheet.vue';

import icFilterB from '@/assets/icons/mobile/ic_filter_b.svg'
import icFilterW from '@/assets/icons/mobile/ic_filter_w.svg'
import icDropdown from '@/assets/icons/mobile/ic_dropdown.svg'

const props = defineProps({
    status: { type: Array, default: () => ['all'] },
    channel: { type: Array, default: () => ['all'] },
    sort: { type: String, default: () => '0' },
    statusOptions: { type: Array, default: () => [] },
    channelOptions: { type: Array, default: () => [] },
    sortOptions: { type: Array, default: () => [] },
    showResetBtn: { type: Boolean, default: false },
});

const emit = defineEmits(['update:status', 'update:channel', 'update:sort']);
const isOpen = ref(false);
 
// 바텀시트 안에서만 쓰일 임시 값 (저장 전까지 부모는 모름)
const tempStatus = ref([...props.status]);
const tempChannel = ref([...props.channel]);
const tempSort = ref(props.sort);
const activeGroups = ref({
    sort: true,
    channel: true,
    status: true
});

// 그룹 토글 함수
const toggleGroup = (groupName) => {
    activeGroups.value[groupName] = !activeGroups.value[groupName];
};

// 바텀시트가 열릴 때 부모의 최신 값을 임시 값에 복사 (동기화)
watch(isOpen, (val) => {
    if (val) {
        tempStatus.value = [...props.status];
        tempChannel.value = [...props.channel];
        tempSort.value = props.sort;
    }
});

// 정렬 선택 (단일 선택)
const selectSort = (val) => {
    tempSort.value = val;
};

// 다중 선택 공통 로직
const toggleMultiSelect = (type, value, options) => {
    const target = type === 'status' ? tempStatus : tempChannel;
    let newValue = JSON.parse(JSON.stringify(target.value));

    const individualOptionValues = options.filter(o => o.value !== 'all').map(o => o.value);

    if (value === 'all') {
        // 전체 클릭 시: 이미 전체면 해제, 아니면 전체만 담기
        newValue = newValue.includes('all') ? [] : ['all'];
    } else {
        const exists = newValue.includes(value);

        // 1. 'all'이 현재 선택된 상태였으면, 'all'을 먼저 해제하고 개별 선택 시작
        if (newValue.includes('all')) {
            // '전체' 상태에서 개별을 클릭하면 해당 값만 선택 상태로 전환
            newValue = [value];
        } else {
            // 2. 일반적인 토글 로직
            if (exists) {
                // 해제
                newValue = newValue.filter((v) => v !== value);
            } else {
                // 선택
                newValue = [...newValue, value];
            }
        }

        // 모든 개별 항목이 선택되면 'all'로 통합
        const isAllIndividualSelected = individualOptionValues.length > 0 &&
                                       newValue.length > 0 &&
                                       individualOptionValues.every(val => newValue.includes(val));
        // 모든 개별 옵션이 선택되었다면, 'all'로 대체하여 값을 통일
        if (isAllIndividualSelected) {
            newValue = ['all'];
        }
    }
    target.value = newValue;
};

// 초기화 함수 (기획안의 '초기화' 버튼 대응)
const resetFilters = () => {
    tempSort.value = '0'; // 첫 번째 정렬 기준
    tempStatus.value = ['all'];
    tempChannel.value = ['all'];
};

const handleSave = () => {
    // 확정 버튼을 눌렀을 때만 부모에게 알림
    emit('update:status', tempStatus.value);
    emit('update:channel', tempChannel.value);
    emit('update:sort', tempSort.value);
    isOpen.value = false;
};

const handelReset = () => {
    resetFilters();
    emit('update:status', tempStatus.value);
    emit('update:channel', tempChannel.value);
    emit('update:sort', tempSort.value);
}
</script>

<template>
    <div class="btn btn--mobile-option" @click="isOpen = true">
        <img :src="icFilterB" alt="필터">
        <span>필터</span>
    </div>

    <BottomSheet v-model="isOpen" save-btn-text="확인" @save="handleSave" @reset="handelReset" :show-reset-btn="showResetBtn">
        <template #content>
            <div class="filter">
                <div v-if="sortOptions.length > 0" class="filter__group">
                    <div class="filter__title" @click="toggleGroup('sort')">
                        <span class="title">정렬</span>
                        <img :src="icDropdown" alt="접기" :class="{ 'is-closed': !activeGroups.sort }">
                    </div>
    
                    <div class="option-list-wrapper" :class="{ 'is-closed': !activeGroups.sort }">
                        <ul class="option-list">
                            <li v-for="s in sortOptions" :key="s.value" @click.stop="selectSort(s.value)">
                                <label class="radio">
                                    <input type="radio" :checked="tempSort === s.value" readonly @click.stop.prevent>
                                    <span class="circle"></span>
                                    <span class="label body-m">{{ s.label }}</span>
                                </label>
                            </li>
                        </ul>
                    </div>
                </div>
    
                <div v-if="channelOptions.length > 0" class="filter__group">
                    <div class="filter__title" @click="toggleGroup('channel')">
                        <span class="title">예약 경로</span>
                        <img :src="icDropdown" alt="접기" :class="{ 'is-closed': !activeGroups.channel }">
                    </div>
    
                    <div class="option-list-wrapper" :class="{ 'is-closed': !activeGroups.channel }">
                        <ul class="option-list">
                            <li v-for="c in channelOptions" :key="c.value" 
                                @click.stop="toggleMultiSelect('channel', c.value, channelOptions)">
                                <label class="checkbox">
                                    <input type="checkbox" :checked="tempChannel.includes(c.value) || (tempChannel.includes('all') && c.value !== 'all')" @click.stop.prevent>
                                    <span class="box"></span>
                                    <span class="label body-m">{{ c.label }}</span>
                                </label>
                            </li>
                        </ul>
                    </div>
                </div>
    
                <div v-if="statusOptions.length > 0" class="filter__group">
                    <div class="filter__title" @click="toggleGroup('status')">
                        <span class="title">예약 상태</span>
                        <img :src="icDropdown" alt="접기" :class="{ 'is-closed': !activeGroups.status }">
                    </div>
    
                    <div class="option-list-wrapper" :class="{ 'is-closed': !activeGroups.status }">
                        <ul class="option-list">
                            <li v-for="st in statusOptions" :key="st.value" 
                                @click.stop="toggleMultiSelect('status', st.value, statusOptions)">
                                <label class="checkbox">
                                    <input type="checkbox" :checked="tempStatus.includes(st.value) || (tempStatus.includes('all') && st.value !== 'all')" @click.stop.prevent>
                                    <span class="box"></span>
                                    <span class="label body-m">{{ st.label }}</span>
                                </label>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>

        </template>
    </BottomSheet>
</template>

<style lang="scss" scoped>
.filter {
    display: flex;
    flex-direction: column;
    gap:24px;
    padding-bottom: 16px;

    &__title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;

        img {
            transition: transform 0.3s ease;
            &.is-closed {
                transform: rotate(180deg); // 닫혔을 때 아이콘 뒤집기
            }
        }

        .title {@include typo($title-m-mobile-size, $title-m-mobile-weight, $title-m-mobile-spacing, $title-m-mobile-line);}
        
    }

    .option-list-wrapper {
        max-height: 800px;
        transition: max-height 0.3s ease;
        overflow: hidden;

        &.is-closed {
            max-height: 0;
        }

        .option-list {
            display: flex;
            padding: 16px;
            flex-direction: column;
            gap: 16px;
    
            border-radius: 8px;
            background: $gray-50;;
        }
    }
}
</style>