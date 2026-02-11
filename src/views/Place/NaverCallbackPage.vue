<!-- 네이버 로그인 콜백: SDK로 프로필 조회 후 opener에 postMessage -->
<script setup>
import { onMounted } from 'vue';
import { COCODE } from '@/constants/common';
import { NAVER_CLIENT_ID, getNaverCallbackUrl, buildProfilePayload, ensureNaverLoginScripts } from '@/constants/naver';

const callbackUrl = getNaverCallbackUrl();

function sendError(msg) {
    if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'naver-profile', error: msg }, window.location.origin);
    }
    window.close();
}

function sendToOpener(profile) {
    if (!window.opener || window.opener.closed) return;
    const payload = buildProfilePayload(profile, Number(COCODE));
    if (!payload) return;
    window.opener.postMessage({ type: 'naver-profile', profile: payload }, window.location.origin);
    window.close();
}

onMounted(() => {
    ensureNaverLoginScripts()
        .then(() => {
            if (typeof window.naver_id_login === 'undefined') {
                sendError('SDK 로드 실패');
                return;
            }
            const naver_id_login = new window.naver_id_login(NAVER_CLIENT_ID, callbackUrl);
            window.naverSignInCallback = function () {
                const id = naver_id_login.getProfileData('id');
                const email = naver_id_login.getProfileData('email');
                const profile = {
                    id,
                    naverId: id,
                    email,
                    nickname: naver_id_login.getProfileData('nickname'),
                    name: naver_id_login.getProfileData('name'),
                    profile_image: naver_id_login.getProfileData('profile_image'),
                    age: naver_id_login.getProfileData('age'),
                    birthday: naver_id_login.getProfileData('birthday'),
                    gender: naver_id_login.getProfileData('gender'),
                    birthyear: naver_id_login.getProfileData('birthyear'),
                };
                sendToOpener(profile);
            };
            naver_id_login.get_naver_userprofile('naverSignInCallback()');
        })
        .catch(() => sendError('SDK 로드 실패'));
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
