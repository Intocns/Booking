// 상품 관련
import { defineStore } from "pinia";
import { api } from "@/api/axios";
import { ref } from "vue";

export const useProductStore = defineStore("product", () => {
    const cocode = '2592' // TODO: 임시

    // 상품 전체 리스트
    const productList = ref([]);

    // 전체 예약 내역 불러오기
    async function getProductList() {

        const response = await api.get(`/api/${cocode}/item/list`)

        if (response.status == 200) {
            const data = response.data.data;
            productList.value = data;
        }
    }
    
    return {
        getProductList,
        productList
    }
})