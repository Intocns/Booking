export const formatCount = (value) => {
    // 숫자로 변환 (문자열 대비)
    const num = Number(value);

    // 숫자가 아니거나 유효하지 않은 입력값 처리
    if (isNaN(num)) return '';

    // 999 이상인 경우 처리
    if (num >= 999) {
        return '999+';
    }

    // 한 자리 숫자일 경우 앞에 0 붙이기 (두 자리 형식)
    return String(num).padStart(2, '0');
};
