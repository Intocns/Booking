<!-- sms, 알림톡 발송 모달 콘텐츠 -->
<script setup>
import icTooltip from '@/assets/icons/ic_tooltip.svg'
import icEmpty from '@/assets/icons/ic_empty.svg'
import TalkPreview from '../TalkPreview.vue';

import { ref, computed, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useModalStore } from '@/stores/modalStore';
import { useTalkSmsStore } from '@/stores/talkSmsStore';
import { api } from '@/api/axios';
import { buildTemplateVariables, formatTemplateContent, getSmsByteLength } from '@/utils/alimtalkSmsTemplate.js';
import { COCODE } from '@/constants/common';
import { formatPhone, removePhoneHyphens } from '@/utils/phoneFormatter.js';
import { PET_GENDER_MAP } from '@/constants';
import { showAlert } from '@/utils/ui';

const props = defineProps({
    reservationData: {
        type: Object,
        default: () => ({})
    }
});

const modalStore = useModalStore();
const talkSmsStore = useTalkSmsStore();
const {
    smsRemainingCount,
    isLoadingSmsPoint,
    isLink,
    templateList,
    isLoadingTemplates,
    smsTemplateList,
    isLoadingSmsTemplates,
} = storeToRefs(talkSmsStore);

const activeTab = ref('talk');
const cocode = COCODE; // TODO: 임시
const compEnrolNum = '1231212345'; // TODO: 임시
const hospitalName = '인투병원'; // TODO: 임시
const hospitalPhone = '01089380571'; // TODO: 임시

// 수신번호 (알림톡·SMS 공통)
const recipientPhone = ref('');

// SMS 발신번호 (병원 전화번호)
const smsSenderPhone = ref(formatPhone(hospitalPhone));

// reservationData 변경 시 수신번호·SMS 발신번호(병원 전화) 자동 설정
watch(() => props.reservationData, (newData) => {
    if (newData) {
        // 수신번호: 예약의 고객 전화 (phoneTxt 우선, phone fallback)
        recipientPhone.value = formatPhone(newData.phoneTxt || newData.phone || '');
        // 발신번호: 병원 전화번호 (reservationData.hospitalPhone 우선, 상수 fallback)
        smsSenderPhone.value = formatPhone(newData.hospitalPhone || hospitalPhone);
    }
}, { immediate: true });

// 전화번호 입력 시 자동 형식 변환
const handlePhoneInput = (event) => {
    recipientPhone.value = formatPhone(event.target.value);
};
const handleSmsSenderInput = (event) => {
    smsSenderPhone.value = formatPhone(event.target.value);
};

// 선택된 템플릿 (모달 내 선택 상태)
const selectedTemplate = ref(null);
const selectedSmsTemplate = ref(null);

// 광고/무료수신거부 문구 추가 체크박스
const includeAdText = ref(false);

// 상수
const OPT_OUT_PHONE = '0808517898'; // 무료수신거부 번호

// 알림톡 템플릿 타입 (현재 5로 고정해 확인)
const selectedTemplateType = ref(5); // TODO: 추후 변경 필요
const isSending = ref(false);

// 알림톡 템플릿 선택 핸들러
const selectTemplate = (template) => {
    selectedTemplate.value = template;
};

// SMS 템플릿 선택 핸들러
const selectSmsTemplate = (template) => {
    selectedSmsTemplate.value = template;
};

