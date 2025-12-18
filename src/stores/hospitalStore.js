import { defineStore } from "pinia";
import { api} from "@/api/axios";
import Qs from "qs"
import { ref } from "vue";

export const useHospitalStore = defineStore("hospital", () => {
    const cocode = '2592' // TODO: 임시
    // TODO: 프록시 설정도 임시

    let hospitalInfo = ref({}) // 예약별 카운트

    // 병원 정보 가져오기 (대시보드)
    async function getHospitalInfo() {
        const response = await api.get(`/api/${cocode}/hospital/detail`);

        if(response.status == 200) {
            let data = response.data.data;
            hospitalInfo.value = data;
        }
    }

    return {
        hospitalInfo, // 병원 정보

        getHospitalInfo, // 병원 정보 가져오기
    };
});