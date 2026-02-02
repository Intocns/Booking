// placeStore.js
import { defineStore } from "pinia";
import { api} from "@/api/axios";
import { ref } from "vue";

export const usePlaceStore = defineStore("place", () => {
    // 네이버 플레이스 관리>플레이스 설정>운영설정
    const operationInfo = ref({}) // 운영 설정 데이터 저장
    const historyData = ref(null); // 노출이력 데이터

    // 네이버 플레이스 관리>플레이스 설정>알림설정
    const remindType = ref(null); // 예약자 리마인드 알림 타입
    const guideList = ref([]); // 예약 확정시 안내 문구리스트
    const cancelGuideList = ref([]); // 예약 취소시 안내 문구 리스트

    // 네이버 플레이스 관리>플레이스 설정>예약자 정보요청
    const isRequestMessageUsed = ref(0); // 기타 요청사항 받는지 여부
    const questionList = ref([]); // 사용자 정보 요청 질문 리스트

    // -------------------------------------
    // 네이버 플레이스 관리>플레이스 설정>운영설정
    // -------------------------------------

    // 운영설정 기본값 가져오기
    const getOperationInfo = async() => {
        const response = await api.get('/api/linkbusiness/{cocode}/setting/operation');
        const rawData = response.data.data;

        operationInfo.value = {
            isAcceptingReservation: rawData.isImp == '1', // '예약 받기' (isImp가 1이면 true)
            isTodayReservationEnabled: rawData.alarmUseYn == 1, // '당일 예약' (alarmUseYn이 1이면 true)
            alarmValue: rawData.alarmValue // '선택된 시간 값'
        };
    }

    // 운영 설정 예약 받기 값 변경 토글
    const setAcceptingReservation = async(value) => {
        const response = await api.get(`/api/linkbusiness/{cocode}/setting/operation/imp/${value}`);
    }

    // 당일 예약 받기 값 변경
    const setTodayReservation = async(useYn, value) => {
        const response = await api.get(`/api/linkbusiness/{cocode}/setting/operation/Ava/${useYn}/${value}`);
    }

    // 노출이력 확인
    const getImpHistory = async() => {
        const response = await api.get('/api/linkbusiness/{cocode}/setting/operation/impHis');
        historyData.value = response.data.data;
    }

    // -------------------------------------
    // 네이버 플레이스 관리>플레이스 설정>알람설정
    // -------------------------------------

    // 알람설정 기본값 가져오기
    const getAlarmInfo = async() => {
        const response = await api.get('/api/linkbusiness/{cocode}/setting/alarm');
        const rawData = response.data.data;

        remindType.value = rawData.alarm;
        guideList.value = rawData.guide;
        cancelGuideList.value = rawData.cancelGuide;
    }

    // 리마인드 알림 설정 값 변경
    const setRemindAlarm = async(value) => {
        const response = await api.get(`/api/linkbusiness/{cocode}/setting/alarm/${value}`);
    }

    // 예약 승인 알림문구 변경
    const modifyAlarmGuide = async(params) => {
        const response = await api.post('/api/linkbusiness/{cocode}/setting/alarm/guide/modify', params);
    }

    // 예약 취소 알림문구 변경
    const modifyAlarmCancelGuide = async(params) => {
        const response = await api.post('/api/linkbusiness/{cocode}/setting/alarm/cancelGuide/modify', params)
    }

    // -------------------------------------
    // 네이버 플레이스 관리>플레이스 설정>예약자 정보요청
    // -------------------------------------

    // 사용자 정보 요청 질문 리스트 가져오기
    const getQuestionList = async() => {
        const response = await api.get('/api/{cocode}/question/list');
        const rawData = response.data.data;

        questionList.value = rawData.questionList.map(q => {
            const sortedOptions = q.options 
            ? [...q.options].sort((a, b) => a.optionOrder - b.optionOrder) 
            : [];

            return {
                ...q,
                options: sortedOptions,
                // UI에서 바로 쓸 수 있게 매핑
                uiQuestionOptions: sortedOptions.map(opt => ({
                    label: opt.optionName,
                    value: opt.optionIdx
                }))
            }
        });
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
        operationInfo,
        historyData,
        // 플레이스 설정 > 알림설정
        remindType,
        guideList,
        cancelGuideList,
        // 플레이스 설정 > 예약자 정보 요청 
        isRequestMessageUsed, 
        questionList,

        // api

        // 플레이스 설정 > 운영설정
        getOperationInfo,
        setAcceptingReservation,
        setTodayReservation,
        getImpHistory,
        // 플레이스 설정 > 알림설정
        getAlarmInfo,
        setRemindAlarm,
        modifyAlarmGuide,
        modifyAlarmCancelGuide,
        // 플레이스 설정 > 예약자 정보 요청 
        getQuestionList,
        addQuestion,
        modifyQuestion,
        modifyQuestionOrder,
        setQuestion,
    }
})