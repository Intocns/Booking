/**
 * YYYY-MM-DD
 */
export const formatDate = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d)) return ''

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * YYYY.MM.DD
 */
export const formatDateDot = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d)) return ''

    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/**
 * HH:mm:ss
 */
export const formatTime = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d)) return ''

    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    // return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

/**
 * YY.MM.DD HH:mm:ss
 */
export const formatDateTime = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d)) return ''

    return `${formatDate(value)} ${formatTime(value)}`
}

/**
 * 시간 문자열을 분 단위로 변환 (HH:mm -> 분)
 * @param {string} timeStr - 'HH:mm' 형식의 시간 문자열
 * @returns {number|null} 분 단위로 변환된 값, 유효하지 않으면 null
 */
export const formatTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}