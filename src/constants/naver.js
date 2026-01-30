/** 네이버 로그인(implicit) - 클라이언트 ID, 콜백 URL */

export const NAVER_CLIENT_ID = 'EcJRARpxNIYe682MRl2I';
export const NAVER_CALLBACK_PATH = 'mylink/naverReserveCallBack';

export function getMappingUrl() {
    return 'https://intobooking.intocns.com/';
}

export function getNaverCallbackUrl() {
    return getMappingUrl() + NAVER_CALLBACK_PATH;
}

/** SDK 프로필 → POST /linkbusiness/profile 요청 바디로 변환 */
export function buildProfilePayload(profile, cocode = 0) {
    if (!profile) return null;
    const num = (v) => (v != null ? Number(v) : 0);
    const str = (v) => (v ?? '');
    return {
        cocode: num(profile.cocode) || cocode,
        hosIdx: num(profile.hosIdx),
        code: num(profile.code),
        itemId: num(profile.itemId),
        naverId: str(profile.naverId) || str(profile.id),
        id: str(profile.id),
        agencyBizItemId: num(profile.agencyBizItemId),
        businessId: num(profile.businessId),
        flag: num(profile.flag),
        email: str(profile.email),
    };
}
