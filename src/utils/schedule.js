// 요일 
export const DAYS_OPTIONS = [
    { label: '월', value: 'MON' },
    { label: '화', value: 'TUE' }, 
    { label: '수', value: 'WED' },
    { label: '목', value: 'THU' }, 
    { label: '금', value: 'FRI' }, 
    { label: '토', value: 'SAT' }, 
    { label: '일', value: 'SUN' }
]

// 공휴일 데이터
export const PUBLIC_HOLIDAYS_OPTIONS = [
    { label: '신정', value: 0 },
    { label: '설날 전날', value: 1, apiValue: '설날 연휴1' },
    { label: '설날 당일', value: 2 },
    { label: '설날 다음날', value: 3, apiValue: '설날 연휴2' },
    { label: '삼일절', value: 4 },
    { label: '석가탄신일', value: 5 },
    { label: '어린이날', value: 6 },
    { label: '현충일', value: 7 },
    { label: '광복절', value: 8 },
    { label: '개천절', value: 9 },
    { label: '한글날', value: 10 },
    { label: '크리스마스', value: 11 },
    { label: '추석 전날', value: 12, apiValue: '추석 연휴1' },
    { label: '추석 당일', value: 13 },
    { label: '추석 다음날', value: 14, apiValue: '추석 연휴2' }
]

// hourBit 변환
export const bitToTimeRanges = (bitString) => {
    // 비트가 없거나 전부 0인 경우
    if (!bitString || !bitString.includes('1')) {
        return [{ startTime: '', endTime: '' }];
    }

    const ranges = [];
    let start = null;

    // 48비트 순회 (0~47)
    for (let i = 0; i < bitString.length; i++) {
        const bit = bitString[i];
        
        // 1을 만났는데 아직 시작점이 없다면 (새로운 구간 시작)
        if (bit === '1' && start === null) {
            start = i;
        } 
        
        // 현재가 1인데 다음이 0이거나, 문자열의 끝인 경우 (구간 종료)
        if (start !== null && (bitString[i + 1] === '0' || i === bitString.length - 1)) {
            const end = i + 1; // 종료 지점은 인덱스 + 1 (길이 개념)
            
            const formatTime = (totalHalfHours) => {
                const hours = Math.floor(totalHalfHours / 2);
                const minutes = (totalHalfHours % 2) * 30;
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            };

            ranges.push({
                startTime: formatTime(start),
                endTime: formatTime(end)
            });
            
            start = null; // 초기화
        }
    }

    // console.log(bitString, ranges);
    return ranges.length > 0 ? ranges : [{ startTime: '', endTime: '' }];
};
