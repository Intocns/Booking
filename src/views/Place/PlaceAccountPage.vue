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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { api } from '@/api/axios';
import { COCODE } from '@/constants/common';
import {
    NAVER_CLIENT_ID,
    PLACE_SETTING_UNLINK,
    PLACE_SETTING_LINK,
    getMappingUrl,
    getNaverCallbackUrl,
    buildConnectPayload,
    ensureNaverLoginScripts,
} from '@/constants/naver';
import { showAlert } from '@/utils/ui';
import { formatPhone } from '@/utils/phoneFormatter';
import { openKakaoAddrSearch } from '@/utils/kakaoAddrSearch';
import { validatePlaceDetail, formatPlaceDetailErrors } from '@/utils/placeAccountValidation';
import { uploadImage } from '@/utils/fileUpload';
import draggable from 'vuedraggable';

// --- 상태 ---
const modalStore = useModalStore();
const hasNaverAccount = ref(false);
/** GET /api/linkbusiness/{cocode} 응답의 useFlag: null=처음 등록, 0=연동해지(계정 재연동), 1=연동중(연동관리) */
const naverUseFlag = ref(null);
/** useFlag가 0 또는 null이면 인풋·업체사진·주소·저장 등 폼 전체 비활성화 */
const isFormLockedByUseFlag = computed(() => naverUseFlag.value === 0 || naverUseFlag.value === null);
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
/** 업체 사진 URL 목록 (여러 장, 첫 번째가 대표 이미지) */
const placeImages = ref([]);
// 저장 시 필요(백엔드 BusinessDetailDto): 주소 원본 값 보존
const jibun = ref('');
const posLat = ref(null);
const posLong = ref(null);

/** 검증 실패 시 에러 메시지·하이라이트용 */
const validationErrors = ref(null);

/** 검증 실패 시 포커스용 ref */
const serviceNameRef = ref(null);
const serviceDescRef = ref(null);
const placeNameRef = ref(null);
const reprOwnerNameRef = ref(null);
const addressSearchBtnRef = ref(null);
const emailRef = ref(null);
const reservationPhoneRef = ref(null);
const adminPhoneRef = ref(null);

const ERROR_KEY_ORDER = ['serviceName', 'desc', 'placeName', 'reprOwnerName', 'address', 'email', 'reservationPhone', 'adminPhone'];
const FIELD_REFS = [
    serviceNameRef, serviceDescRef, placeNameRef, reprOwnerNameRef,
    addressSearchBtnRef, emailRef, reservationPhoneRef, adminPhoneRef,
];

function focusFirstInvalidField(errorKeys) {
    const firstKey = errorKeys[0];
    const idx = ERROR_KEY_ORDER.indexOf(firstKey);
    if (idx < 0) return;
    const el = FIELD_REFS[idx]?.value;
    if (!el) return;
    nextTick(() => {
        setTimeout(() => {
            const input = el?.$el?.querySelector?.('input');
            (input && typeof input.focus === 'function' ? input : el)?.focus?.();
        }, 100);
    });
}

/** 업체 사진 업로드 (multiple 선택 시 선택한 파일 전부 업로드 후 배열에 추가) */
async function handlePlaceImageUpload(event) {
    if (isFormLockedByUseFlag.value) return;
    const files = event.target.files;
    if (!files?.length) return;
    try {
        const urls = [];
        for (let i = 0; i < files.length; i++) {
            const url = await uploadImage(files[i]);
            if (url) urls.push(url);
        }
        if (urls.length) placeImages.value = [...placeImages.value, ...urls];
    } catch (err) {
        showAlert('이미지 업로드에 실패했습니다.');
    } finally {
        event.target.value = '';
    }
}

/** 업체 사진 삭제 */
function removePlaceImage(index) {
    if (isFormLockedByUseFlag.value) return;
    placeImages.value = placeImages.value.filter((_, i) => i !== index);
}

