import { defineStore } from "pinia";
import { api} from "@/api/axios";
// import Qs from "qs"
import { ref } from "vue";
import { formatDate, formatDateTime, formatTime} from "@/utils/dateFormatter";
import { formatPhone } from "@/utils/phoneFormatter";
import { RESERVE_ROUTE_MAP, RESERVE_STATUS_MAP} from "@/utils/reservation";
import { useModalStore } from "./modalStore";

export const useReservationStore = defineStore("reservation", () => {
    const modalStore = useModalStore();

    let reserveList = ref([]); // 전체 예약 내역
    let reservePendingList = ref([]); // 대기 예약 리스트
    let reserveCount = ref({}) // 예약별 카운트
    let reserveScheduleList = ref([]); // 예약 일정 리스트
    
    let reserveInfo = ref({})

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
        try {
            const response = await api.post(`/api/{cocode}/reserve/list`, params);
            if(response.status <= 300){
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
        const response = await api.get(`/api/{cocode}/reserve/cnt`);

        if(response.status <= 300) {
            // console.log(response);
            let data = response.data.data;
            reserveCount.value = data;
        }
    }

    // 대기 예약 리스트 불러오기 (대기 예약 관리,대시보드)
    async function getPendingList(params) {
        const response = await api.get(`/api/{cocode}/reserve/pendinglist`, {params: params});

        if(response.status <= 300) {
            // console.log(response)
            let data = response.data.data;
            reservePendingList.value = data.map(mapReserveRow);
        }
    }

    // 예약 일정 불러오기 (예약 일정 확인 페이지)
    async function getReserveSchedule(params) {
        try {
            const response = await api.post(`/api/{cocode}/reserve/sche`, params)
            if(response.status <= 300) {
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
        } catch (error) {
            console.error(error);
            alert('오류가 발생했습니다.')
        }
    }

    // 고객 매칭용 목록 및 예약 정보
    async function getReserveInfo(reserveIdx) {
        try {
            const response = await api.get(`/api/{cocode}/reserve/${reserveIdx}/cm`)
            if(response.status <= 300) {
                if(response.data.status_code <= 300) {
                    let data = response.data.data
                    reserveInfo.value = data;
                    modalStore.reserveInfoModal.openModal(reserveInfo.value)
                } else {
                    reserveInfo.value = '';
                    alert(response.message)
                }
            }
        } catch (error) {
            console.error(error);
            reserveInfo.value = '';
            alert('오류가 발생했습니다.')
        }
    }

    // 고객 검색 (고객 매칭용)
    async function searchClientMapping(searchData) {
        try {
            const response = await api.post(`/api/{cocode}/reserve/search`, searchData);
            if(response.status <= 300) {
                if(response.data.status_code <= 300) {
                    return response.data.data;
                } else {
                    alert(response.data.message || '검색 중 오류가 발생했습니다.');
                    return [];
                }
            }
            return [];
        } catch (error) {
            console.error('고객 검색 오류:', error);
            alert('고객 검색 중 오류가 발생했습니다.');
            return [];
        }
    }

    // 예약 확정
    async function confirmReservation(reserveIdx, confirmData) {
        try {
            const response = await api.post(`/api/{cocode}/reserve/${reserveIdx}/set`, confirmData);
            
            if(response.status <= 300 && response.data?.status_code <= 300) {
                return { success: true, data: response.data.data || null };
            }
            
            return { 
                success: false, 
                message: response.data?.message || '예약 확정 중 오류가 발생했습니다.' 
            };
        } catch (error) {
            console.error('예약 확정 오류:', error);
            return { success: false, message: '예약 확정 중 오류가 발생했습니다.' };
        }
    }

    // 예약 취소
    async function cancelReservation(reserveIdx, cancelData) {
        try {
            const response = await api.post(`/api/{cocode}/reserve/${reserveIdx}/reject`, cancelData);
            
            if(response.status <= 300 && response.data?.status_code <= 300) {
                return { success: true, data: response.data.data || null };
            }
            
            return { 
                success: false, 
                message: response.data?.message || '예약 취소 중 오류가 발생했습니다.' 
            };
        } catch (error) {
            console.error('예약 취소 오류:', error);
            return { success: false, message: '예약 취소 중 오류가 발생했습니다.' };
        }
    }

    return {
        // 
        reserveList,
        reservePendingList, // 대기 예약 리스트
        reserveCount, // 예약별 카운트
        reserveScheduleList, // 예약 일정 리스트
        reserveInfo,
        // 
        getReservationList,
        getPendingList, // 대기 예약 리스트 불러오기
        getReserveCount, // 예약별 카운트 불러오기
        getReserveSchedule, // 예약 일정 불러오기
        getReserveInfo,
        searchClientMapping, // 고객 검색
        confirmReservation, // 예약 확정
        cancelReservation, // 예약 취소
    };
});