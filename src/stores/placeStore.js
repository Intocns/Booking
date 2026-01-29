// placeStore.js
import { defineStore } from "pinia";
import { api} from "@/api/axios";
import { ref } from "vue";

export const usePlaceStore = defineStore("place", () => {
    const isRequestMessageUsed = ref(0); // 기타 요청사항 받는지 여부
    const questionList = ref([]); // 사용자 정보 요청 질문 리스트

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
        // 
        isRequestMessageUsed,
        questionList,
        // 
        getQuestionList,
        addQuestion,
        modifyQuestion,
        modifyQuestionOrder,
        setQuestion,
    }
})