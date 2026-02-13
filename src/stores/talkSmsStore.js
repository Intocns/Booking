import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/axios';
import { useHospitalStore } from './hospitalStore';

/** 알림톡/SMS 템플릿·포인트 조회용 스토어 (페이지 진입 시 프리로드) */
export const useTalkSmsStore = defineStore('talkSms', () => {
    const smsRemainingCount = ref(null);
    const isLoadingSmsPoint = ref(false);

    const isCheckingAvailable = ref(false);
    const checkAvailableResult = ref(null);
    const isLink = ref(false);

    const templateList = ref([]);
    const isLoadingTemplates = ref(false);

    const smsTemplateList = ref([]);
    const isLoadingSmsTemplates = ref(false);

    const hospitalStore = useHospitalStore();

    const alimTalkParam = ref(null);

    const compEnrolNum = hospitalStore.hospitalData.biz_no.replace(/-/g, '');
    const COCODE = hospitalStore.hospitalData.cocode;
    const templateType = 5; // TODO: 추후 변경


    async function getSmsPointInfo() {
        if (isLoadingSmsPoint.value) return;
        smsRemainingCount.value = null;
        isLoadingSmsPoint.value = true;
        try {
            const res = await api.get('/api/{cocode}/sms/point');
            if (res.status <= 300 && res.data?.status_code === 200 && res.data?.data?.message?.sms_cnt_float != null) {
                smsRemainingCount.value = Number(res.data.data.message.sms_cnt_float);
            }
        } catch (e) {
            console.error('SMS 포인트 정보 조회 오류:', e);
            smsRemainingCount.value = null;
        } finally {
            isLoadingSmsPoint.value = false;
        }
    }

    async function checkAvailableApi() {
        if (isCheckingAvailable.value) return;
        isCheckingAvailable.value = true;
        checkAvailableResult.value = null;
        try {
            const body = { compEnrolNum, cocode: COCODE, templateType };
            const res = await api.post('/api/{cocode}/alimtalk/checkAvailableApi', body);
            checkAvailableResult.value = res.data;
            if (res.data?.status_code === 200 && res.data?.data) {
                const d = res.data.data;
                const isChannel = d.is_channel === true;
                const isProfile = d.is_profile === true;
                const isAvailableTemplate = d.is_available_template === true;
                isLink.value = !isChannel && !isProfile && !isAvailableTemplate;
                // 백엔드에서 내려준 알림톡 프로필 등록 파라미터 저장 (있을 경우)
                alimTalkParam.value = d.alimTalkParam || null;
                await getTemplateInfo(isLink.value);
            }
        } catch (e) {
            console.error('알림톡 checkAvailableApi 호출 오류:', e);
            checkAvailableResult.value = null;
        } finally {
            isCheckingAvailable.value = false;
        }
    }

    /** 알림톡 프로필 등록 URL 생성 (버튼 클릭 시 호출) */
    async function createAlimTalkUrl() {
        if (!alimTalkParam.value) return null;
        try {
            const res = await api.post('/api/{cocode}/alimtalk/createAlimTalkUrl', {
                alimTalkParam: alimTalkParam.value,
            });
            if (res.data?.status_code === 200 && res.data?.data?.alimTalkUrl) {
                return res.data.data.alimTalkUrl;
            }
        } catch (e) {
            console.error('알림톡 URL 생성 오류:', e);
        }
        return null;
    }

    async function getTemplateInfo(useLink = false) {
        if (isLoadingTemplates.value) return;
        isLoadingTemplates.value = true;
        templateList.value = [];
        try {
            const body = { compEnrolNum, cocode: COCODE, templateType, isLink: useLink };
            const res = await api.post('/api/{cocode}/alimtalk/getTemplateInfo', body);
            if (res.data?.status_code === 200 && res.data?.data) {
                const list = res.data.data?.template_info;
                templateList.value = Array.isArray(list) ? list : [];
            }
        } catch (e) {
            console.error('템플릿 정보 조회 오류:', e);
            templateList.value = [];
        } finally {
            isLoadingTemplates.value = false;
        }
    }

    async function getSmsTemplateList() {
        if (isLoadingSmsTemplates.value) return;
        isLoadingSmsTemplates.value = true;
        smsTemplateList.value = [];
        try {
            const res = await api.get('/api/{cocode}/sms/getTemplateInfo');
            if (res.data?.status_code === 200 && res.data?.data?.template_list) {
                const list = res.data.data.template_list;
                smsTemplateList.value = Array.isArray(list) ? list : [];
            }
        } catch (e) {
            console.error('SMS 템플릿 목록 조회 오류:', e);
            smsTemplateList.value = [];
        } finally {
            isLoadingSmsTemplates.value = false;
        }
    }

    /** 알림톡 발송 */
    async function sendAlimTalk(body) {
        return api.post('/api/{cocode}/alimtalk/send', body);
    }

    /** SMS 발송 */
    async function sendSms(body) {
        return api.post('/api/{cocode}/sms/send', body);
    }

    /** 페이지 진입 시 알림톡·SMS 템플릿·포인트 한 번에 프리로드 */
    function preloadTemplatesAndPoint() {
        getSmsPointInfo();
        checkAvailableApi();
        getSmsTemplateList();
    }

    return {
        smsRemainingCount,
        isLoadingSmsPoint,
        isCheckingAvailable,
        checkAvailableResult,
        isLink,
        alimTalkParam,
        templateList,
        isLoadingTemplates,
        smsTemplateList,
        isLoadingSmsTemplates,
        getSmsPointInfo,
        checkAvailableApi,
        getTemplateInfo,
        getSmsTemplateList,
        sendAlimTalk,
        sendSms,
        preloadTemplatesAndPoint,
        createAlimTalkUrl,
    };
});
