//예약상태 define
export const RESERVE_STATUS_OPTIONS = [
    { label: '전체', value: 'all' },
    { label: '예약 대기', value: 0 },
    { label: '예약 승인', value: 1 },
    { label: '예약 취소', value: 2 },
    { label: '예약 거절', value: 3 },
]

export const RESERVE_STATUS_MAP = {
    0: '대기',
    1: '승인',
    2: '취소',
    3: '거절'
}

//예약경로 define
export const RESERVE_ROUTE_OPTIONS = [
    { label: '전체', value: 'all' },
    { label: 'IntoVetGE', value: 1 },
    { label: '인투펫', value: 2 },
    { label: 'fitpet', value: 3 },
    { label: '네이버', value: 4 },
]

// ② List / Table 용 (O(1))
export const RESERVE_ROUTE_MAP = {
    1: 'IntoVetGE',
    2: '인투펫',
    3: 'fitpet',
    4: '네이버'
}