const sendTalk = async () => {
    if (isSending.value) return;

    if (!selectedTemplate.value) {
        showAlert('템플릿을 선택해주세요.');
        return;
    }
    if (!recipientPhone.value) {
        showAlert('수신번호를 입력해주세요.');
        return;
    }

    const templateId =
        selectedTemplate.value.template_id ||
        selectedTemplate.value.templateId ||
        selectedTemplate.value.sno;

    if (!templateId) {
        showAlert('템플릿 ID를 확인할 수 없습니다.');
        return;
    }

    // alim_data_array payload 빌드
    const reservationDataWithPhone = {
        ...props.reservationData,
        hospitalPhone: hospitalPhone,
    };
    const contentVariables = buildTemplateVariables(reservationDataWithPhone);
    const alimData = {
        animal_num: props.reservationData?.gePetNo || '',
        protector_name: props.reservationData?.protectorName || '',
        protector_phone: recipientPhone.value,
        visit_source: props.reservationData?.visitSource || '',
        visit_source_text: props.reservationData?.visitSourceText || '',
        animal_name: props.reservationData?.petName || '',
        animal_species: props.reservationData?.speciesName || '',
        animal_breed: props.reservationData?.breedName || '',
        birth: props.reservationData?.petBirth || '',
        animal_gender: PET_GENDER_MAP[props.reservationData?.petSex] || '',
        reserve_at: props.reservationData?.reservationDate && props.reservationData?.reservationTime
            ? `${props.reservationData.reservationDate} ${props.reservationData.reservationTime}`.trim()
            : (props.reservationData?.reservationDate || ''),
        content_replace_array: contentVariables,
        btn_replace_array: selectedTemplate.value?.btn_setting || [],
    };

    // 발송 내역 저장용 실제 텍스트 (미리보기용 HTML에서 태그 제거)
    const previewHtml = formatTemplateContent(
        selectedTemplate.value?.template_content || '',
        contentVariables,
        { mode: 'alimtalk' }
    );
    const historyText = previewHtml
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?strong>/gi, '')
        .replace(/<\/?[^>]+>/g, '')
        .trim();

    isSending.value = true;
    try {
        const body = {
            compEnrolNum: compEnrolNum, // TODO: 실제 값 연동
            cocode: cocode, // TODO: 실제 값 연동
            templateType: selectedTemplateType.value ?? 0,
            templateSno: selectedTemplate.value?.sno || null,
            templateId: String(templateId),
            alimDataArray: [alimData],
            hospitalReplaceInfo: {
                comp_enrol_num: compEnrolNum, // TODO: 실제 값 연동
                cocode: cocode, // TODO: 실제 값 연동
                company_name: hospitalName, // TODO: 실제 값 연동
                sms_send_tel: hospitalPhone, // TODO: 실제 값 연동
            },
            visitSourceTotalList: props.reservationData?.visitSourceTotalList || '',
            messageText: historyText,
        };


        const response = await talkSmsStore.sendAlimTalk(body);

        if (response.status <= 300 && response.data?.status_code === 200) {
            showAlert('알림톡 발송이 완료되었습니다.');
            modalStore.smsModal.closeModal();
            return;
        }

        showAlert(response.data?.message || '알림톡 발송에 실패했습니다.');
    } catch (error) {
        console.error('알림톡 발송 오류:', error);
        showAlert('알림톡 발송 중 오류가 발생했습니다.');
    } finally {
        isSending.value = false;
    }
};

const sendSms = async () => {
    if (isSending.value) return;

    if (!selectedSmsTemplate.value) {
        showAlert('템플릿을 선택해주세요.');
        return;
    }
    if (!recipientPhone.value) {
        showAlert('수신번호를 입력해주세요.');
        return;
    }
    if (!smsSenderPhone.value) {
        showAlert('발신번호를 입력해주세요.');
        return;
    }

    // 발송할 메시지 내용 (미리보기 텍스트 사용)
    const messageContent = smsPreviewText.value;

    if (!messageContent || messageContent.trim() === '') {
        showAlert('발송할 메시지 내용이 없습니다.');
        return;
    }

    isSending.value = true;
    try {
        const body = {
            recipientNumber: removePhoneHyphens(recipientPhone.value),
            senderNumber: removePhoneHyphens(smsSenderPhone.value),
            content: messageContent,
            addOptOutPhrase: includeAdText.value,
        };
        const response = await api.post(`/api/{cocode}/sms/send`, body);

        if (response.status <= 300 && response.data?.status_code === 200) {
            showAlert('SMS 발송이 완료되었습니다.');
            modalStore.smsModal.closeModal();
            // 포인트 정보 갱신
            await talkSmsStore.getSmsPointInfo();
            return;
        }

        const errorMsg = response.data?.message || response.data?.data?.msg || 'SMS 발송에 실패했습니다.';
        showAlert(errorMsg);
    } catch (error) {
        console.error('SMS 발송 오류:', error);
        showAlert('SMS 발송 중 오류가 발생했습니다.');
    } finally {
        isSending.value = false;
    }
};

