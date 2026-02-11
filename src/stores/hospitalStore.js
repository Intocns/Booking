import { defineStore } from "pinia";
import { api} from "@/api/axios";
import Qs from "qs"
import { ref } from "vue";

export const useHospitalStore = defineStore("hospital", () => {
    const hospitalData = ref({}); // 병원 정보

    let hospitalInfo = ref({}) // 예약별 카운트
    let doctorList = ref([]) // 담당의 리스트

    // 병원 정보 가져오기 (대시보드)
    async function getHospitalInfo() {
        const response = await api.get(`/api/{cocode}/hospital/detail`);

        if(response.status == 200) {
            let data = response.data.data;
            hospitalInfo.value = data;
        }
    }

    // 담당의리스트 가져오기
    async function getDoctorList() {
        const response = await api.get(`/api/{cocode}/reserve/getDoc`);

        if(response.status == 200) {
            let data = response.data.data;
            doctorList.value = data;
        }
    }

    return {
        // 
        hospitalData, // 병원정보 (로그인)
        hospitalInfo, // 대시보드 > 병원 정보
        doctorList, // 담당의 리스트
        // 
        getHospitalInfo, // 병원 정보 가져오기
        getDoctorList, // 담당의 리스트 가져오기
    };
});