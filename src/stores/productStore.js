// 상품 관련
import { defineStore } from "pinia";
import { api } from "@/api/axios";
import { ref } from "vue";

export const useProductStore = defineStore("product", () => {
    const cocode = '2592' // TODO: 임시

    // 상품 전체 리스트
    const productList = ref([]);
    const itemRoomList = ref([]);
    const linkItemInfo = ref({});
    const itemDetailInfo = ref({});
    const responseCode = ref("");
    

    // 상품 리스트
    async function getProductList() {

        const response = await api.get(`/api/${cocode}/item/list`)

        if (response.status == 200) {
            const data = response.data.data;
            productList.value = data;
        }
    }

    //상품 순서 변경
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

        if(response.data.status_code <= 300) {
            responseCode.value = 200;
            alert('저장이 완료되었습니다.');
        }else{
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    //상품 정보 변경
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

        if(response.data.status_code <= 300) {
            alert('저장이 완료되었습니다.');
        }else{
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    //인투펫 진료실 불러오기
    async function getItemRoomList() {
        const response = await api.get(`/api/${cocode}/item/room/list`);

        if(response.data.status_code <= 300) {
            const data = response.data.data;
            itemRoomList.value = data;
        }
    }

    //인투펫 진료실 불러오기
    async function getLinkItemInfo(cocode, roomIdx, params) {
        //임시 적용 start(사용 시 해당 params값 참고)
        // let params = {
        //     "roomIdx": 0,
        //     "itemYn":  "y", //해당 정보 response 여부
        //     "bookingYn": "y" //해당 정보 response 여부
        // }
        //임시 적용 end(사용 시 해당 params값 참고)

        const response = await api.post(`/api/${cocode}/item/linkItem/${roomIdx}`, params);

        if(response.data.status_code <= 300) {
            const data = response.data.data;
            linkItemInfo.value = data;
        }
    }

    //상품 삭제
    async function delItem(cocode, itemId) {
        const response = await api.post(`/api/${cocode}/item/set/del/${itemId}`);

        if(response.data.status_code <= 300) {
            alert('삭제가 완료되었습니다.');
        }else{
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    //상품 등록
    async function addItem(cocode, params) {
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

        if(response.data.status_code <= 300) {
            alert('등록이 완료되었습니다.');
        }else{
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    //상품 수정
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

        if(response.data.status_code <= 300) {
            alert('수정이 완료되었습니다.');
        }else{
            alert('처리 중 오류가 발생했습니다.');
        }
    }

    //상품 기본정보 확인
    async function getItemDetailInfo(cocode, itemId) {
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

        if(response.data.status_code <= 300) {
            responseCode.value = 200;
            alert('저장이 완료되었습니다.');
        }else{
            alert('처리 중 오류가 발생했습니다.');
        }
    }
    
    return {
        productList,
        itemRoomList,
        linkItemInfo,
        itemDetailInfo,
        responseCode,

        getProductList,
        setItemOrder,
        setItemDesc,
        getItemRoomList,
        getLinkItemInfo,
        delItem,
        addItem,
        modifyItem,
        getItemDetailInfo,
        setItemShow
    }
})