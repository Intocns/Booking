// 고객 검색 관련 유틸리티

// 검색 타입을 Int로 변환하는 함수 (백엔드 API용)
export const getSearchTypeInt = (searchType) => {
    const typeMap = {
        'all': 0, // 전체 검색
        'userNo': 1, // 고객번호
        'userName': 2, // 고객명
        'userTel': 3, // 전화번호
        'petNo': 4, // 동물번호
        'petName': 5, // 동물명
    };
    return typeMap[searchType] ?? 0;
};

// 고객 매칭 토글 함수 (단일 선택: 하나 선택 시 기존 선택 해제)
export const toggleCustomerMatch = (list, row) => {
    const index = list.findIndex(item => item === row);
    if (index !== -1) {
        const wasMatched = list[index].isMatched;
        
        // 모든 고객의 매칭 상태 초기화
        list.forEach(item => {
            item.isMatched = false;
            item.rowClass = '';
        });
        
        // 클릭한 고객이 매칭되지 않았던 경우에만 매칭 (토글)
        if (!wasMatched) {
            list[index].isMatched = true;
            list[index].rowClass = 'row-matched';
        }
    }
};
