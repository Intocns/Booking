import { api } from "@/api/axios";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useIntoPetStore = defineStore("intoPetStore", () => {
    const intoPetRoomList = ref([]); // 인투펫 진료실 리스트 데이터

    const getIntoPetInfo = async() => {
        const response = await api.get('/api/{cocode}/reserve/setting/room');
        
        const data = response.data.data;
        intoPetRoomList.value = data;
    }

    return {
        // ref
        intoPetRoomList,
        // api
        getIntoPetInfo,
    }
})