// 상품 관련
import { defineStore } from "pinia";
import { api } from "@/api/axios";
import { ref } from "vue";

export const useProductStore = defineStore("product", () => {
    const cocode = '2592' // TODO: 임시

    const productList = ref([]);     // 상품 전체 리스트
    const itemRoomList = ref([]);    // 인투펫 진료실 리스트
    const linkItemInfo = ref({});
    const itemDetailInfo = ref({});
    const productScheduleDataList = ref([]); // 간단예약 관리 > 상품별 운영시간 데이터
    const productWeekScheduleDataList = ref([]); // 상품 수정 > 상품 운영시간 데이터

    // 상품 리스트 불러오기
    async function getProductList() {

        const response = await api.get(`/api/${cocode}/item/list`)

        if (response.status == 200) {
            const data = response.data.data;
            productList.value = data;
        }
    }

    // 상품 순서 변경
    async function setItemOrder(params) {
        //임시 적용 start(사용 시 해당 params값 참고)
        // let params = [
        //     {
        //         "order": 0,
        //         "bizItemId": 0
        //     }
        // ]
        //임시 적용 end(사용 시 해당 params값 참고)

        const response = await api.post(`/api/${cocode}/item/set/order`, params);
        
        return response.data;
    }

    // 상품 정보 변경
    async function setItemDesc(params) {
        //임시 적용 start(사용 시 해당 params값 참고)
        // let params = {
        //     "bizItemIds": "string",
        //     "bizItemId": "string",
        //     "desc": "string",
        //     "bookingPecautionJson": {
        //         "desc": "string"
        //     },
        //     "extraDescJson": {
        //         "images": [
        //             {
        //                 "src": "string",
        //                 "url": "string"
        //             }
        //         ],
        //         "context": "string",
        //         "title": "string"
        //     }
        // }
        //임시 적용 end(사용 시 해당 params값 참고)

        const response = await api.post(`/api/${cocode}/item/set/desc`, params);
        
        return response.data;
    }

    // 인투펫 진료실 리스트 불러오기
    async function getItemRoomList() {
        const response = await api.get(`/api/${cocode}/item/room/list`);

        if(response.data.status_code <= 300) {
            const data = response.data.data;
            itemRoomList.value = data;
        }
    }

    // 인투펫 진료실 불러오기(import)
    async function getLinkItemInfo(roomIdx) {
        const response = await api.get(`/api/${cocode}/item/linkItem/${roomIdx}`);

        if(response.data.status_code <= 300) {
            const data = response.data.data;
            linkItemInfo.value = data;

            await getProductList();
        } else {
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    // 상품 삭제
    async function delItem(itemId) {
        const response = await api.post(`/api/${cocode}/item/set/del/${itemId}`);

        if(response.data.status_code <= 300) {
            await getProductList();
        }else{
            alert('처리 중 오류가 발생했습니다.');
        }
    }
    
    // 상품 복사
    const copyItem = async(itemId, params) => {
        try {
            const response = await api.post(`/api/${cocode}/item/add/${itemId}/cp`, params);

            if(response.data.status_code <= 300) {
                await getProductList();
            }
        } catch {
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    // 상품 등록
    async function addItem(params) {
        //임시 적용 start(사용 시 해당 params값 참고)
        // let params = {
        //     "imp": true,
        //     "agencyKey": 0,
        //     "impStartDateTime": "string",
        //     "bookableSettingJson": {
        //         "isUseOpen": true,
        //         "openDateTime": "string",
        //         "useOpen": true
        //     },
        //     "bookingCountSettingJson": {
        //         "minBookingCount": 0,
        //         "maxBookingCount": 0
        //     },
        //     "bookingConfirmCode": "string",
        //     "impEndDateTime": "string",
        //     "name": "string",
        //     "bookingPrecautionJson": [
        //         {
        //         "desc": "string"
        //         }
        //     ],
        //     "extraDescJson": [
        //         {
        //         "images": [
        //             {
        //             "src": "string",
        //             "url": "string"
        //             }
        //         ],
        //         "context": "string",
        //         "title": "string"
        //         }
        //     ],
        //     "bizItemResources": [
        //         {
        //         "resourceUrl": "string",
        //         "resourceTypeCode": "string"
        //         }
        //     ],
        //     "isImp": true,
        //     "order": 0,
        //     "desc": "string",
        //     "reserveCnt": 0,
        //     "doctor": "string",
        //     "doctorId": "string",
        //     "imageUrls": [
        //         "string"
        //     ],
        //     "pos": [
        //         {
        //         "businessDay": true,
        //         "basicSchedule": true,
        //         "startDate": "string",
        //         "endDate": "string",
        //         "weekdays": [
        //             "string"
        //         ],
        //         "price": 0,
        //         "isBusinessDay": true,
        //         "stock": 0,
        //         "desc": "string",
        //         "hourBit": "string",
        //         "time": [
        //             {
        //             "startTime": "string",
        //             "endTime": "string"
        //             }
        //         ],
        //         "isBasicSchedule": true
        //         }
        //     ],
        //     "impos": {
        //         "week": [
        //             {
        //                 "holidayType": "string",
        //                 "repetitionType": "string",
        //                 "weekdays": [
        //                 "string"
        //                 ],
        //                 "startDate": "string"
        //             }
        //         ],
        //         "mon": [
        //             {
        //                 "holidayType": "string",
        //                 "repetitionType": "string",
        //                 "weekdays": [
        //                 "string"
        //                 ],
        //                 "weekNumbers": [
        //                 0
        //                 ]
        //             }
        //         ],
        //         "spDay": [
        //             {
        //                 "holidayType": "string",
        //                 "repetitionType": "string",
        //                 "startDate": "string",
        //                 "endDate": "string",
        //                 "repetitionDay": 0,
        //                 "repetitionMonth": 0,
        //                 "repetitionStartDay": 0,
        //                 "repetitionEndDay": 0,
        //                 "repetitionStartMonth": 0,
        //                 "repetitionEndMonth": 0
        //             }
        //         ],
        //         "hoDay": [
        //             "string"
        //         ]
        //     }
        // };
        //임시 적용 end(사용 시 해당 params값 참고)

        const response = await api.post(`/api/${cocode}/item/add`, params);
        return response.data;
    }

    // 상품 수정
    async function modifyItem(itemId, params) {
        //임시 적용 start(사용 시 해당 params값 참고)
        // let params = {
        //     "imp": true,
        //     "agencyKey": 0,
        //     "impStartDateTime": "string",
        //     "bookableSettingJson": {
        //         "isUseOpen": true,
        //         "openDateTime": "string",
        //         "useOpen": true
        //     },
        //     "bookingCountSettingJson": {
        //         "minBookingCount": 0,
        //         "maxBookingCount": 0
        //     },
        //     "bookingConfirmCode": "string",
        //     "impEndDateTime": "string",
        //     "name": "string",
        //     "bookingPrecautionJson": [
        //         {
        //         "desc": "string"
        //         }
        //     ],
        //     "extraDescJson": [
        //         {
        //         "images": [
        //             {
        //             "src": "string",
        //             "url": "string"
        //             }
        //         ],
        //         "context": "string",
        //         "title": "string"
        //         }
        //     ],
        //     "bizItemResources": [
        //         {
        //         "resourceUrl": "string",
        //         "resourceTypeCode": "string"
        //         }
        //     ],
        //     "isImp": true,
        //     "order": 0,
        //     "desc": "string",
        //     "reserveCnt": 0,
        //     "doctor": "string",
        //     "doctorId": "string",
        //     "imageUrls": [
        //         "string"
        //     ],
        //     "pos": [
        //         {
        //         "businessDay": true,
        //         "basicSchedule": true,
        //         "startDate": "string",
        //         "endDate": "string",
        //         "weekdays": [
        //             "string"
        //         ],
        //         "price": 0,
        //         "isBusinessDay": true,
        //         "stock": 0,
        //         "desc": "string",
        //         "hourBit": "string",
        //         "time": [
        //             {
        //             "startTime": "string",
        //             "endTime": "string"
        //             }
        //         ],
        //         "isBasicSchedule": true
        //         }
        //     ],
        //     "impos": {
        //         "week": [
        //             {
        //                 "holidayType": "string",
        //                 "repetitionType": "string",
        //                 "weekdays": [
        //                 "string"
        //                 ],
        //                 "startDate": "string"
        //             }
        //         ],
        //         "mon": [
        //             {
        //                 "holidayType": "string",
        //                 "repetitionType": "string",
        //                 "weekdays": [
        //                 "string"
        //                 ],
        //                 "weekNumbers": [
        //                 0
        //                 ]
        //             }
        //         ],
        //         "spDay": [
        //             {
        //                 "holidayType": "string",
        //                 "repetitionType": "string",
        //                 "startDate": "string",
        //                 "endDate": "string",
        //                 "repetitionDay": 0,
        //                 "repetitionMonth": 0,
        //                 "repetitionStartDay": 0,
        //                 "repetitionEndDay": 0,
        //                 "repetitionStartMonth": 0,
        //                 "repetitionEndMonth": 0
        //             }
        //         ],
        //         "hoDay": [
        //             "string"
        //         ]
        //     }
        // };
        //임시 적용 end(사용 시 해당 params값 참고)

        const response = await api.post(`/api/${cocode}/item/modify/${itemId}`, params);

        return response.data;
    }

    // 상품 기본정보 확인
    async function getItemDetailInfo(itemId) {
        const response = await api.get(`/api/${cocode}/item/detail/${itemId}`);

        if(response.data.status_code <= 300) {
            const data = response.data.data;
            itemDetailInfo.value = data;
        }
    }

    //상품 노출 변경(단건/ 일괄)
    async function setItemShow(params) {
        //임시 적용 start(사용 시 해당 params값 참고)
        // let params = [
        //     {
        //         "bizItemId": 0,
        //         "isImp": 0
        //     }
        // ]
        //임시 적용 end(사용 시 해당 params값 참고)

        const response = await api.post(`/api/${cocode}/item/show`, params);
        
        return response.data;
    }

    // 간단 예약 관리 데이터 불러오기 (상품별 예약 운영시간 데이터)
    const getBusinessSchedule = async(params) => {
        try {
            const response = await api.post(`/api/businesses/${cocode}/sche`, params);
            
            if(response.data.status_code <= 300) {
                const data = response.data.data;
                productScheduleDataList.value = data;
            }
        } catch {
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    // 상품 운영시간 변경
    const setScheduleTime = async(itemId, params, schId = null) => {
        // {
        //     "scheduleId": 0,
        //     "day": "string",
        //     "times": [
        //         {
        //         "startTime": "string",
        //         "endTime": "string"
        //         }
        //     ]
        // }
        try {
            const response = await api.post(`/api/${cocode}/item/${itemId}/schedule/modify/a/${schId}`, params);

            return response.data;
        } catch {
            
        }
    }

    // 상품 등록, 수정 > 예약정보 저장
    async function setItemReservationInfo(itemId, params){
        // {
        //     "reserveCnt": 0,
        //     "impStartDateTime": "string",
        //     "impEndDateTime": "string",
        //     "bookableSettingJson": {
        //         "isUseOpen": true,
        //         "openDateTime": "string",
        //         "useOpen": true
        //     },
        //     "pos": [
        //         {
        //         "businessDay": true,
        //         "basicSchedule": true,
        //         "startDate": "string",
        //         "endDate": "string",
        //         "weekdays": [
        //             "string"
        //         ],
        //         "price": 0,
        //         "isBusinessDay": true,
        //         "stock": 0,
        //         "desc": "string",
        //         "hourBit": "string",
        //         "time": [
        //             {
        //             "startTime": "string",
        //             "endTime": "string"
        //             }
        //         ],
        //         "isBasicSchedule": true
        //         }
        //     ],
        //     "impos": {
        //         "week": [
        //         {
        //             "holidayType": "string",
        //             "repetitionType": "string",
        //             "weekdays": [
        //             "string"
        //             ],
        //             "startDate": "string"
        //         }
        //         ],
        //         "mon": [
        //         {
        //             "holidayType": "string",
        //             "repetitionType": "string",
        //             "weekdays": [
        //             "string"
        //             ],
        //             "weekNumbers": [
        //             0
        //             ]
        //         }
        //         ],
        //         "spDay": [
        //         {
        //             "holidayName": "string",
        //             "holidayType": "string",
        //             "repetitionType": "string",
        //             "startDate": "string",
        //             "endDate": "string",
        //             "repetitionDay": 0,
        //             "repetitionMonth": 0,
        //             "repetitionStartDay": 0,
        //             "repetitionEndDay": 0,
        //             "repetitionStartMonth": 0,
        //             "repetitionEndMonth": 0,
        //             "calendarType": "string",
        //             "extraHolidays": [
        //             0
        //             ]
        //         }
        //         ],
        //         "hoDay": [
        //         "string"
        //         ]
        //     }
        // }

        const response = await api.post(`/api/${cocode}/item/add/${itemId}/sche`, params);
        return response.data;
    }

    // 상품 등록, 수정 > 예약정보 수정(스케줄 한번이라도 등록한 경우가 있을 시 사용)
    async function updateItemReservationInfo(itemId, params){
        // {
        //     "reserveCnt": 0,
        //     "impStartDateTime": "string",
        //     "impEndDateTime": "string",
        //     "bookableSettingJson": {
        //         "isUseOpen": true,
        //         "openDateTime": "string",
        //         "useOpen": true
        //     },
        //     "pos": [
        //         {
        //         "businessDay": true,
        //         "basicSchedule": true,
        //         "startDate": "string",
        //         "endDate": "string",
        //         "weekdays": [
        //             "string"
        //         ],
        //         "price": 0,
        //         "isBusinessDay": true,
        //         "stock": 0,
        //         "desc": "string",
        //         "hourBit": "string",
        //         "time": [
        //             {
        //             "startTime": "string",
        //             "endTime": "string"
        //             }
        //         ],
        //         "isBasicSchedule": true
        //         }
        //     ],
        //     "impos": {
        //         "week": [
        //         {
        //             "holidayType": "string",
        //             "repetitionType": "string",
        //             "weekdays": [
        //             "string"
        //             ],
        //             "startDate": "string"
        //         }
        //         ],
        //         "mon": [
        //         {
        //             "holidayType": "string",
        //             "repetitionType": "string",
        //             "weekdays": [
        //             "string"
        //             ],
        //             "weekNumbers": [
        //             0
        //             ]
        //         }
        //         ],
        //         "spDay": [
        //         {
        //             "holidayName": "string",
        //             "holidayType": "string",
        //             "repetitionType": "string",
        //             "startDate": "string",
        //             "endDate": "string",
        //             "repetitionDay": 0,
        //             "repetitionMonth": 0,
        //             "repetitionStartDay": 0,
        //             "repetitionEndDay": 0,
        //             "repetitionStartMonth": 0,
        //             "repetitionEndMonth": 0,
        //             "calendarType": "string",
        //             "extraHolidays": [
        //             0
        //             ]
        //         }
        //         ],
        //         "hoDay": [
        //         "string"
        //         ]
        //     }
        // }

        const response = await api.post(`/api/${cocode}/item/${itemId}/schedule/modify`, params);
        return response.data;
    }
    
    // 상품 수정 > 상품 운영시간 불러오기
    const getProductSchedule = async(itemId, params) => {
        try {
            const response = await api.post(`/api/${cocode}/item/${itemId}/schedule/detail`, params); 

            if(response.data.status_code <= 300) {
                const data = response.data.data;
                productWeekScheduleDataList.value = data;
            }
            console.log(response)
        } catch {
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    return {
        // 
        productList, // 상품 전체 리스트
        itemRoomList, // 인투펫 진료실 리스트
        linkItemInfo,
        itemDetailInfo,
        productScheduleDataList, // 간단예약 관리 > 상품별 운영시간 데이터
        productWeekScheduleDataList, // 상품 수정 > 상품 운영시간 데이터
        // 
        getProductList, // 상품 리스트 불러오기
        setItemOrder, // 상품 순서 변경
        setItemDesc, // 상품 정보 변경
        getItemRoomList, // 인투펫 진료실 리스트 불러오기
        getLinkItemInfo, // 인투펫 진료실 불러오기(import)
        delItem, // 상품 삭제
        copyItem, // 상품 복사
        addItem, // 상품 등록
        modifyItem, // 상품 수정
        getItemDetailInfo, // 상품 기본정보 확인
        setItemShow, //상품 노출 변경(단건/ 일괄)
        getBusinessSchedule, // 간단 예약 관리 데이터 불러오기 (상품별 예약 운영시간 데이터)
        setScheduleTime, // 상품 운영시간 변경
        setItemReservationInfo, // 상품 등록 > 예약정보 저장
        updateItemReservationInfo,  // 상품 등록, 수정 > 예약정보 저장(등록화면에서 상품 등록을 한번이라도 한 경우)
        getProductSchedule, // 상품 수정 > 상품 운영시간 불러오기
    }
})