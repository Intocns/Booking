export const PET_GENDER_MAP = {
    1: 'Male',
    2: 'FeMale',
    3: 'Castrated Male',
    4: 'Spayed Female',
    5: 'Unknown',
}

// 펫성별 약어
export const PET_GENDER_SHORT_MAP = {
    1: 'M',
    2: 'F',
    3: 'CM',
    4: 'SF',
    5: 'U', // unknown의경우 약어를 어떻게 지정할지 논의필요
}


// 외부 url
const BASE_WD_URL = import.meta.env.VITE_WD_URL;
const BASE_LINK_URL = import.meta.env.VITE_LINK_URL;

export const EXTERNAL_LINKS = {
    WD_SSO: `${BASE_WD_URL}/sso`,
    RECEIPT_COMP: `${BASE_LINK_URL}/plus/receiptCompleted`,
    WAIT_LIST: `${BASE_LINK_URL}/plus/waitList`,
    CHART_MAIN: `${BASE_LINK_URL}/plus/main`,
    NOTICE: `${BASE_LINK_URL}/cscenter/notice`,
    NOTICE_DET: `${BASE_LINK_URL}/cscenter/noticeDet`,
    MY_HOSPITAL: `${BASE_LINK_URL}/mylink/hospital`
};