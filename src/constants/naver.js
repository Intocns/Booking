/** 네이버 로그인(implicit) - 클라이언트 ID, 콜백 URL */

export const NAVER_CLIENT_ID = 'EcJRARpxNIYe682MRl2I';
export const NAVER_CALLBACK_PATH = 'mylink/naverReserveCallBack';

export function getMappingUrl() {
    return 'https://intobooking.intocns.com/';
}

export function getNaverCallbackUrl() {
    return getMappingUrl() + NAVER_CALLBACK_PATH;
}

/** SDK 프로필 → POST /linkbusiness/profile 요청 바디로 변환 (없는 필드는 가라값) */
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
        businessId: num(profile.businessId) || 0,
        flag: num(profile.flag) || 0,
        email: emailVal || 'temp@temp.com',
    };
}
