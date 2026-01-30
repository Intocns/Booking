<!-- 네이버 플레이스 관리 > 네이버 연동 계정 관리 -->
<script setup>
import PageTitle from '@/components/common/PageTitle.vue';
import TableLayout from '@/components/common/TableLayout.vue';
import InputTextBox from '@/components/common/InputTextBox.vue';
import Modal from '@/components/common/Modal.vue';
import icInfo from '@/assets/icons/ic_infomation_b.svg';
import icSearch from '@/assets/icons/ic_search.svg';
import icAddBtn from '@/assets/icons/ic_add_btn.svg';
import icDragHandel from '@/assets/icons/ic_drag_handel.svg';
import icClear from '@/assets/icons/ic_clear.svg';
import { useModalStore } from '@/stores/modalStore';
import { ref, onMounted, onUnmounted } from 'vue';
import { api } from '@/api/axios';
import { COCODE } from '@/constants/common';
import { NAVER_CLIENT_ID, getMappingUrl, getNaverCallbackUrl, buildProfilePayload } from '@/constants/naver';
import { showAlert } from '@/utils/ui';

const modalStore = useModalStore();
const hasNaverAccount = ref(false);
const naverId = ref('');
const businessId = ref('');
const hosIdx = ref(0);

async function fetchAccountInfo() {
    try {
        const res = await api.get(`/api/linkbusiness/{cocode}`);
        const body = res.data;
        const data = body?.data ?? body;
        if (!data || typeof data !== 'object') return;
        const nid = data.naverId ?? data.naver_id ?? '';
        const bid = data.businessId ?? data.business_id;
        const hasData = nid !== '' || bid != null;
        if (hasData) {
            hasNaverAccount.value = true;
            naverId.value = String(nid);
            businessId.value = bid != null ? String(bid) : '';
            hosIdx.value = data.hosIdx != null ? Number(data.hosIdx) : (data.hos_idx != null ? Number(data.hos_idx) : 0);

            console.log(naverId.value);


        }
    } catch {
        hasNaverAccount.value = false;
    }
}

function onToggleNaverReserve() {
    if (!hasNaverAccount.value) return;
    modalStore.confirmModal.openModal({
        title: '연동 해제',
        text: '연동을 해제하시겠습니까?',
        cancelBtnText: '취소',
        confirmBtnText: '연동해제하기',
        onConfirm: () => saveMappingUnlink(),
        onCancel: () => {},
    });
}

async function saveMappingUnlink() {
    modalStore.confirmModal.closeModal();
    try {
        const res = await api.post('/api/linkbusiness/mapping', {
            cocode: Number(COCODE),
            hosIdx: hosIdx.value,
            code: 2,
            naverId: naverId.value,
            businessId: businessId.value ? Number(businessId.value) : null,
        });
        const code = res.data?.status_code ?? res.data?.code;
        if (code === 200 || res.data?.data) {
            hasNaverAccount.value = false;
            naverId.value = '';
            businessId.value = '';
            showAlert('연동이 해제되었습니다.');
            fetchAccountInfo();
            initNaverLogin();
        } else {
            const msg = res.data?.message ?? '연동 해제에 실패했습니다.';
            showAlert(msg);
        }
    } catch (err) {
        console.error(err);
        showAlert('연동 해제 중 오류가 발생했습니다.');
    }
}

const JQUERY_URL = 'https://code.jquery.com/jquery-3.7.1.min.js';
const NAVER_LOGIN_SCRIPT_URL = 'https://static.nid.naver.com/js/naverLogin_implicit-1.0.3.js';

function loadScript(src, opts = {}) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        if (opts.integrity) script.integrity = opts.integrity;
        if (opts.crossOrigin) script.crossOrigin = opts.crossOrigin;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
}

function ensureNaverLoginScripts() {
    return loadScript(JQUERY_URL, {
        integrity: 'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=',
        crossOrigin: 'anonymous',
    }).then(() => loadScript(NAVER_LOGIN_SCRIPT_URL));
}

function initNaverLogin() {
    if (typeof window.naver_id_login === 'undefined') return;
    const mappingUrl = getMappingUrl();
    const callbackUrl = getNaverCallbackUrl();
    const naverLogin = new window.naver_id_login(NAVER_CLIENT_ID, callbackUrl);
    naverLogin.setButton('white', 2, 40);
    naverLogin.setDomain(mappingUrl);
    naverLogin.setState(naverLogin.getUniqState());
    naverLogin.setPopup();
    naverLogin.init_naver_id_login();
    // TODO: 추후 get_naver_userprofile 호출 여부/시점 재검토
    // naverLogin.get_naver_userprofile('naverSignInCallback');
}

function handleNaverMessage(event) {
    if (event.origin !== window.location.origin) return;
    const { type, profile, error } = event.data || {};
    if (type !== 'naver-profile') return;
    if (error) {
        showAlert(error);
        return;
    }
    const payload = buildProfilePayload(profile, Number(COCODE));
    if (!payload) return;
    (async () => {
        try {
            await api.post('/api/linkbusiness/profile', payload);
            hasNaverAccount.value = true;
            // 서버에 반영된 naverId, businessId를 API로 다시 조회해서 표시
            await fetchAccountInfo();
            modalStore.naverConnectNoticeModal.openModal();
        } catch (err) {
            console.error(err);
        }
    })();
}

