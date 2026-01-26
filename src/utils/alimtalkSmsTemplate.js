export const buildTemplateVariables = (reservationData = {}) => {
    return {
        '동물명': reservationData?.petName,
        '예약날짜': reservationData?.reservationDate,
        '날짜': reservationData?.reservationDate,
        '예약시간': reservationData?.reservationTime,
        '상품명': reservationData?.productName,
        // TODO: cocode로 병원 전화번호를 조회해 실제 값으로 교체
        '병원전화번호': reservationData?.hospitalPhone,
        '병원명': reservationData?.hospitalName,
        '고객명': reservationData?.protectorName,
        '내용' : ''
    };
};

/**
 * 템플릿 변수 치환
 * @param {string} content - 원문
 * @param {Object} variables - 치환 맵
 * @param {{ mode?: 'alimtalk'|'sms' }} [opts] - alimtalk: #{변수}, HTML(<br>,<strong>). sms: {변수}, plain.
 */
export const formatTemplateContent = (content = '', variables = {}, opts = {}) => {
    const isSms = opts.mode === 'sms';
    let formatted = String(content || '')
        .replace(/₩n/g, isSms ? '\n' : '<br>')
        .replace(/\\n/g, isSms ? '\n' : '<br>');
    if (!isSms) formatted = formatted.replace(/\n/g, '<br>');

    if (isSms) {
        formatted = formatted.replace(/\{([^}]+)\}/g, (match, name) => {
            const val = variables[name?.trim()];
            if (val === undefined || val === null) return match;
            return String(val);
        });
    } else {
        Object.entries(variables).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            const replacement = value === '' ? '' : String(value);
            formatted = formatted.replace(new RegExp(`#\\{${key}\\}`, 'g'), `<strong>${replacement}</strong>`);
        });
        formatted = formatted.replace(/#\{([^}]+)\}/g, '<strong>#{$1}</strong>');
    }
    return formatted;
};
