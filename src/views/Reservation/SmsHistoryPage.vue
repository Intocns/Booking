<!-- SMS/알림톡 발송 내역 -->
<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import FilterSelect from '@/components/common/filters/FilterSelect.vue';
import FilterKeywordBtn from '@/components/common/filters/FilterKeywordBtn.vue';
import CommonTable from '@/components/common/CommonTable.vue';
import { api } from '@/api/axios';
import { formatDateTime } from '@/utils/dateFormatter';
import { formatPhone } from '@/utils/phoneFormatter';
import {
    MESSAGE_HISTORY_CHANNEL_TYPE_MAP,
    MESSAGE_HISTORY_SEND_RESULT_MAP,
    MESSAGE_HISTORY_CHANNEL_TYPE_OPTIONS,
    MESSAGE_HISTORY_SEND_RESULT_OPTIONS,
} from '@/utils/messageHistory';
import icReset from '@/assets/icons/ic_reset.svg';

const channelTypeOptions = MESSAGE_HISTORY_CHANNEL_TYPE_OPTIONS;
const sendResultOptions = MESSAGE_HISTORY_SEND_RESULT_OPTIONS;

// sms/알림톡 발송 내역 테이블 col 정의
const columns = [
    { key: 'idx', label: 'No.', width: '4%' },
    // { key: 'cocode', label: '회사코드', width: '4%' },
    { key: 'send_date', label: '발송일자', width: '10%' },
    { key: 'user_name', label: '고객명', width: '7%' },
    { key: 'phone_number', label: '전화번호', width: '10%' },
    { key: 'pet_name', label: '동물명', width: '7%' },
    { key: 'message', label: '발송내역', width: '52%' },
    { key: 'send_type', label: '발송구분', width: '5%' },
    { key: 'status', label: '발송결과', width: '5%' },
];

const list = ref([]);
const filterChannelType = ref(['all']);
const filterSendResult = ref(['all']);
const keyword = ref('');

// /reservation/list 와 동일: 필터가 비어있으면 리스트 비우고 조회 안 함
const isChannelEmpty = computed(() => !filterChannelType.value?.length);
const isResultEmpty = computed(() => !filterSendResult.value?.length);

const toNumberFilter = (values) => {
    if (!values || !values.length || values.includes('all')) return null;
    return values.map((v) => Number(v));
};

const fetchList = async (syncPending = false) => {
    try {
        const channelTypes = toNumberFilter(filterChannelType.value);
        const sendResults = toNumberFilter(filterSendResult.value);
        const kw = keyword.value?.trim();

        const params = new URLSearchParams();
        if (channelTypes?.length) channelTypes.forEach((v) => params.append('channelTypes', v));
        if (sendResults?.length) sendResults.forEach((v) => params.append('sendResults', v));
        if (kw) params.append('keyword', kw);
        if (syncPending) params.append('syncPending', 'true');

        const res = await api.get('/api/{cocode}/reserve/sms-history', { params });
        const data = res?.data?.data;
        list.value = Array.isArray(data) ? data : [];
    } catch (e) {
        console.error(e);
        list.value = [];
    }
};

const mapRow = (item) => ({
    idx: item.idx,
    cocode: item.cocode,
    send_date: formatDateTime(item.sendAt),
    user_name: item.customerName ?? '-',
    phone_number: formatPhone(item.phoneNumber) || '-',
    pet_name: item.petName ?? '-',
    message: item.messageContent ?? '-',
    send_type: MESSAGE_HISTORY_CHANNEL_TYPE_MAP[item.channelType] ?? '-',
    status: MESSAGE_HISTORY_SEND_RESULT_MAP[item.sendResult] ?? '-',
    send_result: item.sendResult,
    _raw: item,
});

const filteredRows = computed(() => {
    const rows = list.value.map(mapRow);
    return rows.map(({ _raw, ...rest }) => rest);
});

const totalCount = computed(() => filteredRows.value.length);

/** 필터/키워드 검색 시에는 PENDING 동기화 없이 조회 */
const searchList = async (syncPending = false) => {
    if (isChannelEmpty.value || isResultEmpty.value) {
        list.value = [];
        return;
    }
    await fetchList(syncPending);
};

// 검색 버튼 클릭: 동기화 없이 조회
const doSearch = () => searchList(false);

