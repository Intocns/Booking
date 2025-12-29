<!-- 네이버 플레이스 관리 > 플레이스 설정 -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import PlaceSettingTabOperation from './PlaceSettingTabOperation.vue';
import PlaceSettingTabNotification from './PlaceSettingTabNotification.vue';

import { ref } from 'vue';

// 스토어

const tabs = [
  { id: 'operation', label: '운영설정' },
  { id: 'notification', label: '알림설정' },
  { id: 'request', label: '예약자 정보 요청' },
];

const currentTab = ref('operation'); // 탭 버튼
</script>

<template>
    <PageTitle title="플레이스 설정" />

    <TableLayout>
        <template  #filter>
            <div class="button-group">
                    <button 
                        v-for="tab in tabs" 
                        :key="tab.id"
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === tab.id }"
                        @click="currentTab = tab.id"
                    >
                        {{ tab.label }}
                    </button>
                </div>
        </template>
        

        <template #table>
            <div class="contents-wrapper">
                <!--  운영설정 -->
                <template v-if="currentTab === 'operation'">
                    <PlaceSettingTabOperation />
                </template>

                <!-- 알림설정 -->
                <template v-if="currentTab === 'notification'">
                    <PlaceSettingTabNotification />
                </template>
                <!-- 예약자 정보 요청 -->

            </div>
        </template>
    </TableLayout>
</template>

<style lang="scss" scoped>

</style>