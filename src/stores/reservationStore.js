import { defineStore } from "pinia";
import { api} from "@/api/axios";
// import Qs from "qs"
import { ref } from "vue";
import { formatDate, formatDateTime, formatTime } from "@/utils/dateFormatter";
import { RESERVE_ROUTE_MAP, RESERVE_STATUS_MAP} from "@/utils/reservation";

export const useReservationStore = defineStore("reservation", () => {
    const cocode = '2592' // TODO: 임시
    // TODO: 프록시 설정도 임시
    let reserveList = ref([]); // 전체 예약 내역
    let reservePendingList = ref([]); // 대기 예약 리스트
    let reserveCount = ref({}) // 예약별 카운트

    // 전체 예약 내역 불러오기
    async function getReservationList(params) {
        // const response = await api.get('/api/2592/reserve/getDoc')//담당의 불러오기
        // const docID = params.docId || '' // 담당의 아이디
        // const cocode = params.cocode || '2592' // TODO: 임시 병원 코드 추후삭제
         try {
            const response = await api.post(`/api/${cocode}/reserve/list`, params);
            if(response.status == 200){
                console.log(response);
                let data = response.data.data;
                // reserveList.value = data.list;
                reserveList.value = data.list.map((row, idx) => ({
                        ...row,

                        //날짜 / 시간 포맷
                        re_time_txt: formatDate(row.re_time),
                        re_time_his_txt: formatTime(row.re_time_his),
                        created_at_txt: formatDateTime(row.created_at),

                        //예약상태
                        in_state_txt: RESERVE_STATUS_MAP[row.in_state] ?? '-',

                        //예약경로
                        re_route_txt: RESERVE_ROUTE_MAP[row.re_route] ?? '-',
                    }));

            }
        } catch (error) {
            console.error(error);
            throw error; // 호출한 쪽에서 에러 처리 가능
        }
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
        reserveList,
        reservePendingList, // 대기 예약 리스트
        reserveCount, // 예약별 카운트
        // 
        getReservationList,
        getPendingList, // 대기 예약 리스트 불러오기
        getReserveCount, // 예약별 카운트 불러오기
    };
});