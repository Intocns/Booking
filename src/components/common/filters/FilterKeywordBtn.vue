<!-- 검색어 필터 + 검색버튼 버전 -->
<script setup>
import icSearch from '@/assets/icons/ic_search.svg';
import icClear from '@/assets/icons/ic_clear.svg';
import { computed } from 'vue';

const props = defineProps({
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'search']);

// v-model proxy
const keyword = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
});

const onSearch = (e) => {
    // 한글 조합 중 엔터 방지
    if (e?.isComposing) return;
    emit('search');
};

</script>

<template>
    <div class="search-filter__section">
        <span class="search-filter__label title-s">검색</span>
    
        <div class="search-filter__control search-filter__search_text_box">
            <input
                type="text"
                v-model="keyword"
                class="body-m"
                :placeholder="placeholder"
                @keyup.enter="onSearch"
            >

            <!-- 아이콘 -->
            <span class="search-filter__icons">
                <img
                    :src="icSearch"
                    alt="검색 아이콘"
                    class="search-icon"
                    @click="onSearch"
                >
                <img
                    v-if="keyword.length > 0"
                    :src="icClear"
                    alt="입력 삭제 아이콘"
                    class="clear-icon"
                    @click="keyword = ''"
                >
            </span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .search-filter__section {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .search-filter__icons {
        display: flex;
        align-items: center;
        gap: 4px;

        .search-icon {
            cursor: pointer;
            width: 14px;
            height: 14px;
        }

        .clear-icon {
            cursor: pointer;
            width: 14px;
            height: 14px;
        }
    }

    // 검색 인풋
    .search-filter__search_text_box {
        display: flex;
        // width: 240px;
        flex: 1;
        height: 32px;
        padding: 0 10px;
        align-items: center;
        gap: 4px;

        border: 1px solid $gray-200;
        border-radius: 4px;
        background-color: $gray-00;
        transition: all .2s ease;

        &:focus-within {
            border-color: $gray-900;
        }

        /* 인풋에 값이 있을 때 */
        &.filled {
            border-color: $gray-900;
        }

        /* disabled */
        &.disabled {
            background-color: $gray-50;
            border-color: $gray-200;
            cursor: not-allowed;

            input {
                background: transparent;
                cursor: not-allowed;
            }

            img {opacity: 0.6;}
        }

        input {
            border: none;
            flex: 1;
            // width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            &:focus { outline: none; }
            &::placeholder {
                color: $gray-400;
            }
        }
    }

</style>