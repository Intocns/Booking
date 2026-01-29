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
    { key: 'idx', label: 'No.', width: '5%' },
    { key: 'cocode', label: '회사코드', width: '8%' },
    { key: 'send_date', label: '발송일자', width: '13%' },
    { key: 'user_name', label: '고객명', width: '10%' },
    { key: 'phone_number', label: '전화번호', width: '11%' },
    { key: 'pet_name', label: '동물명', width: '10%' },
    { key: 'message', label: '발송내역', width: '21%' },
    { key: 'send_type', label: '발송구분', width: '8%' },
    { key: 'status', label: '발송결과', width: '8%' },
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

const fetchList = async () => {
    try {
        const channelTypes = toNumberFilter(filterChannelType.value);
        const sendResults = toNumberFilter(filterSendResult.value);
        const kw = keyword.value?.trim();

        const params = new URLSearchParams();
        if (channelTypes?.length) channelTypes.forEach((v) => params.append('channelTypes', v));
        if (sendResults?.length) sendResults.forEach((v) => params.append('sendResults', v));
        if (kw) params.append('keyword', kw);

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
    _raw: item,
});

const filteredRows = computed(() => {
    const rows = list.value.map(mapRow);
    return rows.map(({ _raw, ...rest }) => rest);
});

const totalCount = computed(() => filteredRows.value.length);

const searchList = async () => {
    if (isChannelEmpty.value || isResultEmpty.value) {
        list.value = [];
        return;
    }
    await fetchList();
};

// 검색 버튼 / 엔터 시: 키워드 포함하여 조회 트리거
const doSearch = () => searchList();

const searchClear = () => {
    filterChannelType.value = ['all'];
    filterSendResult.value = ['all'];
    keyword.value = '';
};

let isInitialMount = true;

// /reservation/list 와 동일: 셀렉트 변경 시 자동 조회 (초기 마운트는 제외)
watch([filterChannelType, filterSendResult], () => {
    if (isInitialMount) return;
    nextTick(() => searchList());
}, { deep: true });

onMounted(() => {
    searchList();
    isInitialMount = false;
});
</script>

<template>
    <PageTitle
        title="SMS/알림톡 발송 내역"
        :total="totalCount"
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
            <CommonTable :columns="columns" :rows="filteredRows" />
        </template>
    </TableLayout>
</template>
