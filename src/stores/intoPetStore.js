import { api } from "@/api/axios";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useIntoPetStore = defineStore("intoPetStore", () => {
    const intoPetRoomList = ref([]); // 인투펫 진료실 리스트 데이터
    const intoPetRoomIdx = ref(null); // 인투펫 진료실 데이터 idx (데이터 저장,업데이트시 같이 보내줘야함)
    const intoPetRoomHosIdx = ref(null); //인투펫 진료실 데이터 hosIdx (데이터 저장,업데이트시 같이 보내줘야함)

    const getIntoPetInfo = async() => {
        const response = await api.get('/api/{cocode}/reserve/setting/room');
        
        const data = response.data.data;
        // hosIdx, idx값 저장후 같이 보내줘야함
        intoPetRoomIdx.value = data.idx;
        intoPetRoomHosIdx.value = data.hosIdx
        intoPetRoomList.value = data.clinicInfo;
    }

    const setIntoPetInfo = async(params) => {
        const response = await api.post('/api/{cocode}/reserve/setting/room', params);
    }

    return {
        // ref
        intoPetRoomIdx,
        intoPetRoomHosIdx,
        intoPetRoomList,
        // api
        getIntoPetInfo,
        setIntoPetInfo,
    }
})