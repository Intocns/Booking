<!-- 검색어 필터 -->
<script setup>
import icSearch from '@/assets/icons/ic_search.svg';
import icClear from '@/assets/icons/ic_clear.svg';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'search']);
</script>

<template>
    <div class="search-filter__section">
        <span class="search-filter__label title-s">검색</span>
    
        <div class="search-filter__control search-filter__search_text_box">
           <input
                type="text"
                class="body-m"
                :value="props.modelValue"
                :placeholder="props.placeholder"
                @input="emit('update:modelValue', $event.target.value)"
                @keyup.enter="emit('search')"
            />

        <!-- 아이콘 -->
        <span class="search-filter__icons">
            <img
                :src="icClear"
                class="clear-icon"
                :class="{ visible: props.modelValue.length > 0 }"
                @click="emit('update:modelValue', '')"
            />

            <img
                :src="icSearch"
                @click="$emit('search')"
            />
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
</style>