onMounted(() => {
    window.addEventListener('message', handleNaverMessage);
    fetchAccountInfo();
    ensureNaverLoginScripts()
        .then(() => initNaverLogin())
        .catch((err) => {
            console.error(err);
            showAlert('네이버 로그인 스크립트를 불러오지 못했습니다.');
        });
});
onUnmounted(() => {
    window.removeEventListener('message', handleNaverMessage);
});
</script>

<template>
    <PageTitle title="네이버 연동 계정 관리" desc-text="네이버로 접수된 예약을 인투링크와 인투벳GE 차트에 연동하여 관리해보세요."/>

    <TableLayout>

        <template #filter>  
            <div class="account-sync" :key="`account-${hasNaverAccount}-${naverId}-${businessId}`">
                <section class="account-sync__login">
                    <div class="sync-header">
                        <h3 class="sync-header__title title-m">네이버 계정 연동하기</h3>
                        <template v-if="hasNaverAccount">
                            <label class="toggle">
                                <input type="checkbox" :checked="hasNaverAccount" @click.prevent="onToggleNaverReserve" />
                                <img class="toggle-img" />
                            </label>
                        </template>
                        <template v-else>
                            <div id="naver_id_login"></div>
                        </template>
                    </div>

                    <template v-if="hasNaverAccount">
                        <p class="account-sync__desc caption">연동이 완료되었습니다.</p>
                    </template>
                    <template v-else>
                        <p class="account-sync__desc caption">
                            ※ 네이버 계정으로 로그인하시면 현재 사용 중인 네이버 ID와 네이버 스마트 플레이스 비즈니스 ID가 자동으로 조회되어 표시됩니다.
                            <br/>
                            연동 처리에는 약 10초 정도 소요될 수 있습니다.
                        </p>
                    </template>
                </section>

                <section class="account-sync__form">
                    <div class="form-row">
                        <label class="form-row__label title-s">네이버 ID</label>
                        <div class="form-row__input">
                            <InputTextBox :model-value="naverId" :disabled="true" placeholder="네이버 ID" :key="'naver-' + naverId" @update:model-value="naverId = $event" />
                        </div>
                    </div>
                    <div class="form-row">
                        <label class="form-row__label title-s">네이버 스마트 플레이스 비즈니스 ID</label>
                        <div class="form-row__input">
                            <InputTextBox :model-value="businessId" :disabled="true" placeholder="비즈니스 ID" :key="'biz-' + businessId" @update:model-value="businessId = $event" />
                        </div>
                    </div>
                </section>
            </div>
        </template>

        <template #table>
            <div class="contents-wrapper">
                <ul class="form-container">
                    <li class="form-item">
                        <!-- 서비스명 -->
                        <div class="form-label">서비스명</div>
                        <div class="form-content">
                            <InputTextBox />
                        </div>

                        <!-- 병원명 -->
                        <div class="form-label">병원명</div>
                        <div class="form-content">
                            <InputTextBox />
                        </div>
                    </li>

                    <li class="form-item">
                        <!-- 서비스 소개 -->
                        <div class="form-label">서비스 소개</div>
                        <div class="form-content">
                            <InputTextBox />
                        </div>
                        
                        <!-- 대표자(원장)명 -->
                        <div class="form-label">대표자(원장)명</div>
                        <div class="form-content">
                            <InputTextBox />
                        </div>
                    </li>

                    <li class="form-item d-flex">
                        <div class="d-flex" style="flex: 1;">
                            <!-- 업체사진 -->
                            <div class="form-label helper">
                                업체 사진 
                                <img :src="icInfo" alt="안내아이콘" class="helper__icon">
                                <div class="tooltip-content">
                                    사진을 드래그하여 순서를 변경할 수 있습니다.
                                </div>
                            </div>
                            <div class="form-content">
                                <div class="photo-upload__grid">
                                    <label class="photo-upload__btn">
                                        <input 
                                            type="file" 
                                            hidden 
                                            multiple 
                                            accept="image/*"
                                        >
                                        <img :src="icAddBtn" alt="추가" class="icon-plus" width="32">
                                    </label>

                                    <div class="photo-upload__item">
                                        <img src="" alt="업로드 이미지" class="preview-img"> 
                                        <!-- 드래그핸들 -->
                                        <div class="drag-handle"><img :src="icDragHandel" alt="드래그아이콘"></div>
                                        <!-- 삭제 버튼 -->
                                        <button class="delete-btn">
                                            <img :src="icClear" alt="삭제" width="20">
                                        </button>
                                        <!-- 대표 이미지의 경우 -->
                                        <div class="main-badge">
                                            <span class="caption">대표이미지</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-flex flex-col" style="flex: 1;">
                            <!-- 예약문의 번호 -->
                            <div class="d-flex border-bottom">
                                <div class="form-label">예약문의 번호</div>
                                <div class="form-content">
                                    <InputTextBox />
                                </div>
                            </div>
                            <!-- 관리자 번호 -->
                            <div class="d-flex border-bottom">
                                <div class="form-label">관리자 번호</div>
                                <div class="form-content">
                                    <InputTextBox />
                                </div>
                            </div>
                            <!-- 주소 -->
                            <div class="d-flex">
                                <div class="form-label">주소</div>
                                <div class="form-content">
                                    <div class="d-flex gap-4">
                                        <InputTextBox />
                                        <button class="btn btn--size-32 btn--black-outline">
                                            <img :src="icSearch" alt="검색 아이콘">
                                            주소 검색
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>

                    <li class="form-item">
                        <!-- 이메일 -->
                        <div class="form-label">이메일</div>
                        <div class="form-content">
                            <InputTextBox />
                        </div>

                        <!-- 상세주소 -->
                        <div class="form-label">상세주소</div>
                        <div class="form-content">
                            <InputTextBox />
                        </div>
                    </li>
                </ul>

                <div class="button-wrapper">
                    <button class="btn btn--size-40 btn--blue">저장</button>
                </div>
            </div>
        </template>

    </TableLayout>

    <!-- TODO: 인투링크에 상품이 등록되지 않은 계정으로 해당 메뉴 접속시 상품등록필요 모달 노출 -->
    <!-- TODO: 다시 보지 않음 체크 로직 -->
    <!-- 상품 등록 필요 모달 -->
    <Modal
        v-if="modalStore.productRegistrationModal.isVisible"
        title="상품 등록 필요"
        size="xs"
        :modal-state="modalStore.productRegistrationModal"
    >
        <div class="modal-contents-inner">
            <p class="modal-contents-subTitle">현재 등록된 예약상품이 없습니다.</p>
            <p class="modal-contents-body">네이버 예약 연동을 진행하기 위해서는 인투링크에 상품 등록이 필요합니다. 상품 등록을 완료한 후 다시 계정 연동을 진행해 주세요.</p>
            <span class="caption modal-contents-caption">※ 이미 네이버 예약을 사용 중이시라면 <span class="strong">별도 상품 등록 없이 연동을 진행</span>해주세요.</span>
        </div>

        <div class="modal-button-wrapper">
            <div class="check_section">
                <label class="checkbox">
                    <input type="checkbox" />
                    <span class="box"></span>
                    <span class="label">다시 보지 않음</span>
                </label>
            </div>
            <div class="buttons">
                <button class="btn btn--size-24 btn--black-outline btn--c">닫기</button>
                <button class="btn btn--size-24 btn--black">상품 등록하기</button>
            </div>
        </div>
    </Modal>

    <!-- 계정 연동 완료 모달 -->
    <Modal
        v-if="modalStore.naverConnectNoticeModal.isVisible"
        title="계정 연동 완료"
        size="xs"
        :modal-state="modalStore.naverConnectNoticeModal"
    >
        <div class="modal-contents-inner">
            <p class="modal-contents-subTitle">현재 등록된 예약상품이 없습니다.</p>
            <p class="modal-contents-body">
                최초 연동 시에는 네이버 스마트플레이스의 [솔루션] > [사용 중인 솔루션] 화면에서 <span class="strong">[플레이스 연결하기] 버튼을 눌러 연동을 마무리</span>해주세요.
            </p>
        </div>

        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-24 btn--black btn--c">확인</button>
            </div>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
    :deep(.search-filter) {
        width: 100%;
    }
    .account-sync {
        width: 100%;
        display: flex;
        align-items: center;

        &__login {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        &__desc {
            color: $gray-500;
        }

        &__form {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
    }

    .sync-header {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .form-row {
        display: flex;
        align-items: center;
        gap: 8px;

        &__label {
            width: 191px;
            flex-shrink: 0;
        }

        &__input {
            flex: 1;
        }
    }

    .helper {
        position: relative; // 툴팁 위치의 기준점
        display: inline-flex;
        align-items: center;
        cursor: pointer;

        &__icon {
            width: 16px;
            height: 16px;
        }

        .tooltip-content {
            visibility: hidden;  // 평소엔 숨김
            opacity: 0;         // 투명도 0
            position: absolute;
            top: 10px;
            left: calc(100% + 8px); // 아이콘 위쪽으로 배치
            
            width: max-content;
            max-width: 400px; // 최대 너비 제한
            padding: 15px;

            border-radius: 5px;
            border: 1px solid $primary-700;
            background-color: $primary-50;
            @include typo($body-s-size, $body-s-weight, $body-s-spacing, $body-s-line);
            box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.15);
            
            white-space: pre-wrap; // 툴팁 내 줄바꿈 허용
            text-align: left;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1;
        }

        // 마우스를 올렸을 때(Hover) 동작
        &:hover {
            .tooltip-content {
                visibility: visible;
                opacity: 1;
            }
        }
    }

    .button-wrapper {
        width: 100%;
        @include flex-center;

        button {
            width: 400px;
        }
    }
</style>