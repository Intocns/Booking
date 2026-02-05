/**
 * 카카오(다음) 주소검색 API(Postcode) 유틸
 * @see https://postcode.map.daum.net/guide
 */

const DAUM_POSTCODE_SCRIPT = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

/**
 * 카카오 주소검색 스크립트 로드 (이미 로드됐으면 스킵)
 * @returns {Promise<void>}
 */
export function ensureKakaoAddrSearchScript() {
    if (typeof window !== 'undefined' && window.daum?.Postcode) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = DAUM_POSTCODE_SCRIPT;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Kakao address search script load failed'));
        document.head.appendChild(script);
    });
}

/**
 * 카카오 주소검색 팝업 열기
 * @param {Object} options
 * @param {(data: { roadAddress?: string, jibunAddress?: string, address?: string }) => void} options.onComplete - 주소 선택 시 콜백
 * @param {string} [options.popupTitle='주소 검색'] - 팝업 제목
 * @param {(err?: Error) => void} [options.onError] - 스크립트 로드 실패 시 콜백
 */
export function openKakaoAddrSearch({ onComplete, popupTitle = '주소 검색', onError }) {
    ensureKakaoAddrSearchScript()
        .then(() => {
            new window.daum.Postcode({
                onComplete: (data) => {
                    if (typeof onComplete === 'function') onComplete(data);
                },
            }).open({ popupTitle });
        })
        .catch((err) => {
            if (typeof onError === 'function') onError(err);
        });
}
