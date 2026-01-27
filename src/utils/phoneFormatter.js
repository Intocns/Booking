// 전화번호 포맷터
export const formatPhone = (value) => {
    if (!value) return ''

    // 숫자만 추출
    const num = String(value).replace(/\D/g, '')

    if (num.length === 11) {
        // 010-1234-5678
        return num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    }

    if (num.length === 10) {
        // 02-1234-5678 or 031-123-4567
        return num.startsWith('02')
            ? num.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3')
            : num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }

    if (num.length === 9 && num.startsWith('02')) {
        // 02-123-4567
        return num.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3')
    }

    return value
}

/**
 * 전화번호에서 하이픈 제거 (숫자만 반환)
 * @param {string} phone - 전화번호
 * @returns {string} 하이픈이 제거된 전화번호
 */
export const removePhoneHyphens = (phone) => {
    if (!phone) return ''
    return String(phone).replace(/\D/g, '')
}