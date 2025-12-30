// 네이버 플레이스 > 옵션관리 store
import { defineStore } from "pinia";
import { api} from "@/api/axios";
import { ref } from "vue";

export const useCategoryStore = defineStore("category", () => {
    const cocode = '2592' // TODO: 임시
    // TODO: 프록시 설정도 임시

    let categoryList = ref([]) // 카테고리 리스트
    let responseCode = ref("");

    // 카테고리 목록 조회
    async function getCategoryList() {//251226 optionStore에서 삭제
        const response = await api.get(`/api/${cocode}/category/list`);

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
        
        const response = await api.post(`/api/${cocode}/category/modify`, params);

        if(response.data.status_code <= 300) {
            responseCode.value = 200;
            //$params에서 수정인지 삭제인지 확인 필요
            let msg = '처리가 완료되었습니다.';

            alert(msg);
        }else{
            responseCode.value = response.data.status_code;
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    //카테고리 등록
    async function addCategory(params) {
        //임시 적용 start(사용 시 해당 params값 참고)
        // let params = {
        //     "name": "string",
        //     "selectionTypeCode": "string", //NUMBER, CHECK
        // }
        //임시 적용 end(사용 시 해당 params값 참고)
        
        const response = await api.post(`/api/${cocode}/category/add`, params);
        
        if(response.data.status_code <= 300) {
            responseCode.value = 200;
            alert('저장이 완료되었습니다.');
        }else{
            responseCode.value = response.data.status_code;
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    //카테고리 삭제
    async function deleteCategory(params) {
        //임시 적용 start(사용 시 해당 params값 참고)
        // let params = {
        //     "categoryId": 0,
        //     "idx": 0,
        // }
        //임시 적용 end(사용 시 해당 params값 참고)
        const response = await api.post(`/api/${cocode}/category/delete`, params);
        if(response.data.status_code <= 300) {
            responseCode.value = 200;
            alert('삭제되었습니다.');
        }else{
            responseCode.value = response.data.status_code;
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    return {
        categoryList,
        responseCode,

        getCategoryList,
        modifyCategory,
        addCategory,
        deleteCategory
    }
})