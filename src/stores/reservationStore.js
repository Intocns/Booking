import { defineStore } from "pinia";
import { api} from "@/api/axios";
// import Qs from "qs"
import { ref } from "vue";
import { formatDate, formatDateTime, formatTime} from "@/utils/dateFormatter";
import { formatPhone } from "@/utils/phoneFormatter";
import { RESERVE_ROUTE_MAP, RESERVE_STATUS_MAP} from "@/constants";
import { useModalStore } from "./modalStore";
import { showAlert } from "@/utils/ui";

export const useReservationStore = defineStore("reservation", () => {
    const modalStore = useModalStore();

    let reserveList = ref([]); // 전체 예약 내역
    let reservePendingList = ref([]); // 대기 예약 리스트
    let reserveCount = ref({}) // 예약별 카운트
    let reserveScheduleList = ref([]); // 예약 일정 리스트
    let operatorSettingInfo = ref({});
    
    let reserveInfo = ref({})

    let isLoading = ref(false);

    // data.list 에서 오는 카테고리 (진료예약, 미용, 기타)
    const LIST_CATEGORY_KEY_MAP = {
        '진료예약': '진료예약',
        '미용': '미용',
        '기타': '기타',
    };

    // data.planVaccineList 에서 오는 카테고리
    const PLAN_VACCINE_CATEGORIES = ['진료예정', '백신'];


    const mapReserveRow = (row) => ({
        ...row,
        // 일반 예약의 경우 리스트에서 동물 정보, 고객 정보 미노출 필요
        userName: row.clinicType == '일반예약' ? '' : row.userName,
        phoneTxt: row.clinicType == '일반예약' ? '' : formatPhone(row.phone),
        petName: row.clinicType == '일반예약' ? '' : row.petName,
        speciesName: row.clinicType == '일반예약' ? '' : row.speciesName,
        // 날짜 / 시간
        reTimeTxt: formatDate(row.reTime),
        reTimeHisTxt: formatTime(row.reTime),
        reTimeAndTxt: formatTime(row.reTimeEnd),
        createdAtTxt: formatDateTime(row.createdAt),
        // 예약상태
        inStateTxt: RESERVE_STATUS_MAP[row.inState] ?? '-',
        // 예약경로
        reRouteTxt: RESERVE_ROUTE_MAP[row.reRoute] ?? '-',
        // rowClass
        rowClass: row.inState === 0 ? 'row-pending' : row.inState == 2 || row.inState == 3 ? 'row-canceled' : '',
    })

    // planVaccineList 항목을 예약 리스트와 동일한 형태로 변환
    const mapPlanVaccineRow = (row) => ({
        ...row,
        roomName: row.clinicType || '',
        clinicType: row.gubun === 1 ? '진료예정' : '백신',
        geReMemo: row.geReMemo || '',
        createdAt: row.reTime,
    })

    // 전체 예약 내역 불러오기
    async function getReservationList(params, categories = null) {
        isLoading.value = true;
        try {
            // 선택된 카테고리 중 list / planVaccineList 대상 분리
            const needList = !categories || categories.some(c => !!LIST_CATEGORY_KEY_MAP[c]);
            const needPlanVaccine = !categories || categories.some(c => PLAN_VACCINE_CATEGORIES.includes(c));

            const response = await api.post(`/api/{cocode}/reserve/type/list`, params);
            if(response.status <= 300){
                let data = response.data.data;
                const rows = [];

                // data.list: 진료예약, 미용, 기타 (list 카테고리만 처리)
                if (needList && data.list && typeof data.list === 'object') {
                    Object.entries(data.list).forEach(([key, items]) => {
                        const category = LIST_CATEGORY_KEY_MAP[key] ?? '기타';
                        items.forEach(item => {
                            rows.push(mapReserveRow({ ...item, category }));
                        });
                    });
                }

                // data.planVaccineList: 진료예정, 백신 데이터 (객체: { "진료예정": [...], "백신": [...] })
                if (needPlanVaccine && data.planVaccineList && typeof data.planVaccineList === 'object') {
                    Object.entries(data.planVaccineList).forEach(([key, items]) => {
                        if (!Array.isArray(items)) return;
                        const category = PLAN_VACCINE_CATEGORIES.includes(key) ? key : '기타';
                        items.forEach(item => {
                            rows.push(mapReserveRow({ ...mapPlanVaccineRow(item), category }));
                        });
                    });
                }

                reserveList.value = rows;
            }
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    // 예약 종류별 카운트 (대시보드)
    async function getReserveCount() {
        const response = await api.get(`/api/{cocode}/reserve/type/cnt`);

        if(response.status <= 300) {
            let data = response.data.data;
            reserveCount.value = {
                ...data.totalCnt,
                ...data.totalCountByType,
            };
        }
    }

    // 대기 예약 리스트 불러오기 (대기 예약 관리,대시보드)
    async function getPendingList(params) {
        isLoading.value = true;
        try {
            const response = await api.get(`/api/{cocode}/reserve/pendinglist`, {params: params});

            if(response.status <= 300) {
                let data = response.data.data;
                const rows = [];

                // reserve: 일반 예약 데이터
                if (Array.isArray(data.reserve)) {
                    data.reserve.forEach(item => rows.push(item));
                }

                // plan/vaccine: clinicType이 치료명이므로 roomName으로 매핑
                const mapPlanItem = (item) => ({
                    ...item,
                    roomName: item.clinicType || '',
                    createdAt: item.createdAt || item.reTime,
                    clinicType: '', // mapReserveRow의 일반예약 체크에 영향 안주도록
                });

                if (Array.isArray(data.plan)) {
                    data.plan.forEach(item => rows.push(mapPlanItem(item)));
                }
                if (Array.isArray(data.vaccine)) {
                    data.vaccine.forEach(item => rows.push(mapPlanItem(item)));
                }

                // 배열이 아닌 경우(이전 API 호환)
                if (Array.isArray(data)) {
                    reservePendingList.value = data.map(mapReserveRow);
                } else {
                    reservePendingList.value = rows.map(row => {
                        try { return mapReserveRow(row); }
                        catch(e) { console.error('pendinglist row map error:', e, row); return null; }
                    }).filter(Boolean);
                }
            }
        } catch (error) {
            console.error('pendinglist error:', error);
        } finally {
            isLoading.value = false;
        }

    }

    // 예약 일정 불러오기 (예약 일정 확인 페이지)
    async function getReserveSchedule(params) {
        const response = await api.post(`/api/{cocode}/reserve/sche`, params)

        let data = response.data.data;

        const processedData = data.map((item, idx) => ({
            ...item,                   // 기존 데이터 복사
            start: item.startDate,     // startDate 값을 start 키로 추가
            end: item.endDate,          // endDate 값을 end 키로 추가
            resource: item.doctorId || "", // 리소스 키 추가,
            id: idx, 
        }));

        reserveScheduleList.value = processedData;
    }

    // 고객 매칭용 목록 및 예약 정보
    async function getReserveInfo(reserveIdx) {
        try {
            } else {
                reserveInfo.value = '';
            }
        } catch (error) {
            console.error(error);
            reserveInfo.value = '';
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
                    return [];
                }
            }
            return [];
        } catch (error) {
            console.error('고객 검색 오류:', error);
            const response = await api.get(`/api/{cocode}/reserve/${reserveIdx}/cm`)
            if(response.data.status_code <= 300) {
                let data = response.data.data
                reserveInfo.value = data;
                modalStore.reserveInfoModal.openModal(reserveInfo.value)
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
                message: response.data?.message || '예약 거절 중 오류가 발생했습니다.' 
            };
        } catch (error) {
            console.error('예약 취소 오류:', error);
            return { success: false, message: '예약 거절 중 오류가 발생했습니다.' };
        }
    }

    // 운영 설정 조회
    async function getOperatorSetting() {
        try {
            const response = await api.get(`/api/{cocode}/reserve/setting/operator`, {skipAlert: true});
            if(response.data.status_code <= 300) {
                let data = response.data.data
                operatorSettingInfo.value = data;
            }
        } catch (error) {
            if (error.response?.data?.status_code === 503 || error.data?.status_code === 503) {
                // 503 에러 > 기본값 세팅
                operatorSettingInfo.value = {
                    reserveCnt: 0,
                    alimTalkFlag: 0,
                    isReserve: null,
                    reserveInfo: [{
                        title: '',
                        rec: 0
                    }],
                    alimTalk: ['']
                }
            } else {
                showAlert("운영 설정 정보를 불러오는 중 오류가 발생했습니다.");
            }
            console.error(error);
        }
    }

    // 고객 검색 (고객 매칭용)
    async function saveOperatorSetting(params) {
        const response = await api.post(`/api/{cocode}/reserve/setting/operator`, params);
        return response.data;
    }

    return {
        // 
        reserveList,
        reservePendingList, // 대기 예약 리스트
        reserveCount, // 예약별 카운트
        reserveScheduleList, // 예약 일정 리스트
        reserveInfo,
        operatorSettingInfo,
        isLoading,
        // 
        getReservationList,
        getPendingList, // 대기 예약 리스트 불러오기
        getReserveCount, // 예약별 카운트 불러오기
        getReserveSchedule, // 예약 일정 불러오기
        getReserveInfo,
        searchClientMapping, // 고객 검색
        confirmReservation, // 예약 확정
        cancelReservation, // 예약 취소
        getOperatorSetting, //운영 설정 조회
        saveOperatorSetting, //운영 설정 저장
    };
});