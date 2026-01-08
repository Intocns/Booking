// 네이버 플레이스 > 옵션관리 store
import { defineStore } from "pinia";
import { api} from "@/api/axios";
import { ref } from "vue";
import { formatDate as formatDateUtil } from "@/utils/dateFormatter";

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
            categoryList.value = data;
        }
    }

    async function getOptionList() { //옵션 리스트 가져오기 전체
        const response = await api.get(`/api/${cocode}/option/list`);

        if(response.status == 200) {
            let data = response.data.data;
            optionList.value = data;
        }
    }

    async function getOptionListByCategoryId(categoryId) { //옵션 리스트 가져오기 카테고리별
        const response = await api.get(`/api/${cocode}/option/list/category`, { params: { categoryId: categoryId } });

        if(response.status == 200) {
            let data = response.data.data;
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
                
                // 각 idx별로 bizItemId가 있고 useFlag가 0이 아닌 옵션 개수 계산 및 연결된 상품 ID 리스트 수집
                const connectionCountMap = {};
                const connectedProductIdsMap = {}; // idx별 연결된 상품 ID 리스트
                Object.keys(idxGroupMap).forEach(idx => {
                    // useFlag가 0이 아닌 경우만 카운트 (useFlag가 0이면 비활성화된 연결)
                    const optionsWithBizItemId = idxGroupMap[idx].filter(opt => opt.bizItemId && opt.checked !== 0);
                    connectionCountMap[idx] = optionsWithBizItemId.length;
                    // 연결된 상품 ID 리스트 수집 (중복 제거, useFlag가 0이 아닌 것만)
                    const productIds = [...new Set(optionsWithBizItemId.map(opt => opt.bizItemId))];
                    connectedProductIdsMap[idx] = productIds;
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
                        const connectText = connectionCount > 0  ? `${connectionCount}개 연결중`  : '연결하기';
                        
                        // minBookingCount ~ maxBookingCount 형식으로 표시
                        let bookingCountText = '';
                        const hasMin = option.minBookingCount !== null && option.minBookingCount !== undefined;
                        const hasMax = option.maxBookingCount !== null && option.maxBookingCount !== undefined;
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
                            selectable: bookingCountText,
                            operatingPeriod: option.startDate && option.endDate ? `${formatDateUtil(option.startDate).replace(/-/g, '.')} ~ ${formatDateUtil(option.endDate).replace(/-/g, '.')}` : '상시운영',
                            checked: option.isImp,
                            order: option.order || 0,
                            startDate: option.startDate,
                            endDate: option.endDate,
                            is_connect: connectText,
                            // 수정 모달에서 사용할 원본 데이터
                            rawData: {
                                idx: option.idx,
                                optionId: option.optionId,
                                name: option.name || '',
                                desc: option.desc || '',
                                categoryId: categoryId,
                                minBookingCount: option.minBookingCount,
                                maxBookingCount: option.maxBookingCount,
                                stock: option.stock,
                                price: option.price,
                                normalPrice: option.normalPrice,
                                priceDesc: option.priceDesc,
                                startDate: option.startDate,
                                endDate: option.endDate,
                                serviceDuration: option.serviceDuration,
                                isImp: option.isImp,
                                order: option.order || 0,
                                // 연결된 상품 ID 리스트 (이미 가져온 데이터 활용)
                                connectedProductIds: connectedProductIdsMap[option.idx] || []
                            }
                        };
                    });
            } else {
                optionList.value = [];
            }
        }
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

    // 옵션 수정
    async function updateOption(optionId, params) {
        try {
            const response = await api.post(`/api/${cocode}/option/${optionId}/modify`, params);
            if(response.status == 200) {
                return response.data;
            } else {
                throw new Error('옵션 수정 실패');
            }
        } catch (error) {
            // 409 에러 처리 (옵션을 찾을 수 없음)
            if (error.response && error.response.status === 409) {
                throw new Error('옵션을 찾을 수 없습니다. 옵션이 삭제되었거나 존재하지 않을 수 있습니다.');
            }
            // 기타 에러
            throw error;
        }
    }

    // 옵션 삭제
    async function deleteOption(optionId) {
        try {
            const response = await api.post(`/api/${cocode}/option/${optionId}/del`);
            
            if(response.status == 200) {
                return response.data;
            } else {
                throw new Error('옵션 삭제 실패');
            }
        } catch (error) {
            // 에러 처리
            if (error.response && error.response.status === 409) {
                throw new Error('옵션을 찾을 수 없습니다. 옵션이 이미 삭제되었거나 존재하지 않을 수 있습니다.');
            }
            throw error;
        }
    }

    // 미리보기
    async function getOptionPreviewByItemId(itemId) {
        const response = await api.get(`/api/${cocode}/option/item/${itemId}`);
        if(response.status == 200) {
            return response.data;
        } else {
            throw new Error('미리보기 실패');
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
        updateOption,
        deleteOption,
        getOptionPreviewByItemId,
    }
})