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
