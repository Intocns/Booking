// 네이버 플레이스 > 옵션관리 store
import { defineStore } from "pinia";
import { api} from "@/api/axios";
import { ref } from "vue";

export const useOptionStore = defineStore("option", () => {
    const cocode = '2592' // TODO: 임시
    // TODO: 프록시 설정도 임시

    let categoryList = ref([]) // 카테고리 리스트

    // 병원 정보 가져오기 (대시보드)
    async function getCategoryList() {
        const response = await api.get(`/api/${cocode}/category/list`);

        if(response.status == 200) {
            let data = response.data.data;
            categoryList.value = data;
        }
    }
    return {
        //
        categoryList,
        // 
        getCategoryList,

    }
})