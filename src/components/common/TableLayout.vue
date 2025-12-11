<script setup>
import SearchFilter from './SearchFilter.vue';
import CommonTable from './CommonTable.vue';
import { ref } from 'vue';

// 🔹 임시 컬럼 정의
const columns = [
    { key: "no", label: "No.", width: "60px" },
    { key: "status", label: "예약상태", width: "120px" },
    { key: "date", label: "예약일자", width: "120px" },
    { key: "time", label: "예약시간", width: "90px" },
    { key: "product", label: "상품명/진료실명", width: "160px" },
    { key: "customer", label: "고객명", width: "100px" },
    { key: "phone", label: "전화번호", width: "120px" },
    { key: "petName", label: "동물명", width: "100px" },
    { key: "species", label: "종", width: "60px" },
    { key: "doctor", label: "담당의", width: "100px" },
    { key: "memo", label: "병원 메모", width: "260px" },
    { key: "source", label: "예약경로", width: "120px" },
    { key: "registered", label: "접수일시", width: "120px" },
    { key: "actions", label: "관리", width: "80px" },
];

// 🔹 임시 데이터
const rows = ref([
    {
        no: 1,
        status: "예약대기",
        date: "2025-11-17",
        time: "09:00",
        product: "건강검진",
        customer: "최민두",
        phone: "010-1234-5678",
        petName: "뭉치",
        species: "Canine",
        doctor: "최민두",
        memo: "네이버 예약 시 남긴 메모가 노출됩니다.",
        source: "네이버예약",
        registered: "2025/11/11 24:00",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
    {
        no: 2,
        status: "예약완료",
        date: "2025-11-18",
        time: "10:00",
        product: "건강검진",
        customer: "이진우",
        phone: "010-2222-3333",
        petName: "후추",
        species: "Feline",
        doctor: "김수의",
        memo: "-",
        source: "Intovet GE",
        registered: "2025/11/12 10:30",
        actions: "",
    },
]);
</script>

<template>
    <div class="table-content">
        <SearchFilter />

        <CommonTable :columns="columns" :rows="rows">

            <!-- 예약상태 커스텀 출력 -->
            <template #status="{ value }">
                <span :style="{ color: value === '예약대기' ? '#f39c12' : '#27ae60' }">
                    ● {{ value }}
                </span>
            </template>

            <!-- 관리 버튼 영역 -->
            <template #actions="{ row }">
                <button class="btn btn--size-24 btn--black-outline" @click="console.log('상세', row)">상세</button>
                <button class="btn btn--size-24 btn--black-outline" @click="console.log('삭제', row)">삭제</button>
            </template>

        </CommonTable>
    </div>
</template>

<style lang="scss" scoped>
    .table-content {
        width: 100%;
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        gap: 16px;
        min-height: 0;
    }
</style>