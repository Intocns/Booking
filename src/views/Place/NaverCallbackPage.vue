<!-- 네이버 로그인 콜백 (팝업): SDK 프로필 수신 후 opener로 postMessage -->
<script setup>
import { onMounted } from 'vue';
import { COCODE } from '@/constants/common';
import { NAVER_CLIENT_ID, getMappingUrl, getNaverCallbackUrl, buildProfilePayload } from '@/constants/naver';

const mappingUrl = getMappingUrl();
const callbackUrl = getNaverCallbackUrl();

function sendToOpener(profile) {
    if (!window.opener || window.opener.closed) return;
    const payload = buildProfilePayload(profile, Number(COCODE));
    if (!payload) return;
    window.opener.postMessage({ type: 'naver-profile', profile: payload }, window.location.origin);
}

onMounted(() => {
    window.naverSignInCallback = function (profile) {
        if (profile) sendToOpener(profile);
        window.close();
    };

    if (typeof window.naver_id_login === 'undefined') {
        window.opener && !window.opener.closed &&
            window.opener.postMessage({ type: 'naver-profile', error: 'SDK 로드 실패' }, window.location.origin);
        window.close();
        return;
    }

    const naverLogin = new window.naver_id_login(NAVER_CLIENT_ID, callbackUrl);
    naverLogin.setDomain(mappingUrl);
    naverLogin.setState(naverLogin.getUniqState());
    naverLogin.setPopup();
    naverLogin.init_naver_id_login();
    // naverLogin.get_naver_userprofile('naverSignInCallback');
});
</script>

<template>
    <div class="naver-callback">
        <p class="naver-callback__text">네이버 로그인 중...</p>
        <button type="button" class="btn btn-close" @click="() => window.close()">닫기</button>
    </div>
</template>

<style lang="scss" scoped>
.naver-callback {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;

    &__text {
        @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
        color: $gray-700;
    }
}
</style>
