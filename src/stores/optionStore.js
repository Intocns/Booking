// 네이버 플레이스 > 옵션관리 store
import { defineStore } from "pinia";
import { api} from "@/api/axios";
import { ref } from "vue";

export const useOptionStore = defineStore("option", () => {
    const cocode = '2592' // TODO: 임시
    // TODO: 프록시 설정도 임시

    let categoryList = ref([]) // 카테고리 리스트
    let optionList = ref([]) // 옵션 리스트
    let selectionTypeCode = ref('') // 선택 타입 코드 (NUMBER, CHECK)

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
                const categoryData = data[0];
                const rawOptions = categoryData.options || [];
                
                // selectionTypeCode 저장
                selectionTypeCode.value = categoryData.selectionTypeCode || '';
                
                // 같은 idx를 가진 옵션들을 그룹화하여 bizItemId 개수 계산
                const idxGroupMap = {};
                rawOptions.forEach(option => {
                    const idx = option.idx;
                    if (!idxGroupMap[idx]) {
                        idxGroupMap[idx] = [];
                    }
                    idxGroupMap[idx].push(option);
                });
                
                // 각 idx별로 bizItemId가 있는 옵션 개수 계산
                const connectionCountMap = {};
                Object.keys(idxGroupMap).forEach(idx => {
                    const optionsWithBizItemId = idxGroupMap[idx].filter(opt => opt.bizItemId);
                    connectionCountMap[idx] = optionsWithBizItemId.length;
                });
                
                // API 데이터를 테이블 형식에 맞게 가공
                // 같은 idx를 가진 옵션 중 첫 번째 것만 사용 (중복 제거)
                const seenIdx = new Set();
                optionList.value = rawOptions
                    .filter(option => {
                        if (seenIdx.has(option.idx)) {
                            return false;
                        }
                        seenIdx.add(option.idx);
                        return true;
                    })
                    .map(option => {
                        const connectionCount = connectionCountMap[option.idx] || 0;
                        const connectText = connectionCount > 0 
                            ? `${connectionCount}개 연결중` 
                            : '연결하기';
                        
                        // minBookingCount ~ maxBookingCount 형식으로 표시
                        let bookingCountText = '';
                        const hasMin = option.minBookingCount !== null && option.minBookingCount !== undefined;
                        const hasMax = option.maxBookingCount !== null && option.maxBookingCount !== undefined;
                        console.log(hasMin, hasMax);
                        if (hasMin && hasMax) {
                            // min과 max가 모두 있는 경우
                            if (option.minBookingCount === option.maxBookingCount) {
                                bookingCountText = `${option.minBookingCount}개`;
                            } else {
                                bookingCountText = `${option.minBookingCount}개 ~ ${option.maxBookingCount}개`;
                            }
                        } else if (hasMin && !hasMax) {
                            // min만 있는 경우: "1개 ~" 형식
                            bookingCountText = `${option.minBookingCount}개 ~`;
                        } else {
                            bookingCountText = '-';
                        }
                        
                        return {
                            idx: option.idx,
                            optionName: option.name || '',
                            price: option.price ? option.price.toLocaleString()  + ' 원' : '-',
                            count: option.stock !== null && option.stock !== undefined ? option.stock + ' 개' : '제한 없음',
                            1: bookingCountText,
                            2: option.startDate && option.endDate 
                                ? `${formatDate(option.startDate)} ~ ${formatDate(option.endDate)}`
                                : '상시운영',
                            checked: option.isImp,
                            order: option.order || 0,
                            startDate: option.startDate,
                            endDate: option.endDate,
                            is_connect: connectText
                        };
                    });
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

    // 옵션 등록
    async function addOption(params) {
        const response = await api.post(`/api/${cocode}/option/add`, params);

        if(response.status == 200) {
            return response.data;
        } else {
            throw new Error('옵션 등록 실패');
        }
    }

    // 옵션-상품 매핑 저장
    async function addOptionMapping(params) {
        const response = await api.post(`/api/${cocode}/option/mapping`, params);

        if(response.status == 200) {
            return response.data;
        } else {
            throw new Error('옵션-상품 매핑 저장 실패');
        }
    }

    return {
        //
        categoryList,
        optionList,
        selectionTypeCode,
        //
        getCategoryList,
        getOptionList,
        getOptionListByCategoryId,
        addOption,
        addOptionMapping,
    }
})