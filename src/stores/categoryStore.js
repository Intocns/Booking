// 네이버 플레이스 > 옵션관리 store
import { defineStore } from "pinia";
import { api} from "@/api/axios";
import { ref } from "vue";

export const useCategoryStore = defineStore("category", () => {
    let categoryList = ref([]) // 카테고리 리스트

    // 카테고리 목록 조회
    async function getCategoryList() {//251226 optionStore에서 삭제
        const response = await api.get(`/api/{cocode}/category/list`);

        if(response.status == 200) {
            let data = response.data.data;
            categoryList.value = data;
        }
    }

    //카테고리 수정/삭제
    async function modifyCategory(params) {
        //임시 적용 start(사용 시 해당 params값 참고)
        // let params = [
        //     {
        //         "name": "string",
        //         "selectionTypeCode": "string", //NUMBER, CHECK
        //         "categoryId": 0,
        //         "useFlag": 0, //1:수정일 시, 0:삭제일 시
        //         "idx": 0,
        //         "order": 0
        //     }
        // ]
        //임시 적용 end(사용 시 해당 params값 참고)
        
        const response = await api.post(`/api/{cocode}/category/modify`, params);

        return response.data;
    }

    //카테고리 등록
    async function addCategory(params) {
        //임시 적용 start(사용 시 해당 params값 참고)
        // let params = {
        //     "name": "string",
        //     "selectionTypeCode": "string", //NUMBER, CHECK
        // }
        //임시 적용 end(사용 시 해당 params값 참고)
        
        const response = await api.post(`/api/{cocode}/category/add`, params);

        return response.data;
    }

    //카테고리 삭제
    async function deleteCategory(params) {
        //임시 적용 start(사용 시 해당 params값 참고)
        // let params = {
        //     "categoryId": 0,
        //     "idx": 0,
        // }
        //임시 적용 end(사용 시 해당 params값 참고)
        const response = await api.post(`/api/{cocode}/category/delete`, params);

        return response.data;
    }

    return {
        categoryList,

        getCategoryList,
        modifyCategory,
        addCategory,
        deleteCategory
    }
})