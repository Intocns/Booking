import { defineStore } from "pinia";
import { api} from "@/api/axios";
import Qs from "qs"
import { ref } from "vue";

export const useReservationStore = defineStore("reservation", () => {
    const cocode = '2592' // TODO: 임시
    // TODO: 프록시 설정도 임시

    let reservePendingList = ref([]); // 대기 예약 리스트
    let reserveCount = ref({}) // 예약별 카운트
    
    // 전체 예약 내역 불러오기
    async function getReservationList(params) {

        // const response = await api.post('/api/2592/reserve/list', params)
        // const response = await api.get('/api/2592/reserve/pendinglist')

        // if (response) {
        //     console.log(response)
        // }
    }

    // 예약 종류별 카운트 (대시보드)
    async function getReserveCount() {
        const response = await api.get(`/api/${cocode}/reserve/cnt`);

        if(response.status == 200) {
            console.log(response);
            let data = response.data.data;
            reserveCount.value = data;
        }
    }

    // 대기 예약 리스트 불러오기 (대기 예약 관리,대시보드)
    async function getPendingList() {
        const response = await api.get(`/api/${cocode}/reserve/pendinglist`);

        if(response.status == 200) {
            console.log(response)
            let data = response.data.data;
            reservePendingList.value = data;
        }
    }

    return {
        // 
        reservePendingList, // 대기 예약 리스트
        reserveCount, // 예약별 카운트
        // 
        getReservationList,
        getPendingList, // 대기 예약 리스트 불러오기
        getReserveCount, // 예약별 카운트 불러오기
    };
});