import { api } from "@/api/axios";
import { showAlert } from "@/utils/ui";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useIntoPetStore = defineStore("intoPetStore", () => {
    const intoPetRoomList = ref([]); // 인투펫 진료실 리스트 데이터
    const intoPetRoomIdx = ref(null); // 인투펫 진료실 데이터 idx (데이터 저장,업데이트시 같이 보내줘야함)
    const intoPetRoomHosIdx = ref(null); //인투펫 진료실 데이터 hosIdx (데이터 저장,업데이트시 같이 보내줘야함)

    const getIntoPetInfo = async() => {
        try {
            const response = await api.get('/api/{cocode}/reserve/setting/room', {skipAlert: true});

            const data = response.data.data;
            // hosIdx, idx값 저장후 같이 보내줘야함
            intoPetRoomIdx.value = data.idx;
            intoPetRoomHosIdx.value = data.hosIdx
            intoPetRoomList.value = data.clinicInfo;

        } catch (error) {
            if (error.response?.data?.status_code === 503 || error.data?.status_code === 503) {
                // 503 에러 > 기본 진료실 한개 생성
                // 기본 타임슬롯 정의 
                const defaultTimeSlot = {
                    st_hour: "10시",
                    st_min: "00분",
                    end_hour: "20시",
                    end_min: "00분",
                    is_disabled: 0,
                    deadline_hour: "19시",
                    deadline_min: "00분"
                };

                // 모든 요일에 기본값 채우기
                const defaultPos = {};
                const days = ['monday', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];

                days.forEach(day => {
                    defaultPos[day] = [{ ...defaultTimeSlot }];
                });

                const newRoom = {
                    del_images: [],
                    doctor: '현장데스크(관리자)',
                    doctor_id: 0,
                    idx: 0,
                    images: [],
                    impos: { week: [], mon: [], sp_day: [] }, // 구조 미리 생성
                    mapping_idx: 0, // 새로 추가하는 진료실의 mapping_idx
                    memo: '',
                    name: '진료실을 생성해 주세요',
                    pos: defaultPos,
                    use_flag: 0,
                    set_reserve: 1,
                    use_weekday_time: 0,
                };

                intoPetRoomList.value = [newRoom];
            } else {
                showAlert("인투펫 진료실 정보를 불러오는 중 오류가 발생했습니다.");
                console.error(error);
            }

        }
        
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