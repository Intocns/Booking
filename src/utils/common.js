/**
 * 특정 항목의 에러 상태와 메시지를 계산하는 함수
 */
// 유효성 검사용 정규식 (한글, 영문, 한자, 일본어, 숫자, 로마숫자 및 지정된 특수문자)
const VALID_REG_EX = /^[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣一-龥ぁ-んァ-ヶー\u2160-\u216B\u2170-\u217B\-_():&!\[\],.%+~@*^'/?²℃※<> \n\r]*$/;
const ERR_MSG_CHAR = "한글, 영문, 한자, 일본어, 숫자, 로마 숫자, 특수문자(-_():&![],.%+~@*^'/?²℃※<>)만 입력 가능합니다.";

export const getFieldError = (value, min, max) => {
    const text = String(value || '');
    
    // 값이 있을 때만 형식 검사 (최소길이, 허용 문자)
    if (text.length > 0) {
        // 1. 최소글자 체크
        if (min > 0 && text.length < min) {
            return { isError: true, message: `${min}자 이상 입력해야 합니다.` };
        }
        
        // 2. 허용 문자 체크
        if (!VALID_REG_EX.test(text)) {
            return { isError: true, message: ERR_MSG_CHAR };
        }
    }
    
    // 3. 최대글자 체크 (입력 중 즉시 피드백을 위해 별도 유지)
    if (max > 0 && text.length > max) {
        return { isError: true, message: `${max}자까지만 입력 가능합니다.` };
    }

    return { isError: false, message: '' };
};

export const dateViewFormat = (value) => {
    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return ''; // 유효하지 않은 날짜
    }

    const formatter = new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
    });

    const parts = formatter.formatToParts(date);

    return `${parts[0].value}.${parts[2].value}.${parts[4].value}(${parts[6].value})`;
};