/** 병원주소 → 카카오 주소검색 API 실행 (유틸 사용) */
function openPostCode() {
    if (isFormLockedByUseFlag.value) return;
    openKakaoAddrSearch({
        popupTitle: 'booking intocns',
        onComplete: (data) => {
            address.value = data.roadAddress ?? data.address ?? '';
            jibun.value = data.jibunAddress ?? '';
        },
        onError: () => showAlert('주소 검색을 불러올 수 없습니다.'),
    });
}

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
        if (!data || typeof data !== 'object') {
            naverUseFlag.value = null;
            clearPlaceFields();
            return;
        }

        const nid = data.naverId ?? data.naver_id ?? '';
        const bid = data.businessId ?? data.business_id;
        const numHosIdx = data.hosIdx != null ? Number(data.hosIdx) : Number(data.hos_idx ?? 0);
        hosIdx.value = numHosIdx;

        const useFlagVal = data.useFlag ?? data.use_flag ?? null;
        naverUseFlag.value = useFlagVal != null ? Number(useFlagVal) : null;

        if (nid !== '' || (bid != null && bid !== 0)) {
            hasNaverAccount.value = true;
            existingAccountMode.value = false;
            naverId.value = String(nid);
            businessId.value = bid != null && bid !== 0 ? String(bid) : '';
        }

        // 네이버 플레이스 상세: 폼 필드 채우기 (API 필드 → 화면 라벨)
        // serviceName = 서비스명, name = 병원명, desc = 서비스 소개, reprOwnerName = 대표자명
        serviceName.value = data.serviceName ?? '';
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
        if (Array.isArray(resources) && resources.length > 0) {
            placeImages.value = resources.map((r) => r?.resourceUrl ?? '').filter(Boolean);
        } else {
            placeImages.value = [];
        }
    } catch {
        hasNaverAccount.value = false;
        clearPlaceFields();
    }
}

