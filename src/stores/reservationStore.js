import { defineStore } from "pinia";
import { api} from "@/api/axios";
// import Qs from "qs"
import { ref } from "vue";
import { formatDate, formatDateTime, formatTime} from "@/utils/dateFormatter";
import { formatPhone } from "@/utils/phoneFormatter";
import { RESERVE_ROUTE_MAP, RESERVE_STATUS_MAP} from "@/utils/reservation";

export const useReservationStore = defineStore("reservation", () => {
    const cocode = '2592' // TODO: 임시
    // TODO: 프록시 설정도 임시
    let reserveList = ref([]); // 전체 예약 내역
    let reservePendingList = ref([]); // 대기 예약 리스트
    let reserveCount = ref({}) // 예약별 카운트
    let reserveScheduleList = ref([]); // 예약 일정 리스트

    const mapReserveRow = (row) => ({
        ...row,
        // 날짜 / 시간
        reTimeTxt: formatDate(row.reTime),
        reTimeHisTxt: formatTime(row.reTimeHis),
        createdAtTxt: formatDateTime(row.createdAt),
        // 전화번호
        phoneTxt: formatPhone(row.phone),
        // 예약상태
        inStateTxt: RESERVE_STATUS_MAP[row.inState] ?? '-',
        // 예약경로
        reRouteTxt: RESERVE_ROUTE_MAP[row.reRoute] ?? '-',
    })

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
                reserveList.value = data.list.map(mapReserveRow);
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
            // console.log(response);
            let data = response.data.data;
            reserveCount.value = data;
        }
    }

    // 대기 예약 리스트 불러오기 (대기 예약 관리,대시보드)
    async function getPendingList(params) {
        const response = await api.get(`/api/${cocode}/reserve/pendinglist`, {params: params});

        if(response.status == 200) {
            // console.log(response)
            let data = response.data.data;
            reservePendingList.value = data.map(mapReserveRow);
        }
    }

    // 예약 일정 불러오기 (예약 일정 확인 페이지)
    async function getReserveSchedule(params) {
        try {
            const response = await api.post(`/api/${cocode}/reserve/sche`, params)
            if(response.status == 200) {
                let data = response.data.data;

                const processedData = data.map((item, idx) => ({
                    ...item,                   // 기존 데이터 복사
                    start: item.startDate,     // startDate 값을 start 키로 추가
                    end: item.endDate,          // endDate 값을 end 키로 추가
                    resource: item.doctorId || "", // 리소스 키 추가,
                    id: idx, // TODO: 임시값 추가
                }));

                reserveScheduleList.value = processedData;
            }
        } catch {

        }
    }

    return {
        // 
        reserveList,
        reservePendingList, // 대기 예약 리스트
        reserveCount, // 예약별 카운트
        reserveScheduleList, // 예약 일정 리스트
        // 
        getReservationList,
        getPendingList, // 대기 예약 리스트 불러오기
        getReserveCount, // 예약별 카운트 불러오기
        getReserveSchedule, // 예약 일정 불러오기
    };
});