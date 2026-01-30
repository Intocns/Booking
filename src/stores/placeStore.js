// placeStore.js
import { defineStore } from "pinia";
import { api} from "@/api/axios";
import { ref } from "vue";

export const usePlaceStore = defineStore("place", () => {
    // 네이버 플레이스 관리>플레이스 설정>운영설정
    const isAcceptingReservation = ref(0); // 예약받기 여부
    const isTodayReservationEnabled = ref(0); // 당일예약받기 여부

    // 네이버 플레이스 관리>플레이스 설정>알람설정

    // 네이버 플레이스 관리>플레이스 설정>예약자 정보요청
    const isRequestMessageUsed = ref(0); // 기타 요청사항 받는지 여부
    const questionList = ref([]); // 사용자 정보 요청 질문 리스트

    // 네이버 플레이스 관리>플레이스 설정>운영설정
    // 운영설정 기본값 가져오기
    const getOperationInfo = async() => {
        const response = await api.get('/api/linkbusiness/{cocode}/setting/operation');
        const rawData = response.data.data;

        isAcceptingReservation.value = rawData.alarmUseYn; // 예약받기 여부
        isTodayReservationEnabled.value = rawData.isImp; // 당일예약받기 여부
    }

    // 네이버 플레이스 관리>플레이스 설정>알람설정
    // 알람설정 기본값 가져오기
    const getAlarmInfo = async() => {
        const response = await api.get('/api/linkbusiness/{cocode}/setting/alarm');
    }

    // 네이버 플레이스 관리>플레이스 설정>예약자 정보요청
    // 사용자 정보 요청 질문 리스트 가져오기
    const getQuestionList = async() => {
        const response = await api.get('/api/{cocode}/question/list');
        const rawData = response.data.data;

        questionList.value = rawData.questionList.map(q => ({
            ...q,
            // UI에서 바로 쓸 수 있게 매핑
            uiQuestionOptions: q.options ? q.options.map(opt => ({
                label: opt.optionName,
                value: opt.optionIdx
            })) : [],
        }));
        isRequestMessageUsed.value = rawData.isRequestMessageUsed;
    }

    // 사용자 정보 요청 질문 단건 등록
    const addQuestion = async(params) => {
        const response = await api.post('/api/{cocode}/question/add', params);
    }

    // 사용자 정보 요청 질문 단건 수정
    const modifyQuestion = async(params) => {
        const response = await api.post('/api/{cocode}/question/modify', params);
    }

    // 사용자 정보 요청 질문 순서 변경
    const modifyQuestionOrder = async(params) => {
        const response = await api.post('/api/{cocode}/question/modify/order', params);
    }

    // 사용자 정보 요청 질문 저장/삭제 (리스트로)
    const setQuestion = async(params) => {
        const response = await api.post('/api/{cocode}/question/set', params);
    }

    return {
        // 상태관리
        // 플레이스 설정 > 운영설정
        isAcceptingReservation,
        isTodayReservationEnabled,
        // 플레이스 설정 > 알림설정
        // 플레이스 설정 > 예약자 정보 요청 
        isRequestMessageUsed, 
        questionList,
        // api
        // 플레이스 설정 > 운영설정
        getOperationInfo,
        // 플레이스 설정 > 알림설정
        getAlarmInfo,
        // 플레이스 설정 > 예약자 정보 요청 
        getQuestionList,
        addQuestion,
        modifyQuestion,
        modifyQuestionOrder,
        setQuestion,
    }
})