function clearPlaceFields() {
    naverUseFlag.value = null;
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

/** 검증용 폼 스냅샷 */
function getPlaceFormForValidation() {
    return {
        serviceName: serviceName.value,
        desc: serviceDesc.value,
        placeName: placeName.value,
        reprOwnerName: reprOwnerName.value,
        address: address.value,
        jibun: jibun.value,
        email: email.value,
        reservationPhone: reservationPhone.value,
        adminPhone: adminPhone.value,
    };
}

/** 저장 API용 DTO 생성 */
function buildPlaceDetailDto() {
    const images = placeImages.value.map((url) => (url && String(url).trim()) || '').filter(Boolean);
    return {
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
        reprPhone: adminPhone.value || null,
        phonNumber: reservationPhone.value || null,
        email: email.value || null,
        images,
    };
}

async function savePlaceDetail() {
    if (isFormLockedByUseFlag.value) return;
    const form = getPlaceFormForValidation();
    const { valid, errors } = validatePlaceDetail(form);
    if (!valid) {
        validationErrors.value = errors;
        showAlert(formatPlaceDetailErrors(errors));
        focusFirstInvalidField(Object.keys(errors));
        return;
    }
    validationErrors.value = null;

    try {
        const dto = buildPlaceDetailDto();
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

function openNaverManageModal() {
    if (!hasNaverAccount.value) return;
    modalStore.naverConnectManageModal.openModal();
}

/** useFlag가 0일 때 "계정 재연동" 버튼 클릭 → 확인 모달 오픈 */
function onReconnectAccount() {
    modalStore.naverReconnectConfirmModal.openModal();
}

/** 재연동 확인 모달에서 "연동하기" 클릭 → 모달 닫고 재연동 API 호출 */
function onConfirmReconnect() {
    modalStore.naverReconnectConfirmModal.closeModal();
    savePlaceSetting(PLACE_SETTING_LINK);
}

function onUnlinkFromManageModal() {
    modalStore.naverConnectManageModal.closeModal();
    modalStore.naverConnectUnlinkNoticeModal.openModal();
}

function onConfirmUnlinkFromNoticeModal() {
    modalStore.naverConnectUnlinkNoticeModal.closeModal();
    savePlaceSetting(PLACE_SETTING_UNLINK);
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

/**
 * GET /api/linkbusiness/{cocode}/place/setting/{placeSettingValue}
 * @param {number} placeSettingValue - PLACE_SETTING_UNLINK(0)=연동 해지, PLACE_SETTING_LINK(1)=연동
 */
async function savePlaceSetting(placeSettingValue) {
    modalStore.confirmModal.closeModal();
    try {
        const res = await api.get(`/api/linkbusiness/{cocode}/place/setting/${placeSettingValue}`);
        if (isApiSuccess(res)) {
            if (placeSettingValue === PLACE_SETTING_UNLINK) {
                hasNaverAccount.value = false;
                naverId.value = '';
                businessId.value = '';
                showAlert('연동이 해제되었습니다.');
                fetchAccountInfo();
                nextTick(() => initNaverLogin());
            } else if (placeSettingValue === PLACE_SETTING_LINK) {
                showAlert('계정이 재연동되었습니다.');
                await fetchAccountInfo();
            }
        } else {
            const msg = res.data?.message ?? (placeSettingValue === PLACE_SETTING_UNLINK ? '연동 해제에 실패했습니다.' : '연동에 실패했습니다.');
            showAlert(msg);
        }
    } catch (err) {
        console.error(err);
        showAlert(placeSettingValue === PLACE_SETTING_UNLINK ? '연동 해제 중 오류가 발생했습니다.' : '연동 중 오류가 발생했습니다.');
    }
}

/** 연동 해제 시 호출 */
function saveMappingUnlink() {
    savePlaceSetting(PLACE_SETTING_UNLINK);
}

/** 네이버 SDK로 로그인 버튼·팝업·프로필 콜백 등록 (SDK 로드 후 호출). #naver_id_login div가 DOM에 있을 때만 실행 */
function initNaverLogin() {
    if (typeof window.naver_id_login === 'undefined') return;
    if (!document.getElementById('naver_id_login')) return;
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
    Promise.all([
        fetchAccountInfo().catch(() => {}),
        ensureNaverLoginScripts(),
    ])
        .then(() => {
            if (!hasNaverAccount.value) nextTick(() => initNaverLogin());
        })
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
                            <button
                                v-if="naverUseFlag === 0"
                                type="button"
                                class="btn btn--size-40 btn--blue"
                                @click="onReconnectAccount"
                            >
                                계정 재연동
                            </button>
                            <button
                                v-else
                                type="button"
                                class="btn btn--size-40 btn--blue"
                                @click="openNaverManageModal"
                            >
                                연동관리
                            </button>
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

                <!-- 네이버 ID·비즈니스 ID 영역은 항상 표시, 연동된 경우(useFlag 1)에만 값 노출 -->
                <section class="account-sync__form">
                    <div class="form-row">
                        <label class="form-row__label title-s">네이버 ID</label>
                        <div class="form-row__input">
                            <InputTextBox
                                :model-value="naverUseFlag === 1 ? naverId : (existingAccountMode ? naverId : '')"
                                placeholder="네이버 ID"
                                :disabled="naverUseFlag === 1 || !existingAccountMode"
                                :key="'naver-' + hasNaverAccount + '-' + existingAccountMode + '-' + naverUseFlag"
                                @update:model-value="naverId = $event"
                            />
                        </div>
                    </div>
                    <div class="form-row">
                        <label class="form-row__label title-s">네이버 스마트 플레이스 비즈니스 ID</label>
                        <div class="form-row__input form-row__input--with-btn">
                            <InputTextBox
                                :model-value="naverUseFlag === 1 ? businessId : (existingAccountMode ? businessId : '')"
                                placeholder="비즈니스 ID"
                                :disabled="naverUseFlag === 1 || !existingAccountMode"
                                :key="'biz-' + hasNaverAccount + '-' + existingAccountMode + '-' + naverUseFlag"
                                @update:model-value="businessId = $event"
                            />
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
            <div class="contents-wrapper" :class="{ 'contents-wrapper--locked': isFormLockedByUseFlag }">
                <ul class="form-container">
                    <li class="form-item">
                        <!-- 서비스명 (API: serviceName) - 수정 불가 -->
                        <div class="form-label">서비스명</div>
                        <div class="form-content">
                            <InputTextBox
                                ref="serviceNameRef"
                                v-model="serviceName"
                                placeholder="서비스명"
                                disabled
                                :is-error="!!validationErrors?.serviceName"
                                :error-message="validationErrors?.serviceName"
                            />
                        </div>

                        <!-- 병원명 (API: name) - 수정 불가 -->
                        <div class="form-label">병원명</div>
                        <div class="form-content">
                            <InputTextBox
                                ref="placeNameRef"
                                v-model="placeName"
                                placeholder="병원명"
                                disabled
                                :is-error="!!validationErrors?.placeName"
                                :error-message="validationErrors?.placeName"
                            />
                        </div>
                    </li>

                    <li class="form-item">
                        <!-- 서비스 소개 (API: promotionDesc) -->
                        <div class="form-label">서비스 소개</div>
                        <div class="form-content">
                            <InputTextBox
                                ref="serviceDescRef"
                                v-model="serviceDesc"
                                placeholder="서비스 소개"
                                :disabled="isFormLockedByUseFlag"
                                :is-error="!!validationErrors?.desc"
                                :error-message="validationErrors?.desc"
                            />
                        </div>

                        <!-- 대표자(원장)명 (API: reprOwnerName) -->
                        <div class="form-label">대표자(원장)명</div>
                        <div class="form-content">
                            <InputTextBox
                                ref="reprOwnerNameRef"
                                v-model="reprOwnerName"
                                placeholder="대표자(원장)명"
                                :disabled="isFormLockedByUseFlag"
                                :is-error="!!validationErrors?.reprOwnerName"
                                :error-message="validationErrors?.reprOwnerName"
                            />
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
                            <div class="form-content" :class="{ 'form-content--locked': isFormLockedByUseFlag }">
                                <div class="photo-upload__grid">
                                    <label class="photo-upload__btn" :class="{ 'is-disabled': isFormLockedByUseFlag }" @click="(e) => { if (isFormLockedByUseFlag) e.preventDefault(); }">
                                        <input
                                            type="file"
                                            hidden
                                            multiple
                                            accept="image/*"
                                            :disabled="isFormLockedByUseFlag"
                                            @change="handlePlaceImageUpload"
                                        >
                                        <img :src="icAddBtn" alt="추가" class="icon-plus" width="32">
                                    </label>
                                    <draggable
                                        v-model="placeImages"
                                        :item-key="(url) => url"
                                        class="draggable-container"
                                        handle=".drag-handle"
                                        ghost-class="ghost"
                                        drag-class="drag-item-moving"
                                        :force-fallback="true"
                                        :scroll="true"
                                        :scroll-sensitivity="100"
                                        :animation="200"
                                        :disabled="isFormLockedByUseFlag"
                                    >
                                        <template #item="{ element, index }">
                                            <div class="photo-upload__item">
                                                <img :src="element || ''" alt="업로드 이미지" class="preview-img">
                                                <div class="drag-handle"><img :src="icDragHandel" alt="드래그아이콘"></div>
                                                <button type="button" class="delete-btn" :disabled="isFormLockedByUseFlag" @click="removePlaceImage(index)">
                                                    <img :src="icClear" alt="삭제" width="20">
                                                </button>
                                                <div v-if="index === 0" class="main-badge">
                                                    <span class="caption">대표이미지</span>
                                                </div>
                                            </div>
                                        </template>
                                    </draggable>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-flex flex-col" style="flex: 1;">
                            <!-- 예약문의 번호 -->
                            <div class="d-flex border-bottom">
                                <div class="form-label">예약문의 번호</div>
                                <div class="form-content">
                                    <InputTextBox
                                        ref="reservationPhoneRef"
                                        :model-value="reservationPhone"
                                        placeholder="예약문의 번호"
                                        :disabled="isFormLockedByUseFlag"
                                        :is-error="!!validationErrors?.reservationPhone"
                                        :error-message="validationErrors?.reservationPhone"
                                        @update:model-value="reservationPhone = formatPhone($event)"
                                    />
                                </div>
                            </div>
                            <!-- 관리자 번호 -->
                            <div class="d-flex border-bottom">
                                <div class="form-label">관리자 번호</div>
                                <div class="form-content">
                                    <InputTextBox
                                        ref="adminPhoneRef"
                                        :model-value="adminPhone"
                                        placeholder="관리자 번호"
                                        :disabled="isFormLockedByUseFlag"
                                        :is-error="!!validationErrors?.adminPhone"
                                        :error-message="validationErrors?.adminPhone"
                                        @update:model-value="adminPhone = formatPhone($event)"
                                    />
                                </div>
                            </div>
                            <!-- 주소 -->
                            <div class="d-flex">
                                <div class="form-label">주소</div>
                                <div class="form-content">
                                    <div class="d-flex gap-4">
                                        <InputTextBox v-model="address" placeholder="주소" disabled :is-error="!!validationErrors?.address" :error-message="validationErrors?.address" />
                                        <button ref="addressSearchBtnRef" type="button" class="btn btn--size-32 btn--black-outline" :disabled="isFormLockedByUseFlag" @click="openPostCode">
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
                            <InputTextBox
                                ref="emailRef"
                                v-model="email"
                                placeholder="이메일"
                                :disabled="isFormLockedByUseFlag"
                                :is-error="!!validationErrors?.email"
                                :error-message="validationErrors?.email"
                            />
                        </div>

                        <!-- 상세주소 -->
                        <div class="form-label">상세주소</div>
                        <div class="form-content">
                            <InputTextBox v-model="detailAddress" placeholder="상세주소" :disabled="isFormLockedByUseFlag" />
                        </div>
                    </li>
                </ul>

                <div class="button-wrapper">
                    <button
                        class="btn btn--size-40"
                        :class="isFormLockedByUseFlag ? 'btn--gray' : 'btn--blue'"
                        type="button"
                        :disabled="isFormLockedByUseFlag"
                        @click="savePlaceDetail"
                    >
                        저장
                    </button>
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

    <!-- 네이버 계정 연동 관리 팝업 -->
    <Modal
        v-if="modalStore.naverConnectManageModal.isVisible"
        title="네이버 계정 연동 관리"
        size="xs"
        :modal-state="modalStore.naverConnectManageModal"
    >
        <div class="modal-contents-inner naver-manage-modal">
            <p class="modal-contents-body naver-manage-modal__desc">
                네이버 예약 연동에 대한 설정을 변경할 수 있습니다.
            </p>
            <div class="naver-manage-modal__row">
                <span class="naver-manage-modal__label title-s">연동 상태</span>
                <div class="naver-manage-modal__status">
                    <span class="naver-manage-modal__status-text">연동 중</span>
                    <button
                        type="button"
                        class="btn btn--size-40 btn--black-outline"
                        @click="onUnlinkFromManageModal"
                    >
                        연동 해제
                    </button>
                </div>
            </div>
        </div>
    </Modal>

    <!-- 연동 해제 주의사항 모달 (연동 해제 클릭 시) -->
    <Modal
        v-if="modalStore.naverConnectUnlinkNoticeModal.isVisible"
        title="네이버 계정 연동 관리"
        size="xs"
        :modal-state="modalStore.naverConnectUnlinkNoticeModal"
    >
        <div class="modal-contents-inner naver-unlink-notice-modal">
            <p class="naver-unlink-notice-modal__title title-s">연동 해제 주의사항</p>
            <ul class="naver-unlink-notice-modal__list body-m">
                <li>네이버를 통한 예약 접수 및 확인이 불가합니다.</li>
                <li>등록된 상품 관리 및 신규 상품 등록이 불가합니다.</li>
            </ul>
            <p class="naver-unlink-notice-modal__title title-s">예약만 받고싶지 않다면</p>
            <p class="naver-unlink-notice-modal__desc body-m">
                <span class="naver-unlink-notice-modal__link">플레이스 관리</span> &gt; <span class="naver-unlink-notice-modal__link">운영 설정</span> &gt; <span class="naver-unlink-notice-modal__link">예약받기</span> 메뉴에서 예약받기 토글을 OFF로 설정해 주세요.
            </p>
            <div class="naver-unlink-notice-modal__buttons">
                <button
                    type="button"
                    class="btn btn--size-40 btn--black-outline"
                    @click="modalStore.naverConnectUnlinkNoticeModal.closeModal()"
                >
                    취소
                </button>
                <button
                    type="button"
                    class="btn btn--size-40 btn--blue"
                    @click="onConfirmUnlinkFromNoticeModal"
                >
                    해제하기
                </button>
            </div>
        </div>
    </Modal>

    <!-- 계정 재연동 확인 모달 (계정 재연동 버튼 클릭 시) -->
    <Modal
        v-if="modalStore.naverReconnectConfirmModal.isVisible"
        title="네이버 계정 연동 관리"
        size="xs"
        :modal-state="modalStore.naverReconnectConfirmModal"
    >
        <div class="modal-contents-inner naver-reconnect-confirm-modal">
            <p class="naver-reconnect-confirm-modal__heading title-m">네이버 계정 재연동</p>
            <p class="naver-reconnect-confirm-modal__desc body-m">
                네이버 계정을 다시 연동하면 네이버 예약 및 상품 관리 기능을 사용할 수 있습니다.<br/>
                계정 재연동을 진행하시겠습니까?
            </p>
            <p class="naver-reconnect-confirm-modal__disclaimer caption">
                * 재연동은 기존 연동 계정으로만 가능합니다. 신규 계정으로 연동을 희망하시는 경우, 고객센터로 연락 부탁드립니다.
            </p>
            <div class="naver-reconnect-confirm-modal__buttons">
                <button
                    type="button"
                    class="btn btn--size-40 btn--black-outline"
                    @click="modalStore.naverReconnectConfirmModal.closeModal()"
                >
                    취소
                </button>
                <button
                    type="button"
                    class="btn btn--size-40 btn--blue"
                    @click="onConfirmReconnect"
                >
                    연동하기
                </button>
            </div>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
    .naver-manage-modal {
        .naver-manage-modal__desc {
            margin-bottom: 20px;
        }
        .naver-manage-modal__row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }
        .naver-manage-modal__label {
            color: $gray-800;
        }
        .naver-manage-modal__status {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .naver-manage-modal__status-text {
            color: $gray-700;
            @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);
        }
    }
    .naver-unlink-notice-modal {
        .naver-unlink-notice-modal__title {
            font-weight: 700;
            color: $gray-900;
            margin-bottom: 8px;
            &:not(:first-child) {
                margin-top: 20px;
            }
        }
        .naver-unlink-notice-modal__list {
            color: $gray-800;
            margin: 0 0 0 16px;
            padding: 0;
            line-height: 1.5;
            li { margin-bottom: 4px; }
        }
        .naver-unlink-notice-modal__desc {
            color: $gray-800;
            margin: 0;
            line-height: 1.5;
        }
        .naver-unlink-notice-modal__link {
            color: $primary-700;
            font-weight: 600;
        }
        .naver-unlink-notice-modal__buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 24px;
            padding-top: 16px;
        }
    }
    .naver-reconnect-confirm-modal {
        .naver-reconnect-confirm-modal__heading {
            font-weight: 700;
            color: $gray-900;
            margin-bottom: 12px;
        }
        .naver-reconnect-confirm-modal__desc {
            color: $gray-800;
            margin: 0 0 16px;
            line-height: 1.5;
        }
        .naver-reconnect-confirm-modal__disclaimer {
            color: $gray-600;
            margin: 0 0 24px;
            line-height: 1.5;
        }
        .naver-reconnect-confirm-modal__buttons {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }
    }
    .photo-upload__btn.is-disabled {
        pointer-events: none;
        opacity: 0.5;
        cursor: not-allowed;
    }
    .form-content--locked .delete-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    /* useFlag 0/null 시 폼 영역 전체 회색 비활성화 표시 */
    .contents-wrapper--locked {
        background-color: $gray-100;
        border-radius: 8px;
        padding: 20px;
        position: relative;
        .form-label {
            color: $gray-500;
        }
        :deep(.input-text-box-wrapper input:disabled),
        :deep(.input-text-box-wrapper input[readonly]) {
            background-color: $gray-100;
            color: $gray-500;
            cursor: not-allowed;
        }
        .btn:disabled {
            background-color: $gray-200 !important;
            border-color: $gray-300 !important;
            color: $gray-500 !important;
            cursor: not-allowed;
        }
    }
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

    /* 업체 사진 드래그 정렬 (place/product/edit 동일) */
    .draggable-container {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }
    .ghost {
        opacity: 0.5;
        background: $primary-50 !important;
        border: 1px dashed $primary-500 !important;
    }
    .drag-item-moving {
        opacity: 1 !important;
        background-color: $gray-00 !important;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        border: 1px solid $primary-500 !important;
        z-index: 9999;
    }
</style>