/**
 * YY.MM.DD
 */
export const formatDate = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d)) return ''

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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