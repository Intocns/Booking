import { defineStore } from "pinia";
import { api} from "@/api/axios";
import Qs from "qs"
import { ref } from "vue";

export const useNoticeStore = defineStore("notice", () => {
    const cocode = '2592' // TODO: 임시
    // TODO: 프록시 설정도 임시

    let noticeList = ref([]) 

    // 공지사항 리스트 가져오기 (대시보드)
    async function getNoticeList() {
        const params = {
            page : 0, //페이지 번호 0부터 시작(ex_1페이지일 경우 -1해야함)
            size : 4
        }

        const response = await api.get(`/api/notice/list`, { params });

        if(response.status == 200) {
            // console.log(response);
            let data = response.data.data.content;
            noticeList.value = data.map((item) => ({
                ...item,
                createdAtTxt: item.createdAt.split('T')[0],
            }))
        }
    }

    return {
        noticeList, // 공지사항 리스트

        getNoticeList, // 공지사항 리스트 가져오기
    };
});