export const buildTemplateVariables = (reservationData = {}) => {
    return {
        '동물명': reservationData?.petName,
        '예약날짜': reservationData?.reservationDate,
        '예약시간': reservationData?.reservationTime,
        '상품명': reservationData?.productName,
        // TODO: cocode로 병원 전화번호를 조회해 실제 값으로 교체
        '병원전화번호': reservationData?.hospitalPhone,
    };
};

export const formatTemplateContent = (content = '', variables = {}) => {
    let formatted = content
        .replace(/₩n/g, '<br>')
        .replace(/\\n/g, '<br>')
        .replace(/\n/g, '<br>');

    Object.entries(variables).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        const replacement = value === '' ? '' : String(value);
        const regex = new RegExp(`#\\{${key}\\}`, 'g');
        formatted = formatted.replace(regex, `<strong>${replacement}</strong>`);
    });

    // 치환되지 않은 가변 인자는 강조만 표시
    formatted = formatted.replace(/#\{([^}]+)\}/g, '<strong>#{$1}</strong>');

    return formatted;
};
