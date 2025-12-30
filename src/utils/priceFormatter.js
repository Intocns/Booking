/**
 * 가격 포맷터
 * 숫자를 천 단위 구분자(콤마)로 포맷팅
 * @param {string|number} value - 포맷팅할 숫자
 * @returns {string} 포맷팅된 문자열 (예: 10000 -> "10,000")
 */
export const formatPrice = (value) => {
    if (!value && value !== 0) return '';
    
    // 숫자만 추출
    const num = String(value).replace(/[^0-9]/g, '');
    
    if (!num) return '';
    
    // 천 단위 구분자 추가
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 가격 파서
 * 포맷팅된 문자열에서 숫자만 추출
 * @param {string} value - 포맷팅된 문자열 (예: "10,000")
 * @returns {string} 숫자만 추출된 문자열 (예: "10000")
 */
export const parsePrice = (value) => {
    if (!value) return '';
    // 숫자만 추출
    return String(value).replace(/[^0-9]/g, '');
};

