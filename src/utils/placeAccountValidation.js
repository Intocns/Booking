/**
 * 네이버 플레이스 연동 계정 > 플레이스 등록 정보 저장 시 필수값/형식 검증
 * - serviceName(서비스명), desc(서비스 설명), name(업체명), reprOwnerName(대표자명)
 * - addressJson(주소), email, 전화번호(예약문의/관리자)
 */

/** 허용 문자: 한글, 영문, 한자, 일본어, 숫자, 로마 숫자, 특수문자(-_():&![],.%+~@*^'/?²℃※<>), 공백 */
const ALLOWED_CHAR_PATTERN = /^[\uAC00-\uD7A3a-zA-Z\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF0-9\u2160-\u217F\s\-_():&!\[\],.%+~@*^'\/?\u00B2\u2103\u203B<>]*$/;
const ALLOWED_CHARS_MSG = '한글, 영문, 한자, 일본어, 숫자, 로마 숫자, 특수문자(-_():&![],.%+~@*^\'/?²℃※<>)만 입력 가능합니다.';

function allowedCharsOnly(str) {
    if (str == null || str === '') return true;
    return ALLOWED_CHAR_PATTERN.test(String(str));
}

/** 이메일 형식 (간단 검증, 최대 30자) */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkLength(str, min, max) {
    const len = str == null ? 0 : String(str).length;
    if (min != null && len < min) return { ok: false, message: `최소 ${min}자 이상 입력해 주세요.` };
    if (max != null && len > max) return { ok: false, message: `최대 ${max}자까지 입력 가능합니다.` };
    return { ok: true };
}

/**
 * 서비스명 검증 (최대 50자, 허용 문자만)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateServiceName(value) {
    const s = value == null ? '' : String(value).trim();
    if (!s) return { valid: false, message: '서비스명을 입력해 주세요.' };
    const len = checkLength(s, null, 50);
    if (!len.ok) return { valid: false, message: len.message };
    if (!allowedCharsOnly(s)) return { valid: false, message: `서비스명에는 ${ALLOWED_CHARS_MSG}` };
    return { valid: true };
}

/**
 * 서비스 설명 검증 (최소 20자, 최대 2000자, 허용 문자만)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateDesc(value) {
    const s = value == null ? '' : String(value).trim();
    if (!s) return { valid: false, message: '서비스 설명을 입력해 주세요.' };
    const len = checkLength(s, 20, 2000);
    if (!len.ok) return { valid: false, message: len.message };
    if (!allowedCharsOnly(s)) return { valid: false, message: `서비스 설명에는 ${ALLOWED_CHARS_MSG}` };
    return { valid: true };
}

/**
 * 업체 이름 검증 (최대 30자)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateName(value) {
    const s = value == null ? '' : String(value).trim();
    if (!s) return { valid: false, message: '업체(병원)명을 입력해 주세요.' };
    const len = checkLength(s, null, 30);
    if (!len.ok) return { valid: false, message: len.message };
    return { valid: true };
}

/**
 * 대표자명 검증 (최대 40자)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateReprOwnerName(value) {
    const s = value == null ? '' : String(value).trim();
    if (!s) return { valid: false, message: '대표자(원장)명을 입력해 주세요.' };
    const len = checkLength(s, null, 40);
    if (!len.ok) return { valid: false, message: len.message };
    return { valid: true };
}

/**
 * 주소 검증 (지번 또는 도로명 둘 다 전송 필요. 도로명 없는 경우 지번만 가능)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateAddress(roadAddr, jibun) {
    const road = roadAddr == null ? '' : String(roadAddr).trim();
    const jib = jibun == null ? '' : String(jibun).trim();
    if (!road && !jib) return { valid: false, message: '주소를 검색하여 입력해 주세요.' };
    return { valid: true };
}

/**
 * 이메일 검증 (최대 30자, 형식)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateEmail(value) {
    const s = value == null ? '' : String(value).trim();
    if (!s) return { valid: false, message: '이메일을 입력해 주세요.' };
    const len = checkLength(s, null, 30);
    if (!len.ok) return { valid: false, message: len.message };
    if (!EMAIL_PATTERN.test(s)) return { valid: false, message: '이메일 형식이 올바르지 않습니다.' };
    return { valid: true };
}

/**
 * 전화번호 필수 검증 (숫자만 추출했을 때 9자리 이상 등)
 * @returns {{ valid: boolean, message?: string }}
 */
export function validatePhoneRequired(value) {
    const s = value == null ? '' : String(value).replace(/\D/g, '');
    if (s.length < 9) return { valid: false, message: '올바른 전화번호를 입력해 주세요.' };
    return { valid: true };
}

/**
 * 저장 폼 전체 검증 (필드별 메시지 반환)
 * @param {Object} form - { serviceName, desc, placeName, reprOwnerName, address, jibun, email, reservationPhone, adminPhone }
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validatePlaceDetail(form) {
    const errors = {};

    const r1 = validateServiceName(form.serviceName);
    if (!r1.valid) errors.serviceName = r1.message;

    const r2 = validateDesc(form.desc);
    if (!r2.valid) errors.desc = r2.message;

    const r3 = validateName(form.placeName);
    if (!r3.valid) errors.placeName = r3.message;

    const r4 = validateReprOwnerName(form.reprOwnerName);
    if (!r4.valid) errors.reprOwnerName = r4.message;

    const r5 = validateAddress(form.address, form.jibun);
    if (!r5.valid) errors.address = r5.message;

    const r6 = validateEmail(form.email);
    if (!r6.valid) errors.email = r6.message;

    const r7 = validatePhoneRequired(form.reservationPhone);
    if (!r7.valid) errors.reservationPhone = r7.message;

    const r8 = validatePhoneRequired(form.adminPhone);
    if (!r8.valid) errors.adminPhone = r8.message;

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

/** 검증 에러 키 → 화면 표시용 라벨 */
export const PLACE_DETAIL_FIELD_LABELS = {
    serviceName: '서비스명',
    desc: '서비스 소개',
    placeName: '병원명',
    reprOwnerName: '대표자(원장)명',
    address: '주소',
    email: '이메일',
    reservationPhone: '예약문의 번호',
    adminPhone: '관리자 번호',
};

/**
 * 검증 에러 목록을 사용자 안내 문구로 포맷
 * @param {Record<string, string>} errors - validatePlaceDetail 반환 errors
 * @returns {string} "다음 항목을 확인해 주세요:\n• 서비스명: ..."
 */
export function formatPlaceDetailErrors(errors) {
    if (!errors || Object.keys(errors).length === 0) return '';
    const lines = Object.entries(errors).map(
        ([key, message]) => `• ${PLACE_DETAIL_FIELD_LABELS[key] || key}: ${message}`,
    );
    return '다음 항목을 확인해 주세요.\n\n' + lines.join('\n');
}
