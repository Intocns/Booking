// 네이버 플레이스 > 옵션관리 store
import { defineStore } from "pinia";
import { api} from "@/api/axios";
import { ref } from "vue";

export const useOptionStore = defineStore("option", () => {
    const cocode = '2592' // TODO: 임시
    // TODO: 프록시 설정도 임시

    let categoryList = ref([]) // 카테고리 리스트
    let optionList = ref([]) // 옵션 리스트

    // 병원 정보 가져오기 (대시보드)
    async function getCategoryList() {
        const response = await api.get(`/api/${cocode}/category/list`);

        if(response.status == 200) {
            let data = response.data.data;
            console.log(data);
            categoryList.value = data;
        }
    }

    async function getOptionList() { //옵션 리스트 가져오기 전체
        const response = await api.get(`/api/${cocode}/option/list`);

        if(response.status == 200) {
            let data = response.data.data;
            console.log(data);
            optionList.value = data;
        }
    }

    async function getOptionListByCategoryId(categoryId) { //옵션 리스트 가져오기 카테고리별
        const response = await api.get(`/api/${cocode}/option/list/category`, { params: { categoryId: categoryId } });

        if(response.status == 200) {
            let data = response.data.data;
            console.log(data);
            if(data && Array.isArray(data) && data.length > 0) {
                // data는 배열이고, 첫 번째 요소가 카테고리 객체이며 그 안에 options가 있음
                const rawOptions = data[0].options || [];
                
                // API 데이터를 테이블 형식에 맞게 가공
                optionList.value = rawOptions.map(option => ({
                    idx: option.idx,
                    optionName: option.name || '',
                    price: option.price ? option.price.toLocaleString() : '-',
                    count: option.stock !== null && option.stock !== undefined ? option.stock : '제한 없음',
                    1: option.isImp ? '필수' : '1개',
                    2: option.startDate && option.endDate 
                        ? `${formatDate(option.startDate)} ~ ${formatDate(option.endDate)}`
                        : '상시운영',
                    checked: option.checked || false,
                    order: option.order || 0,
                    startDate: option.startDate,
                    endDate: option.endDate,
                    is_connect: '연결하기' // 기본값, 실제 연결 상태에 따라 변경 필요
                }));
            } else {
                optionList.value = [];
            }
        }
    }

    // 날짜 포맷팅 헬퍼 함수
    function formatDate(dateString) {
        if(!dateString) return '';
        const date = new Date(dateString);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    }

    return {
        //
        categoryList,
        optionList,
        //
        getCategoryList,
        getOptionList,
        getOptionListByCategoryId,
    }
})