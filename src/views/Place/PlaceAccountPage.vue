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
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { api } from '@/api/axios';
import { COCODE } from '@/constants/common';
import {
    NAVER_CLIENT_ID,
    getMappingUrl,
    getNaverCallbackUrl,
    buildConnectPayload,
    buildUnlinkPayload,
    ensureNaverLoginScripts,
} from '@/constants/naver';
import { showAlert } from '@/utils/ui';
import { formatPhone } from '@/utils/phoneFormatter';

// --- 상태 ---
const modalStore = useModalStore();
const hasNaverAccount = ref(false);
const naverId = ref('');
const businessId = ref('');
const hosIdx = ref(0);

/** 기존 계정 연동 버튼 클릭 시 true → 우측 네이버 ID·비즈니스 ID 입력란 활성화 (초기: 비활성화) */
const existingAccountMode = ref(false);
const existingAccountBtnRef = ref(null);

function onExistingAccountClick() {
    existingAccountMode.value = !existingAccountMode.value;
    nextTick(() => existingAccountBtnRef.value?.focus());
}

// GET /api/linkbusiness/{cocode} 응답으로 채우는 플레이스 상세 필드
const serviceName = ref('');
const placeName = ref('');
const serviceDesc = ref('');
const reprOwnerName = ref('');
const reservationPhone = ref('');
const adminPhone = ref('');
const address = ref('');
const detailAddress = ref('');
const email = ref('');
const representativeImageUrl = ref('');
// 저장 시 필요(백엔드 BusinessDetailDto): 주소 원본 값 보존
const jibun = ref('');
const posLat = ref(null);
const posLong = ref(null);

function parseJson(val) {
    if (val == null) return null;
    if (typeof val === 'object') return val;
    if (typeof val !== 'string') return null;
    try {
        return JSON.parse(val);
    } catch {
        return null;
    }
}

/** API 응답이 성공으로 간주되는지 (status_code 200 또는 data 존재) */
function isApiSuccess(res) {
    const code = res?.data?.status_code ?? res?.data?.code;
    return code === 200 || !!res?.data?.data;
}

/**
 * GET /api/linkbusiness/{cocode} 로 연동 정보 조회 후 폼 상태 반영
 * - 연동됐으면 naverId, businessId, hosIdx 채움
 * - 미연동이어도 hosIdx는 있으면 채움 (연동 버튼용)
 */
async function fetchAccountInfo() {
    try {
        const res = await api.get(`/api/linkbusiness/{cocode}`);
        const data = res.data?.data ?? res.data;
        console.log('data ::', data);
        if (!data || typeof data !== 'object') {
            clearPlaceFields();
            return;
        }

        const nid = data.naverId ?? data.naver_id ?? '';
        const bid = data.businessId ?? data.business_id;
        const numHosIdx = data.hosIdx != null ? Number(data.hosIdx) : Number(data.hos_idx ?? 0);
        hosIdx.value = numHosIdx;

        if (nid !== '' || (bid != null && bid !== 0)) {
            hasNaverAccount.value = true;
            existingAccountMode.value = false;
            naverId.value = String(nid);
            businessId.value = bid != null && bid !== 0 ? String(bid) : '';
        }

        // 네이버 플레이스 상세: 폼 필드 채우기 (API 필드 → 화면 라벨)
        // serviceName = 서비스명, name = 병원명, desc = 서비스 소개, reprOwnerName = 대표자명
        serviceName.value = data.serviceName ?? '';
        console.log('servidceName = ',  data.serviceName )
        placeName.value = data.name ?? '';
        serviceDesc.value = data.desc ?? '';
        reprOwnerName.value = data.reprOwnerName ?? '';
        email.value = data.email ?? '';

        const phoneInfo = parseJson(data.phoneInformationJson);
        if (phoneInfo) {
            const list = phoneInfo.phoneList;
            const rawReservation = Array.isArray(list) && list[0] ? list[0] : (phoneInfo.reprPhone ?? '');
            const rawAdmin = phoneInfo.reprPhone ?? '';
            reservationPhone.value = formatPhone(rawReservation);
            adminPhone.value = formatPhone(rawAdmin);
        } else {
            reservationPhone.value = '';
            adminPhone.value = '';
        }

        const addr = parseJson(data.addressJson);
        if (addr && typeof addr === 'object') {
            address.value = addr.roadAddr ?? addr.jibun ?? '';
            jibun.value = addr.jibun ?? '';
            detailAddress.value = addr.detail ?? '';
            posLat.value = addr.posLat != null ? Number(addr.posLat) : null;
            posLong.value = addr.posLong != null ? Number(addr.posLong) : null;
        } else {
            address.value = '';
            jibun.value = '';
            detailAddress.value = '';
            posLat.value = null;
            posLong.value = null;
        }

        const resources = parseJson(data.businessResources);
        if (Array.isArray(resources) && resources[0]?.resourceUrl) {
            representativeImageUrl.value = resources[0].resourceUrl;
        } else {
            representativeImageUrl.value = '';
        }
    } catch {
        hasNaverAccount.value = false;
        clearPlaceFields();
    }
}

