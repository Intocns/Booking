<!-- 검색어 필터 + 검색버튼 버전 -->
<script setup>
import icSearch from '@/assets/icons/ic_search_w.svg';
import icClear from '@/assets/icons/ic_clear.svg';

import { ref } from 'vue';

const props = defineProps({
    placeholder: String,
})
let keyword = ref("");
</script>

<template>
    <div class="search-filter__section">
        <span class="search-filter__label title-s">검색</span>
    
        <div class="search-filter__control search-filter__search_text_box">
            <input 
                type="text"
                v-model="keyword"
                name="" 
                id="" 
                class="body-m" 
                @input="keyword = $event.target.value"
                :placeholder="placeholder"
            >
    
            <!-- 아이콘 -->
            <span class="search-filter__icons">
                <!-- clear icon: 값 있을 때만 표시 -->
                <img 
                    :src="icClear" 
                    alt="입력 삭제 아이콘"
                    class="clear-icon"
                    :class="{ visible: keyword.length > 0 }"
                    @click="keyword = ''"
                >
            </span>
        </div>

        <button class="btn btn--size-32 btn--blue search-btn">
            <img :src="icSearch" alt="">
            검색
        </button>
    </div>
</template>

<style lang="scss" scoped>
    .search-filter__section {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .search-filter__icons {
        width: 36px;
        display: flex;
        justify-content: flex-end;
        gap: 4px;

        .clear-icon {
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
        }
        .clear-icon.visible {
            opacity: 1;
            visibility: visible;
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
        gap: 10px;

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

    .search-btn {
        @include flex-center;
        gap:3px;
    }
</style>