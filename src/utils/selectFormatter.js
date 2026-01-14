/**
 * 선택된 라벨 목록을 표시 형식으로 변환
 * @param {Array<string>} labels - 선택된 라벨 배열
 * @param {string} placeholder - 기본 placeholder 텍스트
 * @param {number} maxDisplayCount - 최대 표시 개수 (기본값: 2)
 * @returns {string} 포맷된 텍스트
 */
export function formatSelectedLabels(labels, placeholder = '선택', maxDisplayCount = 2) {
    if (!labels || labels.length === 0) {
        return placeholder;
    }
    
    // '전체'가 선택된 경우
    if (labels.length === 1 && labels[0] === '전체') {
        return '전체';
    }
    
    // 선택된 항목이 maxDisplayCount 이하인 경우
    if (labels.length <= maxDisplayCount) {
        return labels.join(', ');
    }
    
    // 선택된 항목이 maxDisplayCount 이상인 경우: 처음 maxDisplayCount개만 표시하고 나머지는 "(+N)"로 표시
    const remainingCount = labels.length - maxDisplayCount;
    const displayedLabels = labels.slice(0, maxDisplayCount);
    return `${displayedLabels.join(', ')} (+${remainingCount})`;
}
