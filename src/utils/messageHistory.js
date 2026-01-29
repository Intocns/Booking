// SMS/알림톡 발송 내역 관련 공통 상수
// 채널 타입: 0:알림톡, 1:SMS, 2:MMS (백엔드 ChannelType 매핑과 동일하게 유지)
export const MESSAGE_HISTORY_CHANNEL_TYPE_MAP = {
    0: '알림톡',
    1: 'SMS',
    2: 'MMS',
}

// 발송결과: 0:발송중, 1:성공, 2:실패, 3:성공(문자)
export const MESSAGE_HISTORY_SEND_RESULT_MAP = {
    0: '발송중',
    1: '성공',
    2: '실패',
    3: '성공(문자)',
}

export const MESSAGE_HISTORY_CHANNEL_TYPE_OPTIONS = [
    { label: '전체', value: 'all' },
    { label: '알림톡', value: '0' },
    { label: 'SMS', value: '1' },
    { label: 'MMS', value: '2' },
]

export const MESSAGE_HISTORY_SEND_RESULT_OPTIONS = [
    { label: '전체', value: 'all' },
    { label: '발송중', value: '0' },
    { label: '성공', value: '1' },
    { label: '성공(문자)', value: '3' },
    { label: '실패', value: '2' },
]