// 스토어 액션 래퍼 (템플릿·잔여건수 클릭 시 재조회용)
const getSmsPointInfo = () => talkSmsStore.getSmsPointInfo();
const checkAvailableApi = () => talkSmsStore.checkAvailableApi();
const getTemplateInfo = (useLink = false) => talkSmsStore.getTemplateInfo(useLink);
const getSmsTemplateList = () => talkSmsStore.getSmsTemplateList();

// 스토어 템플릿 로딩 시 첫 항목 자동 선택
function syncSelectedFromStore() {
    if (templateList.value?.length && !selectedTemplate.value) {
        selectedTemplate.value = templateList.value[0];
    }
    if (smsTemplateList.value?.length && !selectedSmsTemplate.value) {
        selectedSmsTemplate.value = smsTemplateList.value[0];
    }
}
onMounted(syncSelectedFromStore);
watch([templateList, smsTemplateList], syncSelectedFromStore, { deep: true });

// SMS: sms_memo + {변수} 치환 미리보기
const smsPreviewText = computed(() => {
    const data = {
        ...props.reservationData,
        hospitalPhone: props.reservationData?.hospitalPhone || hospitalPhone,
        hospitalName: props.reservationData?.hospitalName || hospitalName,
    };
    const vars = buildTemplateVariables(data);
    const templateContent = formatTemplateContent(selectedSmsTemplate.value?.sms_memo || '', vars, { mode: 'sms' });
    
    // 광고/무료수신거부 문구 추가 체크 시: "(광고)" + 템플릿 내용 + "무료수신거부 {번호}"
    if (includeAdText.value) {
        return `(광고)${templateContent}\n무료수신거부 ${OPT_OUT_PHONE}`;
    }
    return templateContent;
});

// SMS: 미리보기 텍스트 기준 Byte·건수 (80Byte 초과 시 2건)
const smsByteCount = computed(() => getSmsByteLength(smsPreviewText.value));
const smsMessageCount = computed(() => (smsByteCount.value >= 80 ? 2 : 1));

// 백엔드 복호화 테스트용
const decryptAlimtalkData = async (encryptedData) => {
    try {
        const res = await api.post(`/api/{cocode}/alimtalk/check`, { encryptedData });
        return res.data;
    } catch (e) {
        console.error('알림톡 복호화 테스트 오류:', e);
        throw e;
    }
};

defineExpose({
    getSmsPointInfo,
    checkAvailableApi,
    getTemplateInfo,
    getSmsTemplateList,
    decryptAlimtalkData,
});

</script>