function clearPlaceFields() {
    existingAccountMode.value = false;
    serviceName.value = '';
    placeName.value = '';
    serviceDesc.value = '';
    reprOwnerName.value = '';
    reservationPhone.value = '';
    adminPhone.value = '';
    address.value = '';
    jibun.value = '';
    posLat.value = null;
    posLong.value = null;
    detailAddress.value = '';
    email.value = '';
    representativeImageUrl.value = '';
}

async function savePlaceDetail() {
    try {
        const images = representativeImageUrl.value?.trim() ? [representativeImageUrl.value.trim()] : [];
        const dto = {
            businessId: businessId.value ? Number(businessId.value) : null,
            naverId: naverId.value || null,
            serviceName: serviceName.value || null,
            desc: serviceDesc.value || null,
            jibun: jibun.value || null,
            roadAddr: address.value || null,
            posLat: posLat.value != null ? Number(posLat.value) : null,
            posLong: posLong.value != null ? Number(posLong.value) : null,
            addressDetail: detailAddress.value || null,
            hospitalName: placeName.value || null,
            ownerName: reprOwnerName.value || null,
            // 백엔드는 reprPhone만 사용해서 phoneList를 구성
            reprPhone: adminPhone.value || null,
            phonNumber: reservationPhone.value || null,
            email: email.value || null,
            images,
        };

        console.log('dto ::', dto);

        const res = await api.post(`/api/linkbusiness/{cocode}/modify`, dto);
        if (isApiSuccess(res)) {
            showAlert('저장되었습니다.');
            await fetchAccountInfo();
        } else {
            const msg = res.data?.message ?? '저장에 실패했습니다.';
            showAlert(msg);
        }
    } catch (err) {
        showAlert('저장 중 오류가 발생했습니다.');
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

async function requestConnect() {
    const nid = naverId.value?.trim();
    const bid = businessId.value?.trim();
    if (!nid || !bid) {
        showAlert('네이버 ID와 비즈니스 ID를 입력해 주세요.');
        return;
    }
    const hosIdxVal = hosIdx.value ?? 0;
    if (!hosIdxVal) {
        showAlert('병원 정보를 불러올 수 없습니다. 페이지를 새로고침하거나, 연동된 계정이 있으면 먼저 조회 후 연동 해제 시나리오를 사용해 주세요.');
        return;
    }
    try {
        const payload = buildConnectPayload({
            cocode: Number(COCODE),
            hosIdx: hosIdxVal,
            naverId: nid,
            businessId: Number(bid),
        });
        const res = await api.post('/api/linkbusiness/conn', payload);
        if (isApiSuccess(res)) {
            hasNaverAccount.value = true;
            await fetchAccountInfo();
            modalStore.naverConnectNoticeModal.openModal();
        } else {
            const msg = res.data?.message ?? '연동에 실패했습니다.';
            showAlert(msg);
        }
    } catch (err) {
        showAlert('연동 요청 중 오류가 발생했습니다.');
    }
}

/** POST /api/linkbusiness/mapping (code: 2 자체 매핑 해제) 후 로컬 상태 초기화 */
async function saveMappingUnlink() {
    modalStore.confirmModal.closeModal();
    try {
        const payload = buildUnlinkPayload({
            cocode: Number(COCODE),
            hosIdx: hosIdx.value,
            naverId: naverId.value,
            businessId: Number(businessId.value),
        });
        const res = await api.post('/api/linkbusiness/mapping', payload);
        if (isApiSuccess(res)) {
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

/** 네이버 SDK로 로그인 버튼·팝업·프로필 콜백 등록 (SDK 로드 후 호출) */
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
    naverLogin.get_naver_userprofile('naverSignInCallback');
}

function handleNaverMessage(event) {
    if (event.origin !== window.location.origin) return;
    const { type, profile, error } = event.data || {};
    if (type !== 'naver-profile') return;
    if (error) {
        showAlert(error);
        return;
    }
    if (!profile) return;
    const payload = profile;
    (async () => {
        try {
            const res = await api.post('/api/linkbusiness/profile', payload);
            hasNaverAccount.value = true;
            existingAccountMode.value = false;
            naverId.value = String(payload.naverId ?? payload.id ?? '');
            // 백엔드 profile API가 생성 후 응답에 business_id를 담아 보냄 (SDK 프로필에는 없음)
            const resData = res.data?.data ?? res.data;
            const bid = resData?.business_id ?? resData?.businessId;
            businessId.value = bid != null && bid !== 0 ? String(bid) : '';
            await fetchAccountInfo();
            modalStore.naverConnectNoticeModal.openModal();
        } catch (err) {
            showAlert('연동 처리 중 오류가 발생했습니다.');
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
            <div class="account-sync" :key="'account-' + hasNaverAccount">
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
                            <button
                                v-if="!hasNaverAccount"
                                ref="existingAccountBtnRef"
                                type="button"
                                class="btn btn--size-40"
                                :class="existingAccountMode ? 'btn--blue' : 'btn--black-outline'"
                                @click="onExistingAccountClick"
                            >
                                기존 계정 연동
                            </button>
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
                            <InputTextBox :model-value="naverId" :disabled="hasNaverAccount || !existingAccountMode" placeholder="네이버 ID" :key="'naver-' + hasNaverAccount + '-' + existingAccountMode" @update:model-value="naverId = $event" />
                        </div>
                    </div>
                    <div class="form-row">
                        <label class="form-row__label title-s">네이버 스마트 플레이스 비즈니스 ID</label>
                        <div class="form-row__input form-row__input--with-btn">
                            <InputTextBox :model-value="businessId" :disabled="hasNaverAccount || !existingAccountMode" placeholder="비즈니스 ID" :key="'biz-' + hasNaverAccount + '-' + existingAccountMode" @update:model-value="businessId = $event" />
                            <button
                                v-if="!hasNaverAccount"
                                type="button"
                                class="btn btn--size-40"
                                :class="existingAccountMode ? 'btn--blue' : 'btn--gray'"
                                :disabled="!existingAccountMode"
                                @click="requestConnect"
                            >
                                연동
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </template>

        <template #table>
            <div class="contents-wrapper">
                <ul class="form-container">
                    <li class="form-item">
                        <!-- 서비스명 (API: serviceName) - 수정 불가 -->
                        <div class="form-label">서비스명</div>
                        <div class="form-content">
                            <InputTextBox v-model="serviceName" placeholder="서비스명" disabled />
                        </div>

                        <!-- 병원명 (API: name) - 수정 불가 -->
                        <div class="form-label">병원명</div>
                        <div class="form-content">
                            <InputTextBox v-model="placeName" placeholder="병원명" disabled />
                        </div>
                    </li>

                    <li class="form-item">
                        <!-- 서비스 소개 (API: promotionDesc) -->
                        <div class="form-label">서비스 소개</div>
                        <div class="form-content">
                            <InputTextBox v-model="serviceDesc" placeholder="서비스 소개" />
                        </div>

                        <!-- 대표자(원장)명 (API: reprOwnerName) -->
                        <div class="form-label">대표자(원장)명</div>
                        <div class="form-content">
                            <InputTextBox v-model="reprOwnerName" placeholder="대표자(원장)명" />
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
                                        <img :src="representativeImageUrl || ''" alt="업로드 이미지" class="preview-img">
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
                                    <InputTextBox
                                        :model-value="reservationPhone"
                                        placeholder="예약문의 번호"
                                        @update:model-value="reservationPhone = formatPhone($event)"
                                    />
                                </div>
                            </div>
                            <!-- 관리자 번호 -->
                            <div class="d-flex border-bottom">
                                <div class="form-label">관리자 번호</div>
                                <div class="form-content">
                                    <InputTextBox
                                        :model-value="adminPhone"
                                        placeholder="관리자 번호"
                                        @update:model-value="adminPhone = formatPhone($event)"
                                    />
                                </div>
                            </div>
                            <!-- 주소 -->
                            <div class="d-flex">
                                <div class="form-label">주소</div>
                                <div class="form-content">
                                    <div class="d-flex gap-4">
                                        <InputTextBox v-model="address" placeholder="주소" />
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
                            <InputTextBox v-model="email" placeholder="이메일" />
                        </div>

                        <!-- 상세주소 -->
                        <div class="form-label">상세주소</div>
                        <div class="form-content">
                            <InputTextBox v-model="detailAddress" placeholder="상세주소" />
                        </div>
                    </li>
                </ul>

                <div class="button-wrapper">
                    <button class="btn btn--size-40 btn--blue" type="button" @click="savePlaceDetail">저장</button>
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

            &--with-btn {
                display: flex;
                align-items: center;
                gap: 8px;
            }
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

    /* 연동 버튼 비활성화 시 회색 */
    .btn--gray {
        background-color: $gray-300;
        border-color: $gray-300;
        color: $gray-600;
        cursor: not-allowed;
    }

    .button-wrapper {
        width: 100%;
        @include flex-center;

        button {
            width: 400px;
        }
    }
</style>