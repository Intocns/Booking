/** 네이버 로그인(implicit) - 클라이언트 ID, 콜백 URL */

export const NAVER_CLIENT_ID = 'EcJRARpxNIYe682MRl2I';
/** 프론트 기준 콜백 경로 (라우터 path) */
export const NAVER_CALLBACK_PATH = 'mylink/naverReserveCallBack';


export function getMappingUrl() {
    return (import.meta.env.VITE_APP_BASE_URL || window.location.origin).replace(/\/$/, '') + '/';
}

export function getNaverCallbackUrl() {
    return getMappingUrl() + NAVER_CALLBACK_PATH;
}

// --- 스크립트 로드 ---
const JQUERY_URL = 'https://code.jquery.com/jquery-3.7.1.min.js';
const NAVER_LOGIN_SCRIPT_URL = 'https://static.nid.naver.com/js/naverLogin_implicit-1.0.3.js';

function loadScript(src, opts = {}) {
    return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') return reject(new Error('document undefined'));
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        if (opts.integrity) script.integrity = opts.integrity;
        if (opts.crossOrigin) script.crossOrigin = opts.crossOrigin;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
}

/** jQuery → Naver SDK 순서로 로드 (콜백 페이지·연동 페이지 공용) */
export function ensureNaverLoginScripts() {
    return loadScript(JQUERY_URL, {
        integrity: 'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=',
        crossOrigin: 'anonymous',
    }).then(() => loadScript(NAVER_LOGIN_SCRIPT_URL));
}

// --- API 페이로드 빌더 ---
/**
 * POST /api/linkbusiness/mapping 요청 바디 (연동 해제용)
 * code: 2 = 자체적인 매핑 해제 호출 (백엔드 BusinessMappingDto.code 규칙)
 */
export function buildUnlinkPayload({ cocode, hosIdx, naverId, businessId }) {
    const num = (v) => (v != null ? Number(v) : 0);
    const str = (v) => (v ?? '');
    return {
        cocode: num(cocode),
        hosIdx: num(hosIdx),
        code: 2,
        itemId: 0,
        naverId: str(naverId),
        id: '0',
        agencyBizItemId: 0,
        businessId: num(businessId),
        flag: 0,
        email: 'temp@temp.com',
    };
}

/** POST /api/linkbusiness/conn 요청 바디 (기존 네이버 예약 병원 연동용) */
export function buildConnectPayload({ cocode, hosIdx, naverId, businessId }) {
    const num = (v) => (v != null ? Number(v) : 0);
    const str = (v) => (v ?? '');
    return {
        cocode: num(cocode),
        hosIdx: num(hosIdx),
        code: 0,
        itemId: 0,
        naverId: str(naverId),
        agencyBizItemId: 0,
        businessId: num(businessId),
        flag: 0,
    };
}

/**
 * SDK 프로필 → POST /api/linkbusiness/profile 요청 바디.
 * DTO profile 그룹 필수: cocode, hosIdx, id, email (나머지는 선택).
 * businessId 없을 땐 null → 백엔드에서 신규 업체 생성 분기.
 */
export function buildProfilePayload(profile, cocode = 0) {
    if (!profile) return null;
    const num = (v) => (v != null ? Number(v) : 0);
    const str = (v) => (v ?? '');
    const idVal = str(profile.id).trim();
    const emailVal = str(profile.email).trim();
    const hosIdxVal = num(profile.hosIdx);
    return {
        cocode: num(profile.cocode) || cocode,
        hosIdx: hosIdxVal > 0 ? hosIdxVal : 1,
        code: num(profile.code) || 0,
        itemId: num(profile.itemId) || 0,
        naverId: str(profile.naverId) || idVal || 'temp',
        id: idVal || 'temp',
        agencyBizItemId: num(profile.agencyBizItemId) || 0,
        businessId: (num(profile.businessId) || 0) === 0 ? null : num(profile.businessId),
        flag: num(profile.flag) || 0,
        email: emailVal || 'temp@temp.com',
    };
}