<template>
    <div class="modal-contents-inner">
        <div class="tab-content-wrapper">
            <div class="tab-menu">
                <div class="tab-menu__left">
                    <div class="tab">
                        <input 
                            type="radio" 
                            name="tab_menu" 
                            id="tab_talk" 
                            v-model="activeTab"
                            value="talk"
                        >
                        <label for="tab_talk" class="tab--radio_btn">
                            <span>알림톡</span>
                        </label>
                    </div>
                    <div class="tab">
                        <input 
                            type="radio" 
                            name="tab_menu" 
                            id="tab_sms" 
                            v-model="activeTab"
                            value="sms"
                        >
                        <label for="tab_sms" class="tab--radio_btn">
                            <span>SMS</span>
                        </label>
                    </div>
                </div>
                <div class="tab-menu__right">
                    <div 
                        class="sms-remaining-count sms-remaining-count--clickable" 
                        v-if="smsRemainingCount !== null"
                        @click="getSmsPointInfo"
                    >
                        <span class="body-m">잔여건수: </span>
                        <span class="body-m count-value">{{ smsRemainingCount.toLocaleString() }}건</span>
                    </div>
                    <div class="sms-remaining-count" v-else-if="isLoadingSmsPoint">
                        <span class="body-m">잔여건수 조회 중...</span>
                    </div>
                </div>
            </div>

            <div class="content-talk" v-if="activeTab === 'talk'">
                <div class="content-talk__top">
                    <div class="content-talk__templates-wrapper">
                        <div class="content-talk__templates">
                            <p class="title-m">템플릿 목록</p>

                            <div class="content-talk__templates-empty" v-if="!isLoadingTemplates && templateList.length === 0">
                                <p class="empty-box">
                                    <img :src="icEmpty" alt="비어있음 아이콘">
                                    <span>템플릿 목록이 없습니다.</span>
                                </p>
                            </div>
    
                            <ul class="content-talk__templates-list" v-if="templateList.length > 0">
                                <li 
                                    v-for="template in templateList" 
                                    :key="template.sno || template.template_id"
                                    class="btn btn--size-32"
                                    :class="selectedTemplate?.sno === template.sno || selectedTemplate?.template_id === template.template_id ? 'active' : 'btn--black-outline'"
                                    @click="selectTemplate(template)"
                                >
                                    {{ template.template_name || template.template_id }}
                                </li>
                            </ul>
                            
                            <div v-if="isLoadingTemplates" class="content-talk__templates-loading">
                                <span class="body-m">템플릿 목록 조회 중...</span>
                            </div>
                        </div>
                    </div>

                    <div class="content-talk__preview">
                        <TalkPreview 
                            :template="selectedTemplate" 
                            :reservationData="{ ...reservationData, hospitalPhone: reservationData?.hospitalPhone || hospitalPhone }" 
                            :isLink="isLink === true" 
                        />
                    </div>
                </div>

                <div class="content-talk__form">
                    <div class="content-talk__form-row">
                        <span class="title-s helper">
                            수신번호
                        </span>
                        <input 
                            class="input-text" 
                            type="text" 
                            v-model="recipientPhone"
                            @input="handlePhoneInput"
                        >
                    </div>
                </div>

                <div class="tooltip-box" v-if="isLink === true">
                    <ul>
                        <li>해당 알림톡은 인투링크 프로필로 발송됩니다.</li>
                    </ul>
                </div>

            </div>

            <div class="content-sms" v-if="activeTab === 'sms'">
                <div class="content-sms__top">
                    <div class="content-sms__templates">
                        <p class="title-m">템플릿 목록</p>

                        <div class="content-sms__templates-empty" v-if="!isLoadingSmsTemplates && smsTemplateList.length === 0">
                            <p class="empty-box">
                                <img :src="icEmpty" alt="비어있음 아이콘">
                                <span>템플릿 목록이 없습니다.</span>
                            </p>
                        </div>
    
                        <ul class="content-sms__templates-list" v-if="smsTemplateList.length > 0">
                            <li 
                                v-for="template in smsTemplateList" 
                                :key="template.Group_Sno || template.Category"
                                class="btn btn--size-32"
                                :class="selectedSmsTemplate?.Group_Sno === template.Group_Sno ? 'active' : 'btn--black-outline'"
                                @click="selectSmsTemplate(template)"
                            >
                                {{ template.Category || template.sms_memo || '템플릿' }}
                            </li>
                        </ul>
                        
                        <div v-if="isLoadingSmsTemplates" class="content-sms__templates-loading">
                            <span class="body-m">템플릿 목록 조회 중...</span>
                        </div>
                    </div>
                    
                    <div class="content-sms__editor">
                        <div class="content-sms__editor-input">
                            <div class="d-flex justify-between">
                                <span class="title-s">문자 미리보기</span>
                                <div class="content-sms__editor-byte">
                                    <p class="body-m">{{ smsByteCount }} Byte / {{ smsMessageCount }}건</p>
                                </div>
                            </div>
                            <p class="content-sms__preview-text" v-if="selectedSmsTemplate?.sms_memo">
                                {{ smsPreviewText }}
                            </p>
                            <p v-else class="empty-message">템플릿을 선택해주세요.</p>
                        </div>

                        <div class="content-sms__editor-options">
                            <label class="checkbox">
                                <input type="checkbox" v-model="includeAdText" />
                                <span class="box"></span>
                                <span class="label">광고/무료수신거부 문구 추가</span>
                            </label>
                        </div>
    
                    </div>
                </div>

                <div class="content-sms__form">
                    <div class="content-sms__form-row">
                        <span class="title-s">문자 수신번호</span>
                        <input
                            class="input-text"
                            type="text"
                            v-model="recipientPhone"
                            @input="handlePhoneInput"
                        >
                    </div>
                    <div class="content-sms__form-row">
                        <span class="title-s d-flex gap-4 helper">
                            문자 발신번호
                            <img :src="icTooltip" alt="툴팁아이콘">
                            <div class="tooltip-content">
                                ※ 전기통신사업법에 의거하여 거짓으로 표기된 전화번호로 인한 이용자 피해 예방을 위해서 발신번호 사전등록제가 시행  됩니다. 발신번호는 개인 또는 기업이 소유한 유효 전화번호를 사용해야하며, 사전등록이 안된 발신번호는 문자 메시지 발송이 차단됩니다.
                            </div>
                        </span>
                        <input
                            class="input-text"
                            type="text"
                            v-model="smsSenderPhone"
                            @input="handleSmsSenderInput"
                        >
                    </div>
                </div>

                <div class="tooltip-box">
                    <ul>
                        <li>80Byte 이상 시 LMS로 발송되어 문자 건수가 2건씩 차감됩니다.</li>
                        <li>문자 발송 상태 확인까지 시간이 소요될 수 있으며, 확인 전까지 ‘대기’ 상태로 표시됩니다. 발송 내역은 ‘SMS 발송내역’ 메뉴에서 확인할 수 있습니다.</li>
                    </ul>
                </div>

            </div>
        </div>
    </div>
    <div class="modal-button-wrapper">
        <div class="buttons">
            <button class="btn btn--size-40 btn--blue-outline modal-btn" @click="modalStore.smsModal.closeModal()">취소</button>
            <button 
                class="btn btn--size-40 btn--blue modal-btn" 
                :disabled="isSending"
                @click="activeTab === 'talk' ? sendTalk() : sendSms()"
            >
                {{ isSending ? '발송 중...' : '발송' }}
            </button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .modal-contents-inner {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .tab-content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    // 탭 메뉴
    .tab-menu {
        display: flex;
        width: 100%;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid $gray-200;

        &__left {
            display: flex;
        }

        &__right {
            @include flex;
            align-items: center;
            padding-right: 8px;

            .sms-remaining-count {
                @include flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                border-radius: 4px;
                background-color: $primary-50;
                border: 1px solid $primary-200;
                color: $primary-700;
                font-weight: 600;

                .count-value {
                    color: $primary-700;
                    font-weight: 700;
                }

                &--clickable {
                    cursor: pointer;
                    transition: background-color 0.2s ease;

                    &:hover {
                        background-color: $primary-100;
                    }
                }
            }
        }
    }

    .tab {
        width: 80px;
        background-color: $gray-00;

        input {display: none;}

        &--radio_btn {
            width: 80px;
            height: 32px;
            @include flex-center;
            gap: 2px;
            padding: 0 8px;
            cursor: pointer;
            transition: all 0.2s ease;

            @include typo($title-m-size, $title-m-weight, $title-m-spacing, $title-m-line);
            border-bottom: 2px solid $gray-00;

            span { color: $gray-400; }

            &:hover {
                background-color: $primary-50;
                border-bottom: 2px solid $primary-200;
                
                span { 
                    color: $primary-700; 
                }
            }
        }

        input:checked + &--radio_btn {
            border-bottom: 2px solid $primary-700;
            span { color: $gray-900; }
        }
    }

    // talk
    .content-talk {
        display: flex;
        flex-direction: column;
        gap: 16px;

        &__top {
            display: flex;
            gap: 24px;
        }
        &__templates-wrapper {
            display: flex;
            flex-direction: column;
        }

        &__templates {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 247px;
            height: 440px;
            padding: 16px;
            overflow-y: auto;
        
            border-radius: 8px;
            background-color: $gray-50;

            &-empty {
                margin: auto;
            }

            &-list {
                display: flex;
                flex-direction: column;
                height: 100%;
                gap: 4px;

                li {
                    width: 100%;
                    text-align: left;
                    padding: 8px 12px;
                    white-space: normal;
                    word-break: break-word;
                    // min-height: 48px;
                    height: auto;
                    line-height: 1.4;

                    &.active {
                        background-color: $primary-100;
                        border: 1px solid $primary-700;
                        color: $primary-700;
                    }
                }
            } 
            
        }

        &__preview {
            height: 440px;
            overflow: hidden;
        }

        &__form {
            display: flex;
            flex-direction: column;
            gap: 8px;

            &-row {
                display: flex;
                align-items: center;
                gap: 60px;

                span {display: flex; align-items: center; gap: 4px;}
                input {flex:1;}
            }
        }

        &__buttons {
            width: 100%;
            display:flex;
            gap: 8px;
            justify-content: flex-end;
        }
    }

    // SMS
    .content-sms {
        display: flex;
        flex-direction: column;
        gap: 16px;
        
        &__top {
            @include flex-center;
            gap: 24px;
        }

        &__templates {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 247px;
            height: 440px;
            padding: 16px;
            overflow-y: auto;
        
            border-radius: 8px;
            background-color: $gray-50;

            &-empty {
                margin: auto;
            }
        
            &-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding-bottom: 5px;

                li {
                    width: 100%;
                    text-align: left;
                    padding: 8px 12px;
                    white-space: normal;
                    word-break: break-word;
                    // min-height: 48px;
                    height: auto;
                    line-height: 1.4;

                    &.active {
                        background-color: $primary-100;
                        border: 1px solid $primary-700;
                        color: $primary-700;
                    }
                }
            }
            
            &-loading {
                margin: auto;
                text-align: center;
            } 
        }

        // 문자 내용 입력
        &__editor {
            display: flex;
            width: 320px;
            height: 440px;
            flex-direction: column;
            padding: 16px;
            gap: 8px;
    
            border-radius: 8px;
            border: 1px solid $gray-300;
            background-color: $gray-00;
    
            &-input {
                flex: 1;
                overflow-y: auto;
                padding-right: 5px;
                
                border-bottom: 1px solid $gray-200;
                .content-sms__preview-text { white-space: pre-wrap; word-break: break-all; margin: 8px 0 0; }
                .empty-message { color: $gray-400; margin: 8px 0 0; }
            }

            &-byte {
                color: $gray-500;
            }
    
            &-options {padding: 8px 0 0;}
        }

        &__form {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .title-s {
                width: 100px;
            }
            &-row {
                display: flex;
                align-items: center;
                gap: 60px;

                input {flex:1;}
            }
        }

        &__notice {
            padding: 16px;
            border-radius: 5px;
            background-color: $primary-50;

            .tooltip {color: $gray-700;}
        }

        &__buttons {
            width: 100%;
            display:flex;
            gap: 8px;
            justify-content: flex-end;
        }
    }

</style>