const searchClear = () => {
    filterChannelType.value = ['all'];
    filterSendResult.value = ['all'];
    keyword.value = '';
    searchList(true);
};

let isInitialMount = true;

// /reservation/list 와 동일: 셀렉트 변경 시 자동 조회 (초기 마운트는 제외)
watch([filterChannelType, filterSendResult], () => {
    if (isInitialMount) return;
    nextTick(() => searchList());
}, { deep: true });

const tooltipData = ref({
    visible: false,
    text: '',
    x: 0,
    y: 0,
    style: {} // 동적 스타일 추가
});

const showTooltip = (e, text) => {
    if (!text || text === '-') return;

    const gap = 15; // 마우스와 툴팁 사이 간격
    const { clientX: mouseX, clientY: mouseY } = e;
    
    // 화면 크기 체크
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // 툴팁이 오른쪽 끝을 벗어나는지 확인 (기준: 300px 너비)
    const isRightEdge = mouseX + 300 > screenWidth;
    // 툴팁이 아래쪽 끝을 벗어나는지 확인 (기준: 150px 높이)
    const isBottomEdge = mouseY + 150 > screenHeight;

    tooltipData.value = {
        visible: true,
        text: text,
        x: mouseX,
        y: mouseY,
        style: {
            left: `${mouseX}px`,
            top: `${mouseY}px`,
            // transform을 이용해 방향 전환
            // 기본: 오른쪽 아래 (15px 간격)
            // 오른쪽 끝일 때: 왼쪽으로 이동 (-100%와 간격)
            // 아래쪽 끝일 때: 위쪽으로 이동 (-100%와 간격)
            transform: `translate(
                ${isRightEdge ? `calc(-100% - ${gap}px)` : `${gap}px`}, 
                ${isBottomEdge ? `calc(-100% - ${gap}px)` : `${gap}px`}
            )`
        }
    };
};

const hideTooltip = () => {
    tooltipData.value.visible = false;
};

onMounted(() => {
    searchList(true); // 최초 로드 시에만 PENDING 성공여부 동기화
    isInitialMount = false;
});
</script>

<template>
    <PageTitle
        title="SMS/알림톡 발송 내역"
        helper-text="예약 관리자 센터에서 발송한 SMS/알림톡 내역만 조회 가능합니다."
    />

    <TableLayout>
        <template #filter>
            <FilterSelect label="발송구분" :options="channelTypeOptions" v-model="filterChannelType" />
            <FilterSelect label="발송결과" :options="sendResultOptions" v-model="filterSendResult" />
            <FilterKeywordBtn
                v-model="keyword"
                :placeholder="'고객명, 동물명, 전화번호 검색'"
                @search="doSearch"
            />
            <button type="button" class="btn btn--size-32 btn--black-outline" @click="searchClear" style="width: 40px;" title="초기화">
                <img :src="icReset" alt="초기화" />
            </button>
        </template>

        <template #table>
            <CommonTable :columns="columns" :rows="filteredRows" :table-total="totalCount">
                <template #message="{ value }">
                    <div 
                        class="message-cell" 
                        @mousemove="showTooltip($event, value)" 
                        @mouseleave="hideTooltip"
                    >
                        {{ value }}
                    </div>
                </template>

                <template #status="{ value, row }">
                    <div :class="[
                        'status-badge',
                        { '--success': row.send_result == 1, // 1: 성공
                        '--fail': row.send_result == 2     // 2: 실패 
                        }
                    ]">
                        {{ value }}
                    </div>
                </template>
            </CommonTable>

            <teleport to="body">
                <div 
                    v-if="tooltipData.visible" 
                    class="custom-fixed-tooltip"
                    :style="tooltipData.style"
                >
                    {{ tooltipData.text }}
                </div>
            </teleport>

        </template>
    </TableLayout>
</template>

<style lang="scss" scoped>
.message-cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.custom-fixed-tooltip {
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    max-width: 300px;
    padding: 10px;
    @include typo($body-s-size, $body-s-weight, $body-s-spacing, $body-s-line);
    white-space: pre-wrap;
    word-break: break-all;
    
    border-radius: 5px;
    border: 1px solid $primary-700;
    background-color: $primary-50;
    color: $gray-900;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
}

.status-badge {
    @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);

    &.--success {
        color: $primary-700;
    }

    &.--fail {
        color: $warning-300;
    }
